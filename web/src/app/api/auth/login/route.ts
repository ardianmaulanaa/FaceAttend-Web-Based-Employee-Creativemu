import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";
import { findDemoUserByEmail, isDatabaseUnavailable } from "@/lib/demoStore";
import { canViewAdminPanel } from "@/lib/adminAccess";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  try {
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    const demoUser = findDemoUserByEmail(String(email || ""));
    if (demoUser && demoUser.password === String(password || "")) {
      const token = await createToken({
        id: demoUser.id,
        email: demoUser.email,
        role: demoUser.role,
      });

      const redirectTo = canViewAdminPanel(demoUser.role)
        ? "/admin/dashboard"
        : "/home";

      const response = NextResponse.json({
        success: true,
        message: "Login berhasil (demo mode)",
        redirectTo,
        user: {
          id: demoUser.id,
          name: demoUser.name,
          email: demoUser.email,
          role: demoUser.role,
          status: demoUser.status,
          must_change_password: demoUser.must_change_password,
        },
      });

      response.cookies.set("faceattend_token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      });

      return response;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Akun tidak aktif" },
        { status: 403 },
      );
    }

    const isValidPassword = await verifyPassword(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 },
      );
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const redirectTo = user.role === "admin" ? "/admin/dashboard" : "/home";

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    response.cookies.set("faceattend_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error(error);

    if (!isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { success: false, message: "Terjadi kesalahan server" },
        { status: 500 },
      );
    }

    const user = findDemoUserByEmail(String(email || ""));

    if (!user || user.password !== String(password || "")) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 },
      );
    }

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const redirectTo = canViewAdminPanel(user.role)
      ? "/admin/dashboard"
      : "/home";

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil (demo mode)",
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        must_change_password: user.must_change_password,
      },
    });

    response.cookies.set("faceattend_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  }
}
