"use client";

import { FormEvent, useEffect, useState } from "react";
import { MessageSquare, Send } from "lucide-react";
import { Button, Textarea } from "@ufo/ui";
import type { ChatMessageRecord } from "@ufo/orders";

export function OrderChatClient({ orderId }: { orderId: string }) {
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  async function loadMessages() {
    const response = await fetch(`/api/chat?orderId=${encodeURIComponent(orderId)}`, {
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
    const response = await fetch("/api/chat", {
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
    <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
      <h2 className="flex items-center gap-2 text-xl font-bold">
        <MessageSquare size={20} />
        چت سفارش
      </h2>
      <div className="mt-4 grid max-h-80 gap-3 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-sm text-[#9BA7B4]">هنوز پیامی ثبت نشده است.</p>
        ) : null}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`rounded-md border p-3 text-sm ${
              message.sender === "customer"
                ? "border-cyan-300/40 bg-cyan-300/10"
                : "border-emerald-300/40 bg-emerald-300/10"
            }`}
          >
            <p className="font-bold">{message.sender === "customer" ? "شما" : "ادمین"}</p>
            <p className="mt-1 leading-7">{message.body}</p>
          </div>
        ))}
      </div>
      <form onSubmit={submit} className="mt-4 grid gap-3">
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="پیام خود را بنویسید"
        />
        <Button type="submit" disabled={isSending || !body.trim()}>
          <Send size={18} />
          {isSending ? "در حال ارسال..." : "ارسال پیام"}
        </Button>
      </form>
    </section>
  );
}
