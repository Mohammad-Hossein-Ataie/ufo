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
import type {
  CustomerAddress,
  ShippingMethodCode,
  ShippingAddress,
  SalesChannel,
} from "@ufo/types";
import type { CustomerCartView } from "@ufo/orders";
import { authHeaders, fetchCustomerCart, readCustomerSession } from "@/lib/customer-client";
import { IranProvinceCitySelect } from "@/components/iran-location-select";
import { LocationPicker } from "@/components/location-picker";
import { CommerceSkeleton } from "@/components/commerce-skeleton";

interface CheckoutShippingMethod {
  scope?: "nationwide" | "tehran" | "pickup";
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

export function CheckoutClient({
  channel = "retail",
  gatewayEnabled = false,
}: {
  channel?: SalesChannel;
  gatewayEnabled?: boolean;
}) {
  const base = channel === "wholesale" ? "/b2b" : "";
  const [location, setLocation] = useState<ShippingAddress["location"]>();
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
  const [pickupStore, setPickupStore] = useState({
    address: "تهران، بازار مولوی، پاساژ صفویه",
    phone: "09362157181",
  });
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [receiptNote, setReceiptNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"zibal" | "card_to_card">(
    gatewayEnabled ? "zibal" : "card_to_card",
  );
  const [error, setError] = useState("");
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [addressError, setAddressError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
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
    setLocation(item.location);
    setShowAddressForm(false);
    if (item.city.trim() !== "تهران" && shippingMethod === "tehran_courier") {
      setShippingMethod("tipax");
    }
  }

  useEffect(() => {
    const session = readCustomerSession(channel);
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
      fetchCustomerCart(channel),
      fetch("/api/customer/addresses", {
        headers: authHeaders(channel),
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
    const controller = new AbortController();
    setShippingMethods([]);
    setIsLoadingShipping(true);
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams({ province, city });
      void fetch(`/api/shipping/methods?${query}`, { signal: controller.signal })
        .then(async (response) => {
          const payload = (await response.json()) as {
            methods?: CheckoutShippingMethod[];
            pickup?: { address: string; phone: string };
            error?: string;
          };
          if (!response.ok) throw new Error(payload.error ?? "دریافت روش‌های ارسال انجام نشد.");
          const methods = payload.methods ?? [];
          if (controller.signal.aborted) return;
          setShippingMethods(methods);
          if (payload.pickup) setPickupStore(payload.pickup);
          setShippingMethod((current) =>
            methods.some((method) => method.code === current && method.available)
              ? current
              : (methods.find((method) => method.available)?.code ?? ""),
          );
        })
        .catch((requestError: unknown) => {
          if (requestError instanceof Error && requestError.name !== "AbortError") {
            setError(requestError.message);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsLoadingShipping(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [city, province]);

  const shipping = shippingMethods.find((item) => item.code === shippingMethod);
  const isPickup = shipping?.scope === "pickup" || shippingMethod === "pickup";
  const subtotalRial = cartView?.summary.subtotalRial ?? 0;
  const discountRial = cartView?.summary.discountRial ?? 0;
  const totalRial = subtotalRial - discountRial + (shipping?.costRial ?? 0);
  const lines = cartView?.items ?? [];
  const selectedAddress = useMemo(
    () => addresses.find((item) => item.id === selectedAddressId),
    [addresses, selectedAddressId],
  );

  function startNewAddress() {
    const session = readCustomerSession(channel);
    setAddressLabel("خانه");
    setCustomerName(
      session ? `${session.customer.firstName} ${session.customer.lastName}`.trim() : customerName,
    );
    setPhone(session?.customer.mobileNumber ?? phone);
    setProvince("تهران");
    setCity("تهران");
    setAddress("");
    setPostalCode("");
    setLocation(undefined);
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
        headers: { "Content-Type": "application/json", ...authHeaders(channel) },
        body: JSON.stringify({
          label: addressLabel,
          province,
          city,
          line1: address,
          postalCode,
          location,
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
    } catch (error) {
      setError(error instanceof Error ? error.message : "ارتباط برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setIsSavingAddress(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      (!isPickup && !address.trim()) ||
      !shipping?.available ||
      !customerName.trim() ||
      !phone.trim()
    ) {
      setError("لطفاً آدرس و یک روش ارسال فعال را انتخاب کنید.");
      return;
    }
    setIsSubmitting(true);
    setError("");
    try {
      const response = await fetch(channel === "wholesale" ? "/api/b2b/orders" : "/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(channel) },
        body: JSON.stringify({
          customerName,
          phone,
          province: isPickup ? "تهران" : province,
          city: isPickup ? "تهران" : city,
          address: isPickup ? "" : address,
          postalCode: isPickup ? "" : postalCode,
          location: isPickup ? undefined : location,
          businessName: readCustomerSession(channel)?.customer.companyName,
          shippingMethod,
          receiptNote,
          paymentMethod,
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
      window.dispatchEvent(
        new CustomEvent(
          channel === "wholesale" ? "ufo-b2b-cart-updated" : "ufo-retail-cart-updated",
        ),
      );
      if (paymentMethod === "zibal") {
        setIsStartingPayment(true);
        try {
          const paymentResponse = await fetch(`/api/payments/zibal/${payload.order.id}`, {
            method: "POST",
            headers: authHeaders(channel),
          });
          const payment = (await paymentResponse.json().catch(() => ({}))) as {
            paymentUrl?: string;
            error?: string;
          };
          if (paymentResponse.ok && payment.paymentUrl) {
            window.location.assign(payment.paymentUrl);
            return;
          }
          setPaymentOrderId(payload.order.id);
          setError(
            `${payment.error ?? "اتصال به درگاه زیبال انجام نشد."} سفارش شما ثبت شده و از صفحه سفارش می‌توانید دوباره تلاش کنید.`,
          );
        } catch {
          setPaymentOrderId(payload.order.id);
          setError(
            "ارتباط با درگاه برقرار نشد. سفارش شما ثبت شده و از صفحه سفارش می‌توانید دوباره تلاش کنید.",
          );
        }
        return;
      }
      window.location.href = `${base}/orders/${payload.order.id}`;
    } catch (error) {
      setError(error instanceof Error ? error.message : "ارتباط برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setIsStartingPayment(false);
      setIsSubmitting(false);
    }
  }

  if (isLoading) return <CommerceSkeleton kind="checkout" />;

  if (!isLoggedIn) {
    return (
      <EmptyState title="برای پرداخت وارد شوید">
        <Link href={`${base}/login?next=${base}/checkout`} className="mt-3 inline-flex">
          <Button>ورود با کد پیامکی</Button>
        </Link>
      </EmptyState>
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
        <Step number="۱" label="روش تحویل" active />
        <span className="h-px flex-1 bg-retail-border mx-2" />
        <Step number="۲" label="اطلاعات گیرنده" active={Boolean(shipping?.available)} />
        <span className="h-px flex-1 bg-retail-border mx-2" />
        <Step number="۳" label="تأیید" active={Boolean((isPickup || address) && shippingMethod)} />
      </div>

      {error ? (
        <div className="mb-5">
          <Alert
            title={paymentOrderId ? "سفارش ثبت شد؛ اتصال به درگاه انجام نشد" : "خطا در ثبت سفارش"}
            tone="danger"
          >
            <p>{error}</p>
            {paymentOrderId ? (
              <Link
                href={`${base}/orders/${encodeURIComponent(paymentOrderId)}`}
                className="mt-3 inline-flex rounded-xl border border-current/30 px-3 py-2 text-sm font-bold"
              >
                مشاهده سفارش و تلاش دوباره
              </Link>
            ) : null}
          </Alert>
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex min-w-0 flex-col gap-5">
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
                    className={`relative flex min-h-[76px] cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition focus-within:ring-2 focus-within:ring-retail-accent ${unavailable ? "cursor-not-allowed border-retail-border opacity-45" : selected ? "border-retail-accent bg-retail-accent/[0.07]" : "border-retail-border bg-black/15 hover:border-white/20"}`}
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
                      {(method.scope === "pickup" || method.code === "pickup") && (
                        <span className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold text-cyan-300">
                          <Store size={14} /> دریافت از مغازه
                        </span>
                      )}
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
          {isPickup ? (
            <section className="checkout-panel">
              <div className="checkout-section-heading">
                <span className="checkout-section-icon">
                  <Store size={21} />
                </span>
                <div>
                  <h2 className="font-black text-white">دریافت از مغازه</h2>
                  <p className="mt-1 text-xs text-retail-secondary">
                    بدون نیاز به آدرس پستی؛ دریافت با هماهنگی فروشگاه
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                <p className="text-sm leading-7 text-white">{pickupStore.address}</p>
                <p className="mt-2 text-xs leading-7 text-retail-secondary">
                  پس از تأیید پرداخت، زمان تقریبی آماده‌شدن سفارش اعلام می‌شود. پیش از مراجعه با
                  فروشگاه هماهنگ کنید.
                </p>
                <a
                  href={`tel:${pickupStore.phone}`}
                  className="mt-3 inline-flex min-h-10 items-center gap-2 text-sm font-bold text-cyan-300"
                >
                  هماهنگی مراجعه <bdi>{pickupStore.phone}</bdi>
                </a>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="checkout-label">
                  نام تحویل‌گیرنده
                  <Input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    className={fieldClass}
                    required
                  />
                </label>
                <label className="checkout-label">
                  موبایل تحویل‌گیرنده
                  <Input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    className={fieldClass}
                    dir="ltr"
                    inputMode="tel"
                    required
                  />
                </label>
              </div>
            </section>
          ) : (
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
                      onProvinceChange={(next) => {
                        setProvince(next);
                        setLocation(undefined);
                      }}
                      onCityChange={(next) => {
                        setCity(next);
                        setLocation(undefined);
                      }}
                    />
                    <LocationPicker value={location} onChange={setLocation} channel={channel} />
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
          )}

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
            <div className="mt-4 grid gap-3">
              {gatewayEnabled ? (
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${paymentMethod === "zibal" ? "border-retail-accent/60 bg-retail-accent/[0.08]" : "border-retail-border bg-black/15"}`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="zibal"
                    checked={paymentMethod === "zibal"}
                    onChange={() => setPaymentMethod("zibal")}
                    className="h-5 w-5 accent-cyan-300"
                  />
                  <div>
                    <p className="font-black text-white">پرداخت آنلاین با زیبال</p>
                    <p className="mt-1 text-xs text-retail-secondary">
                      انتقال امن به درگاه و تأیید خودکار پرداخت
                    </p>
                  </div>
                  <ShieldCheck className="mr-auto shrink-0 text-retail-accent-2" size={21} />
                </label>
              ) : null}
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 ${paymentMethod === "card_to_card" ? "border-retail-accent/60 bg-retail-accent/[0.08]" : "border-retail-border bg-black/15"}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card_to_card"
                  checked={paymentMethod === "card_to_card"}
                  onChange={() => setPaymentMethod("card_to_card")}
                  className="h-5 w-5 accent-cyan-300"
                />
                <div>
                  <p className="font-black text-white">کارت به کارت</p>
                  <p className="mt-1 text-xs text-retail-secondary">
                    اطلاعات پرداخت پس از ثبت سفارش نمایش داده می‌شود.
                  </p>
                </div>
              </label>
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

        <aside className="h-fit rounded-[24px] border border-retail-border bg-gradient-to-b from-[#141b23] to-[#0d1218] p-5 shadow-[0_24px_70px_rgba(0,0,0,.35)] lg:sticky lg:top-[calc(var(--retail-header-height)+1rem)]">
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
              href={`${base}/cart`}
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
            disabled={
              isSubmitting ||
              Boolean(paymentOrderId) ||
              isLoadingShipping ||
              (!isPickup && !address) ||
              !shipping?.available
            }
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" size={19} />
            ) : (
              <Send size={19} />
            )}
            {isSubmitting
              ? isStartingPayment
                ? "در حال اتصال به درگاه..."
                : "در حال ثبت سفارش..."
              : paymentMethod === "zibal"
                ? "ثبت سفارش و پرداخت آنلاین"
                : "تأیید و ثبت سفارش"}
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
            disabled={
              isSubmitting ||
              Boolean(paymentOrderId) ||
              isLoadingShipping ||
              (!isPickup && !address) ||
              !shipping?.available
            }
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" size={18} />
            ) : (
              <Send size={18} />
            )}
            {isSubmitting
              ? isStartingPayment
                ? "اتصال به درگاه..."
                : "در حال ثبت..."
              : paymentMethod === "zibal"
                ? "ثبت و پرداخت"
                : "تأیید سفارش"}
          </Button>
        </div>
      </div>
    </form>
  );
}
