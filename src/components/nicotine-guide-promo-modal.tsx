"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Calculator, Check, Clock3, ShieldCheck, X } from "lucide-react";
import { ModalSurface } from "@/components/modal-surface";
import {
  createNicotineGuidePromoPreference,
  NICOTINE_GUIDE_PROMO_STORAGE_KEY,
  shouldShowNicotineGuidePromo,
  type NicotineGuidePromoChoice,
} from "@/lib/nicotine-guide-promo";

const PROMO_OPEN_DELAY_MS = 2_400;

export function NicotineGuidePromoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let shouldShow = true;

    try {
      shouldShow = shouldShowNicotineGuidePromo(
        window.localStorage.getItem(NICOTINE_GUIDE_PROMO_STORAGE_KEY),
      );
    } catch {
      // Browsers with disabled storage can still use the guide for this visit.
    }

    if (!shouldShow) return;

    const timeout = window.setTimeout(() => setOpen(true), PROMO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  const saveChoice = useCallback((choice: NicotineGuidePromoChoice) => {
    try {
      window.localStorage.setItem(
        NICOTINE_GUIDE_PROMO_STORAGE_KEY,
        createNicotineGuidePromoPreference(choice),
      );
    } catch {
      // Closing the modal should never depend on storage availability.
    }

    setOpen(false);
  }, []);

  const remindLater = useCallback(() => saveChoice("remind-later"), [saveChoice]);

  return (
    <ModalSurface
      open={open}
      onClose={remindLater}
      title="محاسبه‌گر هوشمند نیکوتین"
      overlayClassName="nicotine-promo-overlay backdrop-blur-[10px]"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="nicotine-promo-title"
        aria-describedby="nicotine-promo-description"
        data-testid="nicotine-guide-promo"
        className="nicotine-promo-dialog fixed left-1/2 top-1/2 z-[70] grid max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-[62rem] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] border border-white/15 bg-[#071018] text-right text-white shadow-[0_35px_120px_rgba(0,0,0,.78),0_0_70px_rgba(0,217,255,.09)] outline-none lg:grid-cols-[minmax(0,1.08fr)_minmax(19rem,.92fr)] lg:overflow-hidden"
      >
        <div className="order-2 flex flex-col justify-center px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-9 lg:order-1 lg:min-h-[34rem] lg:px-10 lg:py-10">
          <div className="flex w-fit items-center gap-2 rounded-full border border-retail-accent/25 bg-retail-accent/10 px-3 py-1.5 text-xs font-bold text-retail-accent">
            <Calculator size={15} aria-hidden="true" />
            راهنمای رایگان • کمتر از یک دقیقه
          </div>

          <h2
            id="nicotine-promo-title"
            className="mt-5 text-3xl font-black leading-[1.35] tracking-tight text-white sm:text-4xl"
          >
            نیکوتین مناسب را
            <span className="block bg-gradient-to-l from-retail-accent to-emerald-300 bg-clip-text text-transparent">
              حدس نزنید
            </span>
          </h2>

          <p
            id="nicotine-promo-description"
            className="mt-4 max-w-xl text-sm leading-7 text-retail-secondary sm:text-base sm:leading-8"
          >
            با پاسخ درباره تعداد و نوع سیگار، عدد پیشنهادی ۲۰، ۲۵، ۳۵ یا ۵۰ میلی‌گرم را ببینید؛ سپس
            با انتخاب پاد یا ویپ، محصولات همان خانواده را جداگانه بررسی کنید.
          </p>

          <ul className="mt-5 grid gap-2.5 text-sm text-white/85 sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <Check size={17} className="shrink-0 text-emerald-300" aria-hidden="true" />
              محاسبه بر اساس نوع سیگار شما
            </li>
            <li className="flex items-center gap-2">
              <Check size={17} className="shrink-0 text-emerald-300" aria-hidden="true" />
              چهار خروجی دقیق ۲۰، ۲۵، ۳۵ و ۵۰
            </li>
            <li className="flex items-center gap-2 sm:col-span-2">
              <ShieldCheck size={17} className="shrink-0 text-retail-accent" aria-hidden="true" />
              پاسخ‌های شما ذخیره نمی‌شوند
            </li>
          </ul>

          <div className="mt-7 grid gap-2.5 sm:grid-cols-[1fr_auto]">
            <Link
              href="/nicotine-guide"
              autoFocus
              onClick={() => saveChoice("opened")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-retail-accent px-5 text-sm font-black text-[#031015] shadow-[0_14px_36px_rgba(0,217,255,.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-retail-accent-hover hover:shadow-[0_18px_42px_rgba(0,217,255,.3)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent motion-reduce:transform-none motion-reduce:transition-none"
            >
              شروع محاسبه رایگان
              <ArrowLeft size={18} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={remindLater}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.055] px-4 text-sm font-bold text-white transition hover:border-white/25 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
            >
              <Clock3 size={17} aria-hidden="true" />
              بعداً یادآوری کن
            </button>
          </div>

          <button
            type="button"
            onClick={() => saveChoice("never")}
            className="mt-4 w-fit text-xs text-white/50 underline decoration-white/20 underline-offset-4 transition hover:text-white focus-visible:rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent"
          >
            دیگر یادآوری نکن
          </button>

          <p className="mt-5 border-t border-white/10 pt-4 text-[11px] leading-6 text-retail-muted">
            ویژه افراد بالای ۱۸ سال که در حال حاضر سیگار مصرف می‌کنند؛ این ابزار جایگزین توصیه پزشک
            نیست.
          </p>
        </div>

        <div className="relative order-1 min-h-48 overflow-hidden border-b border-white/10 lg:order-2 lg:min-h-[34rem] lg:border-b-0 lg:border-r">
          <Image
            src="/images/nicotine-guide-promo.png"
            alt="دو بطری مایع ویپ و یک دستگاه در کنار نشانگر محاسبه"
            fill
            loading="eager"
            sizes="(min-width: 1024px) 26rem, calc(100vw - 1.5rem)"
            className="object-cover object-center"
          />
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#071018] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#071018]/80 lg:via-transparent lg:to-transparent"
            aria-hidden="true"
          />
          <div className="absolute bottom-4 end-4 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-bold text-white/85 backdrop-blur-md lg:bottom-6 lg:end-6">
            انتخاب آگاهانه برای مصرف‌کنندگان بزرگسال
          </div>
        </div>

        <button
          type="button"
          onClick={remindLater}
          aria-label="بستن و یادآوری در آینده"
          className="absolute end-3 top-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white/85 backdrop-blur-md transition hover:bg-black/75 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-retail-accent sm:end-4 sm:top-4"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </section>
    </ModalSurface>
  );
}
