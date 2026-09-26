import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { getStorageProvider } from "@ufo/storage";
import { requireAdminMutation, adminRequestErrorStatus } from "@/lib/admin-request";
import { checkRateLimit } from "@/lib/customer-session";

export const runtime = "nodejs";

const maxBytes = 8 * 1024 * 1024;
const maxPixels = 40_000_000;

export async function POST(request: Request) {
  try {
    await requireAdminMutation(request);
    if (!checkRateLimit("admin-content-image-upload", 30, 60_000).allowed)
      return NextResponse.json({ error: "تعداد آپلودها بیش از حد مجاز است." }, { status: 429 });
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > maxBytes + 1024 * 1024)
      return NextResponse.json({ error: "حجم درخواست بیش از حد مجاز است." }, { status: 413 });
    const formData = await request.formData();
    const file = formData.get("file");
    const purpose = formData.get("purpose") === "body" ? "body" : "cover";
    if (!(file instanceof File) || file.size === 0)
      return NextResponse.json({ error: "تصویر معتبر انتخاب کنید." }, { status: 400 });
    if (file.size > maxBytes)
      return NextResponse.json({ error: "حداکثر حجم تصویر ۸ مگابایت است." }, { status: 413 });
    const input = new Uint8Array(await file.arrayBuffer());
    let output: Buffer;
    let width = 1600;
    let height = 900;
    try {
      const pipeline = sharp(input, { failOn: "error", limitInputPixels: maxPixels }).rotate();
      output = await (purpose === "body"
        ? pipeline.resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        : pipeline.resize(1600, 900, { fit: "cover", position: "attention" }))
        .webp({ quality: 84, effort: 5 })
        .toBuffer();
      const metadata = await sharp(output).metadata();
      width = metadata.width ?? width;
      height = metadata.height ?? height;
    } catch {
      return NextResponse.json(
        { error: "فقط تصویر معتبر JPEG، PNG، WebP یا AVIF مجاز است." },
        { status: 400 },
      );
    }
    const assetId = randomUUID();
    await getStorageProvider().upload({
      key: `storage/content/${assetId}.webp`,
      body: new Uint8Array(output),
      contentType: "image/webp",
      visibility: "private",
    });
    return NextResponse.json({
      url: `/api/content-images/${assetId}`,
      width,
      height,
      message: purpose === "body" ? "تصویر بهینه شد و داخل متن قرار گرفت." : "تصویر شاخص با نسبت ۱۶:۹ آماده شد.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "آپلود تصویر ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
