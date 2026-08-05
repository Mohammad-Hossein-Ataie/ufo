"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CreditCard, Send, Truck } from "lucide-react";
import { Alert, Button, EmptyState, Input, Price, Textarea } from "@ufo/ui";
import { products, variants } from "@ufo/domain";
import type { SalesChannel, ShippingMethodCode } from "@ufo/types";

interface CartLine {
  variantId: string;
  quantity: number;
  channel: SalesChannel;
}

interface RetailSession {
  channel: "retail";
  fullName: string;
  phone: string;
}

const shippingOptions: Array<{ code: ShippingMethodCode; title: string; costRial: number; eta: string }> = [
  { code: "tipax", title: "تیپاکس", costRial: 1_650_000, eta: "۲ تا ۴ روز کاری" },
  { code: "tehran_courier", title: "پیک تهران", costRial: 950_000, eta: "همان روز یا روز کاری بعد" },
  { code: "pickup", title: "تحویل حضوری", costRial: 0, eta: "هماهنگی همان روز" }
];

function readCart(): CartLine[] {
  const raw = window.localStorage.getItem("ufo-retail-cart") ?? window.localStorage.getItem("ufo-cart");
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((line): line is CartLine => {
      if (typeof line !== "object" || line === null) return false;
      const record = line as Record<string, unknown>;
      return typeof record.variantId === "string" && typeof record.quantity === "number" && record.channel === "retail";
    });
  } catch {
    return [];
  }
}

function readSession(): RetailSession | null {
  const raw = window.localStorage.getItem("ufo-retail-session");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<RetailSession>;
    return parsed.channel === "retail" && typeof parsed.phone === "string"
      ? { channel: "retail", phone: parsed.phone, fullName: parsed.fullName ?? "" }
      : null;
  } catch {
    return null;
  }
}

export function CheckoutClient() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("تهران");
  const [address, setAddress] = useState("");
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodCode>("tipax");
  const [receiptNote, setReceiptNote] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCart(readCart());
    const session = readSession();
    if (session) {
      setCustomerName(session.fullName);
      setPhone(session.phone);
    }
  }, []);

  const lines = useMemo(
    () =>
      cart
        .map((line) => {
          const variant = variants.find((item) => item.id === line.variantId);
          const product = variant ? products.find((item) => item.id === variant.productId) : undefined;
          if (!variant || !product) return null;
          return {
            ...line,
            product,
            variant,
            totalRial: variant.retailPriceRial * line.quantity
          };
        })
        .filter((line): line is NonNullable<typeof line> => line !== null),
    [cart],
  );

  const shipping = shippingOptions.find((item) => item.code === shippingMethod) ?? shippingOptions[0]!;
  const subtotalRial = lines.reduce((sum, line) => sum + line.totalRial, 0);
  const totalRial = subtotalRial + shipping.costRial;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        phone,
        city,
        address,
        shippingMethod,
        receiptNote,
        lines: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity }))
      })
    });
    const payload = (await response.json().catch(() => ({}))) as { order?: { id: string }; error?: string };
    setIsSubmitting(false);
    if (!response.ok || !payload.order) {
      setError(payload.error ?? "ثبت سفارش انجام نشد.");
      return;
    }

    window.localStorage.removeItem("ufo-retail-cart");
    window.dispatchEvent(new CustomEvent("ufo-retail-cart-updated"));
    window.location.href = `/orders/${payload.order.id}`;
  }

  if (lines.length === 0) {
    return (
      <EmptyState title="سبد خرید تکی خالی است">
        ابتدا از کاتالوگ فروش تکی محصول انتخاب کنید.
      </EmptyState>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_22rem]">
      <section className="grid gap-4 rounded-md border border-[#22303D] bg-[#0D1117] p-5">
        {error ? (
          <Alert title="خطا در ثبت سفارش" tone="danger">
            {error}
          </Alert>
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            نام گیرنده
            <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} required />
          </label>
          <label className="grid gap-2">
            موبایل
            <Input value={phone} onChange={(event) => setPhone(event.target.value)} inputMode="tel" dir="ltr" required />
          </label>
        </div>
        <label className="grid gap-2">
          شهر
          <Input value={city} onChange={(event) => setCity(event.target.value)} required />
        </label>
        <label className="grid gap-2">
          آدرس
          <Textarea value={address} onChange={(event) => setAddress(event.target.value)} required />
        </label>
        <fieldset className="grid gap-2">
          <legend className="mb-2 flex items-center gap-2 font-bold">
            <Truck size={18} />
            روش ارسال
          </legend>
          {shippingOptions.map((method) => (
            <label key={method.code} className="flex min-h-12 items-center justify-between gap-3 rounded-md border border-[#22303D] px-3">
              <span className="flex items-center gap-2">
                <input
                  type="radio"
                  name="shipping"
                  checked={shippingMethod === method.code}
                  onChange={() => setShippingMethod(method.code)}
                />
                {method.title}
              </span>
              <span className="text-sm text-[#9BA7B4]">{method.eta}</span>
            </label>
          ))}
        </fieldset>
        <label className="grid gap-2">
          توضیح/شماره پیگیری پرداخت
          <Textarea
            value={receiptNote}
            onChange={(event) => setReceiptNote(event.target.value)}
            placeholder="مثلاً شماره کارت مبدا، ساعت پرداخت یا کد پیگیری"
          />
        </label>
      </section>
      <aside className="h-fit rounded-md border border-[#22303D] bg-[#141A22] p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <CreditCard size={18} />
          خلاصه پرداخت
        </h2>
        <div className="mt-4 grid gap-3 text-sm">
          {lines.map((line) => (
            <div key={line.variant.id} className="flex items-start justify-between gap-3">
              <span>{line.product.nameFa}</span>
              <Price valueRial={line.totalRial} />
            </div>
          ))}
        </div>
        <div className="mt-4 border-t border-[#22303D] pt-4 text-sm">
          <div className="flex justify-between gap-3">
            <span>جمع کالاها</span>
            <Price valueRial={subtotalRial} />
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span>ارسال</span>
            <Price valueRial={shipping.costRial} />
          </div>
          <div className="mt-4 flex justify-between gap-3 text-lg font-black">
            <span>مبلغ نهایی</span>
            <Price valueRial={totalRial} />
          </div>
          <p className="mt-2 text-[#9BA7B4]">زمان تخمینی ارسال: {shipping.eta}</p>
        </div>
        <Button type="submit" className="mt-5 w-full" disabled={isSubmitting}>
          <Send size={18} />
          {isSubmitting ? "در حال ثبت..." : "ثبت سفارش و ارسال برای ادمین"}
        </Button>
      </aside>
    </form>
  );
}
