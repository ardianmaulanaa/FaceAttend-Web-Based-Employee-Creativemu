// @ts-nocheck
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";

const ALLOWED_ROLES: AllowedRole[] = ["owner", "admin", "cs"];

function getDateParts(date = new Date()) {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

function dateOnly(year: number, month: number, day: number) {
  return new Date(year, month - 1, day);
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
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

    const searchParams = req.nextUrl.searchParams;

    const nowParts = getDateParts();

    const selectedMonth = Number(searchParams.get("month")) || nowParts.month;
    const selectedYear = Number(searchParams.get("year")) || nowParts.year;

    const month = clamp(selectedMonth, 1, 12);
    const year = selectedYear;

    const todayDate = dateOnly(nowParts.year, nowParts.month, nowParts.day);
    const todayKey = formatDateKey(todayDate);

    const monthStart = dateOnly(year, month, 1);
    const nextMonthStart = dateOnly(year, month + 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();

    const activeEmployees = await prisma.user.findMany({
      where: {
        status: "active",
        role: {
          in: ["employee", "admin", "cs"],
        },
      },
      select: {
        id: true,
        name: true,
        role: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const todayRecords = await prisma.attendance.findMany({
      where: {
        attendance_date: todayDate,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            role: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        check_in_time: "asc",
      },
    });

    const monthRecords = await prisma.attendance.findMany({
      where: {
        attendance_date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      select: {
        id: true,
        attendance_date: true,
        check_in_time: true,
        check_out_time: true,
        late_minutes: true,
        work_minutes: true,
        status: true,
        check_in_status: true,
        work_mode: true,
        is_wfh: true,
        is_visit: true,
        is_over_tolerance: true,
        late_reason: true,
        user: {
          select: {
            id: true,
            name: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        attendance_date: "asc",
      },
    });

    const approvedLeaveThisMonth = await prisma.leaveRequest.findMany({
      where: {
        status: "approved",
        start_date: {
          lt: nextMonthStart,
        },
        end_date: {
          gte: monthStart,
        },
      },
      select: {
        id: true,
        user_id: true,
        start_date: true,
        end_date: true,
        leave_type: true,
      },
    });

    const approvedLeaveToday = approvedLeaveThisMonth.filter((leave) => {
      const start = normalizeDate(leave.start_date);
      const end = normalizeDate(leave.end_date);
      const today = normalizeDate(todayDate);

      return start <= today && end >= today;
    });

    const totalActiveEmployees = activeEmployees.length;

    const todayPresent = todayRecords.filter((record) =>
      Boolean(record.check_in_time),
    ).length;

    const todayLate = todayRecords.filter(
      (record) =>
        record.check_in_status === "LATE" ||
        record.status === "LATE" ||
        Number(record.late_minutes || 0) > 0,
    ).length;

    const todayWfh = todayRecords.filter(
      (record) => record.is_wfh || record.work_mode === "wfh",
    ).length;

    const todayVisit = todayRecords.filter(
      (record) => record.is_visit || record.work_mode === "visit",
    ).length;

    const todayCuti = approvedLeaveToday.length;

    const todayPending = Math.max(
      totalActiveEmployees - todayPresent - todayCuti,
      0,
    );

    const totalLateMinutesMonth = monthRecords.reduce(
      (sum, record) => sum + Number(record.late_minutes || 0),
      0,
    );

    const totalWorkMinutesMonth = monthRecords.reduce(
      (sum, record) => sum + Number(record.work_minutes || 0),
      0,
    );

    const percent = (value: number) => {
      if (totalActiveEmployees === 0) return 0;
      return Math.round((value / totalActiveEmployees) * 100);
    };

    const departmentBucket = new Map<string, number>();

    for (const employee of activeEmployees) {
      const departmentName = employee.department?.name || "Tanpa Divisi";
      departmentBucket.set(
        departmentName,
        (departmentBucket.get(departmentName) || 0) + 1,
      );
    }

    const departmentStats = Array.from(departmentBucket.entries())
      .map(([department, total]) => ({
        department,
        total,
      }))
      .sort((a, b) => b.total - a.total);

    const leaveCountByDate = new Map<string, number>();

    for (const leave of approvedLeaveThisMonth) {
      const startDate = normalizeDate(leave.start_date);
      const endDate = normalizeDate(leave.end_date);

      for (
        let cursor = new Date(startDate);
        cursor <= endDate;
        cursor.setDate(cursor.getDate() + 1)
      ) {
        if (cursor >= monthStart && cursor < nextMonthStart) {
          const key = formatDateKey(cursor);
          leaveCountByDate.set(key, (leaveCountByDate.get(key) || 0) + 1);
        }
      }
    }

    const dailyChart = Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const currentDate = dateOnly(year, month, day);
      const currentKey = formatDateKey(currentDate);

      const records = monthRecords.filter(
        (record) => formatDateKey(record.attendance_date) === currentKey,
      );

      const present = records.filter((record) =>
        Boolean(record.check_in_time),
      ).length;

      const late = records.filter(
        (record) =>
          record.check_in_status === "LATE" ||
          record.status === "LATE" ||
          Number(record.late_minutes || 0) > 0,
      ).length;

      const wfh = records.filter(
        (record) => record.is_wfh || record.work_mode === "wfh",
      ).length;

      const visit = records.filter(
        (record) => record.is_visit || record.work_mode === "visit",
      ).length;

      const cuti = leaveCountByDate.get(currentKey) || 0;

      const pending = Math.max(totalActiveEmployees - present - cuti, 0);

      return {
        label: String(day),
        date: currentKey,
        present,
        late,
        wfh,
        visit,
        cuti,
        pending,
        active: totalActiveEmployees,
        todayRecords: records.length,
      };
    });

    const alerts = todayRecords
      .filter(
        (record) =>
          record.check_in_time &&
          !record.check_out_time &&
          record.work_mode !== "cuti",
      )
      .slice(0, 8)
      .map((record) => ({
        id: record.id,
        employeeName: record.user?.name || "Tanpa Nama",
        mode: record.work_mode || "office",
        checkIn: formatTime(record.check_in_time),
      }));

    const lateReasons = monthRecords
      .filter(
        (record) =>
          record.is_over_tolerance ||
          record.late_reason ||
          Number(record.late_minutes || 0) > 0,
      )
      .slice(-8)
      .reverse()
      .map((record) => ({
        id: record.id,
        employeeName: record.user?.name || "Tanpa Nama",
        date: formatDateKey(record.attendance_date),
        checkIn: formatTime(record.check_in_time),
        lateMinutes: Number(record.late_minutes || 0),
        reason: record.late_reason || "Belum ada alasan",
      }));

    const monthVisits = await prisma.employeeVisit.findMany({
      where: {
        visit_date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        visit_date: "desc",
      },
    });

    const visits = monthVisits.map((v) => ({
      id: v.id,
      date: formatDateKey(v.visit_date),
      employeeName: v.user?.name || "Tanpa Nama",
      title: v.title,
      clientName: v.client_name,
      address: v.address,
      startTime: formatTime(v.start_time),
      note: v.note,
      hasPhoto: Boolean(v.visit_photo_mime),
    }));

    return NextResponse.json({
      month,
      year,
      today: todayKey,
      generatedAt: new Date().toISOString(),
      summary: {
        activeEmployees: totalActiveEmployees,
        todayRecords: todayRecords.length,

        present: todayPresent,
        late: todayLate,
        wfh: todayWfh,
        visit: todayVisit,
        cuti: todayCuti,
        pending: todayPending,

        presentPercentage: percent(todayPresent),
        latePercentage: percent(todayLate),
        wfhPercentage: percent(todayWfh),
        visitPercentage: percent(todayVisit),
        cutiPercentage: percent(todayCuti),
        pendingPercentage: percent(todayPending),

        totalLateMinutesMonth,
        totalWorkMinutesMonth,
      },
      departmentStats,
      dailyChart,
      alerts,
      lateReasons,
      visits,
    });
  } catch (error) {
    console.error("GET /api/admin/monitor-perusahaan error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data monitor perusahaan.",
      },
      { status: 500 },
    );
  }
}
