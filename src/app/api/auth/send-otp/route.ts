import { NextResponse } from "next/server";
import { createOtpChallenge } from "@ufo/auth";
import { normalizeIranPhone } from "@ufo/validation";
import type { CustomerType } from "@ufo/types";
import { checkRateLimit } from "@/lib/customer-session";
import { saveOtpChallenge } from "@/lib/otp-store";

export const runtime = "nodejs";

function customerType(value: unknown): CustomerType {
  return value === "wholesale" ? "wholesale" : "retail";
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limit = checkRateLimit(`otp:${ip}`, 6, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "درخواست کد ورود بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const phone = normalizeIranPhone(String(payload.phone ?? ""));
    const type = customerType(payload.customerType ?? payload.platformType);
    const { challenge, code } = await createOtpChallenge({
      phone,
      secret: process.env.OTP_SECRET ?? "development-otp-secret",
    });
    saveOtpChallenge(challenge);
    return NextResponse.json({
      challengeId: challenge.id,
      phone,
      customerType: type,
      expiresAt: challenge.expiresAt,
      ...(process.env.SMS_PROVIDER === "mock" || process.env.NODE_ENV !== "production"
        ? { code }
        : {}),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ارسال کد ورود انجام نشد." },
      { status: 400 },
    );
  }
}
