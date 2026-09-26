import { NextResponse } from "next/server";
import { parseAnalyticsEvent } from "@/lib/analytics-event";
import { recordAnalyticsEvent } from "@/lib/analytics-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const botPattern = /bot|crawler|spider|headless|lighthouse|pagespeed/i;

export async function POST(request: Request) {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "same-site") {
    return NextResponse.json({ error: "درخواست نامعتبر است." }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 4_096) return new NextResponse(null, { status: 413 });
  if (botPattern.test(request.headers.get("user-agent") ?? "")) return new NextResponse(null, { status: 204 });

  try {
    const raw = await request.text();
    if (raw.length > 4_096) return new NextResponse(null, { status: 413 });
    const event = parseAnalyticsEvent(JSON.parse(raw));
    if (!event) return NextResponse.json({ error: "داده گزارش معتبر نیست." }, { status: 400 });
    await recordAnalyticsEvent(event);
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "ثبت گزارش انجام نشد." }, { status: 400 });
  }
}
