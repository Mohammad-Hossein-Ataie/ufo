"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Send, Truck } from "lucide-react";
import { Alert, Button, EmptyState, Input, Price, Textarea } from "@ufo/ui";
import type { ShippingMethodCode } from "@ufo/types";
import type { CustomerCartView } from "@ufo/orders";
import { authHeaders, fetchCustomerCart, readCustomerSession } from "@/lib/customer-client";

const shippingOptions: Array<{
  code: ShippingMethodCode;
  title: string;
  costRial: number;
  eta: string;
}> = [
  { code: "tipax", title: "تیپاکس", costRial: 1_650_000, eta: "۲ تا ۴ روز کاری" },
  {
    code: "tehran_courier",
    title: "پیک تهران",
    costRial: 950_000,
    eta: "همان روز یا روز کاری بعد",
  },
  { code: "pickup", title: "تحویل حضوری", costRial: 0, eta: "هماهنگی همان روز" },
];

export function B2BCheckoutClient() {
  const [cartView, setCartView] = useState<CustomerCartView | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("تهران");
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodCode>("tipax");
  const [receiptNote, setReceiptNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const session = readCustomerSession("wholesale");
    setIsLoggedIn(Boolean(session));
    if (!session) return;
    setBusinessName(session.customer.companyName ?? session.businessName ?? "");
    setManagerName(
      `${session.customer.firstName} ${session.customer.lastName}`.trim() ||
        session.managerName ||
        "",
    );
    setPhone(session.customer.mobileNumber);
    void fetchCustomerCart("wholesale").then(setCartView);
  }, []);

  const shipping =
    shippingOptions.find((item) => item.code === shippingMethod) ?? shippingOptions[0]!;
  const subtotalRial = cartView?.summary.subtotalRial ?? 0;
  const discountRial = cartView?.summary.discountRial ?? 0;
  const totalRial = subtotalRial - discountRial + shipping.costRial;
  const lines = cartView?.items ?? [];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    const response = await fetch("/api/b2b/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders("wholesale") },
      body: JSON.stringify({
        businessName,
        customerName: managerName,
        phone,
        city,
        address,
        shippingMethod,
        receiptNote,
      }),
    });
    const payload = (await response.json().catch(() => ({}))) as {
      order?: { id: string };
      error?: string;
    };
    setIsSubmitting(false);
    if (!response.ok || !payload.order) {
      setError(payload.error ?? "ثبت سفارش عمده انجام نشد.");
      return;
    }
    window.dispatchEvent(new CustomEvent("ufo-b2b-cart-updated"));
    window.location.href = `/b2b/orders/${payload.order.id}`;
  }

  if (!isLoggedIn) {
    return (
      <EmptyState title="برای ثبت سفارش عمده وارد شوید">
        <Link href="/b2b/login?next=/b2b/checkout" className="mt-3 inline-flex">
          <Button className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]">
            ورود همکاری
          </Button>
        </Link>
      </EmptyState>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState title="سبد عمده خالی است">
        ابتدا از سفارش سریع، کارتن‌های موردنظر را انتخاب کنید.
      </EmptyState>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-4 rounded-md border border-[#D5D9C9] bg-white p-5">
        {error ? (
          <Alert title="خطا در ثبت سفارش" tone="danger">
            {error}
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            نام فروشگاه
            <Input
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              required
            />
          </label>
          <label className="grid gap-2">
            موبایل
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              inputMode="tel"
              dir="ltr"
              required
            />
          </label>
        </div>
        <label className="grid gap-2">
          مسئول خرید
          <Input
            value={managerName}
            onChange={(event) => setManagerName(event.target.value)}
            required
          />
        </label>
        <label className="grid gap-2">
          شهر
          <Input value={city} onChange={(event) => setCity(event.target.value)} required />
        </label>
        <label className="grid gap-2">
          آدرس ارسال یا توضیح دریافت حضوری
          <Textarea value={address} onChange={(event) => setAddress(event.target.value)} required />
        </label>
        <fieldset className="grid gap-2">
          <legend className="mb-2 flex items-center gap-2 font-bold">
            <Truck size={18} />
            نحوه ارسال
          </legend>
          {shippingOptions.map((method) => (
            <label
              key={method.code}
              className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#D5D9C9] px-3"
            >
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === method.code}
                  onChange={() => setShippingMethod(method.code)}
                />
                {method.title}
              </span>
              <span className="text-sm text-[#596B61]">{method.eta}</span>
            </label>
          ))}
        </fieldset>
        <label className="grid gap-2">
          توضیح/شماره پیگیری پرداخت
          <Textarea value={receiptNote} onChange={(event) => setReceiptNote(event.target.value)} />
        </label>
      </section>
      <aside className="h-fit rounded-md border border-[#D5D9C9] bg-[#14201B] p-5 text-white">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard size={18} />
          پیش‌فاکتور عمده
        </h2>
        <div className="mt-4 grid gap-3 text-sm">
          {lines.map((line) => (
            <div key={line.id} className="flex items-start justify-between gap-3">
              <span>
                {line.productName}
                <br />
                <small className="text-white/65">
                  {line.cartonCount?.toLocaleString("fa-IR")} کارتن
                </small>
              </span>
              <Price valueRial={line.totalPrice} />
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-white/15 pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <span>جمع کالاها</span>
            <Price valueRial={subtotalRial} />
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span>تخفیف</span>
            <Price valueRial={discountRial} />
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span>ارسال</span>
            <Price valueRial={shipping.costRial} />
          </div>
          <div className="mt-4 flex justify-between gap-3 text-lg font-black">
            <span>مبلغ نهایی</span>
            <Price valueRial={totalRial} />
          </div>
          <p className="mt-2 text-white/65">زمان تخمینی ارسال: {shipping.eta}</p>
        </div>
        <Button
          type="submit"
          className="mt-5 w-full border-[#E8C547] bg-[#E8C547] text-[#14201B] hover:bg-[#F0D86D]"
          disabled={isSubmitting}
        >
          <Send size={18} />
          {isSubmitting ? "در حال ثبت..." : "ثبت سفارش عمده"}
        </Button>
      </aside>
    </form>
  );
}
