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
  const apiKey = process.env.MELIPAYAMAK_API_KEY?.trim();
  const mode = process.env.MELIPAYAMAK_OTP_MODE?.trim() || "pattern";
  const bodyId = process.env.MELIPAYAMAK_BODY_ID?.trim();
  if (mode !== "pattern") {
    throw new OtpSmsError("برای کد ورود، فقط ارسال پترنی از خط خدماتی مجاز است.");
  }
  if (!username || !apiKey || !/^\d{6}$/.test(code)) {
    throw new OtpSmsError("نام کاربری یا API Key ملی‌پیامک برای ارسال کد ورود تنظیم نشده است.");
  }
  if (!bodyId || !/^[1-9]\d*$/.test(bodyId)) {
    throw new OtpSmsError("شناسه پترن تأییدشدهٔ OTP (MELIPAYAMAK_BODY_ID) تنظیم نشده است.");
  }
  const body = new URLSearchParams({
    username,
    password: apiKey,
    text: code,
    to: normalizeIranPhone(phone),
    bodyId,
  });
  let result: string;
  try {
    const response = await fetch("https://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
      redirect: "error",
      cache: "no-store",
    });
    if (!response.ok) throw new Error();
    result = await response.text();
  } catch {
    throw new OtpSmsError("ارتباط با ملی‌پیامک برقرار نشد؛ کمی بعد دوباره تلاش کنید.");
  }
  const value =
    result.match(
      /<(?:string|SendByBaseNumber2Result)(?:\s[^>]*)?>(-?\d+)<\/\s*(?:string|SendByBaseNumber2Result)\s*>/i,
    )?.[1] ?? "";
  // The service returns a receipt number longer than 15 digits on acceptance.
  if (!/^\d{16,}$/.test(value)) {
    if (value === "-110") throw new OtpSmsError("ملی‌پیامک استفاده از API Key را الزامی کرده است.");
    if (value === "-109" || value === "-111")
      throw new OtpSmsError("IP سرور باید در پنل ملی‌پیامک مجاز شود.");
    if (value === "-4" || value === "-5")
      throw new OtpSmsError("پترن OTP تأیید نشده یا با یک متغیرِ کد تطابق ندارد.");
    throw new OtpSmsError("ملی‌پیامک ارسال را نپذیرفت؛ تنظیمات پنل و اعتبار پیامکی بررسی شود.");
  }
  return { mock: false };
}
