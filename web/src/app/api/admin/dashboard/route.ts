import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";

const ALLOWED_ROLES: AllowedRole[] = ["owner", "admin", "cs"];

function getTodayDate() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function formatTime(date?: Date | null) {
  if (!date) return "-";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeDate(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  return user;
}

function getAttendanceStatusLabel(record?: {
  check_in_time: Date | null;
  check_out_time: Date | null;
  status: string;
  check_in_status: string | null;
  late_minutes: number;
}) {
  if (!record || !record.check_in_time) return "Absent";

  if (
    record.check_in_status === "LATE" ||
    record.status === "LATE" ||
    record.late_minutes > 0
  ) {
    return "Late";
  }

  return "Present";
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !ALLOWED_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return NextResponse.json(
        {
          message: "Akses ditolak. Hanya owner, admin, atau cs yang diizinkan.",
        },
        { status: 403 },
      );
    }

    const today = getTodayDate();

    const employees = await prisma.user.findMany({
      where: {
        role: "employee",
        status: "active",
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const todayAttendance = await prisma.attendance.findMany({
      where: {
        attendance_date: today,
      },
      select: {
        id: true,
        user_id: true,
        check_in_time: true,
        check_out_time: true,
        status: true,
        check_in_status: true,
        late_minutes: true,
        work_mode: true,
        is_wfh: true,
        is_visit: true,
        user: {
          select: {
            id: true,
            employee_code: true,
            name: true,
          },
        },
      },
      orderBy: [
        {
          check_in_time: "desc",
        },
        {
          created_at: "desc",
        },
      ],
    });

    const approvedLeavesToday = await prisma.leaveRequest.findMany({
      where: {
        status: "approved",
        start_date: {
          lte: today,
        },
        end_date: {
          gte: today,
        },
      },
      select: {
        id: true,
        user_id: true,
        start_date: true,
        end_date: true,
      },
    });

    const leaveUserIds = new Set(
      approvedLeavesToday
        .filter((leave) => {
          const startDate = normalizeDate(leave.start_date);
          const endDate = normalizeDate(leave.end_date);
          const todayDate = normalizeDate(today);

          return startDate <= todayDate && endDate >= todayDate;
        })
        .map((leave) => leave.user_id),
    );

    const attendanceByUserId = new Map(
      todayAttendance.map((record) => [record.user_id, record]),
    );

    const totalEmployees = employees.length;

    const presentToday = todayAttendance.filter((record) =>
      Boolean(record.check_in_time),
    ).length;

    const lateToday = todayAttendance.filter(
      (record) =>
        record.check_in_status === "LATE" ||
        record.status === "LATE" ||
        record.late_minutes > 0,
    ).length;

    const absentToday = employees.filter((employee) => {
      const hasAttendance = attendanceByUserId.has(employee.id);
      const isLeave = leaveUserIds.has(employee.id);

      return !hasAttendance && !isLeave;
    }).length;

    const recentAttendance = employees.slice(0, 8).map((employee) => {
      const record = attendanceByUserId.get(employee.id);

      return {
        id: employee.employee_code || employee.id.slice(0, 8).toUpperCase(),
        name: employee.name,
        checkIn: formatTime(record?.check_in_time),
        checkOut: formatTime(record?.check_out_time),
        status: leaveUserIds.has(employee.id)
          ? "Cuti"
          : getAttendanceStatusLabel(record),
        workMode: record?.is_wfh
          ? "WFH"
          : record?.is_visit
            ? "Kunjungan"
            : record?.work_mode || "office",
      };
    });

    return NextResponse.json({
      stats: {
        totalEmployees,
        presentToday,
        lateToday,
        absentToday,
      },
      recentAttendance,
    });
  } catch (error) {
    console.error("GET /api/admin/dashboard error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data dashboard admin.",
      },
      { status: 500 },
    );
  }
}