import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;

  if (!token) {
    throw new Error("Token login tidak ditemukan.");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum ada di file .env");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);

  const userId =
    (payload.id as string | undefined) ||
    (payload.userId as string | undefined) ||
    (payload.sub as string | undefined);

  if (!userId) {
    throw new Error("User ID tidak ditemukan di token.");
  }

  return userId;
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const body = await req.json();

    const currentPassword = String(body.current_password || "");
    const newPassword = String(body.new_password || "");
    const confirmPassword = String(body.confirm_password || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        {
          message: "Password lama, password baru, dan konfirmasi wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          message: "Password baru minimal 8 karakter.",
        },
        { status: 400 },
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          message: "Konfirmasi password tidak sama.",
        },
        { status: 400 },
      );
    }

    if (currentPassword === newPassword) {
      return NextResponse.json(
        {
          message: "Password baru tidak boleh sama dengan password lama.",
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        password: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: "User tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          message: "Akun tidak aktif.",
        },
        { status: 403 },
      );
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          message: "Password lama salah.",
        },
        { status: 400 },
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    return NextResponse.json({
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    console.error("PATCH /api/profile/change-password error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengubah password.",
      },
      { status: 500 },
    );
  }
}