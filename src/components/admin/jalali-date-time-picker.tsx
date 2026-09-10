"use client";
import { useEffect, useId, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import {
  formatJalaliDay,
  jalaliMonth,
  jalaliParts,
  shiftDay,
  tehranDayKey,
} from "@/lib/jalali-calendar";

export function JalaliDateTimePicker({
  value,
  onChange,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [today] = useState(() => tehranDayKey());
  const [cursor, setCursor] = useState(() => value.slice(0, 10) || today);
  const [time, setTime] = useState(value.slice(11) || "12:00");
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = value.slice(0, 10);
  const lastDay = shiftDay(today, 90);
  const month = jalaliMonth(cursor);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  function select(day: string) {
    onChange(`${day}T${time || "12:00"}`);
    if (!time) setTime("12:00");
    setOpen(false);
    trigger.current?.focus();
  }
  const buttonClass =
    "flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600";
  return (
    <div ref={root} className="relative min-w-0" dir="rtl">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <div>
          <label id={`${id}-label`} className="mb-2 block text-xs font-bold text-slate-600">
            تاریخ ارسال (شمسی)
          </label>
          <button
            ref={trigger}
            type="button"
            disabled={disabled}
            aria-labelledby={`${id}-label`}
            aria-expanded={open}
            aria-controls={`${id}-calendar`}
            onClick={() => {
              setCursor(selected || today);
              setOpen(!open);
            }}
            className={`flex min-h-12 w-full items-center gap-2 rounded-xl border bg-white px-3 text-right text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 disabled:opacity-50 ${open ? "border-cyan-600 ring-4 ring-cyan-600/10" : "border-slate-200 hover:border-slate-400"}`}
          >
            <CalendarDays size={18} className="shrink-0 text-cyan-700" />
            <span className={selected ? "font-bold text-slate-900" : "text-slate-400"}>
              {selected ? formatJalaliDay(selected) : "انتخاب تاریخ شمسی"}
            </span>
            <ChevronLeft size={15} className="mr-auto text-slate-400" />
          </button>
        </div>
        <label className="grid gap-2 text-xs font-bold text-slate-600">
          ساعت تهران
          <span className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <Clock3 size={17} className="shrink-0 text-slate-400" />
            <input
              type="time"
              value={time}
              disabled={disabled}
              aria-label="ساعت ارسال به وقت تهران"
              onChange={(e) => {
                setTime(e.target.value);
                onChange(selected && e.target.value ? `${selected}T${e.target.value}` : "");
              }}
              className="min-w-0 w-full bg-white text-sm text-slate-900 outline-none [color-scheme:light]"
            />
          </span>
        </label>
      </div>
      {open && (
        <div
          id={`${id}-calendar`}
          role="group"
          aria-label="تقویم شمسی"
          className="absolute right-0 top-[calc(100%+8px)] z-30 w-full max-w-[328px] rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_16px_48px_rgba(15,23,42,.16)]"
        >
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              className={buttonClass}
              disabled={disabled || month.start <= today}
              aria-label="ماه قبل"
              onClick={() => setCursor(month.previous)}
            >
              <ChevronRight size={18} />
            </button>
            <span aria-live="polite" className="text-sm font-black text-slate-900">
              {formatJalaliDay(month.start, { month: "long", year: "numeric" })}
            </span>
            <button
              type="button"
              className={buttonClass}
              disabled={disabled || month.next > lastDay}
              aria-label="ماه بعد"
              onClick={() => setCursor(month.next)}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={buttonClass}
              aria-label="بستن تقویم"
              onClick={() => {
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day, i) => (
              <span key={i} className="pb-2 text-xs text-slate-400">
                {day}
              </span>
            ))}
            {Array.from({ length: month.offset }, (_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {month.days.map((day) => (
              <button
                key={day}
                type="button"
                disabled={disabled || day < today || day > lastDay}
                aria-label={formatJalaliDay(day)}
                aria-pressed={selected === day}
                aria-current={day === today ? "date" : undefined}
                onClick={() => select(day)}
                className={`aspect-square rounded-lg text-sm transition disabled:cursor-not-allowed disabled:opacity-25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-600 ${selected === day ? "bg-cyan-700 font-bold text-white" : day === today ? "bg-cyan-50 font-bold text-cyan-800" : "text-slate-700 hover:bg-slate-100"}`}
              >
                {jalaliParts(day).day.toLocaleString("fa-IR")}
              </button>
            ))}
          </div>
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
            {[
              [today, "امروز"],
              [shiftDay(today, 1), "فردا"],
            ].map(([day, label]) => (
              <button
                type="button"
                key={label}
                disabled={disabled}
                onClick={() => select(day!)}
                className="min-h-9 rounded-lg bg-slate-50 px-4 text-xs font-bold text-slate-600 hover:bg-cyan-50 hover:text-cyan-800"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
