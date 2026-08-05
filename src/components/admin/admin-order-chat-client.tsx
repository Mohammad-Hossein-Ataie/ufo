"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button, Textarea } from "@ufo/ui";
import type { ChatMessageRecord } from "@ufo/orders";

export function AdminOrderChatClient({ orderId }: { orderId: string }) {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function loadMessages() {
    const response = await fetch(`/api/admin/chat?orderId=${encodeURIComponent(orderId)}`, {
      cache: "no-store",
    });
    if (!response.ok) return;
    const payload = (await response.json()) as { messages?: ChatMessageRecord[] };
    setMessages(payload.messages ?? []);
  }

  useEffect(() => {
    void loadMessages();
    const timer = window.setInterval(() => void loadMessages(), 2500);
    return () => window.clearInterval(timer);
  }, [orderId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSending(true);
    const response = await fetch("/api/admin/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, body }),
    });
    setIsSending(false);
    if (!response.ok) return;
    setBody("");
    await loadMessages();
  }

  return (
    <section className="rounded-md border border-[#D7DDE4] bg-white p-5">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <MessageSquare size={20} />
        چت با مشتری
      </h2>
      <div className="mt-4 grid max-h-96 gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-[#5F6C79]">هنوز پیامی ثبت نشده است.</p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-md border p-3 text-sm ${
              message.sender === "admin"
                ? "border-[#168BFF]/30 bg-[#168BFF]/10"
                : "border-[#1F8A5B]/30 bg-[#1F8A5B]/10"
            }`}
          >
            <p className="font-bold">{message.sender === "admin" ? "ادمین" : "مشتری"}</p>
            <p className="mt-1 leading-7">{message.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="پاسخ ادمین"
        />
        <Button type="submit" disabled={isSending || !body.trim()}>
          <Send size={18} />
          {isSending ? "در حال ارسال..." : "ارسال پاسخ"}
        </Button>
      </form>
    </section>
  );
}
