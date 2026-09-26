"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, X } from "lucide-react";
import {
  getJalaliDateParts,
  jalaliDateTimeFromIso,
  jalaliMonthLength,
  jalaliWeekdayIndex,
  tehranDateTimeToIso,
  type JalaliDateParts,
} from "@/lib/jalali-date";

const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
const weekdays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const numberFormatter = new Intl.NumberFormat("fa-IR", { useGrouping: false });
const displayFormatter = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type CalendarPosition = { top: number; left: number; width: number; maxHeight: number };

function sameDate(left: JalaliDateParts | undefined, right: JalaliDateParts) {
  return left?.year === right.year && left.month === right.month && left.day === right.day;
}

export function JalaliDateTimePicker({
  value,
  onChange,
  required = false,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}) {
  const parsed = useMemo(() => jalaliDateTimeFromIso(value), [value]);
  const now = useMemo(() => new Date(), []);
  const initial = parsed ?? { ...getJalaliDateParts(now), hour: (now.getHours() + 1) % 24, minute: 0 };
  const [open, setOpen] = useState(false);
  const [view, setView] = useState({ year: initial.year, month: initial.month });
  const [hour, setHour] = useState(initial.hour);
  const [minute, setMinute] = useState(initial.minute);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [calendarPosition, setCalendarPosition] = useState<CalendarPosition>();

  const positionCalendar = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const viewportPadding = 12;
    const gap = 8;
    const triggerRect = trigger.getBoundingClientRect();
    const width = Math.min(352, window.innerWidth - viewportPadding * 2);
    const panel = panelRef.current;
    const renderedHeight = Math.max(panel?.getBoundingClientRect().height ?? 0, panel?.scrollHeight ?? 0);
    const measuredHeight = renderedHeight >= 320 ? renderedHeight : 470;
    const maxHeight = Math.max(280, window.innerHeight - viewportPadding * 2);
    const height = Math.min(measuredHeight, maxHeight);
    const spaceBelow = window.innerHeight - triggerRect.bottom - viewportPadding;
    const preferredTop = spaceBelow >= height + gap
      ? triggerRect.bottom + gap
      : Math.max(viewportPadding, triggerRect.top - height - gap);
    const top = Math.min(preferredTop, window.innerHeight - height - viewportPadding);
    const preferredLeft = triggerRect.right - width;
    const left = Math.min(
      Math.max(viewportPadding, preferredLeft),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding),
    );
    setCalendarPosition({ top, left, width, maxHeight });
  }, []);

  useEffect(() => {
    if (!parsed) return;
    setView({ year: parsed.year, month: parsed.month });
    setHour(parsed.hour);
    setMinute(parsed.minute);
  }, [parsed?.year, parsed?.month, parsed?.day, parsed?.hour, parsed?.minute]);

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target) && !panelRef.current?.contains(target)) setOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    const reposition = () => positionCalendar();
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", closeWithEscape);
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", closeWithEscape);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, positionCalendar]);

  useLayoutEffect(() => {
    if (!open) {
      setCalendarPosition(undefined);
      return;
    }
    positionCalendar();
  }, [open, positionCalendar, view.month, view.year]);

  const days = jalaliMonthLength(view.year, view.month);
  const offset = jalaliWeekdayIndex({ year: view.year, month: view.month, day: 1 });
  const today = getJalaliDateParts(now);

  function moveMonth(direction: -1 | 1) {
    setView((current) => {
      const month = current.month + direction;
      if (month < 1) return { year: current.year - 1, month: 12 };
      if (month > 12) return { year: current.year + 1, month: 1 };
      return { year: current.year, month };
    });
  }

  function selectDay(day: number) {
    const iso = tehranDateTimeToIso({ year: view.year, month: view.month, day }, hour, minute);
    if (iso) onChange(iso);
  }

  function changeTime(nextHour: number, nextMinute: number) {
    setHour(nextHour);
    setMinute(nextMinute);
    if (!parsed) return;
    const iso = tehranDateTimeToIso(parsed, nextHour, nextMinute);
    if (iso) onChange(iso);
  }

  return (
    <div ref={rootRef} className="relative mt-2">
      <div className="flex gap-2">
        <button
          ref={triggerRef}
          type="button"
          aria-label="زمان انتشار"
          aria-haspopup="dialog"
          aria-expanded={open}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          className="flex min-h-12 min-w-0 flex-1 items-center justify-between gap-3 rounded-lg border border-slate-300 bg-white px-3 text-right text-sm outline-none transition hover:border-cyan-500 focus-visible:border-cyan-600 focus-visible:ring-2 focus-visible:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-70"
        >
          <span className="inline-flex min-w-0 items-center gap-2">
            <CalendarDays size={18} className="shrink-0 text-cyan-700" />
            <span className={value ? "truncate font-bold text-slate-800" : "truncate text-slate-400"}>
              {value ? displayFormatter.format(new Date(value)) : "تاریخ و ساعت را انتخاب کنید"}
            </span>
          </span>
          <span className="shrink-0 text-[10px] text-slate-400">جلالی</span>
        </button>
        {value ? (
          <button
            type="button"
            aria-label="پاک کردن زمان انتشار"
            disabled={disabled}
            onClick={() => onChange("")}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-500 hover:border-rose-300 hover:text-rose-600"
          >
            <X size={17} />
          </button>
        ) : null}
      </div>
      {required && !value ? <p className="mt-1.5 text-xs text-amber-700">برای زمان‌بندی، تاریخ و ساعت الزامی است.</p> : null}

      {open && typeof document !== "undefined" ? createPortal(
        <div
          ref={panelRef}
          role="dialog"
          dir="rtl"
          aria-label="انتخاب تاریخ جلالی انتشار"
          style={calendarPosition}
          className={`fixed z-[100] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] ${calendarPosition ? "opacity-100" : "pointer-events-none opacity-0"}`}
        >
          <div className="flex items-center justify-between">
            <button type="button" aria-label="ماه بعد" onClick={() => moveMonth(1)} className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
              <ChevronRight size={18} />
            </button>
            <strong className="text-sm text-slate-900">
              {monthNames[view.month - 1]} {numberFormatter.format(view.year)}
            </strong>
            <button type="button" aria-label="ماه قبل" onClick={() => moveMonth(-1)} className="inline-flex size-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
              <ChevronLeft size={18} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center" aria-hidden="true">
            {weekdays.map((weekday) => <span key={weekday} className="py-1 text-[11px] font-bold text-slate-400">{weekday}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
            {Array.from({ length: days }, (_, index) => {
              const day = index + 1;
              const date = { year: view.year, month: view.month, day };
              const selected = sameDate(parsed, date);
              const isToday = sameDate(today, date);
              return (
                <button
                  key={day}
                  type="button"
                  aria-label={`${numberFormatter.format(day)} ${monthNames[view.month - 1]} ${numberFormatter.format(view.year)}`}
                  aria-pressed={selected}
                  onClick={() => selectDay(day)}
                  className={`aspect-square rounded-lg text-xs font-bold transition ${selected ? "bg-cyan-700 text-white shadow-sm" : isToday ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {numberFormatter.format(day)}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600"><Clock3 size={15} /> ساعت ایران</span>
            <div className="mr-auto flex items-center gap-1" dir="ltr">
              <select aria-label="ساعت انتشار" value={hour} onChange={(event) => changeTime(Number(event.target.value), minute)} className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm tabular-nums">
                {Array.from({ length: 24 }, (_, item) => <option key={item} value={item}>{String(item).padStart(2, "0")}</option>)}
              </select>
              <span className="font-bold text-slate-400">:</span>
              <select aria-label="دقیقه انتشار" value={minute} onChange={(event) => changeTime(hour, Number(event.target.value))} className="h-10 rounded-lg border border-slate-300 bg-white px-2 text-sm tabular-nums">
                {Array.from({ length: 12 }, (_, item) => item * 5).map((item) => <option key={item} value={item}>{String(item).padStart(2, "0")}</option>)}
                {minute % 5 !== 0 ? <option value={minute}>{String(minute).padStart(2, "0")}</option> : null}
              </select>
            </div>
          </div>
          <button type="button" onClick={() => setOpen(false)} disabled={!value} className="mt-3 min-h-10 w-full rounded-lg bg-slate-900 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-40">
            تأیید زمان انتشار
          </button>
        </div>,
        document.body,
      ) : null}
    </div>
  );
}
