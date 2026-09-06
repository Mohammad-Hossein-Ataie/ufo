import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";
import { assertSameOrigin, RequestOriginError } from "@/lib/request-origin";

const adminSessionCookie = "ufo_admin_session";
const publicAdminPaths = new Set(["/admin/login", "/api/admin/login"]);

function validateAdminOrigin(request: NextRequest): NextResponse {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return NextResponse.next();
  try {
    assertSameOrigin(request);
    return NextResponse.next();
  } catch (error) {
    if (error instanceof RequestOriginError) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error("Admin origin configuration is invalid.");
    return NextResponse.json({ error: "تنظیمات امنیتی سرور کامل نیست." }, { status: 500 });
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();
  if (publicAdminPaths.has(pathname))
    return isAdminApi ? validateAdminOrigin(request) : NextResponse.next();

  const hasSession = await verifyAdminSessionToken(request.cookies.get(adminSessionCookie)?.value);
  if (hasSession) return isAdminApi ? validateAdminOrigin(request) : NextResponse.next();

  if (isAdminApi) {
    return NextResponse.json({ error: "ورود ادمین لازم است." }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
