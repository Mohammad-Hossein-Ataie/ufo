import { NextResponse } from "next/server";
import { verifyOtpChallenge } from "@ufo/auth";
import {
  mergeGuestCart,
  upsertCustomerAccount,
  type CartLineInput,
  type CustomerProfilePatch,
} from "@ufo/orders";
import type { CustomerType, ProductVariantType, UserRole } from "@ufo/types";
import { checkRateLimit, createCustomerSessionToken } from "@/lib/customer-session";
import { getOtpChallenge, removeOtpChallenge, updateOtpChallenge } from "@/lib/otp-store";

export const runtime = "nodejs";

function customerType(value: unknown): CustomerType {
  return value === "wholesale" ? "wholesale" : "retail";
}

function selectedVariant(
  value: unknown,
): { type: Exclude<ProductVariantType, "none">; valueId: string } | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (
    (record.type === "flavor" ||
      record.type === "color" ||
      record.type === "resistance" ||
      record.type === "capacity") &&
    typeof record.valueId === "string"
  ) {
    return { type: record.type, valueId: record.valueId };
  }
  return undefined;
}

function guestCartLines(value: unknown): CartLineInput[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((line) => {
      if (!line || typeof line !== "object" || Array.isArray(line)) return null;
      const record = line as Record<string, unknown>;
      const quantity = Number(record.quantity);
      if (typeof record.variantId !== "string" || !Number.isInteger(quantity) || quantity <= 0) {
        return null;
      }
      const option = selectedVariant(record.selectedVariant);
      const cartonCount = Number(record.cartonCount);
      return {
        variantId: record.variantId,
        quantity,
        ...(Number.isInteger(cartonCount) && cartonCount > 0 ? { cartonCount } : {}),
        ...(option ? { selectedVariant: option } : {}),
        ...(typeof record.colorId === "string" ? { colorId: record.colorId } : {}),
      };
    })
    .filter((line): line is CartLineInput => line !== null);
}

function profilePatch(payload: Record<string, unknown>, type: CustomerType): CustomerProfilePatch {
  return {
    ...(typeof payload.firstName === "string" ? { firstName: payload.firstName } : {}),
    ...(typeof payload.lastName === "string" ? { lastName: payload.lastName } : {}),
    ...(typeof payload.email === "string" ? { email: payload.email } : {}),
    ...(type === "wholesale" && typeof payload.companyName === "string"
      ? { companyName: payload.companyName }
      : {}),
    ...(type === "wholesale" && typeof payload.businessType === "string"
      ? { businessType: payload.businessType }
      : {}),
    ...(type === "wholesale" && typeof payload.taxId === "string" ? { taxId: payload.taxId } : {}),
  };
}

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limit = checkRateLimit(`otp-verify:${ip}`, 10, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تلاش ورود بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }

    const payload = (await request.json()) as Record<string, unknown>;
    const challengeId = String(payload.challengeId ?? "");
    const code = String(payload.code ?? "");
    const type = customerType(payload.customerType ?? payload.platformType);
    const challenge = getOtpChallenge(challengeId);
    if (!challenge) throw new Error("کد ورود پیدا نشد یا منقضی شده است.");

    const verified = await verifyOtpChallenge({
      challenge,
      code,
      secret: process.env.OTP_SECRET ?? "development-otp-secret",
    });
    if (verified.attempts !== challenge.attempts) {
      updateOtpChallenge(verified);
      throw new Error("کد ورود صحیح نیست.");
    }
    removeOtpChallenge(challengeId);

    const customer = upsertCustomerAccount({
      mobileNumber: challenge.phone,
      customerType: type,
      fullName:
        typeof payload.fullName === "string"
          ? payload.fullName
          : typeof payload.businessName === "string"
            ? payload.businessName
            : "",
      profile: profilePatch(payload, type),
    });
    const roles: UserRole[] = [type === "wholesale" ? "wholesale_customer" : "retail_customer"];
    const token = createCustomerSessionToken({
      customerId: customer.id,
      phone: customer.mobileNumber,
      customerType: customer.customerType,
      roles,
    });
    const cart = mergeGuestCart(customer.id, type, guestCartLines(payload.guestCart));

    return NextResponse.json({ customer, token, cart });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ورود انجام نشد." },
      { status: 400 },
    );
  }
}
