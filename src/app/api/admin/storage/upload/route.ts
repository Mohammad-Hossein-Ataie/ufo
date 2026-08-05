import { NextResponse } from "next/server";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایل معتبر نیست." }, { status: 400 });
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: "حداکثر حجم فایل ۸ مگابایت است." }, { status: 413 });
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const key = `uploads/${Date.now()}-${file.name.replace(/[^\w.-]+/g, "-")}`;
    const stored = await getStorageProvider().upload({
      key,
      body: bytes,
      contentType: file.type || "application/octet-stream",
    });
    const publicBaseUrl = process.env.LIARA_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return NextResponse.json({
      message: "فایل آپلود شد.",
      file: {
        ...stored,
        ...(publicBaseUrl ? { url: `${publicBaseUrl}/${key}` } : {}),
      },
    });
  } catch {
    return NextResponse.json({ error: "آپلود فایل ناموفق بود." }, { status: 500 });
  }
}
