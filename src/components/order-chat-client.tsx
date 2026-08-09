"use client";

import { ChatThreadClient } from "@/components/chat-thread-client";

export function OrderChatClient({ orderId }: { orderId: string }) {
  return (
    <ChatThreadClient
      orderId={orderId}
      endpoint="/api/chat"
      currentSender="customer"
      title="پشتیبانی سفارش"
      subtitle="برای سوال درباره پرداخت، ارسال، تغییر آدرس یا وضعیت سفارش پیام بگذارید."
      placeholder="پیام خود را برای پشتیبانی یوفوپاف بنویسید..."
      tone="retail"
    />
  );
}
