import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registerNodeDiagnostics } = await import("@/lib/runtime-diagnostics");
  registerNodeDiagnostics();
  const { getSessionSecret } = await import("@ufo/config");
  const { getConfiguredOrigin, originFlag } = await import("@/lib/request-origin");
  getSessionSecret("admin");
  getConfiguredOrigin();
  originFlag("TRUST_PROXY_HEADERS");
  originFlag("ORIGIN_DEBUG");
  const { zibalMerchantMetadata } = await import("@/lib/zibal-config");
  console.info("[ZIBAL_CONFIG] startup", zibalMerchantMetadata());
}

export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { safeErrorDetails } = await import("@/lib/payment-diagnostics");
  // Use the route template, not the requested URL, query, headers or body.
  console.error("[APP] request-error", {
    method: request.method,
    route: context.routePath,
    routeType: context.routeType,
    ...safeErrorDetails(error),
  });
};
