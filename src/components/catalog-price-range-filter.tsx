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
  const normalized = value
    ?.replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
  const parsed = Number(normalized?.replace(/[^\d]/g, ""));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function CatalogPriceRangeFilter({
  minName = "minPrice",
  maxName = "maxPrice",
  defaultMin,
  defaultMax,
  min = 0,
  max = 25_000_000,
  step = 10_000,
  tone = "dark",
}: CatalogPriceRangeFilterProps) {
  const [from, setFrom] = useState(() => parseValue(defaultMin, min));
  const [to, setTo] = useState(() => parseValue(defaultMax, max));
  const formatter = useMemo(() => new Intl.NumberFormat("fa-IR"), []);
  const lower = Math.min(from, to);
  const upper = Math.max(from, to);
  const range = Math.max(1, max - min);
  const lowerPercent = ((lower - min) / range) * 100;
  const upperPercent = ((upper - min) / range) * 100;

  const inputClass =
    tone === "dark"
      ? "border-retail-border bg-retail-bg text-white placeholder:text-retail-muted focus:border-retail-accent focus:ring-retail-accent/30"
      : "border-[#C8D6C7] bg-[#F7F7F2] text-[#14201B] placeholder:text-[#7A8A80] focus:border-[#1F8A5B] focus:ring-[#1F8A5B]/20";
  const muted = tone === "dark" ? "text-retail-secondary" : "text-[#596B61]";
  const trackBase = tone === "dark" ? "bg-[#22303D]" : "bg-[#D5D9C9]";
  const activeTrack = tone === "dark" ? "bg-cyan-300" : "bg-[#1F8A5B]";
  const thumbColor = tone === "dark" ? "[--range-thumb:#67E8F9]" : "[--range-thumb:#1F8A5B]";
  const thumbClass = `${thumbColor} pointer-events-none absolute inset-x-0 top-1/2 z-20 h-2 -translate-y-1/2 appearance-none bg-transparent focus:outline-none focus-visible:[&::-moz-range-thumb]:ring-4 focus-visible:[&::-moz-range-thumb]:ring-cyan-300/30 focus-visible:[&::-webkit-slider-thumb]:ring-4 focus-visible:[&::-webkit-slider-thumb]:ring-cyan-300/30 [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-[var(--range-thumb)] [&::-moz-range-thumb]:shadow-lg [&::-moz-range-track]:bg-transparent [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:mt-[-6px] [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-[var(--range-thumb)] [&::-webkit-slider-thumb]:shadow-lg`;

  function updateFrom(value: number) {
    setFrom(Math.min(Math.max(value, min), upper));
  }

  function updateTo(value: number) {
    setTo(Math.max(Math.min(value, max), lower));
  }

  return (
    <fieldset className="grid gap-4 rounded-md border border-current/15 p-3">
      <legend className="px-1 text-sm font-bold">محدوده قیمت</legend>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid min-w-0 gap-1">
          <span className={`text-xs ${muted}`}>از</span>
          <span className="relative block">
            <input
              name={minName}
              inputMode="numeric"
              dir="ltr"
              value={lower ? formatter.format(lower) : ""}
              onChange={(event) => updateFrom(parseValue(event.target.value, min))}
              className={`min-h-14 w-full min-w-0 rounded-md border px-3 pb-2 pt-6 text-left text-sm font-bold tabular-nums outline-none transition focus:ring-2 sm:text-base ${inputClass}`}
              placeholder="0"
            />
            <span className={`pointer-events-none absolute right-3 top-2 text-[11px] ${muted}`}>
              تومان
            </span>
          </span>
        </label>
        <label className="grid min-w-0 gap-1">
          <span className={`text-xs ${muted}`}>تا</span>
          <span className="relative block">
            <input
              name={maxName}
              inputMode="numeric"
              dir="ltr"
              value={upper ? formatter.format(upper) : ""}
              onChange={(event) => updateTo(parseValue(event.target.value, max))}
              className={`min-h-14 w-full min-w-0 rounded-md border px-3 pb-2 pt-6 text-left text-sm font-bold tabular-nums outline-none transition focus:ring-2 sm:text-base ${inputClass}`}
              placeholder={formatter.format(max)}
            />
            <span className={`pointer-events-none absolute right-3 top-2 text-[11px] ${muted}`}>
              تومان
            </span>
          </span>
        </label>
      </div>

      <div className="grid gap-3 pt-1">
        <div className="relative h-10 px-1">
          <div
            className={`absolute inset-x-1 top-1/2 h-2 -translate-y-1/2 rounded-full ${trackBase}`}
            aria-hidden="true"
          />
          <div
            className={`absolute top-1/2 h-2 -translate-y-1/2 rounded-full ${activeTrack}`}
            style={{ right: `${lowerPercent}%`, left: `${100 - upperPercent}%` }}
            aria-hidden="true"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={lower}
            onChange={(event) => updateFrom(Number(event.target.value))}
            className={thumbClass}
            aria-label="حداقل قیمت"
          />
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={upper}
            onChange={(event) => updateTo(Number(event.target.value))}
            className={thumbClass}
            aria-label="حداکثر قیمت"
          />
        </div>
        <div className={`flex justify-between gap-3 text-xs ${muted}`}>
          <span className="min-w-0">ارزان‌ترین: {formatter.format(min)} تومان</span>
          <span className="min-w-0 text-left">گران‌ترین: {formatter.format(max)} تومان</span>
        </div>
        <div
          className={`rounded-md border border-current/10 px-3 py-2 text-center text-xs leading-6 ${muted}`}
        >
          {formatter.format(lower)} تا {formatter.format(upper)} تومان
        </div>
      </div>
    </fieldset>
  );
}
