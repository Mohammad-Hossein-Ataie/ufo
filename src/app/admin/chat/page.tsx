import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { listSubmittedOrders } from "@ufo/orders";
import { Button, EmptyState, StatusPill } from "@ufo/ui";

export const dynamic = "force-dynamic";

export default function AdminChatPage() {
  const orders = listSubmittedOrders();
  const chatOrders = orders.filter((order) => order.chat.length > 0);
  const visibleOrders = chatOrders.length > 0 ? chatOrders : orders.slice(0, 10);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-black">چت سفارش‌ها</h1>
      <p className="mt-2 text-[#5F6C79]">برای پاسخ برخط، وارد جزئیات سفارش شوید.</p>
      <div className="mt-6 grid gap-3">
        {visibleOrders.length === 0 ? (
          <EmptyState title="گفتگویی وجود ندارد">
            پس از ثبت سفارش تکی یا عمده، پیام‌های مشتری اینجا قابل پیگیری است.
          </EmptyState>
        ) : (
          visibleOrders.map((order) => (
            <article key={order.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#D7DDE4] bg-white p-4">
              <div>
                <h2 className="font-bold" dir="ltr">{order.orderNumber}</h2>
                <p className="mt-1 text-sm text-[#5F6C79]">{order.customer.businessName ?? order.customer.fullName}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone={order.chat.length > 0 ? "success" : "neutral"}>
                  {order.chat.length.toLocaleString("fa-IR")} پیام
                </StatusPill>
                <Link href={`/admin/orders/${order.id}`}>
                  <Button size="sm">
                    <MessageSquare size={16} />
                    باز کردن چت
                  </Button>
                </Link>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
