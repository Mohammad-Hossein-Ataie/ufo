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
  vi.stubEnv("MELIPAYAMAK_PASSWORD", "test-password");
  vi.stubEnv("MELIPAYAMAK_OTP_MODE", "otp");
  vi.stubEnv("MELIPAYAMAK_FROM", "50001234");
});
afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function request() {
  return new Request("http://localhost/api/auth/send-otp", {
    method: "POST", body: JSON.stringify({ phone: "09362157181" }),
  });
}

it("does not expose real OTPs even in development", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ Value: "12345678901234567" })));
  const response = await POST(request());
  expect(response.status).toBe(200);
  expect(await response.json()).not.toHaveProperty("code");
  expect(saveOtpChallenge).toHaveBeenCalledOnce();
  const challenge = vi.mocked(saveOtpChallenge).mock.calls[0]![0];
  expect(challenge.codeHash).toMatch(/^[0-9a-f]{64}$/);
});

it("does not persist a challenge when the provider rejects sending", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ Value: "0" })));
  expect((await POST(request())).status).toBe(503);
  expect(saveOtpChallenge).not.toHaveBeenCalled();
});
