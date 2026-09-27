import { getConfiguredOrigin } from "@/lib/request-origin";

export class ZibalConfigurationError extends Error {
  readonly status = 503;
}

export function zibalMerchantMetadata() {
  const value = process.env.ZIBAL_MERCHANT?.trim() ?? "";
  return { merchantConfigured: Boolean(value), merchantLength: value.length };
}

export function getZibalMerchant(): string {
  const value = process.env.ZIBAL_MERCHANT?.trim();
  if (!value) throw new ZibalConfigurationError("درگاه زیبال هنوز پیکربندی نشده است.");
  // Dashboard values are literal; dotenv quoting is handled by Next's env loader.
  // Do not guess credential formats or silently rewrite a supplied credential.
  if (/[\s"']/.test(value))
    throw new ZibalConfigurationError(
      "مقدار ZIBAL_MERCHANT نباید شامل کوتیشن یا فاصله داخلی باشد.",
    );
  return value;
}

export function getZibalCallbackUrl(): string {
  const origin = getConfiguredOrigin();
  if (!origin || (process.env.NODE_ENV === "production" && !origin.startsWith("https://")))
    throw new ZibalConfigurationError("آدرس امن سایت برای بازگشت از درگاه پیکربندی نشده است.");
  return `${origin}/api/payments/zibal/callback`;
}
