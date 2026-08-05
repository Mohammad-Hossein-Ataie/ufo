import { NextResponse } from "next/server";
import { appendChatMessage, listChatMessages } from "@ufo/orders";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "شناسه سفارش الزامی است." }, { status: 400 });
  return NextResponse.json({ messages: listChatMessages(orderId) });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
    const body = typeof payload.body === "string" ? payload.body : "";
    const message = appendChatMessage({ orderId, body, sender: "admin" });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ارسال پیام انجام نشد." },
      { status: 400 },
    );
  }
}
