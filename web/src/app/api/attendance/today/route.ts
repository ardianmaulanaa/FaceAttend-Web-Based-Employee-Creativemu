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

function getJakartaDateRange() {
  const todayJakarta = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  const start = new Date(`${todayJakarta}T00:00:00.000Z`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function formatTime(date?: Date | null) {
  if (!date) return "--:--";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatStatus(status?: string | null) {
  if (!status) return "Pending";

  const statusMap: Record<string, string> = {
    PENDING: "Pending",
    PRESENT: "Hadir",
    LATE: "Terlambat",
    ABSENT: "Tidak Hadir",
    LEAVE: "Izin",
    SICK: "Sakit",
    COMPLETED: "Selesai",
  };

  return (
    statusMap[status] ||
    status
      .toLowerCase()
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { start, end } = getJakartaDateRange();

    const attendance = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        attendance_date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        check_in_time: true,
        check_out_time: true,
        status: true,
        check_in_status: true,
        check_out_status: true,
        late_minutes: true,
        early_leave_minutes: true,
        work_minutes: true,
      },
    });

    if (!attendance) {
      return NextResponse.json({
        checkIn: "--:--",
        checkOut: "--:--",
        status: "Pending",
        description: "Belum absensi hari ini",
      });
    }

    const checkIn = formatTime(attendance.check_in_time);
    const checkOut = formatTime(attendance.check_out_time);
    const status = formatStatus(attendance.status);

    let description = "Menunggu absensi";

    if (attendance.check_in_time && !attendance.check_out_time) {
      description = "Sudah check-in";
    }

    if (attendance.check_in_time && attendance.check_out_time) {
      description = "Absensi hari ini selesai";
    }

    if (attendance.late_minutes > 0) {
      description = `Terlambat ${attendance.late_minutes} menit`;
    }

    return NextResponse.json({
      checkIn,
      checkOut,
      status,
      description,
      checkInStatus: attendance.check_in_status,
      checkOutStatus: attendance.check_out_status,
      lateMinutes: attendance.late_minutes,
      earlyLeaveMinutes: attendance.early_leave_minutes,
      workMinutes: attendance.work_minutes,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data absensi hari ini.",
      },
      { status: 401 }
    );
  }
}