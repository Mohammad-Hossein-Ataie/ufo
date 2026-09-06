import { NextResponse } from "next/server";
import { listShippingMethods, saveShippingMethod, type ShippingMethodInput } from "@ufo/orders";
import { checkRateLimit } from "@/lib/customer-session";
import { requireAdminMutation, adminRequestErrorStatus } from "@/lib/admin-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function assertMutation(request: Request) {
  await requireAdminMutation(request);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 20_000) throw new Error("حجم درخواست بیش از حد مجاز است.");
  if (!checkRateLimit("admin-shipping-mutation", 120, 60_000).allowed)
    throw new Error("تعداد تغییرات بیش از حد مجاز است.");
}

function parseInput(payload: Record<string, unknown>): ShippingMethodInput {
  const text = (key: string) => (typeof payload[key] === "string" ? payload[key] : "");
  return {
    code: text("code"),
    titleFa: text("titleFa"),
    descriptionFa: text("descriptionFa"),
    costRial: typeof payload.costRial === "number" ? payload.costRial : Number.NaN,
    etaFa: text("etaFa"),
    scope: payload.scope === "tehran" || payload.scope === "pickup" ? payload.scope : "nationwide",
    isActive: payload.isActive === true,
    sortOrder: typeof payload.sortOrder === "number" ? payload.sortOrder : 100,
  };
}

export async function GET() {
  return NextResponse.json({ methods: listShippingMethods() });
}

export async function POST(request: Request) {
  try {
    await assertMutation(request);
    const payload = (await request.json()) as Record<string, unknown>;
    const method = saveShippingMethod(parseInput(payload));
    return NextResponse.json({ method }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره روش ارسال انجام نشد." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
