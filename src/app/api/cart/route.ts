import { NextResponse } from "next/server";
import { getCustomerCart } from "@ufo/orders";
import { requireCustomerSession } from "@/lib/customer-session";
import { hydrateOrderCatalog } from "@/lib/order-catalog";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = requireCustomerSession(request);
    await hydrateOrderCatalog();
    const cart = getCustomerCart(session.customerId, session.customerType);
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت سبد خرید انجام نشد." },
      { status: 401 },
    );
  }
}
