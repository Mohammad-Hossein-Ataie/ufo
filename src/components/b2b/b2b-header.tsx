"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Home,
  Info,
  Menu,
  PackageSearch,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";
import { Button, IconButton } from "@ufo/ui";

interface CartLine {
  variantId: string;
  quantity: number;
  cartonCount: number;
  channel: "wholesale";
}

const navItems = [
  { href: "/b2b", label: "خانه" },
  { href: "/b2b/catalog", label: "کاتالوگ" },
  { href: "/b2b/quick-order", label: "سفارش سریع" },
  { href: "/b2b/about", label: "درباره همکاری" },
];

function readB2BCartCount() {
  const raw =
    window.localStorage.getItem("ufo-b2b-cart") ?? window.localStorage.getItem("ufo-cart");
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum, item) => {
      const line = item as Partial<CartLine>;
      if (line.channel !== "wholesale" || typeof line.cartonCount !== "number") return sum;
      return sum + line.cartonCount;
    }, 0);
  } catch {
    return 0;
  }
}

function isLoggedIn() {
  return Boolean(window.localStorage.getItem("ufo-b2b-session"));
}

export function B2BHeader() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const formattedCount = useMemo(
    () => new Intl.NumberFormat("fa-IR").format(cartCount),
    [cartCount],
  );

  useEffect(() => {
    const sync = () => {
      setCartCount(readB2BCartCount());
      setLoggedIn(isLoggedIn());
    };
    sync();
    window.addEventListener("ufo-b2b-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ufo-b2b-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const cartHref = loggedIn ? "/b2b/cart" : "/b2b/login?next=/b2b/cart";
  const accountHref = loggedIn ? "/b2b/account" : "/b2b/login";
  const accountLabel = loggedIn ? "حساب همکاری" : "ورود عمده";

  return (
    <header className="sticky top-0 z-30 border-b border-[#D5D9C9] bg-[#F7F7F2]/95 text-[#14201B] backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/b2b" className="flex items-center gap-2 font-black">
          <span className="relative h-10 w-10 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="لوگوی یوفوپاف عمده UFO Puff B2B"
              fill
              sizes="40px"
              className="object-contain"
              priority
              unoptimized
            />
          </span>
          <span className="leading-tight">
            <span className="block">یوفوپاف عمده</span>
            <span className="block text-xs text-[#596B61]" dir="ltr">
              UFO Puff B2B
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="ناوبری عمده">
          {navItems.map((item) => {
            const isActive =
              item.href === "/b2b" ? pathname === "/b2b" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F8A5B] ${
                  isActive ? "bg-[#E7E7DC] text-[#14201B]" : "text-[#405148] hover:bg-[#E7E7DC]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/b2b/quick-order" className="hidden sm:inline-flex">
            <IconButton label="سفارش سریع" className="border-[#D5D9C9] bg-white text-[#14201B]">
              <ClipboardList size={18} aria-hidden="true" />
            </IconButton>
          </Link>
          <Link href={cartHref} aria-label="سبد خرید عمده" className="relative">
            <IconButton
              label={loggedIn ? "سبد خرید عمده" : "ورود برای مشاهده سبد عمده"}
              className="border-[#D5D9C9] bg-white text-[#14201B]"
            >
              <ShoppingCart size={18} aria-hidden="true" />
            </IconButton>
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#20F28B] px-1 text-[11px] font-black tabular-nums text-[#14201B] ring-2 ring-[#F7F7F2]">
                {formattedCount}
              </span>
            ) : null}
          </Link>
          <Link href={accountHref} className="hidden sm:inline-flex">
            <IconButton label={accountLabel} className="border-[#D5D9C9] bg-white text-[#14201B]">
              <UserRound size={18} aria-hidden="true" />
            </IconButton>
          </Link>
          <Link href="/b2b/catalog" className="hidden sm:inline-flex">
            <Button
              size="sm"
              className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
            >
              <PackageSearch size={17} aria-hidden="true" />
              کاتالوگ عمده
            </Button>
          </Link>
          <IconButton
            label={menuOpen ? "بستن منو" : "باز کردن منو"}
            className="border-[#D5D9C9] bg-white text-[#14201B] lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </IconButton>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-[#D5D9C9] bg-white lg:hidden">
          <nav aria-label="منوی موبایل عمده" className="mx-auto grid max-w-7xl gap-2 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#405148] transition hover:bg-[#EEF0E5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F8A5B]"
              >
                {item.href === "/b2b" ? <Home size={18} aria-hidden="true" /> : null}
                {item.href === "/b2b/catalog" ? (
                  <PackageSearch size={18} aria-hidden="true" />
                ) : null}
                {item.href === "/b2b/quick-order" ? (
                  <ClipboardList size={18} aria-hidden="true" />
                ) : null}
                {item.href === "/b2b/about" ? <Info size={18} aria-hidden="true" /> : null}
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-[#D5D9C9] pt-3">
              <Link href={cartHref}>
                <Button variant="ghost" className="relative w-full border-[#D5D9C9] bg-[#F7F7F2]">
                  <ShoppingCart size={18} aria-hidden="true" />
                  سبد عمده
                  {cartCount > 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-[#20F28B] px-1.5 text-[11px] font-black text-[#14201B]">
                      {formattedCount}
                    </span>
                  ) : null}
                </Button>
              </Link>
              <Link href={accountHref}>
                <Button variant="ghost" className="w-full border-[#D5D9C9] bg-[#F7F7F2]">
                  <UserRound size={18} aria-hidden="true" />
                  {accountLabel}
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
