import { NextResponse } from "next/server";
import { appendChatMessage, editChatMessage, markChatMessagesRead } from "@ufo/orders";
import type { ChatMessageRecord } from "@ufo/orders";

export const runtime = "nodejs";

function parseAttachments(value: unknown): NonNullable<ChatMessageRecord["attachments"]> {
  if (!Array.isArray(value)) return [];
  const attachments: NonNullable<ChatMessageRecord["attachments"]> = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    const url = typeof record.url === "string" ? record.url.trim() : "";
    if (!url) continue;
    attachments.push({
      url,
      ...(typeof record.key === "string" ? { key: record.key } : {}),
      ...(typeof record.name === "string" ? { name: record.name } : {}),
      ...(typeof record.contentType === "string" ? { contentType: record.contentType } : {}),
    });
  }
  return attachments;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "شناسه سفارش الزامی است." }, { status: 400 });
  return NextResponse.json({ messages: markChatMessagesRead(orderId, "customer") });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
    const body = typeof payload.body === "string" ? payload.body : "";
    const attachments = parseAttachments(payload.attachments);
    const replyToId = typeof payload.replyToId === "string" ? payload.replyToId : undefined;
    const message = appendChatMessage({
      orderId,
      body,
      sender: "customer",
      ...(attachments.length > 0 ? { attachments } : {}),
      ...(replyToId ? { replyToId } : {}),
    });
    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ارسال پیام انجام نشد." },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const orderId = typeof payload.orderId === "string" ? payload.orderId : "";
    const messageId = typeof payload.messageId === "string" ? payload.messageId : "";
    const body = typeof payload.body === "string" ? payload.body : "";
    const message = editChatMessage({ orderId, messageId, body, sender: "customer" });
    return NextResponse.json({ message });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ویرایش پیام انجام نشد." },
      { status: 400 },
    );
  }
}
