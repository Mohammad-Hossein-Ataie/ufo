import { describe, expect, it } from "vitest";
import { parseAnalyticsEvent } from "@/lib/analytics-event";

describe("first-party analytics event validation", () => {
  it("keeps only the pathname and accepted low-cardinality fields", () => {
    const event = parseAnalyticsEvent({
      name: "page_view",
      path: "/products?q=sensitive#results",
      channel: "retail",
      device: "mobile",
      source: "google",
      unknown: "ignored",
    }, new Date("2026-09-27T10:00:00.000Z"));

    expect(event).toEqual({
      name: "page_view",
      path: "/products",
      channel: "retail",
      device: "mobile",
      source: "google",
      occurredAt: new Date("2026-09-27T10:00:00.000Z"),
    });
  });

  it("rejects unknown events and incomplete Web Vitals", () => {
    expect(parseAnalyticsEvent({ name: "identify_user", path: "/", channel: "retail", device: "desktop" })).toBeUndefined();
    expect(parseAnalyticsEvent({ name: "web_vital", path: "/", channel: "retail", device: "desktop", metricName: "LCP" })).toBeUndefined();
  });

  it("accepts a bounded Web Vital sample", () => {
    expect(parseAnalyticsEvent({
      name: "web_vital",
      path: "/products/example",
      channel: "retail",
      device: "desktop",
      metricName: "LCP",
      metricValue: 2_350,
      rating: "good",
    })).toMatchObject({ metricName: "LCP", metricValue: 2_350, rating: "good" });
  });
});
