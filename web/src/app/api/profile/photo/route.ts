import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { prisma } from "@/lib/prisma";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export const runtime = "nodejs";

const MAX_PHOTO_SIZE = 4 * 1024 * 1024;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const possiblePhotoColumns = [
  "profile_photo",
  "profile_image",
  "profile_picture",
  "photo",
  "photo_url",
  "avatar",
  "avatar_url",
  "image",
  "image_url",
];

type ParsedPhotoBody = {
  buffer: Buffer | null;
  mime: string;
};

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

function getPhotoExtension(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";

  return "jpg";
}

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return {
      buffer: Buffer.from(dataUrl, "base64"),
      mime: "image/jpeg",
    };
  }

  return {
    buffer: Buffer.from(match[2], "base64"),
    mime: match[1],
  };
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    mime: file.type || "image/jpeg",
  };
}

async function parsePhotoBody(req: NextRequest): Promise<ParsedPhotoBody> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    const photo =
      formData.get("photo") ||
      formData.get("profilePhoto") ||
      formData.get("profile_photo") ||
      formData.get("avatar") ||
      formData.get("image");

    if (photo instanceof File) {
      const result = await fileToBuffer(photo);

      return {
        buffer: result.buffer,
        mime: result.mime,
      };
    }

    if (typeof photo === "string" && photo.trim()) {
      const result = dataUrlToBuffer(photo);

      return {
        buffer: result.buffer,
        mime: result.mime,
      };
    }

    return {
      buffer: null,
      mime: "image/jpeg",
    };
  }

  const body = (await req.json()) as Record<string, unknown>;

  const photoDataUrl =
    typeof body.photo === "string"
      ? body.photo
      : typeof body.profilePhoto === "string"
        ? body.profilePhoto
        : typeof body.profile_photo === "string"
          ? body.profile_photo
          : typeof body.avatar === "string"
            ? body.avatar
            : typeof body.image === "string"
              ? body.image
              : null;

  if (!photoDataUrl) {
    return {
      buffer: null,
      mime: "image/jpeg",
    };
  }

  const result = dataUrlToBuffer(photoDataUrl);

  return {
    buffer: result.buffer,
    mime: result.mime,
  };
}

async function getUserTableColumns() {
  const columns = await prisma.$queryRaw<Array<{ COLUMN_NAME: string }>>`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
  `;

  return new Set(columns.map((item) => item.COLUMN_NAME));
}

async function getSafeUser(userId: string) {
  const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    userId
  );

  const user = rows[0];

  if (!user) return null;

  delete user.password_hash;
  delete user.password;

  return user;
}

async function savePhoto(buffer: Buffer, mime: string) {
  const uploadDir = path.join(process.cwd(), "public", "uploads", "profiles");
  const extension = getPhotoExtension(mime);
  const filename = `${randomUUID()}.${extension}`;
  const filePath = path.join(uploadDir, filename);
  const publicPath = `/uploads/profiles/${filename}`;

  await mkdir(uploadDir, { recursive: true });
  await writeFile(filePath, buffer);

  return publicPath;
}

async function updateUserPhoto(userId: string, photoUrl: string) {
  const columns = await getUserTableColumns();

  const availablePhotoColumns = possiblePhotoColumns.filter((column) =>
    columns.has(column)
  );

  if (availablePhotoColumns.length === 0) {
    return {
      updated: false,
      columns: availablePhotoColumns,
    };
  }

  const setClauses = availablePhotoColumns.map((column) => `\`${column}\` = ?`);
  const values = availablePhotoColumns.map(() => photoUrl);

  if (columns.has("updated_at")) {
    setClauses.push("`updated_at` = NOW()");
  }

  await prisma.$executeRawUnsafe(
    `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`,
    ...values,
    userId
  );

  return {
    updated: true,
    columns: availablePhotoColumns,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const user = await getSafeUser(userId);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Data user tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const photoUrl =
      possiblePhotoColumns
        .map((column) => user[column])
        .find((value) => typeof value === "string" && value.trim()) || null;

    return NextResponse.json({
      success: true,
      photoUrl,
      profilePhoto: photoUrl,
      photo: photoUrl,
      user,
    });
  } catch (error) {
    console.error("GET_PROFILE_PHOTO_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil foto profil.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Data user tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Akun kamu sedang tidak aktif.",
        },
        { status: 403 }
      );
    }

    const { buffer, mime } = await parsePhotoBody(req);

    if (!buffer) {
      return NextResponse.json(
        {
          success: false,
          message: "Foto profil wajib dikirim.",
        },
        { status: 400 }
      );
    }

    if (!allowedMimeTypes.has(mime)) {
      return NextResponse.json(
        {
          success: false,
          message: "Format foto harus JPG, PNG, atau WEBP.",
        },
        { status: 400 }
      );
    }

    if (buffer.length > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: "Ukuran foto maksimal 4MB.",
        },
        { status: 400 }
      );
    }

    const photoUrl = await savePhoto(buffer, mime);
    const updateResult = await updateUserPhoto(userId, photoUrl);

    if (!updateResult.updated) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Kolom foto profil belum tersedia di tabel users. Tambahkan salah satu kolom: profile_photo, profile_image, photo, avatar, atau avatar_url.",
          photoUrl,
        },
        { status: 400 }
      );
    }

    const safeUser = await getSafeUser(userId);

    return NextResponse.json({
      success: true,
      message: "Foto profil berhasil diperbarui.",
      photoUrl,
      profilePhoto: photoUrl,
      photo: photoUrl,
      updatedColumns: updateResult.columns,
      user: safeUser,
    });
  } catch (error) {
    console.error("UPDATE_PROFILE_PHOTO_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal memperbarui foto profil."),
      },
      { status: getApiErrorStatus(error) }
    );
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}
