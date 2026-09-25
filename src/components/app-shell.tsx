"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { B2BHeader } from "@/components/b2b/b2b-header";
import { MotionReveal } from "@/components/motion-reveal";
import { FooterCopyContact } from "@/components/footer-copy-contact";
import { SiteHeader } from "@/components/site-header";
import { storeSettings } from "@ufo/domain";

const retailFooterLinks = [
  { href: "/products", label: "محصولات", icon: ShoppingBag },
  { href: "/cart", label: "سبد خرید", icon: Clock3 },
  { href: "/login", label: "حساب مشتری", icon: ShieldCheck },
  { href: "/store/tehran-molavi", label: "درباره یوفوپاف", icon: MessageCircle },
];

const enamadVerificationUrl =
  "https://trustseal.enamad.ir/?id=7628595&Code=9H4ALixgxYdhUO3XrI7dMMNT5ULunNIC";
const enamadLogoUrl =
  "https://trustseal.enamad.ir/logo.aspx?id=7628595&Code=9H4ALixgxYdhUO3XrI7dMMNT5ULunNIC";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (pathname.startsWith("/admin")) {
    return <AdminShell>{children}</AdminShell>;
  }

  if (pathname.startsWith("/b2b")) {
    return (
      <div className="b2b-shell min-h-screen bg-[#F7F7F2] text-[#14201B]">
        <a href="#main-content" className="skip-link">
          پرش به محتوای اصلی
        </a>
        <B2BHeader />
        {children}
      </div>
    );
  }

  return (
    <>
      <a href="#main-content" className="skip-link">
        پرش به محتوای اصلی
      </a>
      <SiteHeader />
      {children}
      <footer className="border-t border-[#22303D] bg-[#0D1117] pb-[calc(5rem+env(safe-area-inset-bottom))] text-[#D9E2EC] lg:pb-0">
        <MotionReveal className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_1fr_0.8fr]">
          <section aria-label="UFO Puff">
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="relative h-12 w-12 shrink-0">
                <Image
                  src="/logos/logo.png"
                  alt="UFO Puff"
                  fill
                  sizes="48px"
                  className="object-contain"
                  unoptimized
                />
              </span>
              <span>
                <span className="block text-lg font-black text-white">یوفوپاف | UFO Puff</span>
                <span className="block text-sm text-[#9BA7B4]">فروشگاه تخصصی پاد و ویپ</span>
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-7 text-[#9BA7B4]">
              {storeSettings.legalNotice}
            </p>
          </section>

          <nav aria-label="دسترسی سریع" className="grid content-start gap-3">
            <h2 className="text-sm font-bold text-white">دسترسی سریع</h2>
            {retailFooterLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center gap-2 text-sm text-[#9BA7B4] transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                <item.icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <section aria-label="ارتباط با فروشگاه" className="grid content-start gap-3">
            <h2 className="text-sm font-bold text-white">ارتباط با فروشگاه</h2>
            <FooterCopyContact value={storeSettings.phone} label="شماره تماس" icon={Phone} />
            <FooterCopyContact value={storeSettings.email} label="ایمیل" icon={Mail} />
            <p className="inline-flex items-start gap-2 text-sm leading-7 text-[#9BA7B4]">
              <MapPin size={17} aria-hidden="true" className="mt-1 shrink-0" />
              <span>{storeSettings.address}</span>
            </p>
            <a
              href={storeSettings.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-[#9BA7B4] transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <Send size={17} aria-hidden="true" />
              <span>تلگرام فروشگاه</span>
            </a>
          </section>

          <section aria-label="اعتماد و اعتبار" className="grid content-start gap-3">
            <h2 className="text-sm font-bold text-white">اعتماد و اعتبار</h2>
            <a
              href={enamadVerificationUrl}
              target="_blank"
              rel="noopener"
              referrerPolicy="origin"
              aria-label="اعتبارسنجی نماد اعتماد الکترونیکی یوفوپاف"
              className="group mx-auto inline-flex w-full max-w-40 flex-col items-center gap-3 rounded-2xl border border-[#2A3845] bg-[#111923] p-3 transition duration-200 hover:-translate-y-1 hover:border-cyan-300/50 hover:bg-[#141E29] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 md:mx-0"
            >
              <span className="relative flex size-28 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
                <span
                  aria-hidden="true"
                  className="flex flex-col items-center gap-1 text-center text-[11px] font-bold leading-5 text-slate-600"
                >
                  <ShieldCheck size={30} className="text-cyan-700" />
                  نماد اعتماد الکترونیکی
                </span>
                {/* The official seal must load directly so Enamad receives the origin referrer. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={enamadLogoUrl}
                  alt="نماد اعتماد الکترونیکی یوفوپاف"
                  width={104}
                  height={104}
                  loading="lazy"
                  referrerPolicy="origin"
                  className="absolute inset-2 size-24 bg-white object-contain"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </span>
              <span className="text-xs font-bold text-[#D9E2EC] transition group-hover:text-cyan-200">
                استعلام اعتبار نماد
              </span>
            </a>
            <p className="mx-auto max-w-40 text-center text-xs leading-6 text-[#7F8B98] md:mx-0 md:text-start">
              برای مشاهده جزئیات مجوز، روی نماد بزنید.
            </p>
          </section>
        </MotionReveal>

        <div className="border-t border-[#22303D]">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-[#9BA7B4] sm:flex-row sm:items-center sm:justify-between">
            <span>© یوفوپاف | UFO Puff</span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={16} aria-hidden="true" />
              فروش فقط برای افراد بالای ۱۸ سال
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
