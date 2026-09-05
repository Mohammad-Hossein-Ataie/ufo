import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createOtpChallenge } from "@ufo/auth";
import { getCustomerAccount, upsertCustomerAccount } from "@ufo/orders";
import { POST } from "@/app/api/auth/verify-otp/route";
import { PATCH } from "@/app/api/customer/profile/route";
import { saveOtpChallenge } from "@/lib/otp-store";
import { customerLoginDestination } from "@/lib/customer-onboarding";
import type { CustomerType } from "@ufo/types";

vi.mock("@/lib/customer-session", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  createCustomerSessionToken: vi.fn(() => "test-token"),
  requireCustomerSession: vi.fn(),
}));
import { requireCustomerSession } from "@/lib/customer-session";

let directory: string;
const secret = "test-only-otp-secret-long-enough";
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "ufo-otp-flow-"));
  vi.stubEnv("UFO_MOCK_DATA_DIR", directory);
  vi.stubEnv("OTP_SECRET", secret);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
  rmSync(directory, { recursive: true, force: true });
});

async function loginRequest(type: CustomerType, extra: Record<string, unknown> = {}) {
  const { challenge, code } = await createOtpChallenge({ phone: "09123456789", secret });
  saveOtpChallenge(challenge);
  const body = JSON.stringify({ challengeId: challenge.id, code, customerType: type, ...extra });
  return () => new Request("http://localhost/api/auth/verify-otp", { method: "POST", body });
}

describe.each(["retail", "wholesale"] as const)("%s OTP onboarding", (type) => {
  it("creates an incomplete account after verification and ignores profile injection", async () => {
    const request = await loginRequest(type, {
      firstName: "Injected",
      lastName: "Name",
      fullName: "Injected Name",
      companyName: "Injected",
    });
    const response = await POST(request());
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.needsProfileCompletion).toBe(true);
    expect(payload.customer.firstName).toBe("");
    expect(payload.customer.lastName).toBe("");
    expect(payload.token).toBe("test-token");
    expect(getCustomerAccount(payload.customer.id)?.mobileNumber).toBe("09123456789");
  });

  it("preserves returning names and skips completion", async () => {
    const customer = upsertCustomerAccount({
      mobileNumber: "09123456789",
      customerType: type,
      profile: { firstName: "Existing", lastName: "Customer", companyName: "Existing Store" },
    });
    const request = await loginRequest(type, { fullName: "Changed Name", firstName: "Changed" });
    const payload = await (await POST(request())).json();
    expect(payload.needsProfileCompletion).toBe(false);
    expect(payload.customer.id).toBe(customer.id);
    expect(payload.customer.firstName).toBe("Existing");
    expect(payload.customer.lastName).toBe("Customer");
  });

  it("allows only one concurrent verification and rejects later replay", async () => {
    const request = await loginRequest(type);
    const results = await Promise.all([POST(request()), POST(request())]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 400]);
    expect((await POST(request())).status).toBe(400);
  });

  it("completes profile through the authenticated route without assigning pricing privileges", async () => {
    const customer = upsertCustomerAccount({ mobileNumber: "09123456789", customerType: type });
    vi.mocked(requireCustomerSession).mockReturnValue({
      customerId: customer.id,
      customerType: type,
      phone: customer.mobileNumber,
      roles: [],
      issuedAt: "",
      expiresAt: "",
    });
    const response = await PATCH(
      new Request("http://localhost/api/customer/profile", {
        method: "PATCH",
        body: JSON.stringify({
          firstName: "New",
          lastName: "Customer",
          companyName: "Store",
          pricingGroup: "vip",
          customerLevel: "vip",
        }),
      }),
    );
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.needsProfileCompletion).toBe(false);
    expect(payload.customer.pricingGroup).not.toBe("vip");
    expect(payload.customer.customerLevel).not.toBe("vip");
  });
});

it("rejects invalid codes and locks out after five attempts", async () => {
  const request = await loginRequest("retail", { code: "000000" });
  for (let index = 0; index < 6; index++) {
    expect((await POST(request())).status).toBe(400);
  }
});

it("rejects expired codes", async () => {
  const { challenge, code } = await createOtpChallenge({ phone: "09123456789", secret });
  saveOtpChallenge({ ...challenge, expiresAt: new Date(0).toISOString() });
  const response = await POST(
    new Request("http://localhost/api/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ challengeId: challenge.id, code }),
    }),
  );
  expect(response.status).toBe(400);
});

it.each([
  "https://example.org",
  "//example.org",
  "/\\example.org",
  "/%2fexample.org",
  "/admin",
  "/b2b/account",
  "/login",
])("rejects unsafe retail next URL: %s", (next) => {
  expect(customerLoginDestination(next, "retail")).toBe("/account");
});

it("keeps valid checkout destinations within the platform", () => {
  expect(customerLoginDestination("/checkout", "retail")).toBe("/checkout");
  expect(customerLoginDestination("/b2b/checkout", "wholesale")).toBe("/b2b/checkout");
});
