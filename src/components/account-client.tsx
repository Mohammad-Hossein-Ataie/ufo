"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ArrowUpLeft, Pencil, UserRound } from "lucide-react";
import { Button, Input, Price, StatusPill } from "@ufo/ui";
import type { Customer } from "@ufo/types";
import type { SubmittedOrder } from "@ufo/orders";
import { authHeaders, readCustomerSession, saveCustomerSession } from "@/lib/customer-client";
import { CustomerOrderPagination } from "@/components/customer-order-pagination";
import {
  orderStatusLabelsFa,
  orderStatusTone,
  type OrderPaginationData,
} from "@/lib/order-presentation";

const PAGE_SIZE = 5;

type ProfileDraft = Pick<Customer, "firstName" | "lastName" | "email">;

function draftFromCustomer(customer: Customer): ProfileDraft {
  return {
    firstName: customer.firstName,
    lastName: customer.lastName,
    email: customer.email ?? "",
  };
}

export function AccountClient() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<OrderPaginationData | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [ordersRetry, setOrdersRetry] = useState(0);

  useEffect(() => {
    const session = readCustomerSession("retail");
    setCustomer(session?.customer ?? null);
    setCheckingSession(false);
    if (!session) return;

    const controller = new AbortController();
    void fetch("/api/customer/profile", {
      headers: authHeaders("retail"),
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => response.json())
      .then((payload: { customer?: Customer }) => {
        if (!controller.signal.aborted && payload.customer) setCustomer(payload.customer);
      })
      .catch(() => {
        /* Session details remain available if profile refresh fails. */
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!readCustomerSession("retail")) return;
    const controller = new AbortController();
    setLoadingOrders(true);
    setOrdersError("");
    void fetch(`/api/orders?page=${page}&pageSize=${PAGE_SIZE}`, {
      headers: authHeaders("retail"),
      cache: "no-store",
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
          setOrdersError("دریافت سفارش‌ها انجام نشد. لطفاً دوباره تلاش کنید.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingOrders(false);
      });
    return () => controller.abort();
  }, [page, ordersRetry]);

  function startEditing() {
    if (!customer) return;
    setDraft(draftFromCustomer(customer));
    setProfileMessage("");
    setProfileError("");
    setEditing(true);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft || saving) return;
    setSaving(true);
    setProfileError("");
    setProfileMessage("");
    try {
      const response = await fetch("/api/customer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders("retail") },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        customer?: Customer;
        error?: string;
      };
      if (!response.ok || !payload.customer)
        throw new Error(payload.error ?? "ذخیره اطلاعات انجام نشد.");
      const session = readCustomerSession("retail");
      if (session) saveCustomerSession({ ...session, customer: payload.customer });
      setCustomer(payload.customer);
      setEditing(false);
      setDraft(null);
      setProfileMessage("اطلاعات شما ذخیره شد.");
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : "ذخیره اطلاعات انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  if (checkingSession) {
    return (
      <p role="status" className="text-[var(--retail-text-secondary)]">
        در حال بارگذاری حساب…
      </p>
    );
  }

  if (!customer) {
    return (
      <section className="rounded-2xl border border-[var(--retail-border)] bg-[var(--retail-surface)] p-6">
        <p className="leading-8 text-[var(--retail-text-secondary)]">
          برای دیدن اطلاعات حساب و سفارش‌ها ابتدا وارد شوید.
        </p>
        <Link
          href="/login?next=/account"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-cyan-300 px-5 font-medium text-slate-950 hover:bg-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
        >
          ورود با کد پیامکی
        </Link>
      </section>
    );
  }

  const fullName =
    [customer.firstName, customer.lastName].filter(Boolean).join(" ") || "کاربر یوفوپاف";
  const initials = customer.firstName?.charAt(0) || <UserRound size={24} />;

  return (
    <div className="grid gap-6">
      <section
        aria-labelledby="account-profile-title"
        className="rounded-2xl border border-[var(--retail-border)] bg-[var(--retail-surface)] p-5 sm:p-7"
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div
              aria-hidden="true"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/25 bg-cyan-300/10 text-2xl font-bold text-cyan-300"
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p id="account-profile-title" className="text-sm text-[var(--retail-text-secondary)]">
                پروفایل من
              </p>
              <h2 className="mt-1 truncate text-xl font-bold sm:text-2xl">{fullName}</h2>
            </div>
          </div>
          {!editing ? (
            <Button
              type="button"
              variant="ghost"
              onClick={startEditing}
              className="w-full border border-[var(--retail-border)] sm:w-auto"
            >
              <Pencil size={16} /> ویرایش اطلاعات
            </Button>
          ) : null}
        </div>

        {!editing ? (
          <dl className="mt-6 grid gap-5 border-t border-[var(--retail-border)] pt-5 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-[var(--retail-text-secondary)]">شماره همراه</dt>
              <dd className="mt-1 font-medium">
                <bdi dir="ltr">{customer.mobileNumber}</bdi>
              </dd>
            </div>
            <div>
              <dt className="text-sm text-[var(--retail-text-secondary)]">ایمیل</dt>
              <dd className="mt-1 break-all font-medium">{customer.email || "ثبت نشده"}</dd>
            </div>
          </dl>
        ) : (
          <form
            onSubmit={saveProfile}
            className="mt-6 grid gap-4 border-t border-[var(--retail-border)] pt-5"
          >
            <p className="text-sm text-[var(--retail-text-secondary)]">
              شماره همراه شما برای ورود استفاده می‌شود و از اینجا قابل تغییر نیست.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                نام
                <Input
                  required
                  maxLength={100}
                  autoComplete="given-name"
                  value={draft?.firstName ?? ""}
                  onChange={(event) =>
                    setDraft((current) => current && { ...current, firstName: event.target.value })
                  }
                />
              </label>
              <label className="grid gap-2 text-sm font-medium">
                نام خانوادگی
                <Input
                  required
                  maxLength={100}
                  autoComplete="family-name"
                  value={draft?.lastName ?? ""}
                  onChange={(event) =>
                    setDraft((current) => current && { ...current, lastName: event.target.value })
                  }
                />
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium">
              ایمیل (اختیاری)
              <Input
                type="email"
                autoComplete="email"
                dir="ltr"
                value={draft?.email ?? ""}
                onChange={(event) =>
                  setDraft((current) => current && { ...current, email: event.target.value })
                }
              />
            </label>
            {profileError ? (
              <p role="alert" className="text-sm text-rose-300">
                {profileError}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "در حال ذخیره…" : "ذخیره تغییرات"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setEditing(false);
                  setDraft(null);
                  setProfileError("");
                }}
              >
                انصراف
              </Button>
            </div>
          </form>
        )}
        {profileMessage ? (
          <p role="status" className="mt-4 text-sm text-emerald-300">
            {profileMessage}
          </p>
        ) : null}
      </section>

      <section
        id="account-orders"
        aria-labelledby="account-orders-title"
        className="rounded-2xl border border-[var(--retail-border)] bg-[var(--retail-surface)] p-5 sm:p-7"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="account-orders-title" className="text-xl font-bold sm:text-2xl">
              سفارش‌های من
            </h2>
            {pagination ? (
              <p className="mt-1 text-sm text-[var(--retail-text-secondary)]">
                {pagination.total.toLocaleString("fa-IR")} سفارش ثبت‌شده
              </p>
            ) : null}
          </div>
          <Link
            href="/orders"
            className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm font-medium text-cyan-300 hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
          >
            صفحه سفارش‌ها <ArrowUpLeft size={16} />
          </Link>
        </div>

        {ordersError ? (
          <div
            role="alert"
            className="mt-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-200"
          >
            <p>{ordersError}</p>
            <button
              type="button"
              onClick={() => setOrdersRetry((current) => current + 1)}
              className="min-h-11 rounded-lg px-3 font-medium underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              تلاش دوباره
            </button>
          </div>
        ) : null}
        {loadingOrders ? (
          <p role="status" className="mt-6 text-sm text-[var(--retail-text-secondary)]">
            در حال دریافت سفارش‌ها…
          </p>
        ) : null}
        {!loadingOrders && !ordersError && orders.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-[var(--retail-border)] p-6 text-sm text-[var(--retail-text-secondary)]">
            هنوز سفارشی ثبت نکرده‌اید.{" "}
            <Link
              href="/products"
              className="font-medium text-cyan-300 underline underline-offset-4"
            >
              مشاهده محصولات
            </Link>
          </div>
        ) : null}
        {!loadingOrders && !ordersError && orders.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {orders.map((order) => (
              <article
                key={order.id}
                className="grid gap-4 rounded-xl border border-[var(--retail-border)] bg-[var(--retail-surface-alt)] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="font-bold">
                      <bdi dir="ltr">{order.orderNumber}</bdi>
                    </h3>
                    <StatusPill tone={orderStatusTone(order.status)}>
                      {orderStatusLabelsFa[order.status]}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-[var(--retail-text-secondary)]">
                    {new Date(order.createdAt).toLocaleDateString("fa-IR")} ·{" "}
                    {order.items.length.toLocaleString("fa-IR")} قلم کالا
                  </p>
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
            {pagination ? (
              <CustomerOrderPagination
                pagination={pagination}
                onPageChange={(nextPage) => {
                  setPage(nextPage);
                  document.getElementById("account-orders")?.scrollIntoView();
                }}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}
