import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

function getTodayRangeWIB() {
  const now = new Date();

  const wibDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const start = new Date(`${wibDate}T00:00:00.000+07:00`);
  const end = new Date(`${wibDate}T23:59:59.999+07:00`);

  return { start, end };
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function calculateWorkMinutes(
  workMinutes: number | null | undefined,
  checkInTime: Date | null | undefined,
  checkOutTime: Date | null | undefined,
) {
  const savedWorkMinutes = Number(workMinutes || 0);

  if (savedWorkMinutes > 0) {
    return savedWorkMinutes;
  }

  if (!checkInTime || !checkOutTime) {
    return 0;
  }

  const diffMs = checkOutTime.getTime() - checkInTime.getTime();

  if (diffMs <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(diffMs / 60000));
}

function isLateStatus(status?: string | null) {
  if (!status) return false;

  const normalizedStatus = status.toLowerCase();

  return normalizedStatus === "late" || normalizedStatus === "terlambat";
}

function getActivityTime(attendance: {
  attendance_date: Date;
  check_in_time: Date | null;
  check_out_time: Date | null;
}) {
  return (
    attendance.check_out_time?.getTime() ||
    attendance.check_in_time?.getTime() ||
    attendance.attendance_date.getTime()
  );
}

export async function GET(req: NextRequest) {
  try {
    await requireOwner(req);

    const { start, end } = getTodayRangeWIB();

    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ["employee", "EMPLOYEE"],
        },
        status: {
          in: ["active", "ACTIVE"],
        },
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        profile_photo: true,
        department: {
          select: {
            name: true,
          },
        },
        position: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        OR: [
          {
            attendance_date: {
              gte: start,
              lte: end,
            },
          },
          {
            check_in_time: {
              gte: start,
              lte: end,
            },
          },
          {
            check_out_time: {
              gte: start,
              lte: end,
            },
          },
        ],
      },
      select: {
        id: true,
        user_id: true,
        attendance_date: true,
        check_in_time: true,
        check_out_time: true,
        status: true,
        late_minutes: true,
        work_minutes: true,
      },
      orderBy: [
        {
          attendance_date: "desc",
        },
        {
          check_in_time: "desc",
        },
      ],
    });

    const attendanceByUserId = new Map<
      string,
      (typeof todayAttendances)[number]
    >();

    for (const attendance of todayAttendances) {
      const existingAttendance = attendanceByUserId.get(attendance.user_id);

      if (!existingAttendance) {
        attendanceByUserId.set(attendance.user_id, attendance);
        continue;
      }

      if (getActivityTime(attendance) > getActivityTime(existingAttendance)) {
        attendanceByUserId.set(attendance.user_id, attendance);
      }
    }

    const recentAttendance = employees.map((employee) => {
      const attendance = attendanceByUserId.get(employee.id);

      const workMinutes = calculateWorkMinutes(
        Number(attendance?.work_minutes || 0),
        attendance?.check_in_time || null,
        attendance?.check_out_time || null,
      );

      return {
        id: employee.id,
        attendanceId: attendance?.id || "",
        name: employee.name,
        employeeCode: employee.employee_code,
        profilePhoto: employee.profile_photo,
        profile_photo: employee.profile_photo,
        profile_photo_url: employee.profile_photo,
        photo_url: employee.profile_photo,
        avatar_url: employee.profile_photo,
        position: employee.position?.name || null,
        department: employee.department?.name || null,
        checkInTime: toIsoDate(attendance?.check_in_time),
        checkOutTime: toIsoDate(attendance?.check_out_time),
        status: attendance?.status || "ABSENT",
        lateMinutes: Number(attendance?.late_minutes || 0),
        workMinutes,
      };
    });

    const checkInToday = recentAttendance.filter(
      (attendance) => attendance.checkInTime,
    ).length;

    const checkOutToday = recentAttendance.filter(
      (attendance) => attendance.checkOutTime,
    ).length;

    const lateToday = recentAttendance.filter((attendance) => {
      return attendance.lateMinutes > 0 || isLateStatus(attendance.status);
    }).length;

    const absentToday = recentAttendance.filter(
      (attendance) => !attendance.checkInTime,
    ).length;

    return NextResponse.json({
      stats: {
        totalEmployees: employees.length,
        checkInToday,
        checkOutToday,
        lateToday,
        absentToday,
      },
      recentAttendance,
    });
  } catch (error) {
    console.error("ADMIN_DASHBOARD_ERROR:", error);

    return NextResponse.json(
      {
        message: getApiErrorMessage(
          error,
          "Gagal mengambil data dashboard admin.",
        ),
      },
      {
        status: getApiErrorStatus(error),
      },
    );
  }
}
