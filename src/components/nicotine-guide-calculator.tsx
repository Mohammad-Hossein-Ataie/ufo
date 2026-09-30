"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  CircleAlert,
  Database,
  Gauge,
  HeartPulse,
  PackageSearch,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Price, ProductCard, StockStatus } from "@ufo/ui";
import { ProductNavigationLink } from "@/components/product-navigation-link";
import { StorefrontProductImage } from "@/components/storefront-product-image";
import {
  calculateNicotineRecommendation,
  NICOTINE_CIGARETTE_COUNT_MAX,
  NICOTINE_CIGARETTE_COUNT_MIN,
  nicotinePerCigaretteMg,
  type CigaretteType,
  type NicotineCalculationError,
  type NicotineRecommendationResult,
} from "@/lib/nicotine-guide";
import type {
  NicotineDeviceType,
  NicotineMatchQuality,
  NicotineRecommendationSetKey,
} from "@/lib/nicotine-product-recommendations";
import type { PublicAvailabilityState } from "@/lib/public-availability";

export interface NicotineRecommendationProduct {
  id: string;
  slug: string;
  nameFa: string;
  nameEn?: string;
  description: string;
  brandNameFa: string;
  image: string;
  fallbackImage: string;
  priceRial: number;
  availability: PublicAvailabilityState;
  purchasable: boolean;
  strengthsMg: number[];
  matchQuality: NicotineMatchQuality;
}

export type NicotineRecommendationSets = Record<
  NicotineRecommendationSetKey,
  NicotineRecommendationProduct[]
>;

export interface NicotineCatalogSummary {
  salt: { available: number; withStrength: number; unknownStrength: number };
  freebase: { available: number; withStrength: number; unknownStrength: number };
}

const cigaretteTypeOptions: Array<{
  value: CigaretteType;
  label: string;
  hint: string;
}> = [
  {
    value: "unknown",
    label: "نمی‌دانم / میانگین بازار",
    hint: `${nicotinePerCigaretteMg.unknown} میلی‌گرم نیکوتین برای هر نخ`,
  },
  {
    value: "light",
    label: "سبک / اولترا لایت",
    hint: `${nicotinePerCigaretteMg.light} میلی‌گرم نیکوتین برای هر نخ`,
  },
  {
    value: "medium",
    label: "معمولی / لایت",
    hint: `${nicotinePerCigaretteMg.medium} میلی‌گرم نیکوتین برای هر نخ`,
  },
  {
    value: "heavy",
    label: "سنگین / پرکشش",
    hint: `${nicotinePerCigaretteMg.heavy} میلی‌گرم نیکوتین برای هر نخ`,
  },
];

const quickCounts = [5, 10, 20, 40, 60, 100];

const deviceOptions: Array<{
  value: NicotineDeviceType;
  label: string;
  hint: string;
}> = [
  {
    value: "pod",
    label: "پاد",
    hint: "پیشنهاد محصول فقط از خانواده سالت نیکوتین",
  },
  {
    value: "vape",
    label: "ویپ",
    hint: "پیشنهاد محصول فقط از خانواده جویس / ای‌لیکوئید",
  },
];

const calculationErrorMessages: Record<NicotineCalculationError, string> = {
  required: "تعداد نخ سیگار در روز را وارد کنید.",
  "invalid-count": "تعداد نخ باید یک عدد صحیح باشد.",
  "out-of-range": `تعداد نخ را به‌صورت یک عدد بین ${NICOTINE_CIGARETTE_COUNT_MIN.toLocaleString("fa-IR")} تا ${NICOTINE_CIGARETTE_COUNT_MAX.toLocaleString("fa-IR")} وارد کنید.`,
  "invalid-cigarette-type": "نوع سیگار انتخاب‌شده معتبر نیست.",
};

function RadioCard({
  checked,
  label,
  hint,
  name,
  value,
  onChange,
}: {
  checked: boolean;
  label: string;
  hint: string;
  name: string;
  value: string;
  onChange: () => void;
}) {
  return (
    <label
      className={`relative flex min-h-[4.75rem] cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-retail-accent ${
        checked
          ? "border-retail-accent/70 bg-retail-accent/10 text-white"
          : "border-retail-border bg-black/15 text-retail-secondary hover:border-white/25 hover:bg-white/[0.035]"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span
        className={`mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full border ${checked ? "border-retail-accent bg-retail-accent text-retail-bg" : "border-retail-muted"}`}
        aria-hidden="true"
      >
        {checked ? <Check size={13} strokeWidth={3} /> : null}
      </span>
      <span>
        <span className="block text-sm font-black text-inherit">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-retail-muted">{hint}</span>
      </span>
    </label>
  );
}

function RecommendationCard({ product }: { product: NicotineRecommendationProduct }) {
  const exactStrength =
    product.matchQuality === "strength" && product.strengthsMg.length > 0
      ? `${product.strengthsMg.join(" / ")} mg/ml`
      : undefined;

  return (
    <ProductCard
      className="catalog-linked-card"
      unavailable={!product.purchasable}
      compactOnMobile
      title={product.nameFa}
      subtitle={product.nameEn}
      description={
        exactStrength
          ? `غلظت ${exactStrength} در مشخصات محصول ثبت شده و با عدد پیشنهادی شما هم‌خوان است.`
          : "محصول از نوع سالت است؛ غلظت نیکوتین در اطلاعات فعلی آن ثبت نشده است."
      }
      media={
        <StorefrontProductImage
          src={product.image}
          fallbackSrc={product.fallbackImage}
          alt={product.nameFa}
          sizes="(min-width: 1280px) 20vw, (min-width: 640px) 33vw, 50vw"
        />
      }
      badge={
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <span
            className={`inline-flex min-h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-black ${exactStrength ? "border-retail-accent-2/30 bg-retail-accent-2/10 text-retail-accent-2" : "border-amber-300/30 bg-amber-300/10 text-amber-200"}`}
          >
            {exactStrength ? <BadgeCheck size={13} aria-hidden="true" /> : null}
            {exactStrength ?? "تطابق نوع محصول"}
          </span>
          <StockStatus state={product.availability} unavailableLabel="ناموجود" />
        </div>
      }
      price={
        <Price
          valueRial={product.priceRial}
          className={!product.purchasable ? "text-retail-muted line-through" : ""}
        />
      }
      actions={
        <ProductNavigationLink
          href={`/products/${product.slug}`}
          documentNavigation
          action="details"
          pendingLabel="در حال باز کردن…"
          className="w-full border border-retail-accent/35 bg-retail-accent/10 text-retail-accent hover:bg-retail-accent hover:text-retail-bg"
        >
          مشاهده و انتخاب
          <ArrowLeft size={16} aria-hidden="true" />
        </ProductNavigationLink>
      }
    />
  );
}

export function NicotineGuideCalculator({
  recommendationSets,
  catalogSummary,
}: {
  recommendationSets: NicotineRecommendationSets;
  catalogSummary: NicotineCatalogSummary;
}) {
  const [cigaretteCount, setCigaretteCount] = useState("");
  const [cigaretteType, setCigaretteType] = useState<CigaretteType>("unknown");
  const [deviceType, setDeviceType] = useState<NicotineDeviceType>("pod");
  const [result, setResult] = useState<NicotineRecommendationResult | null>(null);
  const [error, setError] = useState("");
  const recommendationKey = result
    ? (`${deviceType}:${result.recommendedStrength}` as NicotineRecommendationSetKey)
    : undefined;
  const recommendations = recommendationKey ? (recommendationSets[recommendationKey] ?? []) : [];
  const selectedFamilyLabel = deviceType === "pod" ? "سالت نیکوتین" : "جویس / ای‌لیکوئید";
  const selectedDeviceLabel = deviceType === "pod" ? "پاد" : "ویپ";
  const selectedCatalogSummary =
    deviceType === "pod" ? catalogSummary.salt : catalogSummary.freebase;
  const selectedCategoryHref =
    deviceType === "pod" ? "/products/category/salt-nicotine" : "/products/category/e-liquid";

  const calculate = () => {
    const outcome = calculateNicotineRecommendation({
      cigCount: cigaretteCount,
      cigType: cigaretteType,
    });
    if (!outcome.ok) {
      setError(calculationErrorMessages[outcome.error]);
      setResult(null);
      return;
    }

    setError("");
    setResult(outcome.result);
  };

  const reset = () => {
    setCigaretteCount("");
    setCigaretteType("unknown");
    setDeviceType("pod");
    setResult(null);
    setError("");
  };

  return (
    <section aria-labelledby="calculator-title" className="relative mx-auto max-w-7xl px-4">
      <div className="grid overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#0a1017] shadow-[0_28px_90px_rgba(0,0,0,.42)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="p-5 sm:p-8 lg:p-10">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-retail-accent/25 bg-retail-accent/10 text-retail-accent">
              <Gauge size={22} aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold text-retail-accent">
                دو ورودی محاسبه، یک انتخاب برای پیشنهاد محصول
              </p>
              <h2 id="calculator-title" className="mt-1 text-xl font-black text-white sm:text-2xl">
                عدد پیشنهادی نیکوتین را محاسبه کنید
              </h2>
            </div>
          </div>

          <form
            className="mt-8 grid gap-8"
            onSubmit={(event) => {
              event.preventDefault();
              calculate();
            }}
            noValidate
          >
            <fieldset>
              <legend className="text-sm font-black text-white">
                <span className="ml-2 text-retail-accent">۱.</span>
                روزانه چند نخ سیگار می‌کشید؟
              </legend>
              <div className="mt-3 flex items-stretch gap-2">
                <div className="relative min-w-0 flex-1">
                  <label htmlFor="cigarette-count" className="sr-only">
                    تعداد نخ سیگار در روز
                  </label>
                  <input
                    id="cigarette-count"
                    type="number"
                    inputMode="numeric"
                    min={NICOTINE_CIGARETTE_COUNT_MIN}
                    max={NICOTINE_CIGARETTE_COUNT_MAX}
                    step={1}
                    value={cigaretteCount}
                    onChange={(event) => {
                      setCigaretteCount(event.target.value);
                      if (error) setError("");
                    }}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "cigarette-count-error" : "cigarette-count-help"}
                    placeholder="مثلاً ۱۰"
                    className="min-h-14 w-full rounded-xl border border-retail-border bg-black/20 px-4 pl-16 text-base font-bold tabular-nums text-white outline-none transition placeholder:text-retail-muted focus:border-retail-accent focus:ring-4 focus:ring-retail-accent/10"
                  />
                  <span className="pointer-events-none absolute inset-y-0 left-4 inline-flex items-center text-xs text-retail-muted">
                    نخ / روز
                  </span>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-2" aria-label="انتخاب سریع تعداد نخ">
                {quickCounts.map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      setCigaretteCount(String(count));
                      setError("");
                    }}
                    className={`min-h-10 rounded-full border px-3.5 text-xs font-bold tabular-nums transition ${cigaretteCount === String(count) ? "border-retail-accent bg-retail-accent/10 text-retail-accent" : "border-retail-border text-retail-secondary hover:border-white/25 hover:text-white"}`}
                  >
                    {count.toLocaleString("fa-IR")} نخ
                  </button>
                ))}
              </div>
              {error ? (
                <p
                  id="cigarette-count-error"
                  role="alert"
                  className="mt-2 flex items-center gap-1.5 text-xs font-bold text-rose-300"
                >
                  <CircleAlert size={14} aria-hidden="true" />
                  {error}
                </p>
              ) : (
                <p id="cigarette-count-help" className="mt-2 text-xs leading-5 text-retail-muted">
                  اگر مصرفتان متغیر است، میانگین یک هفته اخیر را وارد کنید.
                </p>
              )}
            </fieldset>

            <fieldset>
              <legend className="text-sm font-black text-white">
                <span className="ml-2 text-retail-accent">۲.</span>
                معمولاً چه نوع سیگاری مصرف می‌کنید؟
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {cigaretteTypeOptions.map((option) => (
                  <RadioCard
                    key={option.value}
                    name="cigarette-type"
                    value={option.value}
                    label={option.label}
                    hint={option.hint}
                    checked={cigaretteType === option.value}
                    onChange={() => setCigaretteType(option.value)}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className="text-sm font-black text-white">
                <span className="ml-2 text-retail-accent">۳.</span>
                از چه دستگاهی استفاده می‌کنید؟
              </legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {deviceOptions.map((option) => (
                  <RadioCard
                    key={option.value}
                    name="device-type"
                    value={option.value}
                    label={option.label}
                    hint={option.hint}
                    checked={deviceType === option.value}
                    onChange={() => setDeviceType(option.value)}
                  />
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-retail-muted">
                انتخاب دستگاه فقط خانواده محصولات پیشنهادی را عوض می‌کند و روی عدد محاسبه‌شده اثر
                ندارد.
              </p>
            </fieldset>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                className="inline-flex min-h-14 flex-1 items-center justify-center gap-2 rounded-xl bg-retail-accent px-5 text-sm font-black text-retail-bg shadow-[0_14px_34px_rgba(0,217,255,.18)] transition hover:bg-retail-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
              >
                <Sparkles size={18} aria-hidden="true" />
                نمایش پیشنهاد شروع
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-xl border border-retail-border px-5 text-sm font-bold text-retail-secondary transition hover:border-white/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
              >
                <RotateCcw size={17} aria-hidden="true" />
                پاک‌کردن
              </button>
            </div>
          </form>

          <p className="mt-5 flex items-center gap-2 text-xs leading-6 text-retail-muted">
            <ShieldCheck size={15} className="shrink-0 text-retail-accent-2" aria-hidden="true" />
            پاسخ‌ها فقط روی همین صفحه پردازش می‌شوند و برای فروشگاه ارسال یا ذخیره نمی‌شوند.
          </p>
        </div>

        <aside
          aria-label="نتیجه راهنمای نیکوتین"
          aria-live="polite"
          className="relative isolate flex min-h-[31rem] flex-col border-t border-white/10 bg-gradient-to-br from-[#10222b] via-[#0b1720] to-[#090d13] p-5 sm:p-8 lg:border-r lg:border-t-0 lg:p-10"
        >
          <div
            className="pointer-events-none absolute -left-24 -top-24 -z-10 size-72 rounded-full bg-retail-accent/10 blur-3xl"
            aria-hidden="true"
          />
          {result ? (
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded-full border border-retail-accent-2/25 bg-retail-accent-2/10 px-3 py-1 text-xs font-black text-retail-accent-2">
                  محاسبه بر اساس کد اصلی مشتری
                </span>
                <span className="text-xs text-retail-muted">راهنمای عددی، نه نسخه پزشکی</span>
              </div>

              <div className="mt-7 border-b border-white/10 pb-7">
                <h3 className="text-lg font-black leading-8 text-white">نتیجه محاسبه نیکوتین</h3>
                <p className="mt-4 text-sm text-retail-secondary">عدد پیشنهادی</p>
                <p
                  dir="ltr"
                  data-testid="nicotine-recommendation-value"
                  className="mt-1 text-left text-5xl font-black tracking-tight text-retail-accent sm:text-6xl"
                >
                  {result.recommendedStrength}mg
                </p>
                <dl className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <dt className="text-xs text-retail-muted">دستگاه انتخابی</dt>
                    <dd data-testid="nicotine-device-value" className="mt-1 font-black text-white">
                      {selectedDeviceLabel}
                    </dd>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/[0.035] p-3">
                    <dt className="text-xs text-retail-muted">نوع محصول پیشنهادی</dt>
                    <dd data-testid="nicotine-family-value" className="mt-1 font-black text-white">
                      {selectedFamilyLabel}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-6 grid gap-4 text-sm leading-7">
                <p className="text-[#d6e1ea]">
                  با مصرف روزانه {result.cigCount.toLocaleString("fa-IR")} نخ و ضریب{" "}
                  <span dir="ltr" className="inline-block font-bold text-white">
                    {result.nicPerCig}mg
                  </span>{" "}
                  برای هر نخ، مجموع برآوردی روزانه شما{" "}
                  <span dir="ltr" className="inline-block font-bold text-white">
                    {result.totalDailyNicotine}mg
                  </span>{" "}
                  است.
                </p>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                  <p className="text-xs font-black text-retail-accent-2">معادل پاکت ۲۰‌تایی</p>
                  <p className="mt-1 text-retail-secondary">
                    حدود {result.packs.toLocaleString("fa-IR", { maximumFractionDigits: 2 })} پاکت
                    در روز
                  </p>
                </div>
              </div>

              <div className="mt-auto pt-7">
                <a
                  href="#recommended-products"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-retail-accent/40 bg-retail-accent/10 px-4 text-sm font-black text-retail-accent transition hover:border-retail-accent hover:bg-retail-accent hover:text-retail-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
                >
                  مشاهده محصولات پیشنهادی
                  <ArrowLeft size={17} aria-hidden="true" />
                </a>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col justify-center">
              <span className="inline-flex size-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-retail-accent">
                <HeartPulse size={30} aria-hidden="true" />
              </span>
              <p className="mt-7 text-xs font-black text-retail-accent">نتیجه شخصی‌سازی‌شده</p>
              <h3 className="mt-2 text-2xl font-black leading-10 text-white sm:text-3xl">
                تعداد و نوع سیگار و دستگاه را مشخص کنید
              </h3>
              <p className="mt-4 max-w-md text-sm leading-8 text-retail-secondary">
                محاسبه فقط با تعداد نخ روزانه و ضریب نوع سیگار انجام می‌شود؛ دستگاه فقط محصولات
                پیشنهادی را بین سالت و جویس فیلتر می‌کند.
              </p>
              <ul className="mt-7 grid gap-3 text-sm text-[#d6e1ea]">
                {[
                  "خروجی‌های دقیق: ۲۰، ۲۵، ۳۵ یا ۵۰ میلی‌گرم.",
                  "زمان اولین سیگار و نوع دستگاه نتیجه را تغییر نمی‌دهند.",
                  "بازه معتبر تعداد سیگار از ۱ تا ۱۰۰ نخ در روز است.",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check
                      size={16}
                      className="mt-1 shrink-0 text-retail-accent-2"
                      aria-hidden="true"
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>

      {result ? (
        <section
          id="recommended-products"
          aria-labelledby="recommended-products-title"
          className="scroll-mt-36 pt-10 sm:pt-12"
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black text-retail-accent">
                <Database size={15} aria-hidden="true" />
                انتخاب از موجودی زنده فروشگاه
              </p>
              <h2
                id="recommended-products-title"
                className="mt-2 text-2xl font-black text-white sm:text-3xl"
              >
                محصولات پیشنهادی برای دستگاه شما
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-retail-secondary">
                دستگاه {selectedDeviceLabel}، خانواده {selectedFamilyLabel} را انتخاب کرده است. از{" "}
                {selectedCatalogSummary.available.toLocaleString("fa-IR")} محصول قابل خرید این
                خانواده، {selectedCatalogSummary.withStrength.toLocaleString("fa-IR")} محصول غلظت
                ساخت‌یافته دارد و فقط تطابق دقیق{" "}
                {result.recommendedStrength.toLocaleString("fa-IR")}mg نمایش داده می‌شود.
              </p>
            </div>
            <Link
              href={selectedCategoryHref}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-retail-border px-4 text-sm font-bold text-white transition hover:border-retail-accent/50 hover:text-retail-accent"
            >
              مشاهده همه دسته
              <ArrowLeft size={16} aria-hidden="true" />
            </Link>
          </div>

          {recommendations.length > 0 ? (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
                {recommendations.map((product) => (
                  <RecommendationCard key={product.id} product={product} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-retail-border bg-retail-surface p-6 text-center">
              <span className="inline-flex size-12 items-center justify-center rounded-xl bg-white/[0.04] text-retail-muted">
                <PackageSearch size={24} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-lg font-black text-white">محصول منطبقِ موجود پیدا نشد</h3>
              <p className="mt-2 max-w-xl text-sm leading-7 text-retail-secondary">
                در حال حاضر محصول قابل خرید از خانواده {selectedFamilyLabel} با غلظت ساخت‌یافته و
                دقیق {result.recommendedStrength.toLocaleString("fa-IR")}mg در کاتالوگ ثبت نشده است.
                محصولات با غلظت نامشخص یا عدد متفاوت جایگزین نشده‌اند.
                {deviceType === "vape" ? " هیچ تبدیل حدسی از سالت به جویس نیز اعمال نشده است." : ""}
              </p>
              <Link
                href={selectedCategoryHref}
                className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-retail-border px-4 text-sm font-bold text-white transition hover:border-retail-accent/50 hover:text-retail-accent"
              >
                بررسی دستی کاتالوگ
                <ArrowLeft size={16} aria-hidden="true" />
              </Link>
            </div>
          )}
        </section>
      ) : null}
    </section>
  );
}
