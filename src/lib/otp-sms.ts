import { normalizeIranPhone } from "@ufo/validation";

export class OtpSmsError extends Error {}

export function otpSecret(): string {
  const secret = process.env.OTP_SECRET;
  if (!secret || secret.length < 16 || secret.startsWith("replace-with-")) {
    throw new OtpSmsError("تنظیمات امنیتی ورود پیامکی کامل نیست.");
  }
  return secret;
}

export async function sendOtpSms(phone: string, code: string): Promise<{ mock: boolean }> {
  if (process.env.SMS_PROVIDER === "mock" && process.env.NODE_ENV !== "production") {
    return { mock: true };
  }
  if (process.env.SMS_PROVIDER !== "melipayamak") {
    throw new OtpSmsError("سرویس پیامکی تنظیم نشده است.");
  }
  const username = process.env.MELIPAYAMAK_USERNAME?.trim();
  const password = process.env.MELIPAYAMAK_API_KEY || process.env.MELIPAYAMAK_PASSWORD;
  const mode = process.env.MELIPAYAMAK_OTP_MODE ?? "otp";
  const sender = process.env.MELIPAYAMAK_FROM?.trim();
  const bodyId = process.env.MELIPAYAMAK_BODY_ID?.trim();
  if (!username || !password || !/^\d{6}$/.test(code)) {
    throw new OtpSmsError("تنظیمات ورود ملی‌پیامک کامل نیست.");
  }
  if (
    (mode !== "otp" && mode !== "pattern") ||
    (mode === "otp" && !sender) ||
    (mode === "pattern" && (!bodyId || !/^[1-9]\d*$/.test(bodyId)))
  ) {
    throw new OtpSmsError("شماره فرستنده یا شناسه پترن ملی‌پیامک تنظیم نشده است.");
  }
  const body = new URLSearchParams({ username, password, to: normalizeIranPhone(phone) });
  if (mode === "pattern") {
    body.set("bodyId", bodyId!);
    body.set("text", code);
  } else {
    body.set("from", sender!);
    body.set("code", code);
  }
  let result: unknown;
  try {
    const response = await fetch(
      `https://rest.payamak-panel.com/api/SendSMS/${mode === "pattern" ? "BaseServiceNumber" : "SendOtp"}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(10_000),
        redirect: "error",
        cache: "no-store",
      },
    );
    if (!response.ok) throw new Error();
    result = await response.json();
  } catch {
    throw new OtpSmsError("ارتباط با ملی‌پیامک برقرار نشد؛ کمی بعد دوباره تلاش کنید.");
  }
  const value =
    result && typeof result === "object" && "Value" in result ? String(result.Value) : "";
  // Small integers are provider errors, not message receipt identifiers.
  if (!/^\d+$/.test(value) || BigInt(value) <= 1000n) {
    if (value === "-110") throw new OtpSmsError("ملی‌پیامک استفاده از API Key را الزامی کرده است.");
    if (value === "-109" || value === "-111")
      throw new OtpSmsError("IP سرور باید در پنل ملی‌پیامک مجاز شود.");
    throw new OtpSmsError("ملی‌پیامک ارسال را نپذیرفت؛ تنظیمات پنل و اعتبار پیامکی بررسی شود.");
  }
  return { mock: false };
}
