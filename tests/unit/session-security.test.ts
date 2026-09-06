import { afterEach, describe, expect, it, vi } from "vitest";
import { envSchema, getSessionSecret } from "@ufo/config";
import { createAdminSessionToken, verifyAdminSessionToken } from "@/lib/admin-session";
import { createCustomerSessionToken, verifyCustomerSessionToken } from "@/lib/customer-session";
import { register } from "@/instrumentation";

afterEach(() => vi.unstubAllEnvs());
describe("production session configuration", () => {
  it.each([
    undefined,
    "",
    "short",
    " ".repeat(40),
    "development-admin-session-secret-change-me",
    "replace-with-at-least-32-random-characters",
  ])("rejects missing/weak/sample secrets in production", async (value) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", value);
    expect(() => getSessionSecret("admin")).toThrow(/SESSION_SECRET/);
    expect(() => getSessionSecret("customer")).toThrow(/SESSION_SECRET/);
    await expect(createAdminSessionToken("admin")).rejects.toThrow(/SESSION_SECRET/);
    expect(envSchema.safeParse({ NODE_ENV: "production", SESSION_SECRET: value }).success).toBe(
      false,
    );
  });
  it("keeps the existing dev/test fallbacks and rejects unknown modes", () => {
    expect(getSessionSecret("admin", { NODE_ENV: "development" })).toBe(
      "development-admin-session-secret-change-me",
    );
    expect(getSessionSecret("customer", { NODE_ENV: "test" })).toBe(
      "development-session-secret-change-me",
    );
    expect(() => getSessionSecret("admin", { NODE_ENV: "staging" })).toThrow(/NODE_ENV/);
    expect(envSchema.safeParse({ NODE_ENV: "staging" }).success).toBe(false);
  });
  it("signs and verifies both audiences with a configured 32-character secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "0123456789abcdef0123456789abcdef");
    const admin = await createAdminSessionToken("test-admin");
    expect(await verifyAdminSessionToken(admin)).toBe(true);
    const customer = createCustomerSessionToken({
      customerId: "test",
      phone: "09123456789",
      customerType: "retail",
      roles: ["retail_customer"],
    });
    expect(verifyCustomerSessionToken(customer)?.customerId).toBe("test");
    vi.stubEnv("SESSION_SECRET", "fedcba9876543210fedcba9876543210");
    expect(await verifyAdminSessionToken(admin)).toBe(false);
    expect(verifyCustomerSessionToken(customer)).toBeNull();
  });
  it("fails startup for invalid production secrets", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    vi.stubEnv("NEXT_PHASE", "phase-production-server");
    await expect(register()).rejects.toThrow(/SESSION_SECRET/);
    vi.stubEnv("SESSION_SECRET", "0123456789abcdef0123456789abcdef");
    await expect(register()).resolves.toBeUndefined();
  });
});
