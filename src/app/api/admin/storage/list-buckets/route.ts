import { NextResponse } from "next/server";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";

export async function GET() {
  try {
    const buckets = await getStorageProvider().listBuckets();
    return NextResponse.json({ buckets });
  } catch {
    return NextResponse.json({ error: "دریافت bucketها ناموفق بود.", buckets: [] }, { status: 500 });
  }
}
