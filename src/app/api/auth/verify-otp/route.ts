import { NextResponse } from "next/server";
import { mergeGuestCart, upsertCustomerAccount, type CartLineInput } from "@ufo/orders";
import type { CustomerType, ProductVariantType, UserRole } from "@ufo/types";
import { checkRateLimit, createCustomerSessionToken } from "@/lib/customer-session";
import { verifyStoredOtp } from "@/lib/verify-stored-otp";
import { needsProfileCompletion } from "@/lib/customer-onboarding";

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
    const challenge = await verifyStoredOtp(challengeId, code);

    const customer = upsertCustomerAccount({
      mobileNumber: challenge.phone,
      customerType: type,
    });
    if (customer.status !== "active") {
      return NextResponse.json({ error: "حساب کاربری غیرفعال است." }, { status: 403 });
    }
    const roles: UserRole[] = [type === "wholesale" ? "wholesale_customer" : "retail_customer"];
    const token = createCustomerSessionToken({
      customerId: customer.id,
      phone: customer.mobileNumber,
      customerType: customer.customerType,
      roles,
    });
    const cart = mergeGuestCart(customer.id, type, guestCartLines(payload.guestCart));

    return NextResponse.json({
      customer,
      token,
      cart,
      needsProfileCompletion: needsProfileCompletion(customer),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ورود انجام نشد." },
      { status: 400 },
    );
  }
}
