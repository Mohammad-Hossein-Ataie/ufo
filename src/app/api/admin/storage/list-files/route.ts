import { NextResponse } from "next/server";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const files = await getStorageProvider().list();
    return NextResponse.json({ files });
  } catch {
    return NextResponse.json({ error: "دریافت لیست فایل‌ها ناموفق بود.", files: [] }, { status: 500 });
  }
}
