import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/otp-store", () => ({ saveOtpChallenge: vi.fn() }));
vi.mock("@/lib/customer-session", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true })) }));
import { saveOtpChallenge } from "@/lib/otp-store";
import { POST } from "@/app/api/auth/send-otp/route";

beforeEach(() => {
  vi.stubEnv("NODE_ENV", "development");
  vi.stubEnv("OTP_SECRET", "test-otp-secret-at-least-16");
  vi.stubEnv("SMS_PROVIDER", "melipayamak");
  vi.stubEnv("MELIPAYAMAK_USERNAME", "test-user");
  vi.stubEnv("MELIPAYAMAK_API_KEY", "test-api-key");
  vi.stubEnv("MELIPAYAMAK_OTP_MODE", "pattern");
  vi.stubEnv("MELIPAYAMAK_BODY_ID", "1234");
});
afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function request() {
  return new Request("http://localhost/api/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ phone: "09362157181" }),
  });
}

it("does not expose real OTPs even in development", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        new Response('<string xmlns="http://tempuri.org/">12345678901234567</string>'),
      ),
  );
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).not.toHaveProperty("code");
  expect(saveOtpChallenge).toHaveBeenCalledOnce();
  const challenge = vi.mocked(saveOtpChallenge).mock.calls[0]![0];
  expect(challenge.codeHash).toMatch(/^[0-9a-f]{64}$/);
});

it("does not expose mock OTPs either", async () => {
  vi.stubEnv("SMS_PROVIDER", "mock");
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).not.toHaveProperty("code");
  expect(saveOtpChallenge).toHaveBeenCalledOnce();
});

it("does not persist a challenge when the provider rejects sending", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<string>0</string>")));
  expect((await POST(request())).status).toBe(503);
  expect(saveOtpChallenge).not.toHaveBeenCalled();
});

it("does not call the provider or save a challenge without an approved pattern ID", async () => {
  vi.stubEnv("MELIPAYAMAK_BODY_ID", "");
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  expect((await POST(request())).status).toBe(503);
  expect(fetcher).not.toHaveBeenCalled();
  expect(saveOtpChallenge).not.toHaveBeenCalled();
});
