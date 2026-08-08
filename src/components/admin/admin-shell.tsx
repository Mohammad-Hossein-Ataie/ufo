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
    <div className="min-h-screen overflow-x-hidden bg-[#F4F6F8] text-[#17202A] lg:grid lg:grid-cols-[17rem_1fr]">
      <aside className="border-b border-[#D7DDE4] bg-white shadow-sm lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-l">
        <div className="flex min-h-16 items-center gap-2 border-b border-[#EEF3F8] px-4 text-xl font-black">
          <span className="relative h-10 w-10 shrink-0">
            <Image
              src="/logos/logo.png"
              alt="پنل مدیریت یوفوپاف"
              fill
              sizes="40px"
              className="object-contain"
              priority
              unoptimized
            />
          </span>
          <span>
            <span className="block leading-5">یوفوپاف</span>
            <span className="block text-xs font-bold text-[#5F6C79]" dir="ltr">
              Admin
            </span>
          </span>
        </div>
        <nav className="grid gap-1 p-3" aria-label="ناوبری مدیریت">
          {modules.map((item) => {
            const isActive =
              item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 items-center gap-2 rounded-md px-3 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#168BFF] ${
                  isActive ? "bg-[#E8F3FF] text-[#0B5CAD]" : "text-[#344054] hover:bg-[#EEF3F8]"
                }`}
              >
                <item.icon size={18} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div>
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-[#D7DDE4] bg-[#F4F6F8]/95 px-4 backdrop-blur">
          <div>
            <p className="font-bold">پنل مدیریت یوفوپاف</p>
            <p className="hidden text-xs text-[#5F6C79] sm:block">
              فروش تکی، عمده، موجودی و پشتیبانی
            </p>
          </div>
          <AdminLogoutButton />
        </header>
        {children}
      </div>
    </div>
  );
}
