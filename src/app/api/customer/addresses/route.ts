import { NextResponse } from "next/server";
import {
  createCustomerAddress,
  parseLocation,
  listCustomerAddresses,
  type CustomerAddressInput,
} from "@ufo/orders";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

function addressInput(payload: Record<string, unknown>): CustomerAddressInput {
  const value = (key: string) => (typeof payload[key] === "string" ? payload[key] : "");
  return {
    location: parseLocation(payload.location),
    label: value("label"),
    province: value("province"),
    city: value("city"),
    line1: value("line1"),
    ...(value("postalCode") ? { postalCode: value("postalCode") } : {}),
    receiverName: value("receiverName"),
    receiverPhone: value("receiverPhone"),
    isDefault: payload.isDefault === true,
  };
}

export async function GET(request: Request) {
  try {
    const session = requireCustomerSession(request);
    return NextResponse.json({ addresses: listCustomerAddresses(session.customerId) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت آدرس‌ها انجام نشد." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = requireCustomerSession(request);
    const limit = checkRateLimit(`address:${session.customerId}`, 20, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تعداد تغییرات بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
    const payload = (await request.json()) as Record<string, unknown>;
    const address = createCustomerAddress(session.customerId, addressInput(payload));
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره آدرس انجام نشد." },
      { status: 400 },
    );
  }
}
