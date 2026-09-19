"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { VariantOptionVisual } from "@/components/product-variant-visuals";
import type { StorefrontVariantOption } from "@/lib/storefront-variants";

interface CatalogFlavorFilterProps {
  name?: string;
  defaultValue?: string | undefined;
  options: StorefrontVariantOption[];
  tone?: "dark" | "light";
}

export function CatalogFlavorFilter({
  name = "flavor",
  defaultValue,
  options,
  tone = "dark",
}: CatalogFlavorFilterProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.id === value);
  const isDark = tone === "dark";
  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("fa").replace(/ي/g, "ی").replace(/ك/g, "ک");
    if (!normalized) return options;
    return options.filter((option) =>
      `${option.labelFa} ${option.id}`.toLocaleLowerCase("fa").replace(/ي/g, "ی").replace(/ك/g, "ک").includes(normalized),
    );
  }, [options, query]);

  function submitForm() {
    requestAnimationFrame(() => {
      wrapperRef.current?.closest("form")?.requestSubmit();
    });
  }

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-11 w-full select-none items-center justify-between gap-3 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${
          isDark
            ? "border-retail-border bg-retail-bg text-white hover:border-retail-accent/70 focus-visible:outline-retail-accent"
            : "border-[#C8D6C7] bg-[#F7F7F2] text-[#14201B] hover:border-[#1F8A5B]/70 focus-visible:outline-[#1F8A5B]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {selected ? <VariantOptionVisual option={selected} size="sm" /> : null}
          <span className="truncate">{selected ? selected.labelFa : "همه طعم‌ها"}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div
          className={`absolute inset-x-0 top-[calc(100%+0.35rem)] z-40 overflow-hidden rounded-lg border shadow-xl ${
            isDark
              ? "border-retail-border bg-retail-bg text-white"
              : "border-[#C8D6C7] bg-white text-[#14201B]"
          }`}
        >
          <div className={`border-b p-2 ${isDark ? "border-white/10" : "border-[#E1E5DA]"}`}>
            <span className="relative block">
              <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="جستجوی طعم"
                aria-label="جستجوی طعم"
                className={`min-h-10 w-full rounded-md border pe-9 ps-3 text-sm outline-none ${isDark ? "border-white/10 bg-white/[0.05] text-white focus:border-retail-accent" : "border-[#D5D9C9] bg-[#F7F7F2] text-[#14201B] focus:border-[#1F8A5B]"}`}
              />
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto overscroll-contain p-1" role="listbox">
          {[...(query ? [] : [undefined]), ...filteredOptions].map((option) => {
            const optionId = option?.id ?? "";
            const active = optionId === value;
            return (
              <button
                key={optionId || "all"}
                type="button"
                onClick={() => {
                  setValue(optionId);
                  setOpen(false);
                  setQuery("");
                  submitForm();
                }}
                className={`flex min-h-10 w-full select-none items-center justify-between gap-3 rounded-md px-3 text-right text-sm font-bold transition motion-reduce:transition-none ${
                  active
                    ? isDark
                      ? "bg-retail-accent text-retail-bg"
                      : "bg-[#E9FBF1] text-[#176D48]"
                    : isDark
                      ? "hover:bg-white/10"
                      : "hover:bg-[#F7F7F2]"
                }`}
                role="option"
                aria-selected={active}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  {option ? (
                    <VariantOptionVisual option={option} size="sm" />
                  ) : (
                    <span className="h-6 w-6 shrink-0 rounded-md border border-current/20" />
                  )}
                  <span className="truncate">{option ? option.labelFa : "همه طعم‌ها"}</span>
                </span>
                {active ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            );
          })}
          {filteredOptions.length === 0 ? <p className="px-3 py-4 text-center text-xs opacity-60">طعم موردنظر پیدا نشد.</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
