import { NextResponse } from "next/server";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (!key) return NextResponse.json({ error: "کلید فایل الزامی است." }, { status: 400 });
    const signedUrl = await getStorageProvider().presignGet(key, 3600);
    return NextResponse.redirect(signedUrl);
  } catch {
    return NextResponse.json({ error: "دریافت تصویر چت ناموفق بود." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایل معتبر نیست." }, { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "فقط تصویر برای چت قابل ارسال است." }, { status: 400 });
    }
    if (file.size > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "حداکثر حجم تصویر ۶ مگابایت است." }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const safeName = file.name.replace(/[^\w.-]+/g, "-");
    const key = `chat/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;
    const stored = await getStorageProvider().upload({
      key,
      body: bytes,
      contentType: file.type,
    });
    const publicBaseUrl = process.env.LIARA_PUBLIC_BASE_URL?.replace(/\/$/, "");
    return NextResponse.json({
      message: "تصویر چت آپلود شد.",
      file: {
        ...stored,
        name: file.name,
        ...(publicBaseUrl
          ? { url: `${publicBaseUrl}/${key}` }
          : { url: `/api/chat/upload?key=${encodeURIComponent(key)}` }),
      },
    });
  } catch {
    return NextResponse.json({ error: "آپلود تصویر چت ناموفق بود." }, { status: 500 });
  }
}
