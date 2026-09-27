import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  getSubmittedOrder,
  getSubmittedOrderForCustomer,
  registerGatewayPaymentAttempt,
} from "@ufo/orders";
import { requireCustomerSession, checkRateLimit } from "@/lib/customer-session";
import { getZibalCallbackUrl, ZibalConfigurationError } from "@/lib/zibal-config";
import { paymentDiagnostic, safeErrorDetails } from "@/lib/payment-diagnostics";
import { reconcileZibalOrder } from "@/lib/zibal-order";
import { requestZibalPayment, ZibalGatewayError, zibalPaymentUrl } from "@/lib/zibal";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const correlationId = randomUUID();
  let savedOrderId: string | undefined;
  try {
    const { orderId } = await params;
    const preliminary = getSubmittedOrder(orderId);
    if (!preliminary) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    const session = requireCustomerSession(request, preliminary.channel);
    const order = getSubmittedOrderForCustomer(orderId, session.customerId, preliminary.channel);
    if (!order) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    savedOrderId = order.id;
    const context = { orderId: order.id, correlationId };
    paymentDiagnostic("PAYMENT", "startup", context);
    if (order.paymentMethod !== "zibal" || order.status !== "awaiting_payment")
      return NextResponse.json({ error: "این سفارش امکان پرداخت آنلاین ندارد." }, { status: 409 });
    if (!checkRateLimit(`zibal:${session.customerId}`, 6, 60_000).allowed)
      return NextResponse.json({ error: "کمی بعد دوباره تلاش کنید." }, { status: 429 });
    const latest = order.gatewayPayments?.at(-1);
    if (latest?.state === "pending") {
      const state = await reconcileZibalOrder(order, latest.trackId, correlationId);
      if (state === "paid") return NextResponse.json({ paid: true });
      if (state === "pending") {
        paymentDiagnostic("ZIBAL_REDIRECT", "ready", {
          ...context,
          reused: true,
          paymentUrlGenerated: true,
        });
        return NextResponse.json({ paymentUrl: zibalPaymentUrl(latest.trackId) });
      }
    }

    const trackId = await requestZibalPayment({
      amountRial: order.totalRial,
      callbackUrl: getZibalCallbackUrl(),
      orderId: order.id,
      mobile: order.customer.phone,
      correlationId,
    });
    registerGatewayPaymentAttempt(
      order.id,
      session.customerId,
      order.channel,
      trackId,
      order.totalRial,
    );
    const paymentUrl = zibalPaymentUrl(trackId);
    paymentDiagnostic("ZIBAL_REDIRECT", "ready", { ...context, paymentUrlGenerated: true });
    return NextResponse.json({ paymentUrl });
  } catch (error) {
    paymentDiagnostic("PAYMENT_ERROR", "startup-failed", {
      orderId: savedOrderId,
      correlationId,
      ...safeErrorDetails(error),
      ...(error instanceof ZibalGatewayError || error instanceof ZibalConfigurationError
        ? { errorMessage: error.message }
        : {}),
      paymentUrlGenerated: false,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "شروع پرداخت انجام نشد." },
      {
        status:
          error instanceof ZibalGatewayError || error instanceof ZibalConfigurationError
            ? error.status
            : 400,
      },
    );
  }
}
