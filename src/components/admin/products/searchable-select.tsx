"use client";

import * as Popover from "@radix-ui/react-popover";
import { Check, ChevronDown, Search } from "lucide-react";
import { useRef, useState } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = "انتخاب کنید",
  className = "",
}: {
  label: string;
  value: string;
  options: readonly SelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase("fa-IR");
  const filtered = options.filter((option) =>
    option.label.toLocaleLowerCase("fa-IR").includes(normalizedQuery),
  );
  const selected = options.find((option) => option.value === value);

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-haspopup="listbox"
          aria-expanded={open}
          disabled={disabled}
          className={`flex min-h-11 min-w-0 items-center justify-between gap-2 rounded-md border border-slate-300 bg-white px-3 text-start text-sm text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown size={16} className="shrink-0 text-slate-500" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          dir="rtl"
          sideOffset={5}
          align="start"
          collisionPadding={12}
          className="z-[100] flex max-h-[var(--radix-popover-content-available-height)] w-[var(--radix-popover-trigger-width)] min-w-48 max-w-[calc(100vw-24px)] flex-col rounded-lg border border-slate-200 bg-white p-2 text-slate-900 shadow-xl"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
        >
          <div className="relative mb-2">
            <Search
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              ref={searchRef}
              aria-label={`جست‌وجوی ${label}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && filtered[0]) {
                  event.preventDefault();
                  onChange(filtered[0].value);
                  setOpen(false);
                }
              }}
              placeholder="جست‌وجو..."
              className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pr-9 pl-3 text-sm outline-none focus:border-cyan-500"
            />
          </div>
          <div
            role="listbox"
            aria-label={label}
            className="min-h-0 max-h-64 overflow-y-auto overscroll-contain"
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
                    setOpen(false);
                  }}
                  className="flex min-h-10 w-full items-center justify-between gap-2 rounded-md px-3 text-start text-sm hover:bg-cyan-50 focus:bg-cyan-50 focus:outline-none data-[selected=true]:font-bold"
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value && <Check size={15} aria-hidden="true" />}
                </button>
              ))
            ) : (
              <p className="px-3 py-4 text-center text-sm text-slate-500">موردی پیدا نشد.</p>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
