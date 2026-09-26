import { getDb, hasUsableMongoUri } from "@ufo/database";
import type { AnalyticsEventDocument, AnalyticsEventName, WebVitalName, WebVitalRating } from "@/lib/analytics-event";

const retentionDays = 180;
const globalAnalytics = globalThis as typeof globalThis & { __ufoAnalyticsEvents?: AnalyticsEventDocument[] };

export interface LocalAnalyticsReport {
  storage: "mongodb" | "memory";
  periodDays: number;
  pageViews: number;
  eventCounts: Partial<Record<AnalyticsEventName, number>>;
  deviceCounts: Record<"mobile" | "tablet" | "desktop", number>;
  topPages: Array<{ path: string; views: number }>;
  dailyViews: Array<{ date: string; views: number }>;
  vitals: Array<{ name: WebVitalName; p75: number; samples: number; rating: WebVitalRating }>;
}

function memoryEvents() {
  globalAnalytics.__ufoAnalyticsEvents ??= [];
  return globalAnalytics.__ufoAnalyticsEvents;
}

export async function recordAnalyticsEvent(event: AnalyticsEventDocument): Promise<void> {
  if (hasUsableMongoUri()) {
    const db = await getDb();
    await db.collection<AnalyticsEventDocument>("analyticsEvents").insertOne(event);
    return;
  }
  const events = memoryEvents();
  events.push(event);
  if (events.length > 5_000) events.splice(0, events.length - 5_000);
}

function percentile75(values: number[]) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * 0.75) - 1)] ?? 0;
}

function ratingFor(name: WebVitalName, value: number): WebVitalRating {
  const thresholds: Record<WebVitalName, [number, number]> = {
    CLS: [0.1, 0.25],
    FCP: [1_800, 3_000],
    INP: [200, 500],
    LCP: [2_500, 4_000],
    TTFB: [800, 1_800],
  };
  const [good, poor] = thresholds[name];
  return value <= good ? "good" : value <= poor ? "needs-improvement" : "poor";
}

function compileReport(events: AnalyticsEventDocument[], periodDays: number, storage: LocalAnalyticsReport["storage"]): LocalAnalyticsReport {
  const eventCounts: LocalAnalyticsReport["eventCounts"] = {};
  const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
  const pages = new Map<string, number>();
  const dates = new Map<string, number>();
  const vitalValues = new Map<WebVitalName, number[]>();

  for (const event of events) {
    eventCounts[event.name] = (eventCounts[event.name] ?? 0) + 1;
    if (event.name === "page_view") {
      deviceCounts[event.device] += 1;
      pages.set(event.path, (pages.get(event.path) ?? 0) + 1);
      const date = event.occurredAt.toISOString().slice(0, 10);
      dates.set(date, (dates.get(date) ?? 0) + 1);
    }
    if (event.name === "web_vital" && event.metricName && event.metricValue !== undefined) {
      const values = vitalValues.get(event.metricName) ?? [];
      values.push(event.metricValue);
      vitalValues.set(event.metricName, values);
    }
  }

  return {
    storage,
    periodDays,
    pageViews: eventCounts.page_view ?? 0,
    eventCounts,
    deviceCounts,
    topPages: [...pages.entries()].map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 10),
    dailyViews: [...dates.entries()].map(([date, views]) => ({ date, views })).sort((a, b) => a.date.localeCompare(b.date)),
    vitals: [...vitalValues.entries()].map(([name, values]) => {
      const p75 = percentile75(values);
      return { name, p75, samples: values.length, rating: ratingFor(name, p75) };
    }).sort((a, b) => a.name.localeCompare(b.name)),
  };
}

export async function getLocalAnalyticsReport(periodDays = 28): Promise<LocalAnalyticsReport> {
  const since = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1_000);
  if (!hasUsableMongoUri()) {
    return compileReport(memoryEvents().filter((event) => event.occurredAt >= since), periodDays, "memory");
  }
  const db = await getDb();
  const events = await db.collection<AnalyticsEventDocument>("analyticsEvents")
    .find({ occurredAt: { $gte: since } }, { projection: { _id: 0 } })
    .sort({ occurredAt: -1 })
    .limit(50_000)
    .toArray();
  return compileReport(events, periodDays, "mongodb");
}

export const analyticsRetentionDays = retentionDays;
