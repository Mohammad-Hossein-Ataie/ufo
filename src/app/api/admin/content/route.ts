import { NextResponse } from "next/server";
import { requireAdminMutation, requireAdminRead, adminRequestErrorStatus } from "@/lib/admin-request";
import { listAdminPosts, saveContentPost } from "@/lib/content-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminRead(request);
    return NextResponse.json({ posts: await listAdminPosts() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت مطالب ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminMutation(request);
    const post = await saveContentPost(await request.json());
    return NextResponse.json({ post, message: "مطلب ذخیره شد." }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره مطلب ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
