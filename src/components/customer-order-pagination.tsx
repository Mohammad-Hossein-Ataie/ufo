"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { OrderPaginationData } from "@/lib/order-presentation";

export function CustomerOrderPagination({
  pagination,
  onPageChange,
  disabled = false,
}: {
  pagination: OrderPaginationData;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (pagination.pageCount <= 1) return null;

  const { page, pageCount } = pagination;

  const visiblePages = Array.from(
    new Set(
      [1, page - 1, page, page + 1, pageCount].filter(
        (value) => value >= 1 && value <= pageCount,
      ),
    ),
  ).sort((a, b) => a - b);

  return (
    <nav
      aria-label="صفحه‌بندی سفارش‌ها"
      className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--retail-border)] pt-5"
    >
      <p className="text-sm text-[var(--retail-text-secondary)]">
        صفحه {page.toLocaleString("fa-IR")} از{" "}
        {pageCount.toLocaleString("fa-IR")}
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          disabled={disabled || page === 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="صفحه قبل"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--retail-border)] text-sm hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-40"
        >
          <ChevronRight size={17} />
        </button>

        {visiblePages.map((value, index) => {
          const previousPage =
            index > 0 ? visiblePages[index - 1] : undefined;

          const shouldShowEllipsis =
            previousPage !== undefined && value - previousPage > 1;

          return (
            <span key={value} className="flex items-center gap-1.5">
              {shouldShowEllipsis ? (
                <span
                  aria-hidden="true"
                  className="px-1 text-[var(--retail-text-secondary)]"
                >
                  …
                </span>
              ) : null}

              <button
                type="button"
                disabled={disabled}
                onClick={() => onPageChange(value)}
                aria-label={`صفحه ${value.toLocaleString("fa-IR")}`}
                aria-current={value === page ? "page" : undefined}
                className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 ${
                  value === page
                    ? "border-cyan-300 bg-cyan-300 text-slate-950"
                    : "border-[var(--retail-border)] hover:border-cyan-300"
                }`}
              >
                {value.toLocaleString("fa-IR")}
              </button>
            </span>
          );
        })}

        <button
          type="button"
          disabled={disabled || page === pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="صفحه بعد"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--retail-border)] text-sm hover:border-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300 disabled:opacity-40"
        >
          <ChevronLeft size={17} />
        </button>
      </div>
    </nav>
  );
}
