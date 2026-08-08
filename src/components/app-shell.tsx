"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3, MapPin, MessageCircle, Phone, Send, ShieldCheck, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { B2BHeader } from "@/components/b2b/b2b-header";
import { SiteHeader } from "@/components/site-header";
import { storeSettings } from "@ufo/domain";

const retailFooterLinks = [
  { href: "/products", label: "محصولات", icon: ShoppingBag },
  { href: "/cart", label: "سبد خرید", icon: Clock3 },
  { href: "/login", label: "حساب مشتری", icon: ShieldCheck },
  { href: "/store/tehran-molavi", label: "درباره یوفوپاف", icon: MessageCircle },
];

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
      <div className="min-h-screen bg-[#F7F7F2] text-[#14201B]">
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
      <footer className="border-t border-[#22303D] bg-[#0D1117] text-[#D9E2EC]">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.2fr_1fr_1fr]">
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
                className="inline-flex min-h-9 items-center gap-2 text-sm text-[#9BA7B4] transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                <item.icon size={17} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <section aria-label="ارتباط با فروشگاه" className="grid content-start gap-3">
            <h2 className="text-sm font-bold text-white">ارتباط با فروشگاه</h2>
            <a
              href={`tel:${storeSettings.phone}`}
              className="inline-flex min-h-9 items-center gap-2 text-sm text-[#9BA7B4] transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <Phone size={17} aria-hidden="true" />
              <span>{storeSettings.phone}</span>
            </a>
            <p className="inline-flex items-start gap-2 text-sm leading-7 text-[#9BA7B4]">
              <MapPin size={17} aria-hidden="true" className="mt-1 shrink-0" />
              <span>{storeSettings.address}</span>
            </p>
            <a
              href={storeSettings.telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-2 text-sm text-[#9BA7B4] transition hover:text-cyan-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              <Send size={17} aria-hidden="true" />
              <span>تلگرام فروشگاه</span>
            </a>
          </section>
        </div>

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
