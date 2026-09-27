/** Allowlisted payment metadata only. Never pass payloads, headers or provider messages. */
export interface PaymentDiagnosticFields {
  orderId?: string | undefined;
  correlationId?: string | undefined;
  channel?: string;
  amount?: number;
  callbackUrl?: string;
  merchantConfigured?: boolean;
  merchantLength?: number;
  operation?: string;
  httpStatus?: number;
  result?: number | null;
  status?: number | null;
  trackIdPresent?: boolean;
  paymentUrlGenerated?: boolean;
  reused?: boolean;
  outcome?: string;
  errorName?: string;
  errorMessage?: string;
  errorStack?: string | undefined;
}

export function paymentDiagnostic(
  prefix:
    | "PAYMENT"
    | "ZIBAL_CONFIG"
    | "ZIBAL_REQUEST"
    | "ZIBAL_RESPONSE"
    | "ZIBAL_REDIRECT"
    | "ZIBAL_CALLBACK"
    | "ZIBAL_VERIFY"
    | "PAYMENT_ERROR",
  event: string,
  fields: PaymentDiagnosticFields,
) {
  const line = `[${prefix}] ${event} ${JSON.stringify(fields)}`;
  if (prefix === "PAYMENT_ERROR") console.error(line);
  else console.info(line);
}

/** Preserve call sites, not arbitrary exception messages (which can contain credentials). */
export function safeErrorDetails(error: unknown) {
  if (!(error instanceof Error)) return { errorName: "UnknownError" };
  const errorName = /^(?:[A-Za-z]+Error|Error|Warning)$/.test(error.name) ? error.name : "Error";
  const errorStack = error.stack
    ?.split("\n")
    .filter((line) => /^\s+at /.test(line))
    .map((line) => line.replace(/https?:\/\/\S+/g, "[url]"))
    .slice(0, 20)
    .join("\n");
  return { errorName, errorStack };
}
