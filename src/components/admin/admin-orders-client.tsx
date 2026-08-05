"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RefreshCcw } from "lucide-react";
import { Button, EmptyState, Price, StatusPill } from "@ufo/ui";
import type { SubmittedOrder } from "@ufo/orders";
import type { OrderStatus, SalesChannel } from "@ufo/types";

const orderStatusLabelsFa: Record<OrderStatus, string> = {
  draft: "پیش‌نویس",
  awaiting_payment: "در انتظار پرداخت",
  awaiting_receipt: "در انتظار رسید",
  payment_under_review: "در انتظار تایید پرداخت",
  confirmed: "تایید شده",
  processing: "در حال آماده‌سازی",
  ready_for_pickup: "آماده تحویل حضوری",
  shipped: "ارسال شده",
  delivered: "تحویل شده",
  cancelled: "لغو شده",
  returned: "مرجوع شده"
};

const statusFlow: OrderStatus[] = ["confirmed", "processing", "ready_for_pickup", "shipped", "delivered", "cancelled"];

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [channel, setChannel] = useState<SalesChannel | "all">("all");
  const [isLoading, setIsLoading] = useState(true);

  async function loadOrders(selectedChannel = channel) {
    setIsLoading(true);
    const suffix = selectedChannel === "all" ? "" : `?channel=${selectedChannel}`;
    const response = await fetch(`/api/admin/orders${suffix}`, { cache: "no-store" });
    const payload = (await response.json().catch(() => ({}))) as { orders?: SubmittedOrder[] };
    setOrders(payload.orders ?? []);
    setIsLoading(false);
  }

  useEffect(() => {
    void loadOrders();
  }, []);

  async function changeStatus(orderId: string, status: OrderStatus) {
    await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    await loadOrders();
  }

  function selectChannel(nextChannel: SalesChannel | "all") {
    setChannel(nextChannel);
    void loadOrders(nextChannel);
  }

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { value: "all", label: "همه" },
            { value: "retail", label: "تکی" },
            { value: "wholesale", label: "عمده" }
          ].map((item) => (
            <Button
              key={item.value}
              type="button"
              size="sm"
              variant={channel === item.value ? "primary" : "secondary"}
              onClick={() => selectChannel(item.value as SalesChannel | "all")}
            >
              {item.label}
            </Button>
          ))}
        </div>
        <Button type="button" size="sm" variant="secondary" onClick={() => loadOrders()} disabled={isLoading}>
          <RefreshCcw size={16} />
          تازه‌سازی
        </Button>
      </div>
      {orders.length === 0 ? (
        <EmptyState title={isLoading ? "در حال خواندن سفارش‌ها" : "سفارشی ثبت نشده است"}>
          سفارش‌های ثبت‌شده از مسیر فروش تکی و مسیر عمده اینجا نمایش داده می‌شود.
        </EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-md border border-[#D7DDE4] bg-white">
          <table className="min-w-[1120px] w-full text-sm">
            <thead className="bg-[#EEF3F8]">
              <tr>
                <th className="px-4 py-3 text-right">شماره</th>
                <th className="px-4 py-3 text-right">کانال</th>
                <th className="px-4 py-3 text-right">مشتری</th>
                <th className="px-4 py-3 text-right">وضعیت</th>
                <th className="px-4 py-3 text-right">ارسال</th>
                <th className="px-4 py-3 text-right">مبلغ</th>
                <th className="px-4 py-3 text-right">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-t border-[#D7DDE4] align-top">
                  <td className="px-4 py-3" dir="ltr">{order.orderNumber}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={order.channel === "wholesale" ? "success" : "info"}>
                      {order.channel === "wholesale" ? "عمده" : "تکی"}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold">{order.customer.businessName ?? order.customer.fullName}</p>
                    <p className="mt-1 text-[#5F6C79]" dir="ltr">{order.customer.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={order.paymentStatus === "approved" ? "success" : "warning"}>
                      {orderStatusLabelsFa[order.status]}
                    </StatusPill>
                  </td>
                  <td className="px-4 py-3">
                    <p>{order.shippingTitleFa}</p>
                    <p className="mt-1 text-[#5F6C79]">{order.etaFa}</p>
                  </td>
                  <td className="px-4 py-3 font-bold"><Price valueRial={order.totalRial} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button size="sm" variant="secondary">جزئیات</Button>
                      </Link>
                      {statusFlow.map((status) => (
                        <Button
                          key={status}
                          type="button"
                          size="sm"
                          variant={status === "cancelled" ? "danger" : "secondary"}
                          onClick={() => changeStatus(order.id, status)}
                        >
                          {orderStatusLabelsFa[status]}
                        </Button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
