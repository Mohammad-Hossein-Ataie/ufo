import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  assertSameOrigin,
  getCanonicalOrigin,
  OriginConfigurationError,
  RequestOriginError,
} from "@/lib/request-origin";

const request = (headers: Record<string, string> = {}) =>
  new Request("http://172.18.0.2:3000/api/admin/storage/upload", { method: "POST", headers });
beforeEach(() => {
  vi.stubEnv("APP_BASE_URL", "https://ufopuff.com");
  vi.stubEnv("TRUST_PROXY_HEADERS", "false");
  vi.stubEnv("ORIGIN_DEBUG", "false");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
describe("canonical origin and CSRF", () => {
  it("uses the configured public origin instead of the container and ignores spoofed proxy headers", () => {
    const req = request({
      origin: "https://ufopuff.com",
      host: "172.18.0.2:3000",
      "x-forwarded-host": "evil.example",
      "x-forwarded-proto": "http",
    });
    expect(getCanonicalOrigin(req)).toBe("https://ufopuff.com");
    expect(() => assertSameOrigin(req)).not.toThrow();
  });
  it.each([
    "https://evil.example",
    "https://ufopuff.com.evil.example",
    "http://ufopuff.com",
    "https://ufopuff.com:444",
    "null",
    "",
    "https://ufopuff.com/path",
    "https://ufopuff.com?token=secret",
    "https://user:password@ufopuff.com",
    "https://ufopuff.com, https://evil.example",
  ])("rejects untrusted/ambiguous Origin %s", (origin) => {
    expect(() =>
      assertSameOrigin(request({ origin, referer: "https://ufopuff.com/admin" })),
    ).toThrow(RequestOriginError);
  });
  it("accepts a same-origin Referer only when Origin is absent; missing both fails closed", () => {
    expect(() =>
      assertSameOrigin(request({ referer: "https://ufopuff.com/admin/products?tab=images" })),
    ).not.toThrow();
    expect(() => assertSameOrigin(request())).toThrow(RequestOriginError);
    expect(() => assertSameOrigin(request({ referer: "https://evil.example/admin" }))).toThrow(
      RequestOriginError,
    );
  });
  it("normalizes scheme/hostname casing and default ports", () => {
    expect(() => assertSameOrigin(request({ origin: "https://UfoPuff.com:443" }))).not.toThrow();
  });
  it.each(["not-a-url", "ftp://ufopuff.com", "https://user:password@ufopuff.com"])(
    "fails closed on invalid APP_BASE_URL",
    (value) => {
      vi.stubEnv("APP_BASE_URL", value);
      expect(() => getCanonicalOrigin(request())).toThrow(OriginConfigurationError);
    },
  );
  it("reconstructs forwarded origins only after explicit proxy trust", () => {
    vi.stubEnv("APP_BASE_URL", "");
    const req = request({ "x-forwarded-proto": "https", "x-forwarded-host": "ufopuff.com" });
    expect(getCanonicalOrigin(req)).toBe("http://172.18.0.2:3000");
    vi.stubEnv("TRUST_PROXY_HEADERS", "true");
    expect(getCanonicalOrigin(req)).toBe("https://ufopuff.com");
    expect(
      getCanonicalOrigin(request({ "x-forwarded-proto": "https", host: "ufopuff.com:443" })),
    ).toBe("https://ufopuff.com");
    expect(getCanonicalOrigin(request({ host: "localhost:3000" }))).toBe("http://localhost:3000");
    expect(getCanonicalOrigin(request())).toBe("http://172.18.0.2:3000");
  });
  it.each([
    { "x-forwarded-host": "ufopuff.com,evil.example", "x-forwarded-proto": "https" },
    { "x-forwarded-host": "ufopuff.com", "x-forwarded-proto": "https,http" },
    { "x-forwarded-host": "user:password@ufopuff.com", "x-forwarded-proto": "https" },
    { "x-forwarded-host": "ufopuff.com/path", "x-forwarded-proto": "https" },
    { "x-forwarded-host": "ufopuff.com", "x-forwarded-proto": "javascript" },
    { "x-forwarded-host": "ufopuff.com" },
  ])("rejects ambiguous or malformed trusted forwarding", (headers) => {
    vi.stubEnv("APP_BASE_URL", "");
    vi.stubEnv("TRUST_PROXY_HEADERS", "true");
    expect(() => getCanonicalOrigin(request(headers))).toThrow(RequestOriginError);
  });
  it("supports local direct requests without proxy trust", () => {
    vi.stubEnv("APP_BASE_URL", "");
    expect(() =>
      assertSameOrigin(
        new Request("http://localhost:3000/api/admin/x", {
          headers: { origin: "http://localhost:3000" },
        }),
      ),
    ).not.toThrow();
  });
  it("logs only bounded sanitized origin diagnostics when enabled", () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    assertSameOrigin(request({ origin: "https://ufopuff.com" }));
    expect(log).not.toHaveBeenCalled();
    vi.stubEnv("ORIGIN_DEBUG", "true");
    expect(() =>
      assertSameOrigin(
        request({
          origin: "https://user:sensitive-value@ufopuff.com",
          host: "user:sensitive-value@host",
          authorization: "Bearer sensitive-value",
          cookie: "session=sensitive-value",
          "x-forwarded-proto": "sensitive-value",
          "x-forwarded-host": "evil/path?sensitive-value",
        }),
      ),
    ).toThrow();
    const output = JSON.stringify(log.mock.calls);
    expect(output).not.toContain("sensitive-value");
    expect(output).toContain("canonicalOrigin");
    expect(output).toContain("[invalid]");
  });
});
