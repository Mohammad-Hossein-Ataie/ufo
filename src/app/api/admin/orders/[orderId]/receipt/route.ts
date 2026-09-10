import { NextResponse } from "next/server";
import { getSubmittedOrder, reviewOrderPayment } from "@ufo/orders";
import {
  requireAdminRead,
  requireAdminMutation,
  adminRequestErrorStatus,
} from "@/lib/admin-request";
import { readReceiptImage } from "@/lib/receipt-files";
import { dispatchOrderNotifications } from "@/lib/order-sms";
export const runtime = "nodejs";
type Context = { params: Promise<{ orderId: string }> };
export async function GET(request: Request, { params }: Context) {
  try {
    await requireAdminRead(request);
    const order = getSubmittedOrder((await params).orderId);
    const receipt = order?.receipts?.find(
      (r) => r.id === new URL(request.url).searchParams.get("id"),
    );
    if (!receipt?.imageKey) return new NextResponse(null, { status: 404 });
    return new NextResponse(new Uint8Array(await readReceiptImage(receipt.imageKey)), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: adminRequestErrorStatus(error) });
  }
}
export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdminMutation(request);
    const { orderId } = await params;
    const text = await request.text();
    if (text.length > 4000) throw new Error("حجم درخواست زیاد است.");
    const payload = JSON.parse(text) as Record<string, unknown>;
    if (payload.action === "retry_sms")
      return NextResponse.json({ order: await dispatchOrderNotifications(orderId, true) });
    if (payload.action !== "approve" && payload.action !== "reject")
      throw new Error("عملیات معتبر نیست.");
    const order = reviewOrderPayment(
      orderId,
      payload.action,
      typeof payload.estimatedDispatchAt === "string" ? payload.estimatedDispatchAt : undefined,
      typeof payload.reason === "string" ? payload.reason : undefined,
    );
    return NextResponse.json({
      order: payload.sendSms === false ? order : await dispatchOrderNotifications(order.id),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "بررسی رسید انجام نشد." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
