import { NextResponse, type NextRequest } from "next/server";
import { verifyAdminSessionToken } from "@/lib/admin-session";

const adminSessionCookie = "ufo_admin_session";
const publicAdminPaths = new Set(["/admin/login", "/api/admin/login"]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi = pathname.startsWith("/api/admin/");

  if (!isAdminPage && !isAdminApi) return NextResponse.next();
  if (publicAdminPaths.has(pathname)) return NextResponse.next();

  const hasSession = await verifyAdminSessionToken(request.cookies.get(adminSessionCookie)?.value);
  if (hasSession) return NextResponse.next();

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
