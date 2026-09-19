"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export interface CatalogSearchableSelectOption {
  value: string;
  label: string;
  keywords?: string[];
}

interface CatalogSearchableSelectProps {
  name: string;
  defaultValue?: string | undefined;
  options: CatalogSearchableSelectOption[];
  allLabel: string;
  searchPlaceholder?: string;
  tone?: "dark" | "light";
  includeAllOption?: boolean;
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fa")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function CatalogSearchableSelect({
  name,
  defaultValue,
  options,
  allLabel,
  searchPlaceholder = "جستجو...",
  tone = "dark",
  includeAllOption = true,
}: CatalogSearchableSelectProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const isDark = tone === "dark";

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    if (!normalizedQuery) return options;
    return options.filter((option) => {
      const haystack = [option.label, option.value, ...(option.keywords ?? [])]
        .map(normalizeSearch)
        .join(" ");
      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  function submitForm() {
    requestAnimationFrame(() => {
      wrapperRef.current?.closest("form")?.requestSubmit();
    });
  }

  function choose(nextValue: string) {
    setValue(nextValue);
    setOpen(false);
    setQuery("");
    submitForm();
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

  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key !== "Escape" || !open) return;
        event.preventDefault();
        setOpen(false);
        setQuery("");
      }}
    >
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current);
          if (open) setQuery("");
        }}
        className={`flex min-h-11 w-full select-none items-center justify-between gap-3 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 motion-reduce:transition-none ${
          isDark
            ? "border-retail-border bg-retail-bg text-white hover:border-retail-accent/70 focus-visible:outline-retail-accent"
            : "border-[#C8D6C7] bg-[#F7F7F2] text-[#14201B] hover:border-[#1F8A5B]/70 focus-visible:outline-[#1F8A5B]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span className="truncate">{selected?.label ?? allLabel}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open ? (
        <div
          className={`absolute inset-x-0 top-[calc(100%+0.35rem)] z-40 overflow-hidden rounded-lg border shadow-2xl ${
            isDark
              ? "border-retail-border bg-[#090E15] text-white shadow-black/50"
              : "border-[#C8D6C7] bg-white text-[#14201B] shadow-black/15"
          }`}
        >
          <div className={`sticky top-0 z-10 border-b p-2 ${isDark ? "border-white/10 bg-[#090E15]" : "border-[#E1E5DA] bg-white"}`}>
            <span className="relative block">
              <Search
                size={15}
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? "text-retail-muted" : "text-[#69776F]"}`}
                aria-hidden="true"
              />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className={`min-h-10 w-full rounded-md border pe-9 ps-3 text-sm outline-none transition placeholder:text-current/45 ${
                  isDark
                    ? "border-white/10 bg-white/[0.05] text-white focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/20"
                    : "border-[#D5D9C9] bg-[#F7F7F2] text-[#14201B] focus:border-[#1F8A5B] focus:ring-2 focus:ring-[#1F8A5B]/20"
                }`}
              />
            </span>
          </div>

          <div id={listboxId} role="listbox" className="max-h-56 overflow-y-auto overscroll-contain p-1.5">
            {!query && includeAllOption ? (
              <button
                type="button"
                onClick={() => choose("")}
                className={`flex min-h-10 w-full select-none items-center justify-between gap-3 rounded-md px-3 text-right text-sm font-bold transition motion-reduce:transition-none ${
                  value === ""
                    ? isDark
                      ? "bg-retail-accent text-retail-bg"
                      : "bg-[#E9FBF1] text-[#176D48]"
                    : isDark
                      ? "hover:bg-white/10"
                      : "hover:bg-[#F7F7F2]"
                }`}
                role="option"
                aria-selected={value === ""}
              >
                <span className="truncate">{allLabel}</span>
                {value === "" ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            ) : null}

            {filteredOptions.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => choose(option.value)}
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
                  <span className="truncate">{option.label}</span>
                  {active ? <Check size={15} aria-hidden="true" /> : null}
                </button>
              );
            })}

            {filteredOptions.length === 0 ? (
              <p className={`px-3 py-4 text-center text-xs ${isDark ? "text-retail-secondary" : "text-[#69776F]"}`}>
                نتیجه‌ای پیدا نشد.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
