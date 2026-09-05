import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { PhoneLoginClient } from "@/components/phone-login-client";

export const metadata: Metadata = {
  title: "ورود",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main
      id="main-content"
      className="relative isolate min-h-[calc(100svh-3.75rem)] overflow-hidden px-4 pb-28 pt-6 sm:py-12 lg:min-h-[calc(100vh-4rem)]"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_16%,rgba(0,217,255,.14),transparent_32%),radial-gradient(circle_at_10%_80%,rgba(32,242,139,.07),transparent_25%)]" />
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm text-retail-secondary transition hover:bg-white/5 hover:text-white"
          >
            <ArrowRight size={18} aria-hidden="true" />
            بازگشت
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs text-retail-secondary">
            <ShieldCheck size={15} className="text-retail-accent-2" aria-hidden="true" />
            ورود امن
          </span>
        </div>
        <div className="mt-3 text-center">
          <Link
            href="/"
            aria-label="صفحه خانه یوفوپاف"
            className="relative mx-auto block h-20 w-20"
          >
            <Image
              src="/logos/logo.png"
              alt="UFO Puff"
              fill
              sizes="80px"
              priority
              className="object-contain"
              unoptimized
            />
          </Link>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-retail-accent/20 bg-retail-accent/[0.06] px-3 py-1 text-xs text-retail-accent">
            <Sparkles size={13} aria-hidden="true" />
            خوش آمدید
          </div>
          <h1 className="mt-3 text-2xl font-black leading-[1.5] text-white sm:text-3xl">
            سریع و ساده وارد شوید
          </h1>
          <p className="mt-2 text-sm leading-7 text-retail-secondary">
            برای ورود یا ساخت حساب، شماره موبایل‌تان کافی است.
          </p>
        </div>
        <div className="mt-7">
          <Suspense fallback={null}>
            <PhoneLoginClient />
          </Suspense>
        </div>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-[#bdc7d1]">
          <ShieldCheck size={18} className="text-retail-accent-2" aria-hidden="true" />
          پیگیری سفارش‌ها و خرید سریع‌تر
        </p>
        <Link
          href="/products"
          className="mx-auto mt-5 flex min-h-11 w-fit items-center justify-center px-4 text-sm font-bold text-retail-secondary transition hover:text-white"
        >
          فعلاً محصولات را می‌بینم
        </Link>
      </div>
    </main>
  );
}
