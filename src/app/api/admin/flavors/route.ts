import { NextResponse } from "next/server";
import { listAdminFlavors, saveAdminFlavor } from "@/lib/admin-flavors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export async function GET() {
  const flavors = await listAdminFlavors();
  return NextResponse.json({ flavors });
}

export async function POST(req: Request) {
  try {
    const payload = (await req.json()) as Record<string, unknown>;
    const nameEn = stringValue(payload.nameEn);
    const slug = stringValue(payload.slug);
    const iconKey = stringValue(payload.iconKey);
    const flavor = await saveAdminFlavor({
      nameFa: stringValue(payload.nameFa) ?? "",
      ...(nameEn ? { nameEn } : {}),
      ...(slug ? { slug } : {}),
      ...(iconKey ? { iconKey } : {}),
    });
    return NextResponse.json({ flavor, message: "طعم جدید ذخیره شد." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره طعم ناموفق بود." },
      { status: 400 },
    );
  }
}
