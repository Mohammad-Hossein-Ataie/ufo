"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { PackageCheck, RotateCcw, ShoppingBag, UserRound } from "lucide-react";
import { Alert, Button, Input, Price, StatusPill } from "@ufo/ui";
import type { Customer } from "@ufo/types";
import type { SubmittedOrder } from "@ufo/orders";
import { authHeaders, readCustomerSession, saveCustomerSession } from "@/lib/customer-client";

export function AccountClient() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = readCustomerSession("retail");
    if (!session) return;
    setCustomer(session.customer);
    void fetch("/api/customer/profile", { headers: authHeaders("retail"), cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { customer?: Customer }) => {
        if (payload.customer) setCustomer(payload.customer);
      });
    void fetch("/api/orders", { headers: authHeaders("retail"), cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { orders?: SubmittedOrder[] }) => setOrders(payload.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;
    const response = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders("retail") },
      body: JSON.stringify(customer),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      customer?: Customer;
      error?: string;
    };
    if (!response.ok || !payload.customer) {
      setMessage(payload.error ?? "ذخیره پروفایل انجام نشد.");
      return;
    }
    const session = readCustomerSession("retail");
    if (session) saveCustomerSession({ ...session, customer: payload.customer });
    setCustomer(payload.customer);
    setMessage("پروفایل ذخیره شد.");
  }

  async function reorder(orderId: string) {
    const response = await fetch(`/api/orders/${orderId}/reorder`, {
      method: "POST",
      headers: authHeaders("retail"),
    });
    if (response.ok) window.location.href = "/cart";
  }

  if (!customer) {
    return (
      <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
        <p className="leading-8 text-[#9BA7B4]">برای مدیریت حساب ابتدا وارد شوید.</p>
        <Link href="/login?next=/account" className="mt-4 inline-flex">
          <Button>ورود با کد پیامکی</Button>
        </Link>
      </section>
    );
  }

  const activeOrders = orders.filter((order) =>
    ["payment_under_review", "confirmed", "processing", "ready_for_pickup", "shipped"].includes(
      order.status,
    ),
  );
  const latestOrder = orders[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-[#22303D] bg-[#0D1117] p-4">
            <ShoppingBag size={20} className="text-cyan-300" />
            <p className="mt-3 text-sm text-[#9BA7B4]">کل سفارش‌ها</p>
            <p className="text-2xl font-black">{orders.length.toLocaleString("fa-IR")}</p>
          </div>
          <div className="rounded-md border border-[#22303D] bg-[#0D1117] p-4">
            <PackageCheck size={20} className="text-cyan-300" />
            <p className="mt-3 text-sm text-[#9BA7B4]">سفارش فعال</p>
            <p className="text-2xl font-black">{activeOrders.length.toLocaleString("fa-IR")}</p>
          </div>
          <div className="rounded-md border border-[#22303D] bg-[#0D1117] p-4">
            <UserRound size={20} className="text-cyan-300" />
            <p className="mt-3 text-sm text-[#9BA7B4]">نوع حساب</p>
            <p className="text-2xl font-black">تکی</p>
          </div>
        </div>

        <form
          onSubmit={saveProfile}
          className="grid gap-4 rounded-md border border-[#22303D] bg-[#0D1117] p-5"
        >
          <h2 className="text-xl font-bold">پروفایل مشتری</h2>
          {message ? (
            <Alert title="وضعیت" tone="info">
              {message}
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              نام
              <Input
                value={customer.firstName}
                onChange={(event) => setCustomer({ ...customer, firstName: event.target.value })}
              />
            </label>
            <label className="grid gap-2">
              نام خانوادگی
              <Input
                value={customer.lastName}
                onChange={(event) => setCustomer({ ...customer, lastName: event.target.value })}
              />
            </label>
          </div>
          <label className="grid gap-2">
            ایمیل
            <Input
              value={customer.email ?? ""}
              onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
            />
          </label>
          <p className="text-sm text-[#9BA7B4]" dir="ltr">
            {customer.mobileNumber}
          </p>
          <Button type="submit" className="w-fit">
            ذخیره پروفایل
          </Button>
        </form>

        <section className="rounded-md border border-[#22303D] bg-[#0D1117] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">آخرین خریدها</h2>
            <Link href="/orders">
              <Button size="sm" variant="ghost">
                همه سفارش‌ها
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-white/5 p-3"
              >
                <div>
                  <p className="font-bold" dir="ltr">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-sm text-[#9BA7B4]">
                    {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <Price valueRial={order.totalRial} />
                <StatusPill tone="info">{order.status}</StatusPill>
              </div>
            ))}
            {orders.length === 0 ? (
              <p className="text-sm text-[#9BA7B4]">هنوز سفارشی ثبت نشده است.</p>
            ) : null}
          </div>
        </section>
      </section>

      <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5">
        <h2 className="text-lg font-bold">پیشنهاد خرید مجدد</h2>
        {latestOrder ? (
          <div className="mt-4 grid gap-3">
            <p className="text-sm leading-7 text-[#9BA7B4]">
              آخرین سفارش شما آماده اضافه شدن دوباره به سبد است.
            </p>
            <Button onClick={() => reorder(latestOrder.id)}>
              <RotateCcw size={18} />
              خرید مجدد
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-[#9BA7B4]">
            بعد از اولین سفارش، میانبر خرید مجدد اینجا نمایش داده می‌شود.
          </p>
        )}
      </aside>
    </div>
  );
}
