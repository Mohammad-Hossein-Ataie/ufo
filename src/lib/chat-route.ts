import { NextResponse } from "next/server";
import {
  appendChatMessage,
  editChatMessage,
  markChatMessagesRead,
  type ChatMessageRecord,
} from "@ufo/orders";
import type { SalesChannel } from "@ufo/types";
import { boundedBody, chatErrorStatus, requireChatOrder } from "./chat-access";
import { readChatFile } from "./chat-files";

export function chatHandlers(audience: SalesChannel | "admin") {
  async function handle(request: Request) {
    try {
      const payload =
        request.method === "GET"
          ? {}
          : (JSON.parse((await boundedBody(request, 16000)).toString()) as Record<string, unknown>);
      const orderId =
        request.method === "GET"
          ? (new URL(request.url).searchParams.get("orderId") ?? "")
          : typeof payload.orderId === "string"
            ? payload.orderId
            : "";
      const order = await requireChatOrder(request, orderId, audience);
      const sender = audience === "admin" ? "admin" : "customer";
      if (request.method === "GET")
        return NextResponse.json(
          { messages: markChatMessagesRead(order.id, sender) },
          { headers: { "Cache-Control": "private, no-store" } },
        );
      const body = typeof payload.body === "string" ? payload.body.trim() : "";
      if (body.length > 2000) throw new Error("پیام باید حداکثر ۲۰۰۰ کاراکتر باشد.");
      if (request.method === "PATCH") {
        const messageId = typeof payload.messageId === "string" ? payload.messageId : "";
        return NextResponse.json({
          message: editChatMessage({ orderId: order.id, messageId, body, sender }),
        });
      }
      const attachments: NonNullable<ChatMessageRecord["attachments"]> = [];
      if (
        payload.attachments !== undefined &&
        (!Array.isArray(payload.attachments) || payload.attachments.length > 3)
      )
        throw new Error("حداکثر سه فایل در هر پیام مجاز است.");
      for (const item of (payload.attachments ?? []) as Record<string, unknown>[]) {
        if (!item || typeof item.key !== "string") throw new Error("فایل معتبر نیست.");
        await readChatFile(order.id, item.key); // Files are scoped to the authorized order.
        attachments.push({
          key: item.key,
          name: typeof item.name === "string" ? item.name.slice(0, 160) : "فایل",
          contentType: item.key.endsWith(".pdf") ? "application/pdf" : "image/webp",
          url: `/api/chat/upload?orderId=${encodeURIComponent(order.id)}&key=${item.key}`,
        });
      }
      const replyToId = typeof payload.replyToId === "string" ? payload.replyToId : undefined;
      if (replyToId && !order.chat.some((message) => message.id === replyToId))
        throw new Error("پیام مورد پاسخ پیدا نشد.");
      return NextResponse.json(
        {
          message: appendChatMessage({
            orderId: order.id,
            sender,
            body,
            attachments,
            ...(replyToId ? { replyToId } : {}),
          }),
        },
        { status: 201 },
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error && !("code" in error)
              ? error.message
              : "دریافت یا ارسال گفتگو انجام نشد.",
        },
        { status: chatErrorStatus(error) },
      );
    }
  }
  return { GET: handle, POST: handle, PATCH: handle };
}
