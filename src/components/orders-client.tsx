"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button, EmptyState, Price, StatusPill } from "@ufo/ui";
import type { SubmittedOrder } from "@ufo/orders";
import type { OrderStatus } from "@ufo/types";
import { authHeaders, readCustomerSession } from "@/lib/customer-client";

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
  returned: "مرجوع شده",
};

export function OrdersClient() {
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = readCustomerSession("retail");
    setIsLoggedIn(Boolean(session));
    if (!session) return;
    fetch("/api/orders", { cache: "no-store", headers: authHeaders("retail") })
      .then((response) => response.json())
      .then((payload: { orders?: SubmittedOrder[] }) => setOrders(payload.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  async function reorder(orderId: string) {
    const response = await fetch(`/api/orders/${orderId}/reorder`, {
      method: "POST",
      headers: authHeaders("retail"),
    });
    if (response.ok) window.location.href = "/cart";
  }

  if (!isLoggedIn) {
    return (
      <EmptyState title="ورود انجام نشده است">
        ابتدا با شماره همراه وارد شوید تا سفارش‌های حساب شما نمایش داده شود.
      </EmptyState>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState title="هنوز سفارشی ندارید">
        از کاتالوگ فروش تکی محصول انتخاب کنید و سفارش را ثبت کنید.
      </EmptyState>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[#22303D] bg-[#0D1117]">
      <table className="min-w-[860px] w-full text-sm">
        <thead className="bg-[#141A22] text-[#D9E2EC]">
          <tr>
            <th className="px-4 py-3 text-right">شماره</th>
            <th className="px-4 py-3 text-right">تاریخ</th>
            <th className="px-4 py-3 text-right">وضعیت</th>
            <th className="px-4 py-3 text-right">تعداد کالا</th>
            <th className="px-4 py-3 text-right">مبلغ</th>
            <th className="px-4 py-3 text-right">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-[#22303D]">
              <td className="px-4 py-3" dir="ltr">
                {order.orderNumber}
              </td>
              <td className="px-4 py-3">{new Date(order.createdAt).toLocaleDateString("fa-IR")}</td>
              <td className="px-4 py-3">
                <StatusPill tone="info">{orderStatusLabelsFa[order.status]}</StatusPill>
              </td>
              <td className="px-4 py-3">{order.items.length.toLocaleString("fa-IR")}</td>
              <td className="px-4 py-3 font-bold">
                <Price valueRial={order.totalRial} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-2">
                  <Link href={`/orders/${order.id}`}>
                    <Button size="sm">مشاهده</Button>
                  </Link>
                  <Button size="sm" variant="ghost" onClick={() => reorder(order.id)}>
                    <RotateCcw size={16} />
                    خرید مجدد
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
