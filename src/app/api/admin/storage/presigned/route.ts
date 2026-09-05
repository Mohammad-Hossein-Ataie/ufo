import { NextResponse } from "next/server";
import { productOriginalPrefix } from "@/lib/product-image-protection";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { key?: string };
    if (!body.key) return NextResponse.json({ error: "کلید فایل الزامی است." }, { status: 400 });
    if (body.key.startsWith(productOriginalPrefix)) {
      return NextResponse.json(
        { error: "برای تصاویر اصلی محصول لینک مستقیم صادر نمی‌شود." },
        { status: 403 },
      );
    }
    const url = await getStorageProvider().presignGet(body.key, 3600);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "ساخت لینک موقت ناموفق بود." }, { status: 500 });
  }
}
