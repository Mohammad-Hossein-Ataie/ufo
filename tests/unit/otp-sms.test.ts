import { afterEach, describe, expect, it, vi } from "vitest";
import { sendOtpSms } from "../../src/lib/otp-sms";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function setup() {
  vi.stubEnv("SMS_PROVIDER", "melipayamak");
  vi.stubEnv("MELIPAYAMAK_USERNAME", "test-user");
  vi.stubEnv("MELIPAYAMAK_PASSWORD", "test-password");
  vi.stubEnv("MELIPAYAMAK_API_KEY", "");
  vi.stubEnv("MELIPAYAMAK_OTP_MODE", "otp");
  vi.stubEnv("MELIPAYAMAK_FROM", "50001234");
}

describe("Melipayamak OTP transport", () => {
  it("sends credentials in a POST body with a normalized recipient", async () => {
    setup();
    const fetcher = vi.fn().mockResolvedValue(Response.json({ Value: "12345678901234567" }));
    vi.stubGlobal("fetch", fetcher);
    expect(await sendOtpSms("989362157181", "123456")).toEqual({ mock: false });
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://rest.payamak-panel.com/api/SendSMS/SendOtp");
    expect(init.body.get("to")).toBe("09362157181");
    expect(init.body.get("password")).toBe("test-password");
    expect(init.body.get("code")).toBe("123456");
  });
  it("supports a single-variable approved pattern and API key authentication", async () => {
    setup();
    vi.stubEnv("MELIPAYAMAK_OTP_MODE", "pattern");
    vi.stubEnv("MELIPAYAMAK_BODY_ID", "1234");
    vi.stubEnv("MELIPAYAMAK_API_KEY", "test-api-key");
    const fetcher = vi.fn().mockResolvedValue(Response.json({ Value: "12345678901234567" }));
    vi.stubGlobal("fetch", fetcher);
    await sendOtpSms("09362157181", "123456");
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toContain("BaseServiceNumber");
    expect(init.body.get("bodyId")).toBe("1234");
    expect(init.body.get("text")).toBe("123456");
    expect(init.body.get("password")).toBe("test-api-key");
  });
  it.each(["0", "2", "35", "-110", "-109", "garbage"])(
    "rejects provider result %s",
    async (Value) => {
      setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ Value })));
      await expect(sendOtpSms("09362157181", "123456")).rejects.toThrow();
    },
  );
  it("fails before contacting the provider when sender is missing", async () => {
    setup();
    vi.stubEnv("MELIPAYAMAK_FROM", "");
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(sendOtpSms("09362157181", "123456")).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("never exposes provider response text or network errors", async () => {
    setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("test-password")));
    await expect(sendOtpSms("09362157181", "123456")).rejects.not.toThrow("test-password");
  });
  it("forbids production mock delivery", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMS_PROVIDER", "mock");
    await expect(sendOtpSms("09362157181", "123456")).rejects.toThrow();
  });
});
