"use client";

import { getCities, getProvincesList } from "@code-plate/iran-cities";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

interface LocationOption {
  value: string;
  label: string;
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("fa").replace(/ي/g, "ی").replace(/ك/g, "ک");
}

function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  value: string;
  options: LocationOption[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);

  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const filtered = useMemo(() => {
    const needle = normalize(query);
    if (!needle || query === value) return options.slice(0, 80);
    return options.filter((option) => normalize(option.label).includes(needle)).slice(0, 80);
  }, [options, query, value]);

  return (
    <label className="checkout-label">
      {label}
      <div ref={rootRef} className="relative">
        <Search
          className="pointer-events-none absolute right-4 top-1/2 z-10 -translate-y-1/2 text-retail-muted"
          size={17}
        />
        <input
          type="text"
          role="combobox"
          aria-label={label}
          aria-expanded={open}
          aria-controls={`${label}-options`}
          aria-autocomplete="list"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setQuery(value);
              setOpen(false);
            }, 150);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") setOpen(false);
            if (event.key === "Enter" && filtered.length === 1) {
              event.preventDefault();
              const option = filtered[0];
              if (option) {
                onChange(option.value);
                setQuery(option.label);
                setOpen(false);
              }
            }
          }}
          placeholder={placeholder}
          className="min-h-[52px] w-full rounded-xl border border-white/10 bg-[#090d13] pe-11 pl-10 text-white caret-retail-accent outline-none transition placeholder:text-retail-muted focus:border-retail-accent focus:ring-2 focus:ring-retail-accent/20 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <ChevronDown
          className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-retail-muted transition ${open ? "rotate-180" : ""}`}
          size={18}
        />
        {open && !disabled ? (
          <div
            id={`${label}-options`}
            role="listbox"
            className="absolute inset-x-0 top-[calc(100%+.45rem)] z-30 max-h-64 overflow-y-auto overscroll-contain rounded-xl border border-retail-border bg-[#10161e] p-1.5 shadow-2xl"
          >
            {filtered.length ? (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onChange(option.value);
                    setQuery(option.label);
                    setOpen(false);
                  }}
                  className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 text-right text-sm transition ${option.value === value ? "bg-retail-accent/12 font-black text-retail-accent" : "text-white hover:bg-white/5"}`}
                >
                  <MapPin size={15} className="text-retail-muted" />
                  {option.label}
                  {option.value === value ? <Check className="mr-auto" size={16} /> : null}
                </button>
              ))
            ) : (
              <p className="px-3 py-5 text-center text-sm text-retail-secondary">
                نتیجه‌ای پیدا نشد
              </p>
            )}
          </div>
        ) : null}
      </div>
    </label>
  );
}

const provinceOptions = getProvincesList().map((province) => ({
  value: province.fa,
  label: province.fa,
}));

export function IranProvinceCitySelect({
  province,
  city,
  onProvinceChange,
  onCityChange,
}: {
  province: string;
  city: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
}) {
  const cityOptions = useMemo(
    () => getCities(province).map((item) => ({ value: item.fa, label: item.fa })),
    [province],
  );
  return (
    <>
      <SearchableSelect
        label="استان"
        value={province}
        options={provinceOptions}
        placeholder="جستجوی استان"
        onChange={(value) => {
          onProvinceChange(value);
          if (!getCities(value).some((item) => item.fa === city)) onCityChange("");
        }}
      />
      <SearchableSelect
        label="شهر"
        value={city}
        options={cityOptions}
        placeholder={province ? "جستجوی شهر" : "ابتدا استان را انتخاب کنید"}
        disabled={!province}
        onChange={onCityChange}
      />
    </>
  );
}
