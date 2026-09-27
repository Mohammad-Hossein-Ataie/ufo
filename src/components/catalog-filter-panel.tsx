"use client";

import { useState, type ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";

export function CatalogFilterPanel({
  children,
  activeCount,
  className = "",
}: {
  children: ReactNode;
  activeCount: number;
  className?: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={mobileOpen}
        aria-controls="catalog-filters"
        onClick={() => setMobileOpen((open) => !open)}
        className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-retail-accent/35 bg-retail-accent/10 px-4 font-black text-white transition hover:border-retail-accent lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal size={19} className="text-retail-accent" aria-hidden="true" />
          فیلتر و مرتب‌سازی
        </span>
        <span className="rounded-full bg-retail-accent/15 px-2.5 py-1 text-xs text-retail-accent">
          {activeCount > 0 ? `${new Intl.NumberFormat("fa-IR").format(activeCount)} فیلتر فعال` : "نمایش گزینه‌ها"}
        </span>
      </button>
      <aside
        id="catalog-filters"
        onSubmitCapture={() => setMobileOpen(false)}
        className={`${mobileOpen ? "block" : "hidden"} ${className}`}
      >
        {children}
      </aside>
    </>
  );
}
