import { NextResponse } from "next/server";
import { reorderSubmittedOrder } from "@ufo/orders";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const session = requireCustomerSession(request, "wholesale");
    const limit = checkRateLimit(`reorder:${session.customerId}`, 20, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "درخواست خرید مجدد بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
    const { orderId } = await params;
    const cart = reorderSubmittedOrder({
      orderId,
      customerId: session.customerId,
      channel: "wholesale",
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خرید مجدد عمده انجام نشد." },
      { status: 400 },
    );
  }
}
