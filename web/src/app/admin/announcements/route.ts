import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

async function getAdminUser(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  if (user.role !== "admin") {
    throw new Error("Akses hanya untuk admin.");
  }

  return user;
}

function normalizeTarget(target: unknown) {
  if (target === "admin") return "admin";
  if (target === "employee") return "employee";
  return "all";
}

function normalizeStatus(status: unknown) {
  if (status === "draft") return "draft";
  if (status === "archived") return "archived";
  return "published";
}

export async function GET(req: NextRequest) {
  try {
    await getAdminUser(req);

    const announcements = await prisma.announcement.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        target: true,
        status: true,
        created_at: true,
        updated_at: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      announcements,
    });
  } catch (error) {
    console.error("ADMIN_GET_ANNOUNCEMENTS_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil pengumuman.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminUser(req);

    const body = await req.json();

    const title = String(body.title || "").trim();
    const content = String(body.content || "").trim();
    const target = normalizeTarget(body.target);
    const status = normalizeStatus(body.status);

    if (!title) {
      return NextResponse.json(
        { error: "Judul pengumuman wajib diisi." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Isi pengumuman wajib diisi." },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        target,
        status,
        author_id: admin.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengumuman berhasil disimpan.",
      announcement,
    });
  } catch (error) {
    console.error("ADMIN_CREATE_ANNOUNCEMENT_ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan pengumuman.",
      },
      { status: 500 }
    );
  }
}