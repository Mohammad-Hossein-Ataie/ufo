import { NextResponse } from "next/server";
import {
  getSubmittedOrder,
  getSubmittedOrderForCustomer,
  registerGatewayPaymentAttempt,
} from "@ufo/orders";
import { requireCustomerSession, checkRateLimit } from "@/lib/customer-session";
import { getConfiguredOrigin } from "@/lib/request-origin";
import { reconcileZibalOrder } from "@/lib/zibal-order";
import { requestZibalPayment, ZibalGatewayError, zibalPaymentUrl } from "@/lib/zibal";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const preliminary = getSubmittedOrder(orderId);
    if (!preliminary) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    const session = requireCustomerSession(request, preliminary.channel);
    const order = getSubmittedOrderForCustomer(orderId, session.customerId, preliminary.channel);
    if (!order) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    if (order.paymentMethod !== "zibal" || order.status !== "awaiting_payment")
      return NextResponse.json({ error: "این سفارش امکان پرداخت آنلاین ندارد." }, { status: 409 });
    if (!checkRateLimit(`zibal:${session.customerId}`, 6, 60_000).allowed)
      return NextResponse.json({ error: "کمی بعد دوباره تلاش کنید." }, { status: 429 });
    const latest = order.gatewayPayments?.at(-1);
    if (latest?.state === "pending") {
      const state = await reconcileZibalOrder(order, latest.trackId);
      if (state === "paid") return NextResponse.json({ paid: true });
      if (state === "pending")
        return NextResponse.json({ paymentUrl: zibalPaymentUrl(latest.trackId) });
    }

    const origin = getConfiguredOrigin();
    if (!origin || (process.env.NODE_ENV === "production" && !origin.startsWith("https://")))
      throw new Error("آدرس امن سایت برای بازگشت از درگاه پیکربندی نشده است.");
    const trackId = await requestZibalPayment({
      amountRial: order.totalRial,
      callbackUrl: `${origin}/api/payments/zibal/callback`,
      orderId: order.id,
      mobile: order.customer.phone,
    });
    registerGatewayPaymentAttempt(
      order.id,
      session.customerId,
      order.channel,
      trackId,
      order.totalRial,
    );
    return NextResponse.json({ paymentUrl: zibalPaymentUrl(trackId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "شروع پرداخت انجام نشد." },
      { status: error instanceof ZibalGatewayError ? error.status : 400 },
    );
  }
}
