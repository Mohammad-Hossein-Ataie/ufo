import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { CheckoutClient } from "@/components/checkout-client";

export const metadata: Metadata = {
  title: "تسویه حساب",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return (
    <main
      id="main-content"
      className="relative isolate mx-auto max-w-6xl overflow-hidden px-4 pb-36 pt-6 sm:pt-10 lg:pb-14"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(0,217,255,.09),transparent_65%)]" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/cart"
            className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 text-sm font-bold text-retail-secondary transition hover:bg-white/5 hover:text-white"
          >
            <ArrowRight size={18} />
            بازگشت به سبد خرید
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-retail-accent/20 bg-retail-accent/[0.08] text-retail-accent">
              <LockKeyhole size={23} />
            </span>
            <div>
              <h1 className="text-2xl font-black text-white sm:text-3xl">تکمیل سفارش</h1>
              <p className="mt-1 text-sm text-retail-secondary">
                آدرس و روش ارسال را بررسی کنید؛ بقیه‌اش با ما.
              </p>
            </div>
          </div>
        </div>
        <span className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-full border border-retail-accent-2/20 bg-retail-accent-2/[0.06] px-4 text-xs font-bold text-retail-accent-2">
          <ShieldCheck size={16} />
          پرداخت امن و قابل پیگیری
        </span>
      </div>
      <div className="mt-7">
        <CheckoutClient />
      </div>
    </main>
  );
}
