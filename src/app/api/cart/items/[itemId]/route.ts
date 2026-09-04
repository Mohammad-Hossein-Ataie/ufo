import { NextResponse } from "next/server";
import { removeCartItem, updateCartItem } from "@ufo/orders";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  try {
    const session = requireCustomerSession(request);
    const limit = checkRateLimit(`cart:${session.customerId}`, 80, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تغییرات سبد خرید بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
    const { itemId } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    const cart = updateCartItem(
      session.customerId,
      session.customerType,
      itemId,
      Number(payload.quantity),
      Number(payload.cartonCount),
    );
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "بروزرسانی سبد خرید انجام نشد." },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    const session = requireCustomerSession(request);
    const { itemId } = await params;
    const cart = removeCartItem(session.customerId, session.customerType, itemId);
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حذف از سبد خرید انجام نشد." },
      { status: 400 },
    );
  }
}
