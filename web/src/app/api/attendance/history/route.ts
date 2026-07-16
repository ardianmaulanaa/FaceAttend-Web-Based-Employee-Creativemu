import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export const runtime = "nodejs";

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

function formatStatus(status?: string | null, lateMinutes = 0, activityNote?: string | null) {
  if (activityNote?.includes("overtime")) return "Lembur";
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
    const { id: userId } = await requireAuth(req);

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
        activity_note: true,
      },
    });

    const records = attendances.map((item) => ({
      id: item.id,
      date: formatDateKey(item.attendance_date),
      checkIn: formatTime(item.check_in_time),
      checkOut: formatTime(item.check_out_time),
      status: formatStatus(item.status, item.late_minutes, item.activity_note),
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
        message: getApiErrorMessage(error, "Gagal mengambil riwayat absensi."),
      },
      { status: getApiErrorStatus(error) }
    );
  }
}
