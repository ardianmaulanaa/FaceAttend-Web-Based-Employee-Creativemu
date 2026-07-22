import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_ROLES = new Set(["owner", "admin"]);
const EMPLOYEE_ROLES = new Set(["employee", "owner", "admin"]);
const EMPLOYEE_PATHS = [
  "/home",
  "/attendance",
  "/history",
  "/profile",
  "/cuti",
  "/notifikasi",
  "/pengumuman",
];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum diatur di .env");
  }

  return new TextEncoder().encode(secret);
}

function unauthorizedApi(message: string, status = 401) {
  return NextResponse.json({ success: false, message }, { status });
}

function isEmployeePage(pathname: string) {
  return EMPLOYEE_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function redirectToLogin(req: NextRequest, pathname: string) {
  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);

  return NextResponse.redirect(loginUrl);
}

function redirectToHome(req: NextRequest) {
  const homeUrl = req.nextUrl.clone();
  homeUrl.pathname = "/home";
  homeUrl.search = "";

  return NextResponse.redirect(homeUrl);
}

function redirectToAdmin(req: NextRequest) {
  const adminUrl = req.nextUrl.clone();
  adminUrl.pathname = "/admin/dashboard";
  adminUrl.search = "";

  return NextResponse.redirect(adminUrl);
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const isAdminApi =
    pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const employeePage = isEmployeePage(pathname);

  if (!isAdminPage && !isAdminApi && !employeePage) {
    return NextResponse.next();
  }

  const token = req.cookies.get("faceattend_token")?.value;

  if (!token) {
    if (isAdminApi) {
      return unauthorizedApi("Silakan login terlebih dahulu.");
    }

    return redirectToLogin(req, pathname);
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = String(payload.role || "").toLowerCase();

    if ((isAdminPage || isAdminApi) && !ADMIN_ROLES.has(role)) {
      if (isAdminApi) {
        return unauthorizedApi("Akses admin ditolak.", 403);
      }

      return redirectToHome(req);
    }

    if (employeePage && !EMPLOYEE_ROLES.has(role)) {
      return redirectToLogin(req, pathname);
    }

    return NextResponse.next();
  } catch {
    if (isAdminApi) {
      return unauthorizedApi("Sesi login tidak valid.");
    }

    const response = redirectToLogin(req, pathname);
    response.cookies.delete("faceattend_token");

    return response;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/home/:path*",
    "/attendance/:path*",
    "/history/:path*",
    "/profile/:path*",
    "/cuti/:path*",
    "/notifikasi/:path*",
    "/pengumuman/:path*",
  ],
};
