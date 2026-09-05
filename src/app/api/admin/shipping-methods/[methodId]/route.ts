import { NextResponse } from "next/server";
import { deleteShippingMethod, saveShippingMethod, type ShippingMethodInput } from "@ufo/orders";
import { checkRateLimit } from "@/lib/customer-session";

export const runtime = "nodejs";
type Context = { params: Promise<{ methodId: string }> };

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) throw new Error("مبدأ درخواست معتبر نیست.");
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

export async function PATCH(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { methodId } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    return NextResponse.json({ method: saveShippingMethod(parseInput(payload), methodId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ویرایش روش ارسال انجام نشد." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    assertSameOrigin(request);
    const { methodId } = await context.params;
    deleteShippingMethod(methodId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حذف روش ارسال انجام نشد." },
      { status: 400 },
    );
  }
}
