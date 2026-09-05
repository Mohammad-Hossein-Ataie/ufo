import { NextResponse } from "next/server";
import { generatedProductKey, productOriginalPrefix } from "@/lib/product-image-protection";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { key?: string };
    if (!body.key) return NextResponse.json({ error: "کلید فایل الزامی است." }, { status: 400 });
    const storage = getStorageProvider();
    await storage.delete(body.key);
    if (body.key.startsWith(productOriginalPrefix)) {
      const assetId = body.key.slice(productOriginalPrefix.length);
      await Promise.allSettled([
        storage.delete(generatedProductKey(assetId, "card")),
        storage.delete(generatedProductKey(assetId, "detail")),
      ]);
    }
    return NextResponse.json({ message: "فایل حذف شد." });
  } catch {
    return NextResponse.json({ error: "حذف فایل ناموفق بود." }, { status: 500 });
  }
}
