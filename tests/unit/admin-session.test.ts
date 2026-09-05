import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminSessionToken, verifyAdminSessionToken } from "@/lib/admin-session";

describe("signed admin session", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a signed token and rejects tampering", async () => {
    vi.stubEnv("SESSION_SECRET", "test-admin-session-secret-at-least-32-characters");
    const token = await createAdminSessionToken("admin@example.com");
    expect(await verifyAdminSessionToken(token)).toBe(true);
    expect(await verifyAdminSessionToken(`${token.slice(0, -1)}x`)).toBe(false);
    expect(await verifyAdminSessionToken("authenticated")).toBe(false);
  });
});
