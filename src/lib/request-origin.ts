export class RequestOriginError extends Error {
  readonly status = 403;
  constructor() {
    super("مبدأ درخواست معتبر نیست.");
  }
}

export class OriginConfigurationError extends Error {
  readonly status = 500;
}

function httpUrl(value: string): URL {
  const url = new URL(value);
  if (!/^https?:$/.test(url.protocol) || url.username || url.password)
    throw new Error("Invalid URL");
  return url;
}

export function getConfiguredOrigin(): string | undefined {
  const configured = process.env.APP_BASE_URL?.trim();
  if (!configured) return undefined;
  try {
    return httpUrl(configured).origin;
  } catch {
    throw new OriginConfigurationError(
      "APP_BASE_URL must be a valid HTTP(S) URL without credentials.",
    );
  }
}

export function originFlag(name: "TRUST_PROXY_HEADERS" | "ORIGIN_DEBUG"): boolean {
  const value = process.env[name];
  if (!value || value === "false") return false;
  if (value === "true") return true;
  throw new OriginConfigurationError(`${name} must be true or false.`);
}

function hostValue(value: string): string {
  // A single authority only; reject ambiguous proxy chains and URL injection.
  if (value.length > 255 || !/^[a-z0-9.[\]:-]+$/i.test(value)) throw new Error("Invalid host");
  const url = httpUrl(`https://${value}`);
  if (!url.hostname || url.pathname !== "/" || url.search || url.hash)
    throw new Error("Invalid host");
  return value;
}

export function getCanonicalOrigin(request: Request): string {
  const configured = getConfiguredOrigin();
  if (configured) return configured;
  if (originFlag("TRUST_PROXY_HEADERS")) {
    const proto = request.headers.get("x-forwarded-proto");
    const forwardedHost = request.headers.get("x-forwarded-host");
    const host = forwardedHost ?? request.headers.get("host");
    if (proto !== null || forwardedHost !== null) {
      try {
        if ((proto !== "https" && proto !== "http") || !host)
          throw new Error("Incomplete proxy headers");
        return httpUrl(`${proto}://${hostValue(host)}`).origin;
      } catch {
        throw new RequestOriginError();
      }
    }
    if (host) {
      try {
        return httpUrl(`${httpUrl(request.url).protocol}//${hostValue(host)}`).origin;
      } catch {
        throw new RequestOriginError();
      }
    }
  }
  return httpUrl(request.url).origin;
}

function sourceOrigin(value: string, allowPath = false): string | undefined {
  try {
    if (!value || /\s|,/.test(value)) return undefined;
    const url = httpUrl(value);
    if (!allowPath && (url.pathname !== "/" || url.search || url.hash)) return undefined;
    return url.origin;
  } catch {
    return undefined;
  }
}

function diagnosticHost(value: string | null): string | null {
  if (value === null) return null;
  try {
    return hostValue(value);
  } catch {
    return "[invalid]";
  }
}

export function assertSameOrigin(request: Request): void {
  let canonical: string | null = null;
  let accepted = false;
  const origin = request.headers.get("origin");
  try {
    canonical = getCanonicalOrigin(request);
    // Origin is authoritative; never rescue an invalid/null Origin with Referer.
    const source =
      origin !== null
        ? sourceOrigin(origin)
        : sourceOrigin(request.headers.get("referer") ?? "", true);
    accepted = source === canonical;
    if (!accepted) throw new RequestOriginError();
  } finally {
    if (originFlag("ORIGIN_DEBUG")) {
      const proto = request.headers.get("x-forwarded-proto");
      console.info("request-origin", {
        origin: origin === null ? null : (sourceOrigin(origin) ?? "[invalid]"),
        host: diagnosticHost(request.headers.get("host")),
        forwardedHost: diagnosticHost(request.headers.get("x-forwarded-host")),
        forwardedProto:
          proto === null || proto === "https" || proto === "http" ? proto : "[invalid]",
        canonicalOrigin: canonical,
        accepted,
      });
    }
  }
}
