import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";

const ALLOWED_EMAIL_DOMAIN = "@creativemu.com";

function isCreativemuEmail(email: string) {
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (!isCreativemuEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Login hanya dapat menggunakan email resmi @creativemu.com.",
        },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Akun tidak aktif" },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(
      normalizedPassword,
      user.password_hash
    );

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
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
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}