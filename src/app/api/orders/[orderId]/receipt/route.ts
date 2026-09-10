import { NextResponse } from "next/server";
import { getSubmittedOrderForCustomer, submitOrderReceipt } from "@ufo/orders";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";
import { getBankAccounts } from "@/lib/payment-settings";
import { storeReceiptImage, removeReceiptImage, readReceiptImage } from "@/lib/receipt-files";
import { dispatchOrderNotifications } from "@/lib/order-sms";
export const runtime = "nodejs";
type Context = { params: Promise<{ orderId: string }> };
export async function POST(request: Request, { params }: Context) {
  let imageKey: string | undefined;
  try {
    const session = requireCustomerSession(request);
    const { orderId } = await params;
    const order = getSubmittedOrderForCustomer(orderId, session.customerId, session.customerType);
    if (!order) return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
    if (!checkRateLimit(`receipt:${session.customerId}`, 8, 60000).allowed)
      return NextResponse.json({ error: "کمی بعد دوباره تلاش کنید." }, { status: 429 });
    if (order.status !== "awaiting_receipt") throw new Error("سفارش اکنون امکان ارسال رسید ندارد.");
    if (!getBankAccounts().some((a) => a.enabled))
      throw new Error("حساب بانکی فروشگاه هنوز فعال نشده است.");
    if (Number(request.headers.get("content-length")) > 5 * 1024 * 1024 + 16000)
      throw new Error("حجم درخواست زیاد است.");
    // Bound the stream too; Content-Length is not trusted.
    const reader = request.body?.getReader();
    if (!reader) throw new Error("رسید ارسال نشده است.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > 5 * 1024 * 1024 + 16000) {
        await reader.cancel();
        throw new Error("حجم درخواست زیاد است.");
      }
      chunks.push(part.value);
    }
    const bounded = new Request(request.url, {
      method: "POST",
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
      body: Buffer.concat(chunks),
    });
    const form = await bounded.formData();
    const note = typeof form.get("note") === "string" ? String(form.get("note")).trim() : "";
    const file = form.get("image");
    if (note.length > 2000 || (!note && !(file instanceof File && file.size)))
      throw new Error("تصویر یا متن رسید را وارد کنید.");
    if (file instanceof File && file.size) imageKey = await storeReceiptImage(file);
    const saved = submitOrderReceipt(order.id, session.customerId, session.customerType, {
      id: crypto.randomUUID(),
      note,
      imageKey,
      submittedAt: new Date().toISOString(),
    });
    imageKey = undefined; // The saved order now owns the file.
    const updated = await dispatchOrderNotifications(saved.id);
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (imageKey) await removeReceiptImage(imageKey).catch(() => undefined);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ارسال رسید انجام نشد." },
      { status: 400 },
    );
  }
}
export async function GET(request: Request, { params }: Context) {
  try {
    const session = requireCustomerSession(request);
    const { orderId } = await params;
    const order = getSubmittedOrderForCustomer(orderId, session.customerId, session.customerType);
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
  } catch {
    return new NextResponse(null, { status: 401 });
  }
}
