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
  const raw = window.localStorage.getItem("ufo-b2b-session");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { phone?: string };
    return parsed.phone ?? "";
  } catch {
    return "";
  }
}

export function B2BOrdersClient() {
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const currentPhone = readPhone();
    setPhone(currentPhone);
    if (!currentPhone) return;
    fetch(`/api/b2b/orders?phone=${encodeURIComponent(currentPhone)}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { orders?: SubmittedOrder[] }) => setOrders(payload.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  if (!phone) {
    return (
      <EmptyState title="ورود عمده انجام نشده است">
        ابتدا وارد حساب همکاری شوید تا سفارش‌های عمده همان شماره نمایش داده شود.
      </EmptyState>
    );
  }

  if (orders.length === 0) {
    return (
      <EmptyState title="هنوز سفارش عمده ندارید">
        از سفارش سریع، سبد عمده را بسازید و ثبت سفارش را کامل کنید.
      </EmptyState>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border border-[#D5D9C9] bg-white">
      <table className="min-w-[760px] w-full text-sm">
        <thead className="bg-[#EEF0E5]">
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
            <tr key={order.id} className="border-t border-[#E2E4D8]">
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
                <Link href={`/b2b/orders/${order.id}`}>
                  <Button
                    size="sm"
                    className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
                  >
                    مشاهده
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
