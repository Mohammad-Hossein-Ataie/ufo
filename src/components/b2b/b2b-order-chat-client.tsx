"use client";

import { ChatThreadClient } from "@/components/chat-thread-client";

export function B2BOrderChatClient({ orderId }: { orderId: string }) {
  return (
    <ChatThreadClient
      orderId={orderId}
      endpoint="/api/b2b/chat"
      currentSender="customer"
      title="پشتیبانی سفارش عمده"
      subtitle="برای هماهنگی موجودی، زمان آماده‌سازی، ارسال کارتن‌ها یا اصلاح سفارش عمده پیام بدهید."
      placeholder="پیام خود را برای تیم عمده‌فروشی یوفوپاف بنویسید..."
      tone="b2b"
    />
  );
}
