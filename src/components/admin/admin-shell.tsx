"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FileText,
  Gauge,
  MessageSquare,
  Package,
  Search,
  Settings,
  UploadCloud,
} from "lucide-react";
import { AdminLogoutButton } from "./admin-logout-button";

const modules = [
  { href: "/admin", label: "داشبورد", icon: Gauge },
  { href: "/admin/products", label: "محصولات", icon: Package },
  { href: "/admin/inventory", label: "موجودی", icon: Boxes },
  { href: "/admin/orders", label: "سفارش‌ها", icon: FileText },
  { href: "/admin/chat", label: "چت", icon: MessageSquare },
  { href: "/admin/seo", label: "SEO", icon: Search },
  { href: "/admin/storage", label: "Storage", icon: UploadCloud },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#17202A] lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-[#D7DDE4] bg-white lg:border-b-0 lg:border-l">
        <div className="flex min-h-16 items-center gap-2 px-4 text-xl font-black">
          <span className="relative h-10 w-10 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="UFO Puff Admin"
              fill
              sizes="40px"
              className="object-contain"
              priority
              unoptimized
            />
          </span>
          UFO Admin
        </div>
        <nav className="grid gap-1 p-3" aria-label="ناوبری مدیریت">
          {modules.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm hover:bg-[#EEF3F8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168BFF]"
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div>
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[#D7DDE4] bg-[#F4F6F8]/95 px-4 backdrop-blur">
          <p className="font-bold">پنل مدیریت مشترک</p>
          <AdminLogoutButton />
        </header>
        {children}
      </div>
    </div>
  );
}
