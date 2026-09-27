import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getStorageProvider } from "@ufo/storage";
import type { Brand } from "@ufo/types";
import { listAdminBrands, updateAdminBrandLogo } from "@/lib/admin-brands";
import { adminRequestErrorStatus, requireAdminMutation } from "@/lib/admin-request";
import { checkRateLimit } from "@/lib/customer-session";

export const runtime = "nodejs";

const maxBytes = 4 * 1024 * 1024;
const allowedFormats = new Set(["jpeg", "png", "webp", "avif"]);

export async function POST(request: Request, { params }: { params: Promise<{ brandId: string }> }) {
  try {
    await requireAdminMutation(request);
    if (!checkRateLimit("admin-brand-image-upload", 30, 60_000).allowed) {
      return NextResponse.json({ error: "تعداد آپلودها بیش از حد مجاز است." }, { status: 429 });
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > maxBytes + 1024 * 1024) {
      return NextResponse.json({ error: "حجم درخواست بیش از حد مجاز است." }, { status: 413 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "یک تصویر معتبر انتخاب کنید." }, { status: 400 });
    }
    if (file.size > maxBytes) {
      return NextResponse.json({ error: "حداکثر حجم تصویر ۴ مگابایت است." }, { status: 413 });
    }

    const { brandId } = await params;
    if (!(await listAdminBrands()).some((brand) => brand.id === brandId)) {
      return NextResponse.json({ error: "برند پیدا نشد." }, { status: 404 });
    }
    const input = new Uint8Array(await file.arrayBuffer());
    let output: Buffer;
    try {
      const pipeline = sharp(input, { failOn: "error", limitInputPixels: 20_000_000 }).rotate();
      const metadata = await pipeline.metadata();
      if (!metadata.format || !allowedFormats.has(metadata.format))
        throw new Error("Invalid image format");
      output = await pipeline
        .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 86, effort: 5 })
        .toBuffer();
    } catch {
      return NextResponse.json(
        { error: "فقط تصویر معتبر PNG، WebP، JPEG یا AVIF مجاز است." },
        { status: 400 },
      );
    }

    const assetId = randomUUID();
    const storage = getStorageProvider();
    const key = `storage/brands/${assetId}.webp`;
    await storage.upload({
      key,
      body: new Uint8Array(output),
      contentType: "image/webp",
      visibility: "private",
    });
    let brand: Brand;
    try {
      brand = await updateAdminBrandLogo(brandId, `/api/brand-images/${assetId}`);
    } catch (error) {
      await storage.delete(key).catch(() => undefined);
      throw error;
    }
    return NextResponse.json({ brand, message: "تصویر برند ذخیره شد." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "آپلود تصویر برند ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
