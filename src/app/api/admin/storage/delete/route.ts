import { NextResponse } from "next/server";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";

export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { key?: string };
    if (!body.key) return NextResponse.json({ error: "کلید فایل الزامی است." }, { status: 400 });
    await getStorageProvider().delete(body.key);
    return NextResponse.json({ message: "فایل حذف شد." });
  } catch {
    return NextResponse.json({ error: "حذف فایل ناموفق بود." }, { status: 500 });
  }
}
