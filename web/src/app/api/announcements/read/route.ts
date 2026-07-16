import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { addReadReceipt, getReadReceipts } from "@/lib/jsonDb";

export const runtime = "nodejs";

async function getCurrentUser(req: NextRequest) {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  return user;
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);
    const body = await req.json();
    const announcementId = String(body.announcementId || "");

    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: "ID pengumuman wajib dikirim." },
        { status: 400 }
      );
    }

    await addReadReceipt(announcementId, currentUser.email, currentUser.name);

    return NextResponse.json({
      success: true,
      message: "Tanda baca pengumuman berhasil disimpan.",
    });
  } catch (error) {
    console.error("POST /api/announcements/read error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal menyimpan tanda baca.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const announcementId = url.searchParams.get("announcementId") || "";

    if (!announcementId) {
      return NextResponse.json(
        { success: false, message: "ID pengumuman wajib dikirim." },
        { status: 400 }
      );
    }

    const receipts = await getReadReceipts();
    const readers = receipts
      .filter((r) => r.announcementId === announcementId)
      .map((r) => ({
        userName: r.userName,
        userEmail: r.userEmail,
        timestamp: r.timestamp,
      }));

    return NextResponse.json({
      success: true,
      readers,
    });
  } catch (error) {
    console.error("GET /api/announcements/read error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil daftar pembaca.",
      },
      { status: 500 }
    );
  }
}
