import { NextResponse } from "next/server";
import { requireAdminMutation, requireAdminRead, adminRequestErrorStatus } from "@/lib/admin-request";
import { deleteContentPost, getAdminPost, saveContentPost } from "@/lib/content-posts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ postId: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    await requireAdminRead(request);
    const post = await getAdminPost((await params).postId);
    return post
      ? NextResponse.json({ post })
      : NextResponse.json({ error: "مطلب پیدا نشد." }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت مطلب ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    await requireAdminMutation(request);
    const post = await saveContentPost(await request.json(), (await params).postId);
    return NextResponse.json({ post, message: "تغییرات مطلب ذخیره شد." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ویرایش مطلب ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    await requireAdminMutation(request);
    const deleted = await deleteContentPost((await params).postId);
    return deleted
      ? NextResponse.json({ message: "مطلب حذف شد." })
      : NextResponse.json({ error: "مطلب پیدا نشد." }, { status: 404 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "حذف مطلب ناموفق بود." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
