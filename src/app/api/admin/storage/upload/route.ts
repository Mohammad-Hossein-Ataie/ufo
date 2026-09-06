import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  maxProductImageBytes,
  originalProductKey,
  productAssetUrl,
  validateProductImage,
} from "@/lib/product-image-protection";
import { getStorageProvider } from "@ufo/storage";
import { checkRateLimit } from "@/lib/customer-session";
import { requireAdminMutation, adminRequestErrorStatus } from "@/lib/admin-request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await requireAdminMutation(req);
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > maxProductImageBytes + 1024 * 1024) {
      return NextResponse.json({ error: "حجم درخواست بیش از حد مجاز است." }, { status: 413 });
    }
    if (!checkRateLimit("admin-product-image-upload", 30, 60_000).allowed) {
      return NextResponse.json({ error: "تعداد آپلودها بیش از حد مجاز است." }, { status: 429 });
    }
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایل معتبر نیست." }, { status: 400 });
    }
    if (file.size > maxProductImageBytes) {
      return NextResponse.json({ error: "حداکثر حجم فایل ۸ مگابایت است." }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    await validateProductImage(bytes);
    const assetId = randomUUID();
    const key = originalProductKey(assetId);
    const stored = await getStorageProvider().upload({
      key,
      body: bytes,
      contentType: file.type,
      visibility: "private",
    });
    return NextResponse.json({
      message: "تصویر اصلی به‌صورت خصوصی ذخیره شد.",
      file: {
        key: stored.key,
        size: stored.size,
        contentType: stored.contentType,
        url: productAssetUrl(assetId, "detail"),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "آپلود تصویر ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
