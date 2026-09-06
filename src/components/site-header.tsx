"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BookOpenText,
  Home,
  Info,
  Menu,
  PackageSearch,
  Search,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { Button, IconButton } from "@ufo/ui";
import { SmartSearch } from "@/components/smart-search";
import { fetchCustomerCart, readCustomerSession } from "@/lib/customer-client";

interface CartLine {
  variantId: string;
  quantity: number;
  channel: "retail" | "wholesale";
}

const navItems = [
  { href: "/", label: "خانه", icon: Home },
  { href: "/products", label: "محصولات", icon: PackageSearch },
  { href: "/store/tehran-molavi", label: "درباره ما", icon: Info },
  { href: "/blog", label: "راهنمای خرید", icon: BookOpenText },
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
      return line.channel === "retail" && typeof line.quantity === "number"
        ? sum + line.quantity
        : sum;
    }, 0);
  } catch {
    return 0;
  }
}

function usePageLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const overflow = document.body.style.overflow;
    const paddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = paddingRight;
    };
  }, [locked]);
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="cart-count-pop absolute -left-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-retail-accent-2 px-1 text-[10px] font-black tabular-nums text-retail-bg ring-2 ring-retail-bg">
      {new Intl.NumberFormat("fa-IR").format(count)}
    </span>
  );
}

function EmptyCartSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  usePageLock(open);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose, open]);

  return (
    <div
      className={`fixed inset-0 z-[70] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="بستن سبد خرید"
        onClick={onClose}
        className={`absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300 ease-mobile ${open ? "opacity-100" : "opacity-0"}`}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="empty-cart-title"
        className={`absolute inset-x-0 bottom-0 mx-auto max-w-xl rounded-t-[28px] border border-retail-border bg-[#0b1016]/98 px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-24px_80px_rgba(0,0,0,.65)] transition-transform duration-300 ease-mobile ${open ? "translate-y-0" : "translate-y-full"}`}
      >
        <div className="mx-auto mb-5 h-1 w-12 rounded-full bg-white/20" />
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute left-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-retail-secondary transition hover:bg-white/10 hover:text-white"
        >
          <X size={20} aria-hidden="true" />
        </button>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-retail-accent/25 bg-retail-accent/10 text-retail-accent shadow-[0_0_30px_rgba(0,217,255,.12)]">
          <ShoppingBag size={30} aria-hidden="true" />
        </div>
        <div className="mt-5 text-center">
          <h2 id="empty-cart-title" className="text-xl font-black text-white">
            سبد خرید شما خالی است
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-retail-secondary">
            بین محصولات یوفوپاف بگردید و انتخاب بعدی‌تان را به سبد اضافه کنید.
          </p>
        </div>
        <Link
          href="/products"
          onClick={onClose}
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-retail-accent px-4 font-black text-retail-bg shadow-[0_12px_36px_rgba(0,217,255,.2)] transition hover:bg-retail-accent-hover"
        >
          مشاهده محصولات
          <PackageSearch size={19} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emptyCartOpen, setEmptyCartOpen] = useState(false);

  useEffect(() => {
    const sync = async () => {
      const session = readCustomerSession("retail");
      setLoggedIn(Boolean(session));
      if (session) {
        const cart = await fetchCustomerCart("retail");
        setCartCount(cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0);
      } else {
        setCartCount(readRetailCartCount());
      }
    };
    void sync();
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
    setEmptyCartOpen(false);
  }, [pathname]);
  usePageLock(menuOpen);
  useEffect(() => {
    if (!menuOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [menuOpen]);

  const accountHref = loggedIn ? "/account" : "/login";
  const openCart = useCallback(() => {
    if (cartCount === 0) setEmptyCartOpen(true);
    else window.location.assign("/cart");
  }, [cartCount]);

  return (
    <>
      <header className="retail-header sticky top-0 z-40 border-b border-retail-border bg-[#05070B]/88 backdrop-blur-xl">
        <div className="relative mx-auto flex h-[60px] max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-4">
          <div className="flex items-center gap-1 lg:hidden">
            <IconButton
              label="باز کردن منو"
              className="border-transparent bg-transparent"
              onClick={() => setMenuOpen(true)}
            >
              <Menu size={22} aria-hidden="true" />
            </IconButton>
            <Link href="/search" aria-label="جستجو" className="inline-flex">
              <IconButton label="جستجو" className="border-transparent bg-transparent">
                <Search size={21} aria-hidden="true" />
              </IconButton>
            </Link>
          </div>
          <Link
            href="/"
            aria-label="یوفوپاف، صفحه خانه"
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 lg:static lg:translate-x-0 lg:translate-y-0"
          >
            <span className="relative h-11 w-11 shrink-0 sm:h-12 sm:w-12">
              <Image
                src="/logos/logo.png"
                alt="UFO Puff"
                fill
                sizes="48px"
                className="object-contain"
                priority
                unoptimized
              />
            </span>
            <span className="hidden leading-tight lg:block">
              <span className="block font-black text-white">یوفوپاف</span>
              <span className="block text-[11px] tracking-[0.16em] text-retail-secondary" dir="ltr">
                UFO PUFF
              </span>
            </span>
          </Link>
          <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white/10 text-white" : "text-retail-secondary hover:bg-white/5 hover:text-white"}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <SmartSearch
            channel="retail"
            className="hidden flex-1 md:block lg:max-w-md xl:max-w-xl"
          />
          <div className="flex items-center gap-1">
            <Link
              href={accountHref}
              aria-label={loggedIn ? "حساب کاربری" : "ورود"}
              className="inline-flex"
            >
              <IconButton
                label={loggedIn ? "حساب کاربری" : "ورود"}
                className="border-transparent bg-transparent lg:border-white/15 lg:bg-white/5"
              >
                <UserRound size={20} aria-hidden="true" />
              </IconButton>
            </Link>
            <button
              type="button"
              onClick={openCart}
              aria-label="سبد خرید"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-retail-accent"
            >
              <ShoppingBag size={21} aria-hidden="true" />
              <CountBadge count={cartCount} />
            </button>
            <Link href="/products" className="hidden lg:inline-flex">
              <Button size="sm">
                <PackageSearch size={17} aria-hidden="true" />
                کاتالوگ
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          aria-label="بستن منو"
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-opacity duration-300 ease-mobile ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="منوی موبایل"
          className={`absolute inset-y-0 right-0 flex w-[min(88vw,24rem)] flex-col border-l border-retail-border bg-[#080c12]/98 shadow-2xl transition-transform duration-300 ease-mobile ${menuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex min-h-20 items-center justify-between border-b border-retail-border px-4 pt-[env(safe-area-inset-top)]">
            <div className="flex items-center gap-3">
              <span className="relative h-11 w-11">
                <Image
                  src="/logos/logo.png"
                  alt="UFO Puff"
                  fill
                  sizes="44px"
                  className="object-contain"
                  unoptimized
                />
              </span>
              <div>
                <p className="font-black text-white">یوفوپاف</p>
                <p className="text-xs text-retail-secondary">فروشگاه تخصصی ویپ</p>
              </div>
            </div>
            <IconButton
              label="بستن منو"
              onClick={() => setMenuOpen(false)}
              className="rounded-full"
            >
              <X size={20} aria-hidden="true" />
            </IconButton>
          </div>
          <div className="px-4 pt-5">
            <SmartSearch channel="retail" />
          </div>
          <nav className="grid gap-2 px-4 py-5" aria-label="منوی موبایل">
            {navItems.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-14 items-center gap-4 rounded-xl px-4 font-bold transition ${active ? "border border-retail-accent/30 bg-retail-accent/10 text-retail-accent" : "text-[#dce5ed] hover:bg-white/5"}`}
                >
                  <item.icon size={21} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t border-retail-border p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <Link
              href={accountHref}
              className="flex min-h-14 items-center justify-between rounded-xl bg-white/5 px-4"
            >
              <span className="flex items-center gap-3">
                <UserRound size={21} aria-hidden="true" />
                <span className="font-bold">{loggedIn ? "حساب کاربری" : "ورود یا ثبت‌نام"}</span>
              </span>
              <span className="text-xs text-retail-secondary">
                {loggedIn ? "مشاهده" : "با شماره موبایل"}
              </span>
            </Link>
          </div>
        </aside>
      </div>

      <nav
        aria-label="دسترسی سریع موبایل"
        className="mobile-bottom-nav fixed inset-x-0 bottom-0 z-50 grid grid-cols-4 border-t border-white/10 bg-[#090d13]/94 px-2 pt-1.5 backdrop-blur-xl lg:hidden"
      >
        {[
          { href: "/", label: "خانه", icon: Home },
          { href: "/products", label: "محصولات", icon: PackageSearch },
        ].map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-item ${active ? "text-retail-accent" : "text-retail-secondary"}`}
            >
              <item.icon size={21} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={openCart}
          className={`mobile-bottom-item relative ${pathname.startsWith("/cart") ? "text-retail-accent" : "text-retail-secondary"}`}
        >
          <span className="relative">
            <ShoppingBag size={21} aria-hidden="true" />
            <CountBadge count={cartCount} />
          </span>
          <span>سبد خرید</span>
        </button>
        <Link
          href={accountHref}
          className={`mobile-bottom-item ${pathname.startsWith("/account") || pathname.startsWith("/login") ? "text-retail-accent" : "text-retail-secondary"}`}
        >
          <UserRound size={21} aria-hidden="true" />
          <span>حساب کاربری</span>
        </Link>
      </nav>

      <EmptyCartSheet open={emptyCartOpen} onClose={() => setEmptyCartOpen(false)} />
      <span className="sr-only" aria-live="polite">
        {new Intl.NumberFormat("fa-IR").format(cartCount)} کالا در سبد خرید
      </span>
    </>
  );
}
