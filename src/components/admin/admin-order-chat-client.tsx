"use client";

import { ChatThreadClient } from "@/components/chat-thread-client";

export function AdminOrderChatClient({ orderId }: { orderId: string }) {
  return (
    <ChatThreadClient
      orderId={orderId}
      endpoint="/api/admin/chat"
      currentSender="admin"
      title="گفت‌وگوی پشتیبانی"
      subtitle="پاسخ‌های کوتاه، دقیق و قابل پیگیری برای سفارش‌های تکی و عمده."
      placeholder="پاسخ پشتیبانی را بنویسید؛ می‌توانید تصویر، رسید یا توضیح تکمیلی هم ضمیمه کنید."
      tone="admin"
    />
  );
}
