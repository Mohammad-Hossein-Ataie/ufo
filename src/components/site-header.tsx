"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Home, Info, Menu, PackageSearch, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { Button, IconButton } from "@ufo/ui";

interface CartLine {
  variantId: string;
  quantity: number;
  channel: "retail" | "wholesale";
}

const navItems = [
  { href: "/", label: "خانه" },
  { href: "/products", label: "محصولات" },
  { href: "/store/tehran-molavi", label: "درباره ما" },
  { href: "/blog", label: "راهنما" },
];

function readRetailCartCount() {
  const raw =
    window.localStorage.getItem("ufo-retail-cart") ?? window.localStorage.getItem("ufo-cart");
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum, item) => {
      const line = item as Partial<CartLine>;
      if (line.channel !== "retail" || typeof line.quantity !== "number") return sum;
      return sum + line.quantity;
    }, 0);
  } catch {
    return 0;
  }
}

function isLoggedIn() {
  return Boolean(window.localStorage.getItem("ufo-retail-session"));
}

export function SiteHeader() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      setCartCount(readRetailCartCount());
      setLoggedIn(isLoggedIn());
    };
    sync();
    window.addEventListener("ufo-cart-updated", sync);
    window.addEventListener("ufo-retail-cart-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("ufo-cart-updated", sync);
      window.removeEventListener("ufo-retail-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const cartHref = loggedIn ? "/cart" : "/login?next=/cart";
  const accountHref = loggedIn ? "/cart" : "/login";
  const accountLabel = loggedIn ? "حساب و سبد خرید" : "ورود";
  const formattedCount = useMemo(
    () => new Intl.NumberFormat("fa-IR").format(cartCount),
    [cartCount],
  );

  return (
    <header className="sticky top-0 z-30 border-b border-[#22303D] bg-[#05070B]/92 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-normal">
          <span className="relative h-10 w-10 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="لوگوی یوفوپاف UFO Puff"
              fill
              sizes="40px"
              className="object-contain"
              priority
              unoptimized
            />
          </span>
          <span className="leading-tight">
            <span className="block text-white">یوفوپاف</span>
            <span className="block text-xs text-retail-secondary" dir="ltr">
              UFO Puff
            </span>
          </span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                  isActive ? "bg-white/10 text-white" : "text-[#D9E2EC] hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="جستجو" className="hidden sm:inline-flex">
            <IconButton label="جستجو">
              <Search size={18} aria-hidden="true" />
            </IconButton>
          </Link>
          <Link href={cartHref} aria-label="سبد خرید" className="relative">
            <IconButton label={loggedIn ? "سبد خرید" : "ورود برای مشاهده سبد خرید"}>
              <ShoppingCart size={18} aria-hidden="true" />
            </IconButton>
            {cartCount > 0 ? (
              <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-retail-accent-2 px-1 text-[11px] font-black tabular-nums text-retail-bg ring-2 ring-retail-bg">
                {formattedCount}
              </span>
            ) : null}
          </Link>
          <Link href={accountHref} aria-label={accountLabel} className="hidden sm:inline-flex">
            <IconButton label={accountLabel}>
              <UserRound size={18} aria-hidden="true" />
            </IconButton>
          </Link>
          <Link href="/products" className="hidden sm:inline-flex">
            <Button size="sm">
              <PackageSearch size={17} aria-hidden="true" />
              کاتالوگ
            </Button>
          </Link>
          <IconButton
            label={menuOpen ? "بستن منو" : "باز کردن منو"}
            className="lg:hidden"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </IconButton>
        </div>
      </div>

      {menuOpen ? (
        <div className="border-t border-retail-border bg-retail-surface lg:hidden">
          <nav aria-label="منوی موبایل" className="mx-auto grid max-w-7xl gap-2 px-4 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#D9E2EC] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
              >
                {item.href === "/" ? <Home size={18} aria-hidden="true" /> : null}
                {item.href === "/store/tehran-molavi" ? (
                  <Info size={18} aria-hidden="true" />
                ) : null}
                {item.href === "/products" ? <PackageSearch size={18} aria-hidden="true" /> : null}
                {item.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2 border-t border-retail-border pt-3">
              <Link href={cartHref}>
                <Button variant="ghost" className="relative w-full border-retail-border bg-white/5">
                  <ShoppingCart size={18} aria-hidden="true" />
                  سبد خرید
                  {cartCount > 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-retail-accent-2 px-1.5 text-[11px] font-black text-retail-bg">
                      {formattedCount}
                    </span>
                  ) : null}
                </Button>
              </Link>
              <Link href={accountHref}>
                <Button variant="ghost" className="w-full border-retail-border bg-white/5">
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
