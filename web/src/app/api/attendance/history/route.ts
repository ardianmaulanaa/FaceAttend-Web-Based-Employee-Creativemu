import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const { searchParams } = new URL(req.url);

    const now = new Date();
    const month = Number(searchParams.get("month") || now.getMonth() + 1);
    const year = Number(searchParams.get("year") || now.getFullYear());

    const startDate = new Date(Date.UTC(year, month - 1, 1));
const endDate = new Date(Date.UTC(year, month, 1));

    const attendances = await prisma.attendance.findMany({
      where: {
        userId,
        checkInTime: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        checkInTime: "desc",
      },
    });

    return NextResponse.json({
      message: "Riwayat absensi berhasil diambil.",
      attendances,
    });
  } catch (error) {
    console.error("HISTORY_ATTENDANCE_ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil riwayat absensi.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}