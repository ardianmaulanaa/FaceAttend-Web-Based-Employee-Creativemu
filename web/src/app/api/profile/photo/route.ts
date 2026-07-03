import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

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

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const formData = await req.formData();
    const file = formData.get("photo");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "File foto wajib dikirim.",
        },
        { status: 400 }
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Format foto harus JPG, PNG, atau WEBP.",
        },
        { status: 400 }
      );
    }

    const maxSize = 2 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "Ukuran foto maksimal 2MB.",
        },
        { status: 400 }
      );
    }

    const extension =
      file.type === "image/png"
        ? "png"
        : file.type === "image/webp"
          ? "webp"
          : "jpg";

    const fileName = `${userId}-${randomUUID()}.${extension}`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );

    await mkdir(uploadDir, { recursive: true });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/profiles/${fileName}`;

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profile_photo: publicUrl,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile_photo: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Foto profil berhasil diperbarui.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("UPLOAD_PROFILE_PHOTO_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal upload foto profil.",
      },
      { status: 500 }
    );
  }
}