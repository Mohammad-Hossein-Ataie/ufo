import { NextResponse } from "next/server";
import { listAdminBrands, saveAdminBrand } from "@/lib/admin-brands";
import { adminRequestErrorStatus, requireAdminMutation, requireAdminRead } from "@/lib/admin-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminRead(request);
    return NextResponse.json({ brands: await listAdminBrands() });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "دریافت برندها ناموفق بود." }, { status: adminRequestErrorStatus(error) });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutation(request);
    const body = (await request.json()) as Record<string, unknown>;
    const brand = await saveAdminBrand({
      nameFa: typeof body.nameFa === "string" ? body.nameFa : "",
      ...(typeof body.slug === "string" ? { slug: body.slug } : {}),
    });
    return NextResponse.json({ brand, message: "برند اضافه شد." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ثبت برند ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
