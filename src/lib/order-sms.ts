import { getCustomerAccount, getSubmittedOrder, setOrderSmsStatus } from "@ufo/orders";
import { normalizeIranPhone } from "@ufo/validation";

export async function sendOrderSms(phone: string, text: string): Promise<"sent" | "mock"> {
  if (process.env.SMS_PROVIDER === "mock" && process.env.NODE_ENV !== "production") return "mock";
  const username = process.env.MELIPAYAMAK_USERNAME?.trim();
  const password = process.env.MELIPAYAMAK_API_KEY || process.env.MELIPAYAMAK_PASSWORD;
  const from = process.env.MELIPAYAMAK_FROM;
  if (process.env.SMS_PROVIDER !== "melipayamak" || !username || !password || !from)
    throw new Error("تنظیمات پیامک کامل نیست.");
  const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      username,
      password,
      from,
      to: normalizeIranPhone(phone),
      text,
      isFlash: "false",
    }),
    signal: AbortSignal.timeout(10000),
    redirect: "error",
    cache: "no-store",
  });
  if (!response.ok) throw new Error("ارسال پیامک انجام نشد.");
  const result: unknown = await response.json();
  const value =
    result && typeof result === "object" && "Value" in result ? String(result.Value) : "";
  if (!/^\d+$/.test(value) || BigInt(value) <= 1000n) throw new Error("ارسال پیامک پذیرفته نشد.");
  return "sent"; // Accepted by provider, not a delivery confirmation.
}

export async function dispatchOrderNotifications(orderId: string, retryFailed = false) {
  const order = getSubmittedOrder(orderId);
  if (!order) throw new Error("سفارش پیدا نشد.");
  for (const item of order.notifications ?? []) {
    if (item.status !== "pending" && !(retryFailed && item.status === "failed")) continue;
    // Re-read before claiming, so concurrent requests in this process do not duplicate sends.
    const latest = getSubmittedOrder(orderId)?.notifications?.find((entry) => entry.id === item.id);
    if (latest?.status !== item.status) continue;
    setOrderSmsStatus(orderId, item.id, "sending");
    try {
      const text =
        item.kind === "receipt"
          ? `یوفوپاف: رسید سفارش ${order.orderNumber} دریافت شد. پس از تأیید پرداخت، نتیجه و زمان تقریبی ارسال پیامک می‌شود.`
          : `یوفوپاف: پرداخت سفارش ${order.orderNumber} تأیید شد. ${order.shippingScope === "pickup" || order.shippingMethod === "pickup" ? "زمان تقریبی آماده‌شدن برای دریافت حضوری" : "زمان تقریبی ارسال"}: ${new Date(order.estimatedDispatchAt!).toLocaleString("fa-IR", { timeZone: "Asia/Tehran" })}${order.shippingScope === "pickup" || order.shippingMethod === "pickup" ? `؛ محل دریافت: ${order.shippingAddress.line1}. پیش از مراجعه هماهنگ کنید.` : ""}`;
      const phone = order.userId ? getCustomerAccount(order.userId)?.mobileNumber : undefined;
      if (!phone) throw new Error("حساب مشتری پیدا نشد.");
      setOrderSmsStatus(orderId, item.id, await sendOrderSms(phone, text));
    } catch {
      setOrderSmsStatus(orderId, item.id, "failed");
    }
  }
  return getSubmittedOrder(orderId)!;
}
