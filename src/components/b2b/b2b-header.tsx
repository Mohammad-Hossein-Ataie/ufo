import Image from "next/image";
import Link from "next/link";
import { ClipboardList, PackageSearch, UserRound } from "lucide-react";
import { Button, IconButton } from "@ufo/ui";

const navItems = [
  { href: "/b2b/catalog", label: "کاتالوگ" },
  { href: "/b2b/quick-order", label: "سفارش سریع" },
  { href: "/b2b/orders", label: "سفارش‌ها" },
  { href: "/b2b/account", label: "حساب همکاری" },
];

export function B2BHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[#D5D9C9] bg-[#F7F7F2]/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4">
        <Link href="/b2b" className="flex items-center gap-2 font-black">
          <span className="relative h-10 w-10 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="UFO Puff B2B"
              fill
              sizes="40px"
              className="object-contain"
              priority
              unoptimized
            />
          </span>
          UFO Puff B2B
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="ناوبری عمده">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm hover:bg-[#E7E7DC] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F8A5B]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/b2b/quick-order">
            <IconButton label="سفارش سریع" className="border-[#D5D9C9] bg-white text-[#14201B]">
              <ClipboardList size={18} />
            </IconButton>
          </Link>
          <Link href="/b2b/login">
            <IconButton label="ورود عمده" className="border-[#D5D9C9] bg-white text-[#14201B]">
              <UserRound size={18} />
            </IconButton>
          </Link>
          <Link href="/b2b/catalog" className="hidden sm:inline-flex">
            <Button
              size="sm"
              className="border-[#1F8A5B] bg-[#1F8A5B] text-white hover:bg-[#176D48]"
            >
              <PackageSearch size={17} />
              کاتالوگ عمده
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
