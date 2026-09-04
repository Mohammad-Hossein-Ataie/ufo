import { NextResponse } from "next/server";
import { addCartItem, type CartLineInput } from "@ufo/orders";
import type { ProductVariantType } from "@ufo/types";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

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

function cartLine(payload: Record<string, unknown>): CartLineInput {
  const option = selectedVariant(payload.selectedVariant);
  const quantity = Number(payload.quantity);
  const cartonCount = Number(payload.cartonCount);
  return {
    variantId: String(payload.variantId ?? ""),
    quantity,
    ...(Number.isInteger(cartonCount) && cartonCount > 0 ? { cartonCount } : {}),
    ...(option ? { selectedVariant: option } : {}),
    ...(typeof payload.colorId === "string" ? { colorId: payload.colorId } : {}),
  };
}

export async function POST(request: Request) {
  try {
    const session = requireCustomerSession(request);
    const limit = checkRateLimit(`cart:${session.customerId}`, 80, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تغییرات سبد خرید بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
    const payload = (await request.json()) as Record<string, unknown>;
    const cart = addCartItem(session.customerId, session.customerType, cartLine(payload));
    return NextResponse.json(cart, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "افزودن به سبد خرید انجام نشد." },
      { status: 400 },
    );
  }
}
