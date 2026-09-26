"use client";

import type { AnalyticsChannel, AnalyticsDevice, AnalyticsEventInput, AnalyticsEventName } from "@/lib/analytics-event";

function trackingAllowed() {
  if (typeof navigator === "undefined") return false;
  const privacyNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack !== "1" && !privacyNavigator.globalPrivacyControl;
}

export function analyticsChannelForPath(path: string): AnalyticsChannel {
  return path.startsWith("/b2b") ? "wholesale" : "retail";
}

export function analyticsDevice(): AnalyticsDevice {
  if (window.innerWidth < 768) return "mobile";
  if (window.innerWidth < 1_024) return "tablet";
  return "desktop";
}

export function sendAnalyticsEvent(event: AnalyticsEventInput) {
  if (!trackingAllowed()) return;
  const payload = JSON.stringify(event);
  if (navigator.sendBeacon) {
    const sent = navigator.sendBeacon("/api/analytics", new Blob([payload], { type: "application/json" }));
    if (sent) return;
  }
  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    credentials: "omit",
    keepalive: true,
  }).catch(() => undefined);
}

export function trackSiteEvent(name: Exclude<AnalyticsEventName, "page_view" | "web_vital">, options?: { channel?: AnalyticsChannel; context?: string }) {
  if (typeof window === "undefined") return;
  sendAnalyticsEvent({
    name,
    path: window.location.pathname,
    channel: options?.channel ?? analyticsChannelForPath(window.location.pathname),
    device: analyticsDevice(),
    ...(options?.context ? { context: options.context } : {}),
  });
}
