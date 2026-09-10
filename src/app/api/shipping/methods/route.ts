import { NextResponse } from "next/server";
import { listAvailableShippingQuotes } from "@ufo/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const province = (url.searchParams.get("province") ?? "").trim().slice(0, 80);
    const city = (url.searchParams.get("city") ?? "").trim().slice(0, 80);
    const methods = listAvailableShippingQuotes({
      province,
      city,
      line1: "استعلام روش ارسال",
      receiverName: "مشتری",
      receiverPhone: "09120000000",
    }).filter((method) => (province && city) || method.scope === "pickup");
    return NextResponse.json(
      {
        methods,
        pickup: {
          address: process.env.STORE_ADDRESS?.trim() || "تهران، بازار مولوی، پاساژ صفویه",
          phone: process.env.STORE_PHONE?.trim() || "09362157181",
        },
      },
      { headers: { "Cache-Control": "private, max-age=30, stale-while-revalidate=60" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت روش‌های ارسال انجام نشد." },
      { status: 400 },
    );
  }
}
