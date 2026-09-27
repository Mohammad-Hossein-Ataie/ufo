"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Search } from "lucide-react";

export function CatalogQuickSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";
  const [draft, setDraft] = useState({ baseQuery: initialQuery, value: initialQuery });
  const query = draft.baseQuery === urlQuery ? draft.value : urlQuery;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const trimmed = query.trim();
    params.delete("page");
    if (trimmed) params.set("q", trimmed);
    else params.delete("q");

    const suffix = params.toString();
    const nextUrl = `/products${suffix ? `?${suffix}` : ""}`;
    if (nextUrl !== `${window.location.pathname}${window.location.search}`) {
      router.push(nextUrl, { scroll: false });
    }
  }

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-retail border border-retail-border bg-retail-surface p-3 shadow-retail sm:flex sm:items-center sm:p-4 lg:col-span-2"
    >
      <label htmlFor="catalog-quick-search" className="shrink-0 text-sm font-bold text-white">
        جستجو در محصولات
      </label>
      <div className="flex min-w-0 flex-1 gap-2">
        <span className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-retail-muted"
            aria-hidden="true"
          />
          <input
            id="catalog-quick-search"
            type="search"
            enterKeyHint="search"
            value={query}
            onChange={(event) => setDraft({ baseQuery: urlQuery, value: event.target.value })}
            placeholder="نام محصول، برند یا SKU"
            className="min-h-11 w-full rounded-lg border border-retail-border bg-retail-bg py-2 pl-3 pr-10 text-sm text-white outline-none transition placeholder:text-retail-muted focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/30"
          />
        </span>
        <button
          type="submit"
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-retail-accent px-4 text-sm font-black text-retail-bg transition hover:bg-retail-accent-hover"
        >
          جستجو
        </button>
      </div>
    </form>
  );
}
