import { describe, expect, it } from "vitest";
import { jalaliDateTimeFromIso, tehranDateTimeToIso } from "@/lib/jalali-date";

describe("Jalali date conversion", () => {
  it("round-trips a Tehran publication time", () => {
    const iso = tehranDateTimeToIso({ year: 1405, month: 7, day: 5 }, 13, 45);
    expect(iso).toBeTruthy();
    expect(jalaliDateTimeFromIso(iso)).toEqual({ year: 1405, month: 7, day: 5, hour: 13, minute: 45 });
  });
});
