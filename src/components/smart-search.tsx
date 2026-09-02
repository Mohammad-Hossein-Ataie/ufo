"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ArrowLeft, Boxes, Loader2, PackageSearch, Search, Store, X } from "lucide-react";
import { cn } from "@ufo/ui";
import { StorefrontProductImage } from "@/components/storefront-product-image";

type SearchChannel = "retail" | "wholesale";

interface SearchProduct {
  id: string;
  title: string;
  subtitle: string;
  brand: string;
  category: string;
  sku: string;
  href: string;
  image: string;
  fallbackImage: string;
  priceRial: number;
  compareAtPriceRial: number | null;
  stockCount: number;
  stockLabel: string;
  cartonSize: number | null;
  moq: number | null;
}

interface SearchFacet {
  id: string;
  label: string;
  href: string;
  count: number;
}

interface SearchResponse {
  products: SearchProduct[];
  categories: SearchFacet[];
  brands: SearchFacet[];
}

interface SmartSearchProps {
  channel: SearchChannel;
  className?: string;
  inputClassName?: string;
}

const emptyResponse: SearchResponse = {
  products: [],
  categories: [],
  brands: [],
};

function formatToman(valueRial: number) {
  return `${new Intl.NumberFormat("fa-IR").format(Math.round(valueRial / 10))} تومان`;
}

function highlightText(value: string, query: string) {
  const tokens = query
    .trim()
    .split(/\s+/)
    .map((token) => token.toLowerCase())
    .filter((token) => token.length > 1);
  if (tokens.length === 0) return value;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join("|")})`, "gi");
  return value.split(pattern).map((part, index) =>
    tokens.includes(part.toLowerCase()) ? (
      <mark key={`${part}-${index}`} className="rounded-sm bg-cyan-300/25 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getSearchPath(channel: SearchChannel, query: string) {
  const path = channel === "wholesale" ? "/b2b/catalog" : "/products";
  const trimmed = query.trim();
  return trimmed ? `${path}?q=${encodeURIComponent(trimmed)}` : path;
}

export function SmartSearch({ channel, className, inputClassName }: SmartSearchProps) {
  const router = useRouter();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse>(emptyResponse);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const theme = channel === "wholesale" ? "light" : "dark";
  const allLinks = useMemo(
    () => [
      ...results.products.map((product) => product.href),
      ...results.categories.map((category) => category.href),
      ...results.brands.map((brand) => brand.href),
    ],
    [results],
  );
  const hasResults =
    results.products.length > 0 || results.categories.length > 0 || results.brands.length > 0;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?channel=${channel}&q=${encodeURIComponent(query.trim())}`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Search failed");
        const payload = (await response.json()) as SearchResponse;
        setResults(payload);
        setActiveIndex(-1);
      } catch {
        if (!controller.signal.aborted) {
          setResults(emptyResponse);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 140 : 0);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [channel, open, query]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function submitSearch(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    router.push(getSearchPath(channel, query));
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, allLinks.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }
    if (event.key === "Enter" && activeIndex >= 0 && allLinks[activeIndex]) {
      event.preventDefault();
      router.push(allLinks[activeIndex]);
      setOpen(false);
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div
      ref={wrapperRef}
      className={cn(
        "relative z-40 w-full max-w-2xl focus-within:max-md:fixed focus-within:max-md:inset-0 focus-within:max-md:max-w-none focus-within:max-md:bg-retail-bg focus-within:max-md:p-4",
        theme === "light" && "focus-within:max-md:bg-[#F7F7F2]",
        className,
      )}
      dir="rtl"
    >
      <form onSubmit={submitSearch} role="search" className="relative">
        <Search
          size={18}
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2",
            theme === "dark" ? "text-retail-muted" : "text-[#7A8A80]",
          )}
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={channel === "wholesale" ? "جستجوی کاتالوگ عمده" : "جستجوی محصول، برند یا SKU"}
          className={cn(
            "min-h-11 w-full rounded-md border px-10 py-2 text-sm outline-none transition",
            theme === "dark" &&
              "border-retail-border bg-retail-surface text-white placeholder:text-retail-muted focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30",
            theme === "light" &&
              "border-[#C8D6C7] bg-white text-[#14201B] placeholder:text-[#7A8A80] focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20",
            inputClassName,
          )}
        />
        {query ? (
          <button
            type="button"
            aria-label="پاک کردن جستجو"
            onClick={() => {
              setQuery("");
              setOpen(true);
            }}
            className={cn(
              "absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md transition",
              theme === "dark" ? "text-retail-secondary hover:bg-white/10" : "text-[#596B61] hover:bg-[#EEF0E5]",
            )}
          >
            <X size={16} aria-hidden="true" />
          </button>
        ) : null}
      </form>

      {open ? (
        <div
          className={cn(
            "absolute right-0 top-[calc(100%+0.5rem)] max-h-[min(72vh,34rem)] w-full overflow-y-auto rounded-md border p-2 shadow-2xl max-md:static max-md:mt-3 max-md:max-h-[calc(100vh-5.5rem)]",
            theme === "dark"
              ? "border-retail-border bg-[#0B1118] text-retail-primary shadow-black/50"
              : "border-[#D5D9C9] bg-white text-[#14201B] shadow-[#14201B]/15",
          )}
        >
          <button
            type="button"
            onClick={() => submitSearch()}
            className={cn(
              "mb-2 flex min-h-11 w-full items-center justify-between gap-3 rounded-md px-3 text-sm font-bold transition",
              activeIndex === -1
                ? theme === "dark"
                  ? "bg-white/10"
                  : "bg-[#EEF0E5]"
                : theme === "dark"
                  ? "hover:bg-white/10"
                  : "hover:bg-[#EEF0E5]",
            )}
          >
            <span className="inline-flex min-w-0 items-center gap-2">
              <Search size={17} aria-hidden="true" />
              <span className="truncate">
                {query.trim() ? `جستجو: ${query.trim()}` : "مشاهده همه محصولات"}
              </span>
            </span>
            <ArrowLeft size={16} aria-hidden="true" />
          </button>

          {loading ? (
            <div className="grid gap-2 p-2" aria-live="polite">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex min-h-20 items-center gap-3 rounded-md px-2">
                  <div className="h-14 w-14 shrink-0 animate-pulse rounded-md bg-current/10" />
                  <div className="grid flex-1 gap-2">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-current/10" />
                    <div className="h-3 w-full animate-pulse rounded bg-current/10" />
                  </div>
                </div>
              ))}
            </div>
          ) : hasResults ? (
            <div className="grid gap-3">
              {results.products.length > 0 ? (
                <section aria-label="محصولات" className="grid gap-1">
                  <div className="flex items-center gap-2 px-2 py-1 text-xs font-black text-current/65">
                    <PackageSearch size={15} aria-hidden="true" />
                    محصولات
                  </div>
                  {results.products.map((product, index) => (
                    <Link
                      key={product.id}
                      href={product.href}
                      data-search-product="true"
                      data-search-channel={channel}
                      data-has-price={product.priceRial > 0 ? "true" : "false"}
                      data-has-wholesale-meta={
                        channel === "wholesale" && product.moq && product.cartonSize ? "true" : "false"
                      }
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex min-h-24 items-center gap-3 rounded-md p-2 transition",
                        activeIndex === index
                          ? theme === "dark"
                            ? "bg-white/10"
                            : "bg-[#EEF0E5]"
                          : theme === "dark"
                            ? "hover:bg-white/10"
                            : "hover:bg-[#EEF0E5]",
                      )}
                    >
                      <span
                        className={cn(
                          "relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-white",
                          theme === "dark" ? "border-retail-border" : "border-[#D5D9C9]",
                        )}
                      >
                        <StorefrontProductImage
                          src={product.image}
                          fallbackSrc={product.fallbackImage}
                          alt={product.title}
                          sizes="64px"
                          className="h-full w-full object-contain p-1.5"
                        />
                      </span>
                      <span className="grid min-w-0 flex-1 gap-1">
                        <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="min-w-0 flex-1 truncate text-sm font-black">
                            {highlightText(product.title, query)}
                          </span>
                          <span
                            className={cn(
                              "rounded-md border px-1.5 py-0.5 text-[11px] font-bold",
                              theme === "dark"
                                ? "border-retail-border text-retail-secondary"
                                : "border-[#D5D9C9] text-[#596B61]",
                            )}
                          >
                            {product.stockLabel}
                          </span>
                        </span>
                        <span className="line-clamp-1 text-xs text-current/58">
                          {product.brand} · {product.category} · <span dir="ltr">{product.sku}</span>
                        </span>
                        <span className="line-clamp-2 text-xs leading-5 text-current/52">
                          {highlightText(product.subtitle, query)}
                        </span>
                        <span className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-black tabular-nums">
                            {formatToman(product.priceRial)}
                          </span>
                          {product.compareAtPriceRial ? (
                            <span className="text-xs tabular-nums text-current/45 line-through">
                              {formatToman(product.compareAtPriceRial)}
                            </span>
                          ) : null}
                          {channel === "wholesale" && product.moq && product.cartonSize ? (
                            <span className="text-xs font-bold text-current/60">
                              حداقل {new Intl.NumberFormat("fa-IR").format(product.moq)} کارتن ·{" "}
                              {new Intl.NumberFormat("fa-IR").format(product.cartonSize)} عددی
                            </span>
                          ) : null}
                        </span>
                      </span>
                    </Link>
                  ))}
                </section>
              ) : null}

              <FacetSection
                title="دسته بندی ها"
                icon={<Boxes size={15} aria-hidden="true" />}
                items={results.categories}
                startIndex={results.products.length}
                activeIndex={activeIndex}
                theme={theme}
                onSelect={() => setOpen(false)}
              />
              <FacetSection
                title="برندها"
                icon={<Store size={15} aria-hidden="true" />}
                items={results.brands}
                startIndex={results.products.length + results.categories.length}
                activeIndex={activeIndex}
                theme={theme}
                onSelect={() => setOpen(false)}
              />
            </div>
          ) : (
            <div className="grid min-h-40 place-items-center rounded-md border border-dashed border-current/20 p-5 text-center">
              <div>
                <Loader2 className="mx-auto mb-3 h-5 w-5 text-current/35" aria-hidden="true" />
                <p className="font-bold">نتیجه ای پیدا نشد</p>
                <p className="mt-1 text-sm text-current/58">نام برند، مدل یا SKU را کوتاه تر وارد کنید.</p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function FacetSection({
  title,
  icon,
  items,
  startIndex,
  activeIndex,
  theme,
  onSelect,
}: {
  title: string;
  icon: ReactNode;
  items: SearchFacet[];
  startIndex: number;
  activeIndex: number;
  theme: "dark" | "light";
  onSelect: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <section aria-label={title} className="grid gap-1">
      <div className="flex items-center gap-2 px-2 py-1 text-xs font-black text-current/65">
        {icon}
        {title}
      </div>
      {items.map((item, itemIndex) => {
        const index = startIndex + itemIndex;
        return (
          <Link
            key={item.id}
            href={item.href}
            onClick={onSelect}
            className={cn(
              "flex min-h-10 items-center justify-between gap-3 rounded-md px-3 text-sm transition",
              activeIndex === index
                ? theme === "dark"
                  ? "bg-white/10"
                  : "bg-[#EEF0E5]"
                : theme === "dark"
                  ? "hover:bg-white/10"
                  : "hover:bg-[#EEF0E5]",
            )}
          >
            <span className="truncate font-bold">{item.label}</span>
            <span className="shrink-0 text-xs tabular-nums text-current/55">
              {new Intl.NumberFormat("fa-IR").format(item.count)}
            </span>
          </Link>
        );
      })}
    </section>
  );
}
