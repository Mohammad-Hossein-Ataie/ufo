import { NextResponse } from "next/server";
import { getBankAccounts, saveBankAccounts } from "@/lib/payment-settings";
import {
  requireAdminRead,
  requireAdminMutation,
  adminRequestErrorStatus,
} from "@/lib/admin-request";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAdminRead(request);
    return NextResponse.json({ accounts: getBankAccounts() });
  } catch (error) {
    return NextResponse.json(
      { error: "ورود ادمین لازم است." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
export async function PUT(request: Request) {
  try {
    await requireAdminMutation(request);
    const text = await request.text();
    if (text.length > 10000) throw new Error("حجم درخواست زیاد است.");
    return NextResponse.json({ accounts: saveBankAccounts(JSON.parse(text).accounts) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره انجام نشد." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
