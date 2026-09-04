import { NextResponse } from "next/server";
import { getSubmittedOrderForCustomer } from "@ufo/orders";
import { requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = requireCustomerSession(request, "wholesale");
    const { orderId } = await params;
    const order = getSubmittedOrderForCustomer(orderId, session.customerId, "wholesale");
    if (!order) throw new Error("سفارش عمده پیدا نشد.");
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت سفارش عمده انجام نشد." },
      { status: 404 },
    );
  }
}
