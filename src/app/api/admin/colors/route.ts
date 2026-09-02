import { NextResponse } from "next/server";
import { listAdminColors, saveAdminColor } from "@/lib/admin-colors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function GET() {
  const colors = await listAdminColors();
  return NextResponse.json({ colors });
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const id = stringValue(payload.id);
    const color = await saveAdminColor({
      labelFa: stringValue(payload.labelFa) ?? "",
      hex: stringValue(payload.hex) ?? "",
      ...(id ? { id } : {}),
    });
    return NextResponse.json({ color, message: "رنگ جدید ذخیره شد." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره رنگ ناموفق بود." },
      { status: 400 },
    );
  }
}
