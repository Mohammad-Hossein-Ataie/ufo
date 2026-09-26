"use client";

import { useCallback, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { analyticsChannelForPath, analyticsDevice, sendAnalyticsEvent } from "@/lib/site-analytics-client";

function referrerHost() {
  if (!document.referrer) return undefined;
  try {
    const host = new URL(document.referrer).hostname;
    return host === window.location.hostname ? undefined : host;
  } catch {
    return undefined;
  }
}

function campaignFields() {
  const params = new URLSearchParams(window.location.search);
  const source = params.get("utm_source")?.slice(0, 80);
  const medium = params.get("utm_medium")?.slice(0, 80);
  const campaign = params.get("utm_campaign")?.slice(0, 100);
  return {
    ...(source ? { source } : {}),
    ...(medium ? { medium } : {}),
    ...(campaign ? { campaign } : {}),
  };
}

export function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const externalReferrer = referrerHost();
    sendAnalyticsEvent({
      name: "page_view",
      path: pathname,
      channel: analyticsChannelForPath(pathname),
      device: analyticsDevice(),
      ...(externalReferrer ? { referrerHost: externalReferrer } : {}),
      ...campaignFields(),
    });
  }, [pathname]);

  const reportWebVital = useCallback((metric: {
    id: string;
    name: "CLS" | "FCP" | "INP" | "LCP" | "TTFB";
    value: number;
    rating?: "good" | "needs-improvement" | "poor";
    navigationType?: string;
  }) => {
    const path = window.location.pathname;
    if (path.startsWith("/admin")) return;
    sendAnalyticsEvent({
      name: "web_vital",
      path,
      channel: analyticsChannelForPath(path),
      device: analyticsDevice(),
      metricName: metric.name,
      metricId: metric.id,
      metricValue: metric.value,
      ...(metric.rating ? { rating: metric.rating } : {}),
      ...(metric.navigationType ? { navigationType: metric.navigationType } : {}),
    });
  }, []);

  useReportWebVitals(reportWebVital);
  return null;
}
