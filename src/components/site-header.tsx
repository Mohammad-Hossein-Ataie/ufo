import Image from "next/image";
import Link from "next/link";
import { PackageSearch, Search, ShoppingCart, UserRound } from "lucide-react";
import { Button, IconButton } from "@ufo/ui";

const navItems = [
  { href: "/products", label: "محصولات" },
  { href: "/store/tehran-molavi", label: "فروشگاه مولوی" },
  { href: "/orders", label: "سفارش‌ها" },
  { href: "/blog", label: "راهنما" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#22303D] bg-[#05070B]/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-normal">
          <span className="relative h-10 w-10 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="UFO Puff"
              fill
              sizes="40px"
              className="object-contain"
              priority
              unoptimized
            />
          </span>
          <span>UFO Puff</span>
        </Link>
        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm text-[#D9E2EC] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/search" aria-label="جستجو">
            <IconButton label="جستجو">
              <Search size={18} />
            </IconButton>
          </Link>
          <Link href="/cart" aria-label="سبد خرید">
            <IconButton label="سبد خرید">
              <ShoppingCart size={18} />
            </IconButton>
          </Link>
          <Link href="/login" aria-label="ورود">
            <IconButton label="ورود">
              <UserRound size={18} />
            </IconButton>
          </Link>
          <Link href="/products" className="hidden sm:inline-flex">
            <Button size="sm">
              <PackageSearch size={17} />
              کاتالوگ
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
