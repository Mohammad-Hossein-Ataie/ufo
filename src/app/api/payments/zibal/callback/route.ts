import { NextResponse } from "next/server";
import { getSubmittedOrderByGatewayTrackId } from "@ufo/orders";
import { reconcileZibalOrder } from "@/lib/zibal-order";
import { getConfiguredOrigin } from "@/lib/request-origin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const trackId = url.searchParams.get("trackId") ?? "";
  if (!/^\d{1,30}$/.test(trackId)) return new Response("شناسه تراکنش معتبر نیست.", { status: 400 });
  const order = getSubmittedOrderByGatewayTrackId(trackId);
  if (!order || (url.searchParams.get("orderId") && url.searchParams.get("orderId") !== order.id))
    return new Response("تراکنش برای این سفارش پیدا نشد.", { status: 404 });
  try {
    const outcome = await reconcileZibalOrder(order, trackId);
    const path = `${order.channel === "wholesale" ? "/b2b" : ""}/orders/${encodeURIComponent(order.id)}`;
    const destination = new URL(path, getConfiguredOrigin() ?? url.origin);
    destination.searchParams.set("payment", outcome);
    return NextResponse.redirect(destination, { status: 303 });
  } catch {
    // A provider/network mismatch must never approve an order from callback parameters alone.
    return new Response("تأیید پرداخت انجام نشد. وضعیت سفارش را دوباره بررسی کنید.", {
      status: 502,
    });
  }
}
