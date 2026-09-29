import { NextResponse } from "next/server";
import { listSubmittedOrders } from "@ufo/orders";
import { adminRequestErrorStatus, requireAdminRead } from "@/lib/admin-request";
import { parseAdminOrderQuery, queryAdminOrders } from "@/lib/admin-order-query";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const startedAt = performance.now();
  try {
    await requireAdminRead(request);
    const allOrders = listSubmittedOrders();
    const result = queryAdminOrders(allOrders, parseAdminOrderQuery(new URL(request.url)));
    return NextResponse.json(result, {
      headers: {
        "Server-Timing": `admin-orders;dur=${(performance.now() - startedAt).toFixed(1)}`,
        "X-Admin-Orders-Source-Count": String(allOrders.length),
        "X-Admin-Orders-Page-Count": String(result.orders.length),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت سفارش‌ها انجام نشد." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
