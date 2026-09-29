import { describe, expect, it } from "vitest";
import {
  isAnnouncementActive,
  sortSiteAnnouncements,
  validateSiteAnnouncements,
} from "@/lib/site-announcements";

const announcement = {
  id: "announcement_test",
  enabled: true,
  text: "ارسال سفارش‌ها طبق برنامه انجام می‌شود.",
  icon: "truck" as const,
  style: "info" as const,
  priority: 10,
};

describe("site announcement scheduling", () => {
  it("honors enabled, start and end boundaries", () => {
    const scheduled = {
      ...announcement,
      startsAt: "2026-09-29T08:00:00.000Z",
      endsAt: "2026-09-29T10:00:00.000Z",
    };
    expect(isAnnouncementActive(scheduled, new Date("2026-09-29T07:59:59.000Z"))).toBe(false);
    expect(isAnnouncementActive(scheduled, new Date("2026-09-29T08:00:00.000Z"))).toBe(true);
    expect(isAnnouncementActive(scheduled, new Date("2026-09-29T10:00:00.000Z"))).toBe(true);
    expect(isAnnouncementActive(scheduled, new Date("2026-09-29T10:00:01.000Z"))).toBe(false);
    expect(isAnnouncementActive({ ...scheduled, enabled: false }, new Date("2026-09-29T09:00:00Z"))).toBe(false);
  });

  it("validates generic content and orders higher priority first", () => {
    const values = validateSiteAnnouncements([
      { ...announcement, id: "low", priority: 1, link: "/products" },
      { ...announcement, id: "high", priority: 20, link: "https://example.com/notice" },
    ]);
    expect(sortSiteAnnouncements(values).map((item) => item.id)).toEqual(["high", "low"]);
    expect(() =>
      validateSiteAnnouncements([{ ...announcement, endsAt: "not-a-date" }]),
    ).toThrow("زمان پایان");
    expect(() =>
      validateSiteAnnouncements([{ ...announcement, link: "javascript:alert(1)" }]),
    ).toThrow("HTTPS");
  });
});
