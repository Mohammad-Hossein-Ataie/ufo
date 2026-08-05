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
  return value
    .map((line) => {
      if (typeof line !== "object" || line === null) return null;
      const record = line as Record<string, unknown>;
      const quantity =
        typeof record.quantity === "number" ? record.quantity : Number(record.quantity);
      if (typeof record.variantId !== "string" || !Number.isInteger(quantity) || quantity <= 0)
        return null;
      return { variantId: record.variantId, quantity };
    })
    .filter((line): line is CartSubmissionLine => line !== null);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = url.searchParams.get("phone") ?? undefined;
  const orders = listSubmittedOrders({ channel: "retail", ...(phone ? { phone } : {}) });
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as Record<string, unknown>;
    const customerName = stringValue(payload.customerName || payload.receiverName).trim();
    const phone = stringValue(payload.phone || payload.receiverPhone).trim();
    const city = stringValue(payload.city, "تهران");
    const addressLine = stringValue(payload.address || payload.line1).trim();
    const province = stringValue(payload.province, city === "تهران" ? "تهران" : "");
    const order = createSubmittedOrder({
      channel: "retail",
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
      { error: error instanceof Error ? error.message : "ثبت سفارش انجام نشد." },
      { status: 400 },
    );
  }
}
