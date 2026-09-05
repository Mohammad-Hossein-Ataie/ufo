"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Check,
  ChevronDown,
  CreditCard,
  Home,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Plus,
  ReceiptText,
  Send,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { Alert, Button, EmptyState, Input, Price, Textarea } from "@ufo/ui";
import type { CustomerAddress, ShippingMethodCode } from "@ufo/types";
import type { CustomerCartView } from "@ufo/orders";
import { authHeaders, fetchCustomerCart, readCustomerSession } from "@/lib/customer-client";
import { IranProvinceCitySelect } from "@/components/iran-location-select";

interface CheckoutShippingMethod {
  code: ShippingMethodCode;
  titleFa: string;
  descriptionFa: string;
  costRial: number;
  etaFa: string;
  available: boolean;
  reasonFa?: string;
}

const fieldClass =
  "min-h-[52px] rounded-xl !border-white/10 !bg-[#090d13] px-4 !text-white caret-retail-accent !shadow-none placeholder:!text-retail-muted focus:!border-retail-accent focus:!ring-retail-accent/20";
const textareaClass =
  "rounded-xl !border-white/10 !bg-[#090d13] px-4 py-3 !text-white caret-retail-accent !shadow-none placeholder:!text-retail-muted focus:!border-retail-accent focus:!ring-retail-accent/20";

function Step({ number, label, active }: { number: string; label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${active ? "text-white" : "text-retail-muted"}`}>
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${
          active
            ? "bg-retail-accent text-retail-bg shadow-[0_0_20px_rgba(0,217,255,.22)]"
            : "border border-retail-border bg-retail-surface"
        }`}
      >
        {number}
      </span>
      <span className="hidden text-xs font-bold sm:inline">{label}</span>
    </div>
  );
}

export function CheckoutClient() {
  const [cartView, setCartView] = useState<CustomerCartView | null>(null);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressLabel, setAddressLabel] = useState("خانه");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [province, setProvince] = useState("تهران");
  const [city, setCity] = useState("تهران");
  const [address, setAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [makeDefault, setMakeDefault] = useState(true);
  const [shippingMethod, setShippingMethod] = useState<ShippingMethodCode>("tipax");
  const [shippingMethods, setShippingMethods] = useState<CheckoutShippingMethod[]>([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [receiptNote, setReceiptNote] = useState("");
  const [error, setError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  function applyAddress(item: CustomerAddress) {
    setSelectedAddressId(item.id);
    setCustomerName(item.receiverName);
    setPhone(item.receiverPhone);
    setProvince(item.province);
    setCity(item.city);
    setAddress(item.line1);
    setPostalCode(item.postalCode ?? "");
    setShowAddressForm(false);
    if (item.city.trim() !== "تهران" && shippingMethod === "tehran_courier") {
      setShippingMethod("tipax");
    }
  }

  useEffect(() => {
    const session = readCustomerSession("retail");
    setIsLoggedIn(Boolean(session));
    if (!session) {
      setIsLoading(false);
      return;
    }
    const fullName =
      `${session.customer.firstName} ${session.customer.lastName}`.trim() || session.fullName || "";
    setCustomerName(fullName);
    setPhone(session.customer.mobileNumber);
    void Promise.all([
      fetchCustomerCart("retail"),
      fetch("/api/customer/addresses", {
        headers: authHeaders("retail"),
        cache: "no-store",
      }).then((response) => response.json() as Promise<{ addresses?: CustomerAddress[] }>),
    ])
      .then(([cart, payload]) => {
        setCartView(cart);
        const saved = payload.addresses ?? [];
        setAddresses(saved);
        const preferred = saved.find((item) => item.isDefault) ?? saved[0];
        if (preferred) applyAddress(preferred);
        else setShowAddressForm(true);
      })
      .catch(() => setError("دریافت اطلاعات تسویه حساب انجام نشد. دوباره تلاش کنید."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!province || !city) {
      setShippingMethods([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsLoadingShipping(true);
      const query = new URLSearchParams({ province, city });
      void fetch(`/api/shipping/methods?${query}`, { signal: controller.signal })
        .then(async (response) => {
          const payload = (await response.json()) as {
            methods?: CheckoutShippingMethod[];
            error?: string;
          };
          if (!response.ok) throw new Error(payload.error ?? "دریافت روش‌های ارسال انجام نشد.");
          const methods = payload.methods ?? [];
          setShippingMethods(methods);
          const selected = methods.find(
            (method) => method.code === shippingMethod && method.available,
          );
          if (!selected) {
            setShippingMethod(methods.find((method) => method.available)?.code ?? "");
          }
        })
        .catch((requestError: unknown) => {
          if (requestError instanceof Error && requestError.name !== "AbortError") {
            setError(requestError.message);
          }
        })
        .finally(() => setIsLoadingShipping(false));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [city, province, shippingMethod]);

  const shipping = shippingMethods.find((item) => item.code === shippingMethod);
  const subtotalRial = cartView?.summary.subtotalRial ?? 0;
  const discountRial = cartView?.summary.discountRial ?? 0;
  const totalRial = subtotalRial - discountRial + (shipping?.costRial ?? 0);
  const lines = cartView?.items ?? [];
  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  function startNewAddress() {
    const session = readCustomerSession("retail");
    setAddressLabel("خانه");
    setCustomerName(
      session ? `${session.customer.firstName} ${session.customer.lastName}`.trim() : customerName,
    );
    setPhone(session?.customer.mobileNumber ?? phone);
    setProvince("تهران");
    setCity("تهران");
    setAddress("");
    setPostalCode("");
    setMakeDefault(addresses.length === 0);
    setAddressError("");
    setShowAddressForm(true);
  }

  async function saveAddress() {
    setIsSavingAddress(true);
    setAddressError("");
    try {
      const response = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders("retail") },
        body: JSON.stringify({
          label: addressLabel,
          province,
          city,
          line1: address,
          postalCode,
          receiverName: customerName,
          receiverPhone: phone,
          isDefault: makeDefault,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        address?: CustomerAddress;
        error?: string;
      };
      if (!response.ok || !payload.address) {
        setAddressError(payload.error ?? "ذخیره آدرس انجام نشد.");
        return;
      }
      const saved = payload.address;
      setAddresses((current) => [
        saved,
        ...current.map((item) => (saved.isDefault ? { ...item, isDefault: false } : item)),
      ]);
      applyAddress(saved);
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!address.trim() || !shipping?.available) {
      setError("لطفاً آدرس و یک روش ارسال فعال را انتخاب کنید.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders("retail") },
        body: JSON.stringify({
          customerName,
          phone,
          province,
          city,
          address,
          postalCode,
          shippingMethod,
          receiptNote,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        order?: { id: string };
        error?: string;
      };
      if (!response.ok || !payload.order) {
        setError(payload.error ?? "ثبت سفارش انجام نشد.");
        return;
      }
      window.dispatchEvent(new CustomEvent("ufo-retail-cart-updated"));
      window.location.href = `/orders/${payload.order.id}`;
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isLoggedIn) {
    return (
      <EmptyState title="برای پرداخت وارد شوید">
        <Link href="/login?next=/checkout" className="mt-3 inline-flex">
          <Button>ورود با کد پیامکی</Button>
        </Link>
      </EmptyState>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-[24px] border border-retail-border bg-retail-surface">
        <LoaderCircle className="animate-spin text-retail-accent" size={28} />
        <span className="mr-3 text-sm text-retail-secondary">آماده‌سازی تسویه حساب...</span>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState title="سبد خرید تکی خالی است">
        ابتدا از کاتالوگ فروش تکی محصول انتخاب کنید.
      </EmptyState>
    );
  }

  return (
    <form id="retail-checkout" onSubmit={submit} className="pb-24 lg:pb-0">
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-retail-border bg-retail-surface/70 px-4 py-3">
        <Step number="۱" label="آدرس" active />
        <span className="h-px flex-1 bg-retail-border mx-2" />
        <Step number="۲" label="ارسال" active={Boolean(address)} />
        <span className="h-px flex-1 bg-retail-border mx-2" />
        <Step number="۳" label="تأیید" active={Boolean(address && shippingMethod)} />
      </div>

      {error ? (
        <div className="mb-5">
          <Alert title="خطا در ثبت سفارش" tone="danger">
            {error}
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="grid gap-5">
          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span className="checkout-section-icon">
                <MapPin size={21} />
              </span>
              <div>
                <h2 className="font-black text-white">آدرس تحویل</h2>
                <p className="mt-1 text-xs text-retail-secondary">سفارش را کجا تحویل بگیرید؟</p>
              </div>
              <button
                type="button"
                onClick={startNewAddress}
                className="mr-auto inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-bold text-retail-accent transition hover:bg-retail-accent/10"
              >
                <Plus size={17} /> آدرس جدید
              </button>
            </div>

            {addresses.length > 0 ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((item) => {
                  const selected = item.id === selectedAddressId && !showAddressForm;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => applyAddress(item)}
                      className={`relative min-h-36 rounded-2xl border p-4 text-right transition duration-200 ${
                        selected
                          ? "border-retail-accent bg-retail-accent/[0.07] shadow-[0_10px_35px_rgba(0,217,255,.08)]"
                          : "border-retail-border bg-black/15 hover:border-white/20"
                      }`}
                    >
                      <span className="flex items-start gap-3">
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selected ? "bg-retail-accent text-retail-bg" : "bg-white/5 text-retail-secondary"}`}
                        >
                          {item.label === "محل کار" ? <Store size={19} /> : <Home size={19} />}
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-2 font-black text-white">
                            {item.label}
                            {item.isDefault ? (
                              <span className="rounded-full bg-retail-accent-2/12 px-2 py-0.5 text-[10px] text-retail-accent-2">
                                پیش‌فرض
                              </span>
                            ) : null}
                          </span>
                          <span className="mt-2 line-clamp-2 text-xs leading-6 text-retail-secondary">
                            {item.province}، {item.city}، {item.line1}
                          </span>
                          <span className="mt-2 block text-xs text-retail-muted" dir="ltr">
                            {item.receiverPhone}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`absolute left-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-retail-accent bg-retail-accent text-retail-bg" : "border-retail-border"}`}
                      >
                        {selected ? <Check size={14} strokeWidth={3} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {showAddressForm ? (
              <div className="checkout-address-form mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-white">
                      {addresses.length ? "افزودن آدرس جدید" : "اولین آدرس شما"}
                    </h3>
                    <p className="mt-1 text-xs text-retail-secondary">
                      این اطلاعات برای ارسال سفارش استفاده می‌شود.
                    </p>
                  </div>
                  {addresses.length ? (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddressForm(false);
                        if (selectedAddress) applyAddress(selectedAddress);
                      }}
                      className="min-h-11 px-3 text-sm text-retail-secondary hover:text-white"
                    >
                      انصراف
                    </button>
                  ) : null}
                </div>
                {addressError ? (
                  <Alert title="آدرس ذخیره نشد" tone="danger">
                    {addressError}
                  </Alert>
                ) : null}
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <fieldset className="sm:col-span-2">
                    <legend className="mb-2 text-sm font-bold">عنوان آدرس</legend>
                    <div className="flex gap-2">
                      {["خانه", "محل کار", "سایر"].map((label) => (
                        <button
                          key={label}
                          type="button"
                          onClick={() => setAddressLabel(label)}
                          className={`min-h-11 rounded-xl border px-4 text-sm font-bold transition ${addressLabel === label ? "border-retail-accent bg-retail-accent/10 text-retail-accent" : "border-retail-border text-retail-secondary"}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="checkout-label">
                    نام گیرنده
                    <Input
                      value={customerName}
                      onChange={(event) => setCustomerName(event.target.value)}
                      className={fieldClass}
                      autoComplete="name"
                      required
                    />
                  </label>
                  <label className="checkout-label">
                    شماره موبایل
                    <Input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className={`${fieldClass} text-left`}
                      inputMode="tel"
                      autoComplete="tel"
                      dir="ltr"
                      required
                    />
                  </label>
                  <IranProvinceCitySelect
                    province={province}
                    city={city}
                    onProvinceChange={setProvince}
                    onCityChange={setCity}
                  />
                  <label className="checkout-label sm:col-span-2">
                    نشانی کامل
                    <Textarea
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      className={`${textareaClass} min-h-28`}
                      autoComplete="street-address"
                      placeholder="خیابان، کوچه، پلاک و واحد"
                      required
                    />
                  </label>
                  <label className="checkout-label">
                    کد پستی <span className="font-normal text-retail-muted">(اختیاری)</span>
                    <Input
                      value={postalCode}
                      onChange={(event) =>
                        setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 10))
                      }
                      className={`${fieldClass} text-left`}
                      inputMode="numeric"
                      dir="ltr"
                      placeholder="۱۰ رقم"
                    />
                  </label>
                  <label className="flex min-h-[52px] cursor-pointer items-center gap-3 self-end rounded-xl border border-retail-border px-4 text-sm text-retail-secondary">
                    <input
                      type="checkbox"
                      checked={makeDefault}
                      onChange={(event) => setMakeDefault(event.target.checked)}
                      className="h-5 w-5 accent-cyan-300"
                    />
                    آدرس پیش‌فرض من باشد
                  </label>
                </div>
                <Button
                  type="button"
                  onClick={() => void saveAddress()}
                  disabled={isSavingAddress}
                  className="mt-5 min-h-[52px] w-full rounded-xl sm:w-auto"
                >
                  {isSavingAddress ? (
                    <LoaderCircle className="animate-spin" size={18} />
                  ) : (
                    <MapPin size={18} />
                  )}
                  {isSavingAddress ? "در حال ذخیره..." : "ذخیره و انتخاب آدرس"}
                </Button>
              </div>
            ) : null}
          </section>

          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span className="checkout-section-icon">
                <Truck size={21} />
              </span>
              <div>
                <h2 className="font-black text-white">روش ارسال</h2>
                <p className="mt-1 text-xs text-retail-secondary">
                  زمان و هزینه مناسب را انتخاب کنید.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3">
              {isLoadingShipping ? (
                <div className="flex min-h-20 items-center justify-center gap-2 rounded-2xl border border-retail-border text-sm text-retail-secondary">
                  <LoaderCircle className="animate-spin text-retail-accent" size={18} />
                  محاسبه روش‌های قابل ارسال...
                </div>
              ) : null}
              {!isLoadingShipping && shippingMethods.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-retail-border p-4 text-sm leading-7 text-retail-secondary">
                  برای مشاهده روش‌ها و هزینه ارسال، استان و شهر را انتخاب کنید.
                </div>
              ) : null}
              {shippingMethods.map((method) => {
                const unavailable = !method.available;
                const selected = shippingMethod === method.code;
                return (
                  <label
                    key={method.code}
                    className={`relative flex min-h-[76px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition ${unavailable ? "cursor-not-allowed border-retail-border opacity-45" : selected ? "border-retail-accent bg-retail-accent/[0.07]" : "border-retail-border bg-black/15 hover:border-white/20"}`}
                  >
                    <input
                      type="radio"
                      name="shipping"
                      className="sr-only"
                      checked={selected}
                      disabled={unavailable}
                      onChange={() => setShippingMethod(method.code)}
                    />
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${selected ? "border-retail-accent bg-retail-accent text-retail-bg" : "border-retail-border"}`}
                    >
                      {selected ? <Check size={14} strokeWidth={3} /> : null}
                    </span>
                    <span>
                      <span className="block font-black text-white">{method.titleFa}</span>
                      <span className="mt-1 block text-xs text-retail-secondary">
                        {unavailable
                          ? method.reasonFa
                          : `${method.descriptionFa} · ${method.etaFa}`}
                      </span>
                    </span>
                    <span className="mr-auto shrink-0 text-sm font-black text-white">
                      {method.costRial === 0 ? "رایگان" : <Price valueRial={method.costRial} />}
                    </span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="checkout-panel">
            <div className="checkout-section-heading">
              <span className="checkout-section-icon">
                <CreditCard size={21} />
              </span>
              <div>
                <h2 className="font-black text-white">روش پرداخت</h2>
                <p className="mt-1 text-xs text-retail-secondary">پرداخت امن و قابل پیگیری</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-retail-accent/40 bg-retail-accent/[0.06] p-4">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-retail-accent text-retail-bg">
                <Check size={14} strokeWidth={3} />
              </span>
              <div>
                <p className="font-black text-white">کارت به کارت</p>
                <p className="mt-1 text-xs text-retail-secondary">
                  اطلاعات پرداخت پس از ثبت سفارش نمایش داده می‌شود.
                </p>
              </div>
              <ShieldCheck className="mr-auto text-retail-accent-2" size={21} />
            </div>
            <details className="group mt-3 rounded-2xl border border-retail-border bg-black/15">
              <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-4 text-sm font-bold text-retail-secondary">
                <ReceiptText size={17} />
                توضیحات یا شماره پیگیری <span className="font-normal">(اختیاری)</span>
                <ChevronDown className="mr-auto transition group-open:rotate-180" size={17} />
              </summary>
              <div className="px-4 pb-4">
                <Textarea
                  value={receiptNote}
                  onChange={(event) => setReceiptNote(event.target.value)}
                  className={`${textareaClass} min-h-24`}
                  placeholder="اگر توضیحی برای سفارش دارید اینجا بنویسید"
                />
              </div>
            </details>
          </section>
        </div>

        <aside className="h-fit rounded-[24px] border border-retail-border bg-gradient-to-b from-[#141b23] to-[#0d1218] p-5 shadow-[0_24px_70px_rgba(0,0,0,.35)] lg:sticky lg:top-24">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-retail-accent">
              <PackageCheck size={20} />
            </span>
            <div>
              <h2 className="font-black text-white">خلاصه سفارش</h2>
              <p className="mt-1 text-xs text-retail-secondary">
                {new Intl.NumberFormat("fa-IR").format(lines.length)} قلم کالا
              </p>
            </div>
            <Link
              href="/cart"
              className="mr-auto min-h-11 px-2 py-3 text-xs font-bold text-retail-accent"
            >
              ویرایش سبد
            </Link>
          </div>
          <div className="mt-4 grid gap-3 border-y border-retail-border py-4 text-sm">
            {lines.slice(0, 3).map((line) => (
              <div key={line.id} className="flex items-start justify-between gap-3">
                <span className="line-clamp-1 text-retail-secondary">
                  {line.productName}{" "}
                  <span className="text-retail-muted">
                    ×{new Intl.NumberFormat("fa-IR").format(line.quantity)}
                  </span>
                </span>
                <Price valueRial={line.totalPrice} className="shrink-0 font-bold text-white" />
              </div>
            ))}
            {lines.length > 3 ? (
              <p className="text-xs text-retail-muted">
                و {new Intl.NumberFormat("fa-IR").format(lines.length - 3)} کالای دیگر
              </p>
            ) : null}
          </div>
          <div className="grid gap-3 py-4 text-sm">
            <div className="flex justify-between gap-3 text-retail-secondary">
              <span>جمع کالاها</span>
              <Price valueRial={subtotalRial} />
            </div>
            {discountRial > 0 ? (
              <div className="flex justify-between gap-3 text-retail-accent-2">
                <span>تخفیف</span>
                <span>
                  - <Price valueRial={discountRial} />
                </span>
              </div>
            ) : null}
            <div className="flex justify-between gap-3 text-retail-secondary">
              <span>هزینه ارسال</span>
              {(shipping?.costRial ?? 0) === 0 ? (
                <span>رایگان</span>
              ) : (
                <Price valueRial={shipping?.costRial ?? 0} />
              )}
            </div>
          </div>
          <div className="flex items-end justify-between border-t border-retail-border pt-4">
            <span>
              <span className="block text-sm text-retail-secondary">مبلغ قابل پرداخت</span>
              <span className="mt-1 block text-xs text-retail-muted">با احتساب ارسال</span>
            </span>
            <Price valueRial={totalRial} className="text-xl font-black text-white" />
          </div>
          <Button
            type="submit"
            className="mt-5 hidden min-h-14 w-full rounded-xl text-base font-black lg:inline-flex"
            disabled={isSubmitting || !address || !shipping?.available}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" size={19} />
            ) : (
              <Send size={19} />
            )}
            {isSubmitting ? "در حال ثبت سفارش..." : "تأیید و ثبت سفارش"}
          </Button>
          <p className="mt-3 hidden items-center justify-center gap-1.5 text-[11px] text-retail-muted lg:flex">
            <ShieldCheck size={14} className="text-retail-accent-2" />
            اطلاعات شما نزد یوفوپاف محفوظ است
          </p>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40 border-t border-white/10 bg-[#090d13]/96 p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0">
            <span className="block text-[10px] text-retail-secondary">مبلغ نهایی</span>
            <Price valueRial={totalRial} className="block truncate text-sm font-black text-white" />
          </div>
          <Button
            type="submit"
            className="mr-auto min-h-[52px] flex-1 rounded-xl font-black"
            disabled={isSubmitting || !address || !shipping?.available}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            {isSubmitting ? "در حال ثبت..." : "تأیید سفارش"}
          </Button>
        </div>
      </div>
    </form>
  );
}
