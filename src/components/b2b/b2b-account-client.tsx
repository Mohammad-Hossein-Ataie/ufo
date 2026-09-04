"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Building2, PackageCheck, RotateCcw, ShoppingBag } from "lucide-react";
import { Alert, Button, Input, Price, StatusPill } from "@ufo/ui";
import type { Customer } from "@ufo/types";
import type { SubmittedOrder } from "@ufo/orders";
import { authHeaders, readCustomerSession, saveCustomerSession } from "@/lib/customer-client";

export function B2BAccountClient() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<SubmittedOrder[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const session = readCustomerSession("wholesale");
    if (!session) return;
    setCustomer(session.customer);
    void fetch("/api/customer/profile", { headers: authHeaders("wholesale"), cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { customer?: Customer }) => {
        if (payload.customer) setCustomer(payload.customer);
      });
    void fetch("/api/b2b/orders", { headers: authHeaders("wholesale"), cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { orders?: SubmittedOrder[] }) => setOrders(payload.orders ?? []))
      .catch(() => setOrders([]));
  }, []);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customer) return;
    const response = await fetch("/api/customer/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders("wholesale") },
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
    const session = readCustomerSession("wholesale");
    if (session) saveCustomerSession({ ...session, customer: payload.customer });
    setCustomer(payload.customer);
    setMessage("پروفایل همکاری ذخیره شد.");
  }

  async function reorder(orderId: string) {
    const response = await fetch(`/api/b2b/orders/${orderId}/reorder`, {
      method: "POST",
      headers: authHeaders("wholesale"),
    });
    if (response.ok) window.location.href = "/b2b/cart";
  }

  if (!customer) {
    return (
      <div className="rounded-md border border-[#D5D9C9] bg-white p-5">
        <p className="leading-8 text-[#596B61]">برای سفارش عمده ابتدا با شماره همراه وارد شوید.</p>
        <Link href="/b2b/login?next=/b2b/account" className="mt-4 inline-flex">
          <Button className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">
            ورود عمده
          </Button>
        </Link>
      </div>
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
          <div className="rounded-md border border-[#D5D9C9] bg-white p-4">
            <ShoppingBag size={20} className="text-[#1F8A5B]" />
            <p className="mt-3 text-sm text-[#596B61]">کل سفارش‌ها</p>
            <p className="text-2xl font-black">{orders.length.toLocaleString("fa-IR")}</p>
          </div>
          <div className="rounded-md border border-[#D5D9C9] bg-white p-4">
            <PackageCheck size={20} className="text-[#1F8A5B]" />
            <p className="mt-3 text-sm text-[#596B61]">سفارش فعال</p>
            <p className="text-2xl font-black">{activeOrders.length.toLocaleString("fa-IR")}</p>
          </div>
          <div className="rounded-md border border-[#D5D9C9] bg-white p-4">
            <Building2 size={20} className="text-[#1F8A5B]" />
            <p className="mt-3 text-sm text-[#596B61]">گروه قیمت</p>
            <p className="text-2xl font-black">{customer.pricingGroup ?? "default"}</p>
          </div>
        </div>

        <form
          onSubmit={saveProfile}
          className="grid gap-4 rounded-md border border-[#D5D9C9] bg-white p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">پروفایل همکاری</h2>
            <StatusPill tone="success">حساب عمده فعال</StatusPill>
          </div>
          {message ? (
            <Alert title="وضعیت" tone="info">
              {message}
            </Alert>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              نام فروشگاه
              <Input
                value={customer.companyName ?? ""}
                onChange={(event) => setCustomer({ ...customer, companyName: event.target.value })}
              />
            </label>
            <label className="grid gap-2">
              نوع کسب‌وکار
              <Input
                value={customer.businessType ?? ""}
                onChange={(event) => setCustomer({ ...customer, businessType: event.target.value })}
              />
            </label>
            <label className="grid gap-2">
              نام مسئول خرید
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
            <label className="grid gap-2">
              شناسه مالیاتی
              <Input
                value={customer.taxId ?? ""}
                onChange={(event) => setCustomer({ ...customer, taxId: event.target.value })}
              />
            </label>
            <label className="grid gap-2">
              ایمیل
              <Input
                value={customer.email ?? ""}
                onChange={(event) => setCustomer({ ...customer, email: event.target.value })}
              />
            </label>
          </div>
          <div className="grid gap-3 text-sm text-[#596B61] sm:grid-cols-2">
            <span>سطح مشتری: {customer.customerLevel ?? "standard"}</span>
            <span>
              موبایل: <b dir="ltr">{customer.mobileNumber}</b>
            </span>
          </div>
          <Button
            type="submit"
            className="w-fit border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
          >
            ذخیره پروفایل
          </Button>
        </form>

        <section className="rounded-md border border-[#D5D9C9] bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold">آخرین خریدهای عمده</h2>
            <Link href="/b2b/orders">
              <Button size="sm" variant="ghost">
                همه سفارش‌ها
              </Button>
            </Link>
          </div>
          <div className="mt-4 grid gap-3">
            {orders.slice(0, 3).map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-[#F7F7F2] p-3"
              >
                <div>
                  <p className="font-bold" dir="ltr">
                    {order.orderNumber}
                  </p>
                  <p className="mt-1 text-sm text-[#596B61]">
                    {new Date(order.createdAt).toLocaleDateString("fa-IR")}
                  </p>
                </div>
                <Price valueRial={order.totalRial} />
                <StatusPill tone="info">{order.status}</StatusPill>
              </div>
            ))}
            {orders.length === 0 ? (
              <p className="text-sm text-[#596B61]">هنوز سفارش عمده ثبت نشده است.</p>
            ) : null}
          </div>
        </section>
      </section>

      <aside className="h-fit rounded-md border border-[#D5D9C9] bg-[#14201B] p-5 text-white">
        <h2 className="text-lg font-bold">خرید مجدد عمده</h2>
        {latestOrder ? (
          <div className="mt-4 grid gap-3">
            <p className="text-sm leading-7 text-white/65">
              ردیف‌های موجود آخرین سفارش به سبد عمده اضافه می‌شود.
            </p>
            <Button
              className="border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D]"
              onClick={() => reorder(latestOrder.id)}
            >
              <RotateCcw size={18} />
              خرید مجدد
            </Button>
          </div>
        ) : (
          <p className="mt-4 text-sm leading-7 text-white/65">
            بعد از اولین سفارش عمده، میانبر خرید مجدد اینجا نمایش داده می‌شود.
          </p>
        )}
      </aside>
    </div>
  );
}
