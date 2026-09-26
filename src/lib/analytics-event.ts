export const analyticsEventNames = [
  "page_view",
  "web_vital",
  "add_to_cart",
  "order_created",
  "payment_started",
  "site_search",
] as const;

export const webVitalNames = ["CLS", "FCP", "INP", "LCP", "TTFB"] as const;

export type AnalyticsEventName = (typeof analyticsEventNames)[number];
export type WebVitalName = (typeof webVitalNames)[number];
export type AnalyticsChannel = "retail" | "wholesale";
export type AnalyticsDevice = "mobile" | "tablet" | "desktop";
export type WebVitalRating = "good" | "needs-improvement" | "poor";

export interface AnalyticsEventInput {
  name: AnalyticsEventName;
  path: string;
  channel: AnalyticsChannel;
  device: AnalyticsDevice;
  context?: string;
  metricName?: WebVitalName;
  metricId?: string;
  metricValue?: number;
  rating?: WebVitalRating;
  navigationType?: string;
  referrerHost?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface AnalyticsEventDocument extends AnalyticsEventInput {
  occurredAt: Date;
}

const eventNameSet = new Set<string>(analyticsEventNames);
const vitalNameSet = new Set<string>(webVitalNames);
const ratingSet = new Set<string>(["good", "needs-improvement", "poor"]);

function text(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().slice(0, maxLength);
  return normalized || undefined;
}

function path(value: unknown): string | undefined {
  const candidate = text(value, 300);
  if (!candidate?.startsWith("/") || candidate.startsWith("//")) return undefined;
  try {
    const url = new URL(candidate, "https://analytics.local");
    return url.pathname.slice(0, 300) || "/";
  } catch {
    return undefined;
  }
}

export function parseAnalyticsEvent(value: unknown, occurredAt = new Date()): AnalyticsEventDocument | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const input = value as Record<string, unknown>;
  if (typeof input.name !== "string" || !eventNameSet.has(input.name)) return undefined;
  const eventPath = path(input.path);
  if (!eventPath) return undefined;
  const channel = input.channel === "wholesale" ? "wholesale" : input.channel === "retail" ? "retail" : undefined;
  const device = input.device === "mobile" || input.device === "tablet" || input.device === "desktop"
    ? input.device
    : undefined;
  if (!channel || !device) return undefined;

  const event: AnalyticsEventDocument = {
    name: input.name as AnalyticsEventName,
    path: eventPath,
    channel,
    device,
    occurredAt,
  };

  const optionalText = {
    context: text(input.context, 80),
    metricId: text(input.metricId, 80),
    navigationType: text(input.navigationType, 40),
    referrerHost: text(input.referrerHost, 120),
    source: text(input.source, 80),
    medium: text(input.medium, 80),
    campaign: text(input.campaign, 100),
  };
  for (const [key, item] of Object.entries(optionalText)) {
    if (item) Object.assign(event, { [key]: item });
  }

  if (typeof input.metricName === "string" && vitalNameSet.has(input.metricName)) {
    event.metricName = input.metricName as WebVitalName;
  }
  if (typeof input.rating === "string" && ratingSet.has(input.rating)) {
    event.rating = input.rating as WebVitalRating;
  }
  if (typeof input.metricValue === "number" && Number.isFinite(input.metricValue) && input.metricValue >= 0 && input.metricValue <= 10_000_000) {
    event.metricValue = input.metricValue;
  }
  if (event.name === "web_vital" && (!event.metricName || event.metricValue === undefined)) return undefined;
  return event;
}
