import { NextResponse } from "next/server";
import { checkoutCustomerCart, listSubmittedOrders, parseLocation } from "@ufo/orders";
import { hydrateOrderCatalog } from "@/lib/order-catalog";
import type { ShippingMethodCode } from "@ufo/types";
import { requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function shippingMethod(value: unknown): ShippingMethodCode {
  if (typeof value !== "string" || !/^[a-z][a-z0-9_]{2,39}$/.test(value))
    throw new Error("روش ارسال معتبر نیست.");
  return value;
}

export async function GET(request: Request) {
  try {
    const session = requireCustomerSession(request, "wholesale");
    const orders = listSubmittedOrders({ channel: "wholesale", customerId: session.customerId });
    return NextResponse.json({ orders });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت سفارش‌های عمده انجام نشد." },
      { status: 401 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = requireCustomerSession(request, "wholesale");
    const payload = (await request.json()) as Record<string, unknown>;
    const businessName = stringValue(payload.businessName).trim();
    const customerName = stringValue(
      payload.customerName || payload.managerName,
      "مسئول خرید",
    ).trim();
    const phone = stringValue(payload.phone).trim();
    const city = stringValue(payload.city, "تهران");
    const addressLine = stringValue(payload.address || payload.line1).trim();
    const province = stringValue(payload.province, city === "تهران" ? "تهران" : "");
    await hydrateOrderCatalog();
    const order = checkoutCustomerCart({
      channel: "wholesale",
      customerId: session.customerId,
      businessName,
      customerName,
      phone: phone || session.phone,
      address: {
        location: parseLocation(payload.location),
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
      { error: error instanceof Error ? error.message : "ثبت سفارش عمده انجام نشد." },
      { status: 400 },
    );
  }
}
