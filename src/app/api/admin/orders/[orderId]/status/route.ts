import { NextResponse } from "next/server";
import { updateSubmittedOrderStatus } from "@ufo/orders";
import type { OrderStatus } from "@ufo/types";

export const runtime = "nodejs";

const allowedStatuses: OrderStatus[] = [
  "payment_under_review",
  "confirmed",
  "processing",
  "ready_for_pickup",
  "shipped",
  "delivered",
  "cancelled"
];

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const payload = (await request.json()) as Record<string, unknown>;
    const status = typeof payload.status === "string" ? payload.status : "";
    if (!allowedStatuses.includes(status as OrderStatus)) {
      return NextResponse.json({ error: "وضعیت سفارش معتبر نیست." }, { status: 400 });
    }
    const order = updateSubmittedOrderStatus(orderId, status as OrderStatus);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "به‌روزرسانی وضعیت انجام نشد." },
      { status: 400 },
    );
  }
}
