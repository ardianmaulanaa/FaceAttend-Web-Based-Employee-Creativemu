import { Buffer } from "node:buffer";

import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type ParsedPhotoBody = {
  buffer: Buffer | null;
  mime: string;
};

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getUserIdFromRequest(req: NextRequest) {
  try {
    const { id } = await requireAuth(req);
    return id;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("aktif") || message.includes("akses")) {
      throw new ApiError(403, "Akun kamu sedang tidak aktif.");
    }

    throw new ApiError(401, "Sesi login tidak valid atau sudah kedaluwarsa.");
  }
}

function dataUrlToBuffer(dataUrl: string): ParsedPhotoBody {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);

  if (!match) {
    return {
      buffer: Buffer.from(dataUrl, "base64"),
      mime: "image/jpeg",
    };
  }

  return {
    buffer: Buffer.from(match[2], "base64"),
    mime: match[1].toLowerCase(),
  };
}

async function fileToBuffer(file: File): Promise<ParsedPhotoBody> {
  const arrayBuffer = await file.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    mime: (file.type || "image/jpeg").toLowerCase(),
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
      return fileToBuffer(photo);
    }

    if (typeof photo === "string" && photo.trim()) {
      return dataUrlToBuffer(photo.trim());
    }

    return {
      buffer: null,
      mime: "image/jpeg",
    };
  }

  if (!contentType.includes("application/json")) {
    throw new ApiError(
      400,
      "Content-Type harus multipart/form-data atau application/json.",
    );
  }

  let body: Record<string, unknown>;

  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "Data JSON foto tidak valid.");
  }

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

  if (!photoDataUrl?.trim()) {
    return {
      buffer: null,
      mime: "image/jpeg",
    };
  }

  return dataUrlToBuffer(photoDataUrl.trim());
}

function getProfilePhotoEndpoint(userId: string) {
  return `/api/profil/photo?userId=${encodeURIComponent(userId)}&raw=1`;
}

function toPrismaBytes(buffer: Buffer): Uint8Array<ArrayBuffer> {
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength,
  ) as ArrayBuffer;

  return new Uint8Array(arrayBuffer);
}

async function getSafeUser(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      employee_code: true,
      name: true,
      email: true,
      role: true,
      employee_type: true,
      phone: true,
      status: true,
      profile_photo: true,
      profile_photo_public_id: true,
      jabatan_id: true,
      department_id: true,
      position_id: true,
      shift_id: true,
      registered_office_id: true,
      npwp_number: true,
      ptkp_status: true,
      base_salary: true,
      created_at: true,
      updated_at: true,
    },
  });
}

function errorResponse(error: unknown, fallbackMessage: string) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      {
        status: error.status,
      },
    );
  }

  console.error(fallbackMessage, error);

  return NextResponse.json(
    {
      success: false,
      message: "Terjadi kesalahan pada server.",
    },
    {
      status: 500,
    },
  );
}

export async function GET(req: NextRequest) {
  try {
    const authUserId = await getUserIdFromRequest(req);
    const requestedUserId = req.nextUrl.searchParams.get("userId") || authUserId;
    const isRaw = req.nextUrl.searchParams.get("raw") === "1";
    const user = await getSafeUser(requestedUserId);

    if (!user) {
      throw new ApiError(404, "Data user tidak ditemukan.");
    }

    if (isRaw) {
      const rows = await prisma.$queryRawUnsafe<
        Array<{ profile_photo_data: Buffer | Uint8Array | null; profile_photo_mime: string | null }>
      >(
        "SELECT profile_photo_data, profile_photo_mime FROM users WHERE id = ? LIMIT 1",
        requestedUserId,
      );
      const photo = rows[0];

      if (!photo?.profile_photo_data) {
        throw new ApiError(404, "Foto profil tidak ditemukan.");
      }

      return new NextResponse(Buffer.from(photo.profile_photo_data), {
        headers: {
          "Content-Type": photo.profile_photo_mime || "image/jpeg",
          "Cache-Control": "private, no-store, max-age=0",
        },
      });
    }

    const photoUrl = user.profile_photo ? getProfilePhotoEndpoint(requestedUserId) : null;

    return NextResponse.json({
      success: true,
      photoUrl,
      profilePhoto: photoUrl,
      photo: photoUrl,
      user: {
        ...user,
        profile_photo: photoUrl,
      },
    });
  } catch (error) {
    return errorResponse(error, "GET_PROFILE_PHOTO_ERROR:");
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const currentUser = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        status: true,
        profile_photo_public_id: true,
      },
    });

    if (!currentUser) {
      throw new ApiError(404, "Data user tidak ditemukan.");
    }

    if (currentUser.status !== "active") {
      throw new ApiError(403, "Akun kamu sedang tidak aktif.");
    }

    const { buffer, mime } = await parsePhotoBody(req);

    if (!buffer || buffer.length === 0) {
      throw new ApiError(400, "Foto profil wajib dikirim.");
    }

    if (!ALLOWED_MIME_TYPES.has(mime)) {
      throw new ApiError(400, "Format foto harus JPG, PNG, atau WEBP.");
    }

    if (buffer.length > MAX_PHOTO_SIZE) {
      throw new ApiError(400, "Ukuran foto maksimal 5MB.");
    }

    const photoUrl = getProfilePhotoEndpoint(userId);
    const photoPublicId = null;

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        profile_photo: photoUrl,
        profile_photo_public_id: photoPublicId,
        profile_photo_data: toPrismaBytes(buffer),
        profile_photo_mime: mime,
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        employee_type: true,
        phone: true,
        status: true,
        profile_photo: true,
        profile_photo_public_id: true,
        jabatan_id: true,
        department_id: true,
        position_id: true,
        shift_id: true,
        registered_office_id: true,
        npwp_number: true,
        ptkp_status: true,
        base_salary: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Foto profil berhasil diperbarui.",
      photoUrl,
      profilePhoto: photoUrl,
      photo: photoUrl,
      publicId: photoPublicId,
      user: updatedUser,
    });
  } catch (error) {
    return errorResponse(error, "UPDATE_PROFILE_PHOTO_ERROR:");
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}
