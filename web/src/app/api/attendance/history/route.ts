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

function formatTime(date?: Date | null) {
  if (!date) return "--:--";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatStatus(status?: string | null, lateMinutes = 0) {
  if (lateMinutes > 0) return "Terlambat";

  const statusMap: Record<string, string> = {
    PENDING: "Pending",
    PRESENT: "Masuk kerja",
    COMPLETED: "Selesai",
    LATE: "Terlambat",
    ABSENT: "Tidak hadir",
    LEAVE: "Cuti",
    SICK: "Sakit",
  };

  return statusMap[status || ""] || status || "Pending";
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const { searchParams } = new URL(req.url);

    const now = new Date();

    const month = Number(searchParams.get("month")) || now.getMonth() + 1;
    const year = Number(searchParams.get("year")) || now.getFullYear();

    const sortParam = searchParams.get("sort");
    const sort: "asc" | "desc" = sortParam === "asc" ? "asc" : "desc";

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const attendances = await prisma.attendance.findMany({
      where: {
        user_id: userId,
        attendance_date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: [
        {
          attendance_date: sort,
        },
        {
          created_at: sort,
        },
      ],
      select: {
        id: true,
        attendance_date: true,
        check_in_time: true,
        check_out_time: true,
        status: true,
        late_minutes: true,
        early_leave_minutes: true,
        work_minutes: true,
      },
    });

    const records = attendances.map((item) => ({
      id: item.id,
      date: formatDateKey(item.attendance_date),
      checkIn: formatTime(item.check_in_time),
      checkOut: formatTime(item.check_out_time),
      status: formatStatus(item.status, item.late_minutes),
      lateMinutes: item.late_minutes,
      earlyLeaveMinutes: item.early_leave_minutes,
      workMinutes: item.work_minutes,
    }));

    return NextResponse.json({
      message: "Riwayat absensi berhasil diambil.",
      records,
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