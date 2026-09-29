import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  listSiteAnnouncements,
  saveSiteAnnouncements,
} from "@/lib/site-announcements";
import {
  adminRequestErrorStatus,
  requireAdminMutation,
  requireAdminRead,
} from "@/lib/admin-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminRead(request);
    return NextResponse.json({ announcements: listSiteAnnouncements() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "دریافت اعلان‌ها انجام نشد." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdminMutation(request);
    const body = await request.text();
    if (body.length > 50_000) throw new Error("حجم درخواست بیش از حد مجاز است.");
    const payload = JSON.parse(body) as { announcements?: unknown };
    const announcements = saveSiteAnnouncements(payload.announcements);
    revalidatePath("/", "layout");
    return NextResponse.json({ announcements });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "ذخیره اعلان‌ها انجام نشد." },
      { status: adminRequestErrorStatus(error) },
    );
  }
}
