import { NextResponse } from "next/server";
import { deleteCustomerAddress, updateCustomerAddress } from "@ufo/orders";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ addressId: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = requireCustomerSession(request, "retail");
    const limit = checkRateLimit(`address:${session.customerId}`, 20, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تعداد تغییرات بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
    const { addressId } = await context.params;
    const payload = (await request.json()) as Record<string, unknown>;
    const address = updateCustomerAddress(session.customerId, addressId, {
      ...(typeof payload.label === "string" ? { label: payload.label } : {}),
      ...(typeof payload.province === "string" ? { province: payload.province } : {}),
      ...(typeof payload.city === "string" ? { city: payload.city } : {}),
      ...(typeof payload.line1 === "string" ? { line1: payload.line1 } : {}),
      ...(typeof payload.postalCode === "string" ? { postalCode: payload.postalCode } : {}),
      ...(typeof payload.receiverName === "string" ? { receiverName: payload.receiverName } : {}),
      ...(typeof payload.receiverPhone === "string"
        ? { receiverPhone: payload.receiverPhone }
        : {}),
      ...(typeof payload.isDefault === "boolean" ? { isDefault: payload.isDefault } : {}),
    });
    return NextResponse.json({ address });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ویرایش آدرس انجام نشد." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = requireCustomerSession(request, "retail");
    const { addressId } = await context.params;
    deleteCustomerAddress(session.customerId, addressId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حذف آدرس انجام نشد." },
      { status: 400 },
    );
  }
}
