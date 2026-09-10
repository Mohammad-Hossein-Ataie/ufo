import { NextResponse } from "next/server";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";
export const runtime = "nodejs";
const cache = new Map<string, { expires: number; results: unknown[] }>();
let nextRequestAt = 0;
export async function GET(request: Request) {
  try {
    const session = requireCustomerSession(request);
    if (!checkRateLimit(`geocode:${session.customerId}`, 15, 60000).allowed)
      return NextResponse.json({ error: "کمی بعد دوباره جست‌وجو کنید." }, { status: 429 });
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
    if (q.length < 3 || q.length > 120) throw new Error("نام مکان باید بین ۳ تا ۱۲۰ کاراکتر باشد.");
    const found = cache.get(q);
    if (found && found.expires > Date.now()) return NextResponse.json({ results: found.results });
    if (Date.now() < nextRequestAt)
      return NextResponse.json({ error: "یک ثانیه بعد دوباره جست‌وجو کنید." }, { status: 429 });
    nextRequestAt = Date.now() + 1100;
    const url = new URL(
      process.env.GEOCODING_SEARCH_URL ?? "https://nominatim.openstreetmap.org/search",
    );
    if (url.protocol !== "https:") throw new Error("تنظیمات جست‌وجو معتبر نیست.");
    url.search = new URLSearchParams({
      q,
      format: "jsonv2",
      countrycodes: "ir",
      "accept-language": "fa",
      limit: "5",
    }).toString();
    const response = await fetch(url, {
      headers: {
        "User-Agent": "UfoPuff-Checkout/1.0 (delivery location search)",
        "Accept-Language": "fa",
      },
      signal: AbortSignal.timeout(10000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("سرویس جست‌وجو پاسخ نداد؛ روی نقشه انتخاب کنید.");
    const rows = (await response.json()) as Array<{
      place_id: number;
      lat: string;
      lon: string;
      display_name: string;
    }>;
    const results = rows
      .slice(0, 5)
      .map((r) => ({
        id: String(r.place_id),
        latitude: Number(r.lat),
        longitude: Number(r.lon),
        label: r.display_name,
      }))
      .filter((r) => Number.isFinite(r.latitude) && Number.isFinite(r.longitude));
    if (cache.size >= 500) cache.delete(cache.keys().next().value!);
    cache.set(q, { expires: Date.now() + 86400000, results });
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "جست‌وجو انجام نشد." },
      { status: 400 },
    );
  }
}
