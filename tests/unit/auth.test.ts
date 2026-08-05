import { describe, expect, it } from "vitest";
import { can, createOtpChallenge, verifyOtpChallenge } from "@ufo/auth";

describe("auth", () => {
  it("checks server-side permissions", () => {
    expect(can(["admin"], "admin:write")).toBe(true);
    expect(can(["retail_customer"], "admin:write")).toBe(false);
  });

  it("creates and verifies OTP challenges", async () => {
    const { challenge, code } = await createOtpChallenge({
      phone: "09362157181",
      secret: "test-secret-for-otp",
      now: new Date("2026-08-02T08:00:00.000Z"),
    });
    await expect(
      verifyOtpChallenge({
        challenge,
        code,
        secret: "test-secret-for-otp",
        now: new Date("2026-08-02T08:01:00.000Z"),
      }),
    ).resolves.toEqual(challenge);
  });
});
