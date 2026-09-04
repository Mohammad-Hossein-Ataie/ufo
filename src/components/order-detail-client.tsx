"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { Button, EmptyState, Price, StatusPill } from "@ufo/ui";
import type { SubmittedOrder } from "@ufo/orders";
import type { OrderStatus, SalesChannel } from "@ufo/types";
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

const paymentStatusLabelsFa = {
  pending_review: "در انتظار بررسی رسید",
  approved: "پرداخت تایید شد",
  rejected: "پرداخت رد شد",
};

export function OrderDetailClient({
  orderId,
  channel,
}: {
  orderId: string;
  channel: SalesChannel;
}) {
  const [order, setOrder] = useState<SubmittedOrder | null>(null);
  const [error, setError] = useState("");
  const isWholesale = channel === "wholesale";
  const base = isWholesale ? "/api/b2b/orders" : "/api/orders";
  const loginHref = isWholesale ? "/b2b/login" : "/login";
  const cartHref = isWholesale ? "/b2b/cart" : "/cart";

  useEffect(() => {
    if (!readCustomerSession(channel)) {
      setError("برای مشاهده سفارش وارد حساب خود شوید.");
      return;
    }
    fetch(`${base}/${orderId}`, { cache: "no-store", headers: authHeaders(channel) })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(
        ({
          response,
          payload,
        }: {
          response: Response;
          payload: { order?: SubmittedOrder; error?: string };
        }) => {
          if (!response.ok || !payload.order) {
            setError(payload.error ?? "سفارش پیدا نشد.");
            return;
          }
          setOrder(payload.order);
        },
      )
      .catch(() => setError("دریافت سفارش انجام نشد."));
  }, [base, channel, orderId]);

  async function reorder() {
    const response = await fetch(`${base}/${orderId}/reorder`, {
      method: "POST",
      headers: authHeaders(channel),
    });
    if (response.ok) window.location.href = cartHref;
  }

  if (error) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10">
        <EmptyState title="دسترسی به سفارش ممکن نیست">
          <Link
            href={`${loginHref}?next=${encodeURIComponent(isWholesale ? `/b2b/orders/${orderId}` : `/orders/${orderId}`)}`}
            className="mt-3 inline-flex"
          >
            <Button>ورود با کد پیامکی</Button>
          </Link>
        </EmptyState>
      </main>
    );
  }

  if (!order) {
    return <main className="mx-auto max-w-6xl px-4 py-10">در حال دریافت سفارش...</main>;
  }

  return (
    <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-5">
        <div>
          <h1 className="text-3xl font-black">سفارش {order.orderNumber}</h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusPill tone="info">{orderStatusLabelsFa[order.status]}</StatusPill>
            <StatusPill tone={order.paymentStatus === "approved" ? "success" : "warning"}>
              {paymentStatusLabelsFa[order.paymentStatus]}
            </StatusPill>
          </div>
        </div>
        <section
          className={`rounded-md border p-5 ${isWholesale ? "border-[#D5D9C9] bg-white" : "border-[#22303D] bg-[#0D1117]"}`}
        >
          <h2 className="text-xl font-bold">اقلام سفارش</h2>
          <div className="mt-4 grid gap-3">
            {order.items.map((item) => (
              <div
                key={item.sku}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-md p-3 ${isWholesale ? "bg-[#F7F7F2]" : "bg-white/5"}`}
              >
                <div>
                  <p className="font-bold">{item.productName}</p>
                  <p
                    className={`mt-1 text-sm ${isWholesale ? "text-[#596B61]" : "text-[#9BA7B4]"}`}
                  >
                    {item.variantName} · تعداد {item.quantity.toLocaleString("fa-IR")}
                    {item.cartonCount ? ` · ${item.cartonCount.toLocaleString("fa-IR")} کارتن` : ""}
                  </p>
                  <p
                    className={`mt-1 text-sm ${isWholesale ? "text-[#596B61]" : "text-[#9BA7B4]"}`}
                    dir="ltr"
                  >
                    {item.sku}
                  </p>
                </div>
                <div className="text-left">
                  <Price valueRial={item.totalRial} />
                  {item.discountRial > 0 ? (
                    <p className="mt-1 text-xs">
                      تخفیف: <Price valueRial={item.discountRial} />
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>
      <aside
        className={`h-fit rounded-md border p-5 ${isWholesale ? "border-[#D5D9C9] bg-[#14201B] text-white" : "border-[#22303D] bg-[#141A22]"}`}
      >
        <h2 className="text-lg font-bold">خلاصه سفارش</h2>
        <div className="mt-4 grid gap-2 text-sm">
          <div className="flex justify-between gap-3">
            <span>جمع کالاها</span>
            <Price valueRial={order.subtotalRial} />
          </div>
          <div className="flex justify-between gap-3">
            <span>تخفیف</span>
            <Price valueRial={order.discountRial} />
          </div>
          <div className="flex justify-between gap-3">
            <span>{order.shippingTitleFa}</span>
            <Price valueRial={order.shippingRial} />
          </div>
          <div className="mt-3 flex justify-between gap-3 border-t border-current/20 pt-3 text-lg font-black">
            <span>مبلغ نهایی</span>
            <Price valueRial={order.totalRial} />
          </div>
        </div>
        <div className="mt-5 grid gap-2 border-t border-current/20 pt-4 text-sm">
          <h3 className="font-bold">آدرس ارسال</h3>
          <p>
            {order.shippingAddress.province}، {order.shippingAddress.city}
          </p>
          <p>{order.shippingAddress.line1}</p>
          <p>
            {order.shippingAddress.receiverName} ·{" "}
            <span dir="ltr">{order.shippingAddress.receiverPhone}</span>
          </p>
        </div>
        <Button className="mt-5 w-full" onClick={reorder}>
          <RotateCcw size={18} />
          خرید مجدد
        </Button>
      </aside>
    </main>
  );
}
