"use client";

import { useMemo, useState } from "react";

interface CatalogPriceRangeFilterProps {
  minName?: string;
  maxName?: string;
  defaultMin?: string | undefined;
  defaultMax?: string | undefined;
  min?: number;
  max?: number;
  step?: number;
  tone?: "dark" | "light";
}

function parseValue(value: string | undefined, fallback: number) {
  const parsed = Number(value?.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function CatalogPriceRangeFilter({
  minName = "minPrice",
  maxName = "maxPrice",
  defaultMin,
  defaultMax,
  min = 0,
  max = 25_000_000,
  step = 50_000,
  tone = "dark",
}: CatalogPriceRangeFilterProps) {
  const [from, setFrom] = useState(() => parseValue(defaultMin, min));
  const [to, setTo] = useState(() => parseValue(defaultMax, max));
  const formatter = useMemo(() => new Intl.NumberFormat("fa-IR"), []);
  const inputClass =
    tone === "dark"
      ? "border-retail-border bg-retail-bg text-white placeholder:text-retail-muted focus:border-retail-accent focus:ring-retail-accent/30"
      : "border-[#C8D6C7] bg-[#F7F7F2] text-[#14201B] placeholder:text-[#7A8A80] focus:border-[#1F8A5B] focus:ring-[#1F8A5B]/20";
  const muted = tone === "dark" ? "text-retail-secondary" : "text-[#596B61]";

  function updateFrom(value: number) {
    setFrom(Math.min(value, to));
  }

  function updateTo(value: number) {
    setTo(Math.max(value, from));
  }

  return (
    <fieldset className="grid gap-3 rounded-md border border-current/15 p-3">
      <legend className="px-1 text-sm font-bold">محدوده قیمت</legend>
      <div className="grid gap-2">
        <label className="grid gap-1">
          <span className={`text-xs ${muted}`}>از</span>
          <span className="relative block">
            <input
              name={minName}
              inputMode="numeric"
              value={from || ""}
              onChange={(event) => updateFrom(parseValue(event.target.value, min))}
              className={`min-h-12 w-full rounded-md border px-3 pl-14 text-lg font-black tabular-nums outline-none transition focus:ring-2 ${inputClass}`}
              placeholder="تومان"
            />
            <span
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs ${muted}`}
            >
              تومان
            </span>
          </span>
        </label>
        <label className="grid gap-1">
          <span className={`text-xs ${muted}`}>تا</span>
          <span className="relative block">
            <input
              name={maxName}
              inputMode="numeric"
              value={to || ""}
              onChange={(event) => updateTo(parseValue(event.target.value, max))}
              className={`min-h-12 w-full rounded-md border px-3 pl-14 text-lg font-black tabular-nums outline-none transition focus:ring-2 ${inputClass}`}
              placeholder="تومان"
            />
            <span
              className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs ${muted}`}
            >
              تومان
            </span>
          </span>
        </label>
      </div>
      <div className="grid gap-2 pt-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={from}
          onChange={(event) => updateFrom(Number(event.target.value))}
          className="accent-cyan-400"
          aria-label="حداقل قیمت"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={to}
          onChange={(event) => updateTo(Number(event.target.value))}
          className={tone === "dark" ? "accent-cyan-400" : "accent-[#1F8A5B]"}
          aria-label="حداکثر قیمت"
        />
        <div className={`flex justify-between text-xs ${muted}`}>
          <span>ارزان‌ترین</span>
          <span>{formatter.format(max)} تومان</span>
        </div>
      </div>
    </fieldset>
  );
}
