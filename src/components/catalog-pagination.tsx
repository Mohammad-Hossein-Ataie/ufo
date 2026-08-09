import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CatalogPaginationProps {
  currentPage: number;
  totalPages: number;
  makeHref: (page: number) => string;
  tone?: "dark" | "light";
}

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function CatalogPagination({
  currentPage,
  totalPages,
  makeHref,
  tone = "dark",
}: CatalogPaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter((page) => {
    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
  });
  const linkClass =
    tone === "dark"
      ? "border-retail-border bg-retail-surface text-white hover:bg-white/10 focus-visible:outline-retail-accent"
      : "border-[#D5D9C9] bg-white text-[#14201B] hover:bg-[#F7F7F2] focus-visible:outline-[#1F8A5B]";
  const activeClass =
    tone === "dark"
      ? "border-retail-accent bg-retail-accent text-retail-bg"
      : "border-[#1F8A5B] bg-[#1F8A5B] text-white";

  return (
    <nav
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
      aria-label="صفحه‌بندی محصولات"
    >
      <Link
        href={makeHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className={cx(
          "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          linkClass,
          currentPage === 1 && "pointer-events-none opacity-45",
        )}
      >
        <ArrowRight size={16} aria-hidden="true" />
        قبلی
      </Link>
      {pages.map((page, index) => {
        const previous = pages[index - 1];
        return (
          <span key={page} className="inline-flex items-center gap-2">
            {previous && page - previous > 1 ? (
              <span className={tone === "dark" ? "text-retail-secondary" : "text-[#596B61]"}>
                ...
              </span>
            ) : null}
            <Link
              href={makeHref(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={cx(
                "inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                page === currentPage ? activeClass : linkClass,
              )}
            >
              {new Intl.NumberFormat("fa-IR").format(page)}
            </Link>
          </span>
        );
      })}
      <Link
        href={makeHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className={cx(
          "inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          linkClass,
          currentPage === totalPages && "pointer-events-none opacity-45",
        )}
      >
        بعدی
        <ArrowLeft size={16} aria-hidden="true" />
      </Link>
    </nav>
  );
}
