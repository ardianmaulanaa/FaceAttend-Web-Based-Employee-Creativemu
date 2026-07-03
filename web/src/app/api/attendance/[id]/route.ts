import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function calculateWorkMinutes(
  checkInTime?: Date | null,
  checkOutTime?: Date | null,
) {
  if (!checkInTime || !checkOutTime) return 0;

  const diffMs = checkOutTime.getTime() - checkInTime.getTime();

  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / 1000 / 60);
}

function toJakartaDate(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

function getDayOfWeekEnum(date = new Date()) {
  const dayIndex = toJakartaDate(date).getDay();

  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return days[dayIndex];
}

function timeToMinutes(time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText || 0);
  const minute = Number(minuteText || 0);

  return hour * 60 + minute;
}

function dateToMinutes(date: Date) {
  const jakartaDate = toJakartaDate(date);

  return jakartaDate.getHours() * 60 + jakartaDate.getMinutes();
}

function normalizeTime(value?: string | null, fallback = "17:00") {
  const raw = String(value || "")
    .trim()
    .replace(".", ":");

  if (/^\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  return fallback;
}

function getDefaultCheckOutTimeByShift(shiftName?: string | null) {
  const name = String(shiftName || "").toUpperCase();

  if (name.includes("SIANG")) return "17:00";
  if (name.includes("PAGI")) return "17:00";
  if (name.includes("MAGANG")) return "17:00";
  if (name.includes("UTAMA")) return "17:00";

  return "17:00";
}

function calculateEarlyLeaveMinutes(
  checkOutTime?: Date | null,
  scheduledCheckOutTime = "17:00",
) {
  if (!checkOutTime) return 0;

  const checkOutMinutes = dateToMinutes(checkOutTime);
  const scheduledMinutes = timeToMinutes(scheduledCheckOutTime);

  const early = scheduledMinutes - checkOutMinutes;

  return early > 0 ? early : 0;
}

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
    hour12: false,
  })
    .format(date)
    .replace(".", ":");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatStatus(
  status?: string | null,
  lateMinutes = 0,
  earlyLeaveMinutes = 0,
) {
  if (lateMinutes > 0 && earlyLeaveMinutes > 0) {
    return "Terlambat & Pulang Cepat";
  }

  if (lateMinutes > 0) return "Terlambat";

  if (earlyLeaveMinutes > 0) return "Pulang Cepat";

  const statusMap: Record<string, string> = {
    PENDING: "Pending",
    PRESENT: "Masuk kerja",
    LATE: "Terlambat",
    ABSENT: "Tidak hadir",
    PERMISSION: "Cuti",
    SICK: "Sakit",
    COMPLETED: "Selesai",
  };

  return statusMap[status || ""] || status || "Pending";
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await context.params;

    const attendance = await prisma.attendance.findFirst({
      where: {
        id,
        user_id: userId,
      },
      select: {
        id: true,
        attendance_date: true,

        check_in_time: true,
        check_out_time: true,

        check_in_photo: true,
        check_out_photo: true,
        check_in_photo_mime: true,
        check_out_photo_mime: true,

        check_in_latitude: true,
        check_in_longitude: true,
        check_in_accuracy: true,
        check_in_distance: true,
        check_in_within_radius: true,

        check_out_latitude: true,
        check_out_longitude: true,
        check_out_accuracy: true,
        check_out_distance: true,
        check_out_within_radius: true,

        status: true,
        late_minutes: true,
        early_leave_minutes: true,
        work_minutes: true,
        note: true,

        user: {
          select: {
            shift: {
              select: {
                id: true,
                name: true,
                work_schedules: {
                  select: {
                    id: true,
                    day_of_week: true,
                    is_work_day: true,
                    check_out_time: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          message: "Data absensi tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const dayOfWeek = getDayOfWeekEnum(attendance.attendance_date);

    const todaySchedule = attendance.user.shift?.work_schedules?.find(
      (schedule) => String(schedule.day_of_week).toUpperCase() === dayOfWeek,
    );

    const defaultCheckOutTime = getDefaultCheckOutTimeByShift(
      attendance.user.shift?.name,
    );

    const scheduledCheckOutTime = normalizeTime(
      todaySchedule?.check_out_time,
      defaultCheckOutTime,
    );

    const workMinutes =
      attendance.work_minutes > 0
        ? attendance.work_minutes
        : calculateWorkMinutes(
            attendance.check_in_time,
            attendance.check_out_time,
          );

    const earlyLeaveMinutes =
      attendance.early_leave_minutes > 0
        ? attendance.early_leave_minutes
        : calculateEarlyLeaveMinutes(
            attendance.check_out_time,
            scheduledCheckOutTime,
          );

    return NextResponse.json({
      id: attendance.id,
      date: formatDate(attendance.attendance_date),
      checkIn: formatTime(attendance.check_in_time),
      checkOut: formatTime(attendance.check_out_time),

      status: formatStatus(
        attendance.status,
        attendance.late_minutes,
        earlyLeaveMinutes,
      ),

      lateMinutes: attendance.late_minutes,
      earlyLeaveMinutes,
      workMinutes,
      note: attendance.note,

      scheduledCheckOutTime,

      hasCheckInPhoto: Boolean(
        attendance.check_in_photo && attendance.check_in_photo_mime,
      ),
      hasCheckOutPhoto: Boolean(
        attendance.check_out_photo && attendance.check_out_photo_mime,
      ),

      checkInLocation: {
        latitude: attendance.check_in_latitude,
        longitude: attendance.check_in_longitude,
        accuracy: attendance.check_in_accuracy,
        distance: attendance.check_in_distance,
        withinRadius: attendance.check_in_within_radius,
      },

      checkOutLocation: {
        latitude: attendance.check_out_latitude,
        longitude: attendance.check_out_longitude,
        accuracy: attendance.check_out_accuracy,
        distance: attendance.check_out_distance,
        withinRadius: attendance.check_out_within_radius,
      },
    });
  } catch (error) {
    console.error("ATTENDANCE_DETAIL_ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil detail absensi.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}