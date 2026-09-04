import { NextResponse } from "next/server";
import {
  getCustomerAccount,
  updateCustomerAccountProfile,
  type CustomerProfilePatch,
} from "@ufo/orders";
import { checkRateLimit, requireCustomerSession } from "@/lib/customer-session";

export const runtime = "nodejs";

function profilePatch(payload: Record<string, unknown>): CustomerProfilePatch {
  return {
    ...(typeof payload.firstName === "string" ? { firstName: payload.firstName } : {}),
    ...(typeof payload.lastName === "string" ? { lastName: payload.lastName } : {}),
    ...(typeof payload.email === "string" ? { email: payload.email } : {}),
    ...(typeof payload.companyName === "string" ? { companyName: payload.companyName } : {}),
    ...(typeof payload.businessType === "string" ? { businessType: payload.businessType } : {}),
    ...(typeof payload.taxId === "string" ? { taxId: payload.taxId } : {}),
    ...(typeof payload.customerLevel === "string" ? { customerLevel: payload.customerLevel } : {}),
    ...(typeof payload.pricingGroup === "string" ? { pricingGroup: payload.pricingGroup } : {}),
  };
}

export async function GET(request: Request) {
  try {
    const session = requireCustomerSession(request);
    const customer = getCustomerAccount(session.customerId);
    if (!customer) throw new Error("حساب مشتری پیدا نشد.");
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت پروفایل انجام نشد." },
      { status: 401 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = requireCustomerSession(request);
    const limit = checkRateLimit(`profile:${session.customerId}`, 30, 60_000);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تعداد تغییرات بیش از حد مجاز است." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
      );
    }
    const payload = (await request.json()) as Record<string, unknown>;
    const customer = updateCustomerAccountProfile(session.customerId, profilePatch(payload));
    return NextResponse.json({ customer });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "بروزرسانی پروفایل انجام نشد." },
      { status: 400 },
    );
  }
}
