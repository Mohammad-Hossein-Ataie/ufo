import { NextResponse } from "next/server";
import { getCustomerCart } from "@ufo/orders";
import { requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = requireCustomerSession(request);
    const cart = getCustomerCart(session.customerId, session.customerType);
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت سبد خرید انجام نشد." },
      { status: 401 },
    );
  }
}
