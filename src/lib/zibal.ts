import {
  paymentDiagnostic,
  safeErrorDetails,
  type PaymentDiagnosticFields,
} from "@/lib/payment-diagnostics";
import { getZibalMerchant, zibalMerchantMetadata } from "@/lib/zibal-config";

const gatewayOrigin = "https://gateway.zibal.ir";

export class ZibalGatewayError extends Error {
  readonly status = 502;
  constructor(
    message: string,
    readonly result?: number,
  ) {
    super(message);
    this.name = "ZibalGatewayError";
  }
}

function requestError(result: unknown): ZibalGatewayError {
  switch (Number(result)) {
    case 102:
      return new ZibalGatewayError("شناسه پذیرنده درگاه زیبال پیدا نشد.", 102);
    case 104:
      return new ZibalGatewayError(
        "شناسه پذیرنده درگاه زیبال معتبر نیست. مقدار merchant درگاه را در پنل زیبال بررسی کنید.",
        104,
      );
    case 103:
      return new ZibalGatewayError(
        "درگاه زیبال غیرفعال است یا قرارداد آن کامل نشده؛ وضعیت درگاه را در پنل زیبال بررسی کنید.",
      );
    case 105:
      return new ZibalGatewayError("مبلغ سفارش از حداقل مبلغ مجاز زیبال کمتر است.");
    case 106:
      return new ZibalGatewayError(
        "آدرس بازگشت پرداخت از طرف زیبال پذیرفته نشد. APP_BASE_URL باید نشانی عمومی و HTTPS سایت باشد.",
      );
    case 113:
      return new ZibalGatewayError("مبلغ سفارش از سقف مجاز این درگاه بیشتر است.");
    case 115:
      return new ZibalGatewayError("آی‌پی سرور در تنظیمات درگاه زیبال ثبت نشده است.", 115);
    default:
      return new ZibalGatewayError("درخواست پرداخت توسط زیبال پذیرفته نشد؛ دوباره تلاش کنید.");
  }
}

async function callZibal(
  path: "/v1/request" | "/v1/verify" | "/v1/inquiry",
  body: object,
  context: PaymentDiagnosticFields,
) {
  const operation = path.slice(4);
  paymentDiagnostic("ZIBAL_CONFIG", "checked", {
    ...context,
    operation,
    ...zibalMerchantMetadata(),
  });
  // Validate before the transport try/catch: missing config is not a network failure.
  const merchant = getZibalMerchant();
  paymentDiagnostic(path === "/v1/request" ? "ZIBAL_REQUEST" : "ZIBAL_VERIFY", "sending", {
    ...context,
    operation,
  });
  let response: Response;
  try {
    response = await fetch(`${gatewayOrigin}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, merchant }),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
  } catch (error) {
    paymentDiagnostic("PAYMENT_ERROR", "transport-failed", {
      ...context,
      operation,
      ...safeErrorDetails(error),
    });
    throw new ZibalGatewayError("ارتباط با درگاه زیبال برقرار نشد؛ دوباره تلاش کنید.");
  }
  let data: Record<string, unknown>;
  try {
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error();
    data = payload as Record<string, unknown>;
  } catch {
    paymentDiagnostic("ZIBAL_RESPONSE", "received", {
      ...context,
      operation,
      httpStatus: response.status,
      result: null,
      trackIdPresent: false,
    });
    throw new ZibalGatewayError("پاسخ درگاه زیبال معتبر نیست.");
  }
  paymentDiagnostic("ZIBAL_RESPONSE", "received", {
    ...context,
    operation,
    httpStatus: response.status,
    result: typeof data.result === "number" ? data.result : null,
    status: typeof data.status === "number" ? data.status : null,
    trackIdPresent: data.trackId !== undefined && data.trackId !== null,
  });
  if (!response.ok)
    throw new ZibalGatewayError("درگاه زیبال موقتاً پاسخگو نیست؛ دوباره تلاش کنید.");
  return data;
}

function trackId(value: unknown): string {
  if (
    (typeof value !== "string" && typeof value !== "number") ||
    !/^\d{1,30}$/.test(String(value)) ||
    !Number.isSafeInteger(Number(value)) ||
    Number(value) <= 0
  )
    throw new ZibalGatewayError("شناسه تراکنش زیبال معتبر نیست.");
  return String(value);
}

export function zibalPaymentUrl(value: string): string {
  return `${gatewayOrigin}/start/${encodeURIComponent(trackId(value))}`;
}

export async function requestZibalPayment(args: {
  amountRial: number;
  callbackUrl: string;
  orderId: string;
  mobile: string;
  correlationId?: string;
}): Promise<string> {
  if (!Number.isSafeInteger(args.amountRial) || args.amountRial <= 1_000)
    throw new Error("مبلغ سفارش برای پرداخت آنلاین معتبر نیست.");
  const result = await callZibal(
    "/v1/request",
    {
      amount: args.amountRial,
      callbackUrl: args.callbackUrl,
      orderId: args.orderId,
      mobile: args.mobile,
      description: `سفارش ${args.orderId}`,
    },
    {
      orderId: args.orderId,
      correlationId: args.correlationId,
      amount: args.amountRial,
      callbackUrl: args.callbackUrl,
    },
  );
  if (result.result !== 100) throw requestError(result.result);
  return trackId(result.trackId);
}

export interface ZibalVerification {
  paid: boolean;
  status: number;
  amountRial?: number;
  orderId?: string;
  refNumber?: string;
  paidAt?: string;
}

function parseVerification(data: Record<string, unknown>): ZibalVerification {
  const status = Number(data.status);
  if (!Number.isInteger(status)) throw new Error("وضعیت تراکنش زیبال معتبر نیست.");
  if (status !== 1) return { paid: false, status };
  const amountRial = Number(data.amount);
  const refNumber = String(data.refNumber ?? "");
  if (
    !Number.isSafeInteger(amountRial) ||
    !/^\d{1,40}$/.test(refNumber) ||
    typeof data.orderId !== "string"
  )
    throw new Error("اطلاعات تأیید پرداخت زیبال کامل نیست.");
  return {
    paid: true,
    status,
    amountRial,
    orderId: data.orderId,
    refNumber,
    ...(typeof data.paidAt === "string" ? { paidAt: data.paidAt } : {}),
  };
}

export async function verifyZibalPayment(
  value: string,
  context: PaymentDiagnosticFields = {},
): Promise<ZibalVerification> {
  const data = await callZibal("/v1/verify", { trackId: Number(trackId(value)) }, context);
  if (data.result === 100) return parseVerification(data);
  if (data.result === 201) {
    const inquiry = await callZibal("/v1/inquiry", { trackId: Number(trackId(value)) }, context);
    if (inquiry.result !== 100) throw new Error("استعلام پرداخت زیبال انجام نشد.");
    return parseVerification(inquiry);
  }
  if (data.result === 202 && Number.isInteger(Number(data.status)))
    return { paid: false, status: Number(data.status) };
  throw new Error("تأیید پرداخت زیبال انجام نشد؛ وضعیت سفارش را دوباره بررسی کنید.");
}
