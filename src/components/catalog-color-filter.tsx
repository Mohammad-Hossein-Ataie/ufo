"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import type { ProductColorOption } from "@ufo/domain";

interface CatalogColorFilterProps {
  name?: string;
  defaultValue?: string | undefined;
  options: ProductColorOption[];
  tone?: "dark" | "light";
}

function colorStyle(color: ProductColorOption) {
  return color.hex.startsWith("linear-gradient")
    ? { backgroundImage: color.hex }
    : { backgroundColor: color.hex };
}

export function CatalogColorFilter({
  name = "color",
  defaultValue,
  options,
  tone = "dark",
}: CatalogColorFilterProps) {
  const [value, setValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const selected = options.find((option) => option.id === value);
  const isDark = tone === "dark";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
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
        className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isDark
            ? "border-retail-border bg-retail-bg text-white hover:border-retail-accent/70 focus-visible:outline-retail-accent"
            : "border-[#C8D6C7] bg-[#F7F7F2] text-[#14201B] hover:border-[#1F8A5B]/70 focus-visible:outline-[#1F8A5B]"
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {selected ? (
            <span
              className="h-4 w-4 shrink-0 rounded-full border border-current/25"
              style={colorStyle(selected)}
              aria-hidden="true"
            />
          ) : null}
          <span className="truncate">{selected ? selected.labelFa : "همه رنگ‌ها"}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" />
      </button>

      {open ? (
        <div
          className={`absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 max-h-64 overflow-y-auto rounded-md border p-1 shadow-xl ${
            isDark
              ? "border-retail-border bg-retail-bg text-white"
              : "border-[#C8D6C7] bg-white text-[#14201B]"
          }`}
          role="listbox"
        >
          {[{ id: "", labelFa: "همه رنگ‌ها", hex: "" }, ...options].map((option) => {
            const active = option.id === value;
            return (
              <button
                key={option.id || "all"}
                type="button"
                onClick={() => {
                  setValue(option.id);
                  setOpen(false);
                }}
                className={`flex min-h-10 w-full items-center justify-between gap-3 rounded-md px-3 text-right text-sm font-bold transition ${
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
                  {option.id ? (
                    <span
                      className="h-4 w-4 shrink-0 rounded-full border border-current/25"
                      style={colorStyle(option)}
                      aria-hidden="true"
                    />
                  ) : (
                    <span className="h-4 w-4 shrink-0 rounded-full border border-current/25 bg-transparent" />
                  )}
                  <span className="truncate">{option.labelFa}</span>
                </span>
                {active ? <Check size={15} aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
