"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowDownUp,
  ArrowLeft,
  Banknote,
  Clock3,
  FileText,
  Filter,
  MessageSquare,
  PackageCheck,
  RefreshCcw,
  Search,
  ShoppingBag,
  Truck,
  Warehouse,
} from "lucide-react";
import { Badge, Button, EmptyState, Input, Price, StatusPill } from "@ufo/ui";
import type { PaymentReviewStatus } from "@ufo/orders";
import type { OrderStatus, SalesChannel } from "@ufo/types";
import type {
  AdminOrderDashboardSummary,
  AdminOrderSummary,
} from "@/lib/admin-order-query";

type PaymentFilter = "all" | "pending_review" | "approved" | "rejected";
type SortKey = "createdAt" | "totalRial" | "status" | "customer";
type SortDirection = "asc" | "desc";

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

const paymentStatusLabelsFa: Record<PaymentReviewStatus, string> = {
  awaiting_receipt: "در انتظار ارسال رسید",
  awaiting_gateway: "در انتظار پرداخت آنلاین",
  pending_review: "در انتظار بررسی رسید",
  approved: "پرداخت تایید شد",
  rejected: "پرداخت رد شد",
};

const terminalStatuses: OrderStatus[] = ["delivered", "cancelled", "returned"];

const statusTone: Partial<
  Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "info">
> = {
  awaiting_payment: "warning",
  awaiting_receipt: "warning",
  payment_under_review: "warning",
  confirmed: "info",
  processing: "info",
  ready_for_pickup: "success",
  shipped: "success",
  delivered: "success",
  cancelled: "danger",
  returned: "warning",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function customerName(order: AdminOrderSummary) {
  return order.customer.businessName ?? order.customer.fullName;
}

function channelLabel(channel: SalesChannel) {
  return channel === "wholesale" ? "عمده" : "تکی";
}

function nextActions(
  order: AdminOrderSummary,
): Array<{ status: OrderStatus; label: string; tone?: "danger" }> {
  if (order.status === "payment_under_review") {
    return [{ status: "cancelled", label: "رد و لغو", tone: "danger" }];
  }
  if (order.status === "confirmed") return [{ status: "processing", label: "شروع آماده‌سازی" }];
  if (order.status === "processing") {
    return order.shippingScope === "pickup" || order.shippingMethod === "pickup"
      ? [{ status: "ready_for_pickup", label: "آماده دریافت حضوری" }]
      : [{ status: "shipped", label: "ثبت ارسال" }];
  }
  if (order.status === "ready_for_pickup")
    return order.shippingScope === "pickup" || order.shippingMethod === "pickup"
      ? []
      : [{ status: "shipped", label: "ثبت ارسال" }];
  if (order.status === "shipped") return [];
  if (!terminalStatuses.includes(order.status))
    return [{ status: "cancelled", label: "لغو", tone: "danger" }];
  return [];
}

function SortButton({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  direction: SortDirection;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === activeKey;
  return (
    <button
      type="button"
      className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 font-bold transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168BFF]"
      onClick={() => onSort(sortKey)}
    >
      {label}
      <ArrowDownUp
        size={14}
        className={active ? "text-[#168BFF]" : "text-[#7A8794]"}
        aria-label={active ? `مرتب‌سازی ${direction === "asc" ? "صعودی" : "نزولی"}` : undefined}
      />
    </button>
  );
}

export function AdminOrdersClient() {
  const [orders, setOrders] = useState<AdminOrderSummary[]>([]);
  const [priorityOrders, setPriorityOrders] = useState<AdminOrderSummary[]>([]);
  const [summary, setSummary] = useState<AdminOrderDashboardSummary>({
    openOrders: 0,
    paymentReview: 0,
    processing: 0,
    readyToShip: 0,
    totalRevenue: 0,
    wholesaleOrders: 0,
  });
  const [shippingMethods, setShippingMethods] = useState<string[]>([]);
  const [channel, setChannel] = useState<SalesChannel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all" | "active">("active");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [shippingFilter, setShippingFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [channelTotal, setChannelTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [reload, setReload] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState("در حال خواندن سفارش‌ها...");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(
      async () => {
        setIsLoading(true);
        const params = new URLSearchParams({
          channel,
          status: statusFilter,
          payment: paymentFilter,
          shipping: shippingFilter,
          q: query,
          sort: sortKey,
          direction: sortDirection,
          page: String(page),
        });
        try {
          const response = await fetch(`/api/admin/orders?${params}`, {
            cache: "no-store",
            signal: controller.signal,
          });
          const payload = (await response.json().catch(() => ({}))) as {
            orders?: AdminOrderSummary[];
            priorityOrders?: AdminOrderSummary[];
            summary?: AdminOrderDashboardSummary;
            shippingMethods?: string[];
            total?: number;
            channelTotal?: number;
            page?: number;
            totalPages?: number;
            error?: string;
          };
          if (!response.ok) throw new Error(payload.error ?? "دریافت سفارش‌ها انجام نشد.");
          setOrders(payload.orders ?? []);
          setPriorityOrders(payload.priorityOrders ?? []);
          if (payload.summary) setSummary(payload.summary);
          setShippingMethods(payload.shippingMethods ?? []);
          setTotal(payload.total ?? 0);
          setChannelTotal(payload.channelTotal ?? 0);
          setTotalPages(payload.totalPages ?? 1);
          if (payload.page && payload.page !== page) setPage(payload.page);
          setStatusMessage("سفارش‌ها به‌روز شد.");
        } catch (error) {
          if (!controller.signal.aborted) {
            setStatusMessage(
              error instanceof Error ? error.message : "دریافت سفارش‌ها انجام نشد.",
            );
          }
        } finally {
          if (!controller.signal.aborted) setIsLoading(false);
        }
      },
      query.trim() ? 280 : 0,
    );
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [
    channel,
    statusFilter,
    paymentFilter,
    shippingFilter,
    query,
    sortKey,
    sortDirection,
    page,
    reload,
  ]);

  async function changeStatus(orderId: string, status: OrderStatus) {
    setIsLoading(true);
    const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = (await response.json().catch(() => ({}))) as { error?: string };
    setStatusMessage(payload.error ?? `وضعیت سفارش به «${orderStatusLabelsFa[status]}» تغییر کرد.`);
    setReload((value) => value + 1);
  }

  function selectChannel(nextChannel: SalesChannel | "all") {
    setChannel(nextChannel);
    setPage(1);
  }

  function toggleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(nextKey);
      setSortDirection(nextKey === "createdAt" || nextKey === "totalRial" ? "desc" : "asc");
    }
    setPage(1);
  }

  return (
    <section className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            label: "سفارش باز",
            value: formatNumber(summary.openOrders),
            meta: "نیازمند اقدام عملیاتی",
            icon: FileText,
          },
          {
            label: "تایید پرداخت",
            value: formatNumber(summary.paymentReview),
            meta: "رسیدهای در انتظار بررسی",
            icon: Clock3,
          },
          {
            label: "در آماده‌سازی",
            value: formatNumber(summary.processing),
            meta: "بسته‌بندی و کنترل کالا",
            icon: PackageCheck,
          },
          {
            label: "آماده ارسال",
            value: formatNumber(summary.readyToShip),
            meta: "نیازمند ثبت خروج",
            icon: Truck,
          },
          {
            label: "فروش کل",
            value: <Price valueRial={summary.totalRevenue} />,
            meta: `${formatNumber(summary.wholesaleOrders)} سفارش عمده`,
            icon: Banknote,
            featured: true,
          },
        ].map((item) => (
          <article
            key={item.label}
            className={`min-w-0 overflow-hidden rounded-md border border-[#D7DDE4] bg-white p-4 shadow-sm ${
              item.featured ? "md:col-span-2 xl:col-span-1" : ""
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-[#5F6C79]">{item.label}</p>
                <div className="mt-2 text-2xl font-black tabular-nums">{item.value}</div>
              </div>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-[#EEF3F8] text-[#168BFF]">
                <item.icon size={22} aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-xs text-[#5F6C79]">{item.meta}</p>
          </article>
        ))}
      </div>

      {priorityOrders.length > 0 ? (
        <section className="rounded-md border border-[#D7DDE4] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black">اولویت‌های سفارش</h2>
            <span className="text-sm text-[#5F6C79]">پرداخت‌های معطل و سفارش‌های آماده خروج</span>
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {priorityOrders.map((order) => (
              <article
                key={order.id}
                className="rounded-md border border-[#E2E7ED] bg-[#F8FAFC] p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold" dir="ltr">
                      {order.orderNumber}
                    </p>
                    <p className="mt-1 text-sm text-[#5F6C79]">{customerName(order)}</p>
                  </div>
                  <StatusPill tone={statusTone[order.status] ?? "neutral"}>
                    {orderStatusLabelsFa[order.status]}
                  </StatusPill>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="font-black">
                    <Price valueRial={order.totalRial} />
                  </span>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="inline-flex min-h-10 items-center gap-1 rounded-md px-3 text-sm font-bold text-[#168BFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168BFF]"
                  >
                    جزئیات
                    <ArrowLeft size={15} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-md border border-[#D7DDE4] bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(16rem,1fr)_repeat(4,minmax(9rem,12rem))_auto]">
          <label className="relative">
            <span className="sr-only">جستجو در سفارش‌ها</span>
            <Search
              className="pointer-events-none absolute right-3 top-3 text-[#5F6C79]"
              size={18}
            />
            <Input
              className="pr-10"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="جستجو در شماره، مشتری، موبایل، شهر یا کالا"
            />
          </label>
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value as OrderStatus | "all" | "active");
              setPage(1);
            }}
            aria-label="فیلتر وضعیت سفارش"
          >
            <option value="active">سفارش‌های باز</option>
            <option value="all">همه وضعیت‌ها</option>
            {Object.entries(orderStatusLabelsFa).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            value={paymentFilter}
            onChange={(event) => {
              setPaymentFilter(event.target.value as PaymentFilter);
              setPage(1);
            }}
            aria-label="فیلتر پرداخت"
          >
            <option value="all">همه پرداخت‌ها</option>
            <option value="pending_review">در انتظار بررسی</option>
            <option value="approved">تایید شده</option>
            <option value="rejected">رد شده</option>
          </select>
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            value={shippingFilter}
            onChange={(event) => {
              setShippingFilter(event.target.value);
              setPage(1);
            }}
            aria-label="فیلتر ارسال"
          >
            <option value="all">همه روش‌های ارسال</option>
            {shippingMethods.map((method) => (
              <option key={method} value={method}>
                {method}
              </option>
            ))}
          </select>
          <select
            className="min-h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200"
            value={`${sortKey}:${sortDirection}`}
            onChange={(event) => {
              const [key, direction] = event.target.value.split(":") as [SortKey, SortDirection];
              setSortKey(key);
              setSortDirection(direction);
              setPage(1);
            }}
            aria-label="مرتب‌سازی سفارش‌ها"
          >
            <option value="createdAt:desc">جدیدترین</option>
            <option value="createdAt:asc">قدیمی‌ترین</option>
            <option value="totalRial:desc">بیشترین مبلغ</option>
            <option value="totalRial:asc">کمترین مبلغ</option>
            <option value="customer:asc">نام مشتری</option>
          </select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setReload((value) => value + 1)}
            disabled={isLoading}
          >
            <RefreshCcw size={16} aria-hidden="true" />
            تازه‌سازی
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[
              { value: "all", label: "همه" },
              { value: "retail", label: "تکی" },
              { value: "wholesale", label: "عمده" },
            ].map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={channel === item.value ? "primary" : "secondary"}
                onClick={() => selectChannel(item.value as SalesChannel | "all")}
              >
                {item.value === "wholesale" ? <Warehouse size={16} /> : <ShoppingBag size={16} />}
                {item.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-[#5F6C79]" role="status">
            <Filter size={16} aria-hidden="true" />
            {formatNumber(total)} سفارش از {formatNumber(channelTotal)}
          </div>
        </div>
      </section>

      {orders.length === 0 ? (
        <EmptyState
          title={
            isLoading
              ? "در حال خواندن سفارش‌ها"
              : channelTotal === 0
                ? "سفارشی ثبت نشده است"
                : "سفارشی با این فیلتر پیدا نشد"
          }
        >
          فیلترها یا عبارت جست‌وجو را تغییر دهید؛ سفارش‌های ثبت‌شده تکی و عمده اینجا نمایش داده
          می‌شوند.
        </EmptyState>
      ) : (
        <section className="overflow-hidden rounded-md border border-[#D7DDE4] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-[#EEF3F8] text-[#4C5A67]">
                <tr>
                  <th className="px-4 py-3 text-right">
                    <SortButton
                      label="شماره"
                      sortKey="createdAt"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="px-4 py-3 text-right">کانال</th>
                  <th className="px-4 py-3 text-right">
                    <SortButton
                      label="مشتری"
                      sortKey="customer"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortButton
                      label="وضعیت"
                      sortKey="status"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="px-4 py-3 text-right">کالاها</th>
                  <th className="px-4 py-3 text-right">ارسال</th>
                  <th className="px-4 py-3 text-right">
                    <SortButton
                      label="مبلغ"
                      sortKey="totalRial"
                      activeKey={sortKey}
                      direction={sortDirection}
                      onSort={toggleSort}
                    />
                  </th>
                  <th className="px-4 py-3 text-right">اقدام بعدی</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-t border-[#D7DDE4] align-top">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-bold text-[#0B5CAD] hover:text-[#168BFF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168BFF]"
                        dir="ltr"
                      >
                        {order.orderNumber}
                      </Link>
                      <p className="mt-1 text-xs text-[#5F6C79]">{formatDate(order.createdAt)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill tone={order.channel === "wholesale" ? "success" : "info"}>
                        {channelLabel(order.channel)}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{customerName(order)}</p>
                      <p className="mt-1 text-[#5F6C79]" dir="ltr">
                        {order.customer.phone}
                      </p>
                      <p className="mt-1 text-xs text-[#5F6C79]">
                        {order.shippingAddress.province}، {order.shippingAddress.city}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="grid gap-2">
                        <StatusPill tone={statusTone[order.status] ?? "neutral"}>
                          {orderStatusLabelsFa[order.status]}
                        </StatusPill>
                        <Badge
                          tone={
                            order.paymentStatus === "approved"
                              ? "success"
                              : order.paymentStatus === "rejected"
                                ? "danger"
                                : "warning"
                          }
                        >
                          {paymentStatusLabelsFa[order.paymentStatus]}
                        </Badge>
                        {order.chatCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-xs text-[#5F6C79]">
                            <MessageSquare size={14} aria-hidden="true" />
                            {formatNumber(order.chatCount)} پیام
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{formatNumber(order.itemCount)} قلم</p>
                      <p className="mt-1 text-xs text-[#5F6C79]">
                        {formatNumber(order.unitCount)} عدد
                        {order.channel === "wholesale"
                          ? ` · ${formatNumber(order.cartonCount)} کارتن`
                          : ""}
                      </p>
                      <p className="mt-2 max-w-44 truncate text-xs text-[#5F6C79]">
                        {order.firstProductName}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{order.shippingTitleFa}</p>
                      <p className="mt-1 text-[#5F6C79]">
                        {order.estimatedDispatchAt
                          ? new Date(order.estimatedDispatchAt).toLocaleString("fa-IR", {
                              timeZone: "Asia/Tehran",
                            })
                          : order.etaFa}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-black">
                      <Price valueRial={order.totalRial} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button size="sm" variant="secondary">
                            {order.status === "payment_under_review" ? "بررسی رسید" : "جزئیات"}
                          </Button>
                        </Link>
                        {nextActions(order).map((action) => (
                          <Button
                            key={action.status}
                            type="button"
                            size="sm"
                            variant={action.tone === "danger" ? "danger" : "secondary"}
                            onClick={() => changeStatus(order.id, action.status)}
                            disabled={isLoading}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#5F6C79]">
              سفارشی با این فیلتر پیدا نشد.
            </div>
          ) : null}
        </section>
      )}

      {totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-center gap-3 rounded-md border border-[#D7DDE4] bg-white p-3"
          aria-label="صفحه‌بندی سفارش‌ها"
        >
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isLoading || page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            صفحه قبل
          </Button>
          <span className="text-sm font-bold tabular-nums text-[#4C5A67]">
            صفحه {formatNumber(page)} از {formatNumber(totalPages)}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isLoading || page >= totalPages}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          >
            صفحه بعد
          </Button>
        </nav>
      ) : null}

      <p className="text-sm text-[#5F6C79]" role="status">
        {statusMessage}
      </p>
    </section>
  );
}
