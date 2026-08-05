"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button, EmptyState, Price, StatusPill } from "@ufo/ui";
import type { SubmittedOrder } from "@ufo/orders";
import type { OrderStatus } from "@ufo/types";

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

function readPhone(): string {
  const raw = window.localStorage.getItem("ufo-retail-session");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { phone?: string };
    return parsed.phone ?? "";
  } catch {
    return "";
  }
}

export function OrdersClient() {
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const currentPhone = readPhone();
    setPhone(currentPhone);
    if (!currentPhone) return;
    fetch(`/api/orders?phone=${encodeURIComponent(currentPhone)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { orders?: SubmittedOrder[] }) => setOrders(payload.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  if (!phone) {
    return (
      <EmptyState title="ورود انجام نشده است">
        ابتدا با شماره همراه وارد شوید تا سفارش‌های همان شماره نمایش داده شود.
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
      <table className="min-w-[760px] w-full text-sm">
        <thead className="bg-[#141A22] text-[#D9E2EC]">
          <tr>
            <th className="px-4 py-3 text-right">شماره</th>
            <th className="px-4 py-3 text-right">وضعیت</th>
            <th className="px-4 py-3 text-right">ارسال</th>
            <th className="px-4 py-3 text-right">مبلغ</th>
            <th className="px-4 py-3 text-right">جزئیات</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-t border-[#22303D]">
              <td className="px-4 py-3" dir="ltr">
                {order.orderNumber}
              </td>
              <td className="px-4 py-3">
                <StatusPill tone="info">{orderStatusLabelsFa[order.status]}</StatusPill>
              </td>
              <td className="px-4 py-3">{order.etaFa}</td>
              <td className="px-4 py-3 font-bold">
                <Price valueRial={order.totalRial} />
              </td>
              <td className="px-4 py-3">
                <Link href={`/orders/${order.id}`}>
                  <Button size="sm">مشاهده</Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
