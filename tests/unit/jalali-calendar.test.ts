import { describe, expect, it } from "vitest";
import {
  formatJalaliDay,
  jalaliMonth,
  jalaliParts,
  shiftDay,
  tehranDateTimeToIso,
  tehranDayKey,
} from "@/lib/jalali-calendar";

describe("Persian dispatch calendar", () => {
  it("uses Tehran's day at the UTC date boundary", () => {
    expect(tehranDayKey(new Date("2026-09-09T21:00:00Z"))).toBe("2026-09-10");
  });
  it("renders Persian date parts and month names", () => {
    expect(jalaliParts("2026-09-10")).toEqual({ year: 1405, month: 6, day: 19 });
    expect(formatJalaliDay("2026-09-10")).toContain("شهریور");
  });
  it("handles Nowruz and leap Esfand without Gregorian month assumptions", () => {
    const leap = jalaliMonth("2025-03-20");
    expect(leap.days).toHaveLength(30);
    expect(jalaliParts(leap.next)).toEqual({ year: 1404, month: 1, day: 1 });
    expect(jalaliMonth("2026-03-20").days).toHaveLength(29);
    expect(jalaliMonth("2026-09-10").days).toHaveLength(31);
    expect(jalaliMonth("2026-10-01").days).toHaveLength(30);
  });
  it("aligns weeks to Saturday and keeps next/previous month boundaries contiguous", () => {
    const month = jalaliMonth("2026-09-10");
    expect(month.offset).toBe((new Date(`${month.start}T12:00:00Z`).getUTCDay() + 1) % 7);
    expect(shiftDay(month.previous, 1)).toBe(month.start);
    expect(shiftDay(month.days.at(-1)!, 1)).toBe(month.next);
  });
  it("stores the selected time in Tehran independently of browser timezone", () => {
    expect(tehranDateTimeToIso("2026-09-10T12:30")).toBe("2026-09-10T09:00:00.000Z");
    expect(tehranDateTimeToIso("2026-09-10T00:30")).toBe("2026-09-09T21:00:00.000Z");
    expect(() => tehranDateTimeToIso("2026-02-30T12:00")).toThrow();
    expect(() => tehranDateTimeToIso("1405/06/19")).toThrow();
  });
});
