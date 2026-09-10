import { NextResponse } from "next/server";
import { checkoutCustomerCart, listSubmittedOrders, parseLocation } from "@ufo/orders";
import type { ShippingMethodCode } from "@ufo/types";
import { requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function bounded(value: unknown, maxLength: number, field: string, fallback = ""): string {
  const result = stringValue(value, fallback).trim();
  if (result.length > maxLength) throw new Error(`${field} بیش از حد طولانی است.`);
  return result;
}

function shippingMethod(value: unknown): ShippingMethodCode {
  if (typeof value !== "string" || !/^[a-z][a-z0-9_]{2,39}$/.test(value)) {
    throw new Error("روش ارسال معتبر نیست.");
  }
  return value;
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
    const customerName = bounded(payload.customerName || payload.receiverName, 100, "نام گیرنده");
    const phone = bounded(payload.phone || payload.receiverPhone, 20, "شماره موبایل");
    const city = bounded(payload.city, 80, "شهر", "تهران");
    const addressLine = bounded(payload.address || payload.line1, 500, "نشانی");
    const province = bounded(payload.province, 80, "استان", city === "تهران" ? "تهران" : "");
    const postalCode = stringValue(payload.postalCode).replace(/\D/g, "");
    if (postalCode && postalCode.length !== 10) throw new Error("کد پستی باید ۱۰ رقم باشد.");
    const receiptNote = bounded(payload.receiptNote, 1_000, "توضیحات سفارش");
    const order = checkoutCustomerCart({
      channel: "retail",
      customerId: session.customerId,
      customerName,
      phone: phone || session.phone,
      address: {
        location: parseLocation(payload.location),
        province,
        city,
        line1: addressLine,
        ...(postalCode ? { postalCode } : {}),
        receiverName: customerName,
        receiverPhone: phone || session.phone,
      },
      shippingMethod: shippingMethod(payload.shippingMethod),
      paymentMethod: "card_to_card",
      receiptNote,
    });
    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ثبت سفارش انجام نشد." },
      { status: 400 },
    );
  }
}
