"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpLeft } from "lucide-react";
import { EmptyState, Price, StatusPill } from "@ufo/ui";
import type { SubmittedOrder } from "@ufo/orders";
import { authHeaders, readCustomerSession } from "@/lib/customer-client";
import { CustomerOrderPagination } from "@/components/customer-order-pagination";
import {
  orderStatusLabelsFa,
  orderStatusTone,
  type OrderPaginationData,
} from "@/lib/order-presentation";

const PAGE_SIZE = 10;

export function OrdersClient() {
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<OrderPaginationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const session = readCustomerSession("retail");
    setIsLoggedIn(Boolean(session));
    if (!session) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    void fetch(`/api/orders?page=${page}&pageSize=${PAGE_SIZE}`, {
      cache: "no-store",
      headers: authHeaders("retail"),
      signal: controller.signal,
    })
      .then(async (response) => {
        const payload = (await response.json()) as {
          orders?: SubmittedOrder[];
          pagination?: OrderPaginationData;
          error?: string;
        };
        if (!response.ok || !payload.pagination)
          throw new Error(payload.error ?? "دریافت سفارش‌ها انجام نشد.");
        return payload;
      })
      .then((payload) => {
        if (controller.signal.aborted) return;
        setOrders(payload.orders ?? []);
        setPagination(payload.pagination ?? null);
        if (payload.pagination && payload.pagination.page !== page)
          setPage(payload.pagination.page);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError("دریافت سفارش‌ها انجام نشد. لطفاً دوباره تلاش کنید.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, retry]);

  if (isLoggedIn === null || (isLoggedIn && loading)) {
    return (
      <p role="status" className="text-sm text-[var(--retail-text-secondary)]">
        در حال دریافت سفارش‌ها…
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <EmptyState title="ورود انجام نشده است">
        برای مشاهده سفارش‌های خود{" "}
        <Link href="/login?next=/orders" className="text-cyan-300 underline underline-offset-4">
          وارد حساب شوید
        </Link>
        .
      </EmptyState>
    );
  }

  if (error)
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/30 bg-rose-400/10 p-5 text-rose-200"
      >
        <p>{error}</p>
        <button
          type="button"
          onClick={() => setRetry((current) => current + 1)}
          className="min-h-11 rounded-lg px-3 font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          تلاش دوباره
        </button>
      </div>
    );

  if (pagination?.total === 0) {
    return (
      <EmptyState title="هنوز سفارشی ندارید">
        از{" "}
        <Link href="/products" className="text-cyan-300 underline underline-offset-4">
          محصولات
        </Link>{" "}
        دیدن کنید و اولین سفارش خود را ثبت کنید.
      </EmptyState>
    );
  }

  return (
    <section
      id="orders-list"
      aria-label="فهرست سفارش‌ها"
      className="rounded-2xl border border-[var(--retail-border)] bg-[var(--retail-surface)] p-4 sm:p-6"
    >
      {pagination ? (
        <p className="mb-5 text-sm text-[var(--retail-text-secondary)]">
          {pagination.total.toLocaleString("fa-IR")} سفارش ثبت‌شده
        </p>
      ) : null}
      <div className="grid gap-3">
        {orders.map((order) => (
          <article
            key={order.id}
            className="grid gap-4 rounded-xl border border-[var(--retail-border)] bg-[var(--retail-surface-alt)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <h2 className="font-bold">
                  <bdi dir="ltr">{order.orderNumber}</bdi>
                </h2>
                <StatusPill tone={orderStatusTone(order.status)}>
                  {orderStatusLabelsFa[order.status]}
                </StatusPill>
              </div>
              <p className="mt-2 text-sm text-[var(--retail-text-secondary)]">
                {new Date(order.createdAt).toLocaleDateString("fa-IR")} ·{" "}
                  {order.items.length.toLocaleString("fa-IR")} قلم کالا
              </p>
              {order.estimatedDispatchAt ? (
                <p className="mt-1 text-sm text-[var(--retail-text-secondary)]">
                  زمان تقریبی ارسال:{" "}
                  {new Date(order.estimatedDispatchAt).toLocaleDateString("fa-IR", {
                    timeZone: "Asia/Tehran",
                  })}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--retail-border)] pt-3 sm:justify-end sm:border-0 sm:pt-0">
              <Price valueRial={order.totalRial} />
              <Link
                href={`/orders/${encodeURIComponent(order.id)}`}
                aria-label={`جزئیات سفارش ${order.orderNumber}`}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-cyan-300/40 px-3 text-sm font-medium text-cyan-300 hover:bg-cyan-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                جزئیات <ArrowUpLeft size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
      {pagination ? (
        <div className="mt-5">
          <CustomerOrderPagination
            pagination={pagination}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              document.getElementById("orders-list")?.scrollIntoView();
            }}
          />
        </div>
      ) : null}
    </section>
  );
}
