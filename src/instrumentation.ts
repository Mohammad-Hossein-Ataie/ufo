export async function register() {
  const { getSessionSecret } = await import("@ufo/config");
  const { getConfiguredOrigin, originFlag } = await import("@/lib/request-origin");
  getSessionSecret("admin");
  getConfiguredOrigin();
  originFlag("TRUST_PROXY_HEADERS");
  originFlag("ORIGIN_DEBUG");
}
