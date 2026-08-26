import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const username = typeof payload.username === "string" ? payload.username : "";
  const password = typeof payload.password === "string" ? payload.password : "";

  try {
    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور نادرست است." }, { status: 401 });
    }
  } catch (error) {
    console.error("Admin login configuration error", error);
    return NextResponse.json(
      {
        error:
          "تنظیمات ورود ادمین در سرور کامل نیست. مقدار ADMIN_PASSWORD را در محیط پروداکشن بررسی کنید.",
      },
      { status: 500 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "authenticated", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}
