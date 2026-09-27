import { NextResponse } from "next/server";
import { chooseManualPayment, getSubmittedOrderForCustomer } from "@ufo/orders";
import { requireCustomerSession } from "@/lib/customer-session";
import { getBankAccounts } from "@/lib/payment-settings";
export const runtime = "nodejs";
export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  let session;
  try {
    session = requireCustomerSession(request);
  } catch {
    return NextResponse.json({ error: "برای تغییر روش پرداخت وارد شوید." }, { status: 401 });
  }
  const { orderId } = await params;
  if (!getSubmittedOrderForCustomer(orderId, session.customerId, session.customerType))
    return NextResponse.json({ error: "سفارش پیدا نشد." }, { status: 404 });
  try {
    if (!getBankAccounts().some((account) => account.enabled))
      throw new Error("حساب بانکی فروشگاه هنوز فعال نشده است.");
    return NextResponse.json({
      order: chooseManualPayment(orderId, session.customerId, session.customerType),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "تغییر روش پرداخت انجام نشد." },
      { status: 400 },
    );
  }
}
