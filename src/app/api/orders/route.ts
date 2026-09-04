import { NextResponse } from "next/server";
import { checkoutCustomerCart, listSubmittedOrders } from "@ufo/orders";
import type { ShippingMethodCode } from "@ufo/types";
import { requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function shippingMethod(value: unknown): ShippingMethodCode {
  if (value === "tehran_courier" || value === "pickup" || value === "tipax") return value;
  return "tipax";
}

export async function GET(request: Request) {
  try {
    const session = requireCustomerSession(request, "retail");
    const orders = listSubmittedOrders({ channel: "retail", customerId: session.customerId });
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت سفارش‌ها انجام نشد." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = requireCustomerSession(request, "retail");
    const payload = (await request.json()) as Record<string, unknown>;
    const customerName = stringValue(payload.customerName || payload.receiverName).trim();
    const phone = stringValue(payload.phone || payload.receiverPhone).trim();
    const city = stringValue(payload.city, "تهران");
    const addressLine = stringValue(payload.address || payload.line1).trim();
    const province = stringValue(payload.province, city === "تهران" ? "تهران" : "");
    const order = checkoutCustomerCart({
      channel: "retail",
      customerId: session.customerId,
      customerName,
      phone: phone || session.phone,
      address: {
        province,
        city,
        line1: addressLine,
        receiverName: customerName,
        receiverPhone: phone || session.phone,
      },
      shippingMethod: shippingMethod(payload.shippingMethod),
      paymentMethod: "card_to_card",
      receiptNote: stringValue(payload.receiptNote),
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ثبت سفارش انجام نشد." },
      { status: 400 },
    );
  }
}
