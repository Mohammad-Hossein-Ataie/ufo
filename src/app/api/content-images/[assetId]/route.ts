import { NextResponse } from "next/server";
import { getStorageProvider } from "@ufo/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const assetIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ assetId: string }> }) {
  const { assetId } = await params;
  if (!assetIdPattern.test(assetId)) return new NextResponse(null, { status: 404 });
  try {
    const file = await getStorageProvider().read(`storage/content/${assetId.toLowerCase()}.webp`);
    return new Response(Buffer.from(file.body), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": 'inline; filename="ufo-puff-content.webp"',
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404, headers: { "Cache-Control": "public, max-age=60" } });
  }
}
