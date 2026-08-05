import { NextResponse } from "next/server";
import { listSubmittedOrders } from "@ufo/orders";
import type { SalesChannel } from "@ufo/types";

export const runtime = "nodejs";

function channel(value: string | null): SalesChannel | undefined {
  if (value === "retail" || value === "wholesale") return value;
  return undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const selectedChannel = channel(url.searchParams.get("channel"));
  const orders = listSubmittedOrders(selectedChannel ? { channel: selectedChannel } : {});
  return NextResponse.json({ orders });
}
