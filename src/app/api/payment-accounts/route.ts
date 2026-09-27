import { NextResponse } from "next/server";
import { getBankAccounts } from "@/lib/payment-settings";
export const dynamic = "force-dynamic";
export async function GET() {
  const accounts = getBankAccounts().filter((a) => a.enabled);
  return NextResponse.json({
    accounts,
    demo: !accounts.length,
  });
}
