import { NextResponse } from "next/server";
import { createSubmittedOrder, listSubmittedOrders, type CartSubmissionLine } from "@ufo/orders";
import type { ShippingMethodCode } from "@ufo/types";

export const runtime = "nodejs";

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function shippingMethod(value: unknown): ShippingMethodCode {
  if (value === "tehran_courier" || value === "pickup" || value === "tipax") return value;
  return "tipax";
}

function cartLines(value: unknown): CartSubmissionLine[] {
  if (!Array.isArray(value)) return [];
  const lines: CartSubmissionLine[] = [];
  value.forEach((line) => {
    if (typeof line !== "object" || line === null) return;
    const record = line as Record<string, unknown>;
    const quantity =
      typeof record.quantity === "number" ? record.quantity : Number(record.quantity);
    const cartonCount =
      typeof record.cartonCount === "number" ? record.cartonCount : Number(record.cartonCount);
    if (
      typeof record.variantId !== "string" ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isInteger(cartonCount) ||
      cartonCount <= 0
    ) {
      return;
    }
    lines.push({ variantId: record.variantId, quantity, cartonCount });
  });
  return lines;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = url.searchParams.get("phone") ?? undefined;
  const orders = listSubmittedOrders({ channel: "wholesale", ...(phone ? { phone } : {}) });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
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
    const order = createSubmittedOrder({
      channel: "wholesale",
      businessName,
      customerName,
      phone,
      address: {
        province,
        city,
        line1: addressLine,
        receiverName: customerName,
        receiverPhone: phone,
      },
      lines: cartLines(payload.lines),
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
