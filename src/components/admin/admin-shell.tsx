"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  ChevronLeft,
  FileText,
  Gauge,
  MessageSquare,
  Package,
  Search,
  Settings,
  UploadCloud,
} from "lucide-react";
import { cn } from "@ufo/ui";
import { AdminLogoutButton } from "./admin-logout-button";

const groups = [
  {
    title: "عملیات",
    items: [
      { href: "/admin", label: "داشبورد", icon: Gauge },
      { href: "/admin/orders", label: "سفارش‌ها", icon: FileText },
      { href: "/admin/inventory", label: "موجودی", icon: Boxes },
      { href: "/admin/chat", label: "پشتیبانی", icon: MessageSquare },
    ],
  },
  {
    title: "کاتالوگ",
    items: [{ href: "/admin/products", label: "محصولات", icon: Package }],
  },
  {
    title: "زیرساخت",
    items: [
      { href: "/admin/storage", label: "رسانه‌ها", icon: UploadCloud },
      { href: "/admin/seo", label: "SEO", icon: Search },
      { href: "/admin/settings", label: "تنظیمات", icon: Settings },
    ],
  },
];

function isActivePath(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return <>{children}</>;

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-950 lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="border-b border-slate-200 bg-white lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-l">
        <div className="flex min-h-16 items-center gap-3 border-b border-slate-100 px-4">
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
          <span className="min-w-0">
            <span className="block truncate text-lg font-black leading-6">یوفوپاف</span>
            <span className="block text-xs font-bold text-slate-500" dir="ltr">
              Operations Admin
            </span>
          </span>
        </div>

        <nav className="grid gap-5 p-3" aria-label="ناوبری مدیریت">
          {groups.map((group) => (
            <div key={group.title} className="grid gap-1">
              <p className="px-3 py-1 text-[11px] font-black uppercase tracking-normal text-slate-400">
                {group.title}
              </p>
              {group.items.map((item) => {
                const active = isActivePath(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex min-h-10 items-center justify-between gap-2 rounded-md px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-500",
                      active
                        ? "bg-cyan-50 text-cyan-800"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <item.icon size={17} aria-hidden="true" />
                      {item.label}
                    </span>
                    {active ? <ChevronLeft size={15} aria-hidden="true" /> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between border-b border-slate-200 bg-slate-100/95 px-4 backdrop-blur">
          <div className="min-w-0">
            <p className="truncate text-sm font-black">پنل مدیریت یوفوپاف</p>
            <p className="hidden text-xs text-slate-500 sm:block">
              سفارش، موجودی، کاتالوگ و پشتیبانی در یک مسیر کاری
            </p>
          </div>
          <AdminLogoutButton />
        </header>
        {children}
      </div>
    </div>
  );
}
