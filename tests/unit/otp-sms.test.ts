import { afterEach, describe, expect, it, vi } from "vitest";
import { sendOtpSms } from "../../src/lib/otp-sms";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function setup() {
  vi.stubEnv("SMS_PROVIDER", "melipayamak");
  vi.stubEnv("MELIPAYAMAK_USERNAME", "test-user");
  vi.stubEnv("MELIPAYAMAK_PASSWORD", "unused-panel-password");
  vi.stubEnv("MELIPAYAMAK_API_KEY", "test-api-key");
  vi.stubEnv("MELIPAYAMAK_OTP_MODE", "pattern");
  vi.stubEnv("MELIPAYAMAK_BODY_ID", "1234");
}

function providerResult(value: string) {
  return new Response(`<string xmlns="http://tempuri.org/">${value}</string>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

describe("Melipayamak OTP transport", () => {
  it("uses the HTTPS service-pattern endpoint with credentials only in the POST body", async () => {
    setup();
    const fetcher = vi.fn().mockResolvedValue(providerResult("12345678901234567"));
    vi.stubGlobal("fetch", fetcher);

    expect(await sendOtpSms("989362157181", "123456")).toEqual({ mock: false });
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2");
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("error");
    expect(init.body).toBeInstanceOf(URLSearchParams);
    expect(Object.fromEntries(init.body)).toEqual({
      username: "test-user",
      password: "test-api-key",
      text: "123456",
      to: "09362157181",
      bodyId: "1234",
    });
    expect(String(url)).not.toContain("test-api-key");
  });

  it("defaults to the pattern method if mode is unset", async () => {
    setup();
    vi.stubEnv("MELIPAYAMAK_OTP_MODE", "");
    const fetcher = vi.fn().mockResolvedValue(providerResult("12345678901234567"));
    vi.stubGlobal("fetch", fetcher);
    await sendOtpSms("09362157181", "123456");
    expect(fetcher.mock.calls[0]![0]).toContain("SendByBaseNumber2");
  });

  it.each([
    ["MELIPAYAMAK_API_KEY", ""],
    ["MELIPAYAMAK_BODY_ID", ""],
    ["MELIPAYAMAK_BODY_ID", "not-a-number"],
    ["MELIPAYAMAK_OTP_MODE", "otp"],
  ])("fails closed when %s is %s", async (name, value) => {
    setup();
    vi.stubEnv(name, value);
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(sendOtpSms("09362157181", "123456")).rejects.toThrow();
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each(["0", "2", "35", "-110", "-109", "-4", "-5", "garbage"])(
    "rejects provider result %s",
    async (value) => {
      setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(providerResult(value)));
      await expect(sendOtpSms("09362157181", "123456")).rejects.toThrow();
    },
  );

  it("accepts a SOAP result element", async () => {
    setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          new Response("<SendByBaseNumber2Result>12345678901234567</SendByBaseNumber2Result>"),
        ),
    );
    await expect(sendOtpSms("09362157181", "123456")).resolves.toEqual({ mock: false });
  });

  it("never exposes provider response text or network errors", async () => {
    setup();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("test-api-key")));
    await expect(sendOtpSms("09362157181", "123456")).rejects.not.toThrow("test-api-key");
  });

  it("forbids production mock delivery", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SMS_PROVIDER", "mock");
    await expect(sendOtpSms("09362157181", "123456")).rejects.toThrow();
  });
});
