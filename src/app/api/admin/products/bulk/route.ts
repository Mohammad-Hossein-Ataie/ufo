import { NextResponse } from "next/server";
import { requireAdminMutation, adminRequestErrorStatus } from "@/lib/admin-request";
import { bulkProductSchema, bulkUpdateProducts } from "@/lib/admin-product-bulk";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    await requireAdminMutation(request);
    const text = await request.text();
    if (text.length > 30000)
      return NextResponse.json({ error: "درخواست بیش از حد بزرگ است." }, { status: 413 });
    const input = bulkProductSchema.safeParse(JSON.parse(text));
    if (!input.success)
      return NextResponse.json(
        { error: "عملیات یا مقادیر معتبر نیست؛ حداکثر ۱۰۰ محصول انتخاب کنید." },
        { status: 400 },
      );
    return NextResponse.json(await bulkUpdateProducts(input.data));
  } catch (error) {
    return NextResponse.json(
      { error: "انجام عملیات گروهی ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
