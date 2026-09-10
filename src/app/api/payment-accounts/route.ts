import { NextResponse } from "next/server";
import { getBankAccounts } from "@/lib/payment-settings";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({
    accounts: getBankAccounts().filter((a) => a.enabled),
    demo: !getBankAccounts().some((a) => a.enabled),
  });
}
