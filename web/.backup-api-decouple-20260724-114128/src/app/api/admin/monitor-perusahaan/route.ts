import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/api-auth";

export const runtime = "nodejs";

type AllowedRole = "admin" | "owner";

const ALLOWED_ROLES: AllowedRole[] = ["admin", "owner"];
const EMPLOYEE_ROLE = "employee";

function getLeaveTypeLabel(type?: string | null) {
  const normalized = String(type || "").trim().toLowerCase();

  if (normalized === "annual" || normalized === "annual_leave") {
    return "Cuti Tahunan";
  }

  if (normalized === "permission") return "Izin";
  if (normalized === "sick") return "Sakit";
  if (normalized === "other") return "Lainnya";

  return "Cuti";
}

function mapChartEmployee(user?: {
  id?: string | null;
  name?: string | null;
  employee_code?: string | null;
  profile_photo?: string | null;
}) {
  return {
    id: user?.id || "",
    name: user?.name || "Tanpa Nama",
    employeeCode: user?.employee_code || null,
    profilePhoto: user?.profile_photo || null,
    profile_photo: user?.profile_photo || null,
  };
}

function getDateParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
  };
}

function dateOnly(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDateKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatJakartaDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatTime(date?: Date | null) {
  if (!date) return "-";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeDate(date: Date) {
  const [year, month, day] = formatJakartaDateKey(date).split("-").map(Number);

  return dateOnly(year, month, day);
}

function normalizeWorkMode(mode?: string | null) {
  return String(mode || "office").trim().toLowerCase();
}

function isWfhRecord(record: {
  is_wfh?: boolean | null;
  is_wfc?: boolean | null;
  work_mode?: string | null;
}) {
  const mode = normalizeWorkMode(record.work_mode);

  return (
    Boolean(record.is_wfh) ||
    Boolean(record.is_wfc) ||
    mode === "wfh" ||
    mode === "wfc"
  );
}

function isVisitRecord(record: {
  is_visit?: boolean | null;
  work_mode?: string | null;
  visits?: unknown[] | null;
}) {
  const mode = normalizeWorkMode(record.work_mode);

  return (
    Boolean(record.is_visit) ||
    Boolean(record.visits?.length) ||
    mode === "visit" ||
    mode === "kunjungan"
  );
}

function isOfficeRecord(record: {
  check_in_time?: Date | null;
  is_wfh?: boolean | null;
  is_wfc?: boolean | null;
  is_visit?: boolean | null;
  work_mode?: string | null;
  visits?: unknown[] | null;
}) {
  return (
    Boolean(record.check_in_time) &&
    !isWfhRecord(record) &&
    !isVisitRecord(record)
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function getCurrentUser(req: NextRequest) {
  return requireOwner(req);
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
          message: "Akses ditolak. Hanya admin yang diizinkan.",
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
    const tomorrowDate = dateOnly(nowParts.year, nowParts.month, nowParts.day + 1);
    const todayKey = formatDateKey(todayDate);

    const monthStart = dateOnly(year, month, 1);
    const nextMonthStart = dateOnly(year, month + 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const isCurrentMonth = year === nowParts.year && month === nowParts.month;
    const chartDaysInMonth = isCurrentMonth ? nowParts.day : daysInMonth;

    const activeEmployees = await prisma.user.findMany({
      where: {
        status: "active",
        role: {
          in: ["employee"],
        },
      },
      select: {
        id: true,
        name: true,
        employee_code: true,
        profile_photo: true,
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
        attendance_date: {
          gte: todayDate,
          lt: tomorrowDate,
        },
        user: {
          role: EMPLOYEE_ROLE,
        },
      },
      include: {
        visits: {
          select: {
            id: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            profile_photo: true,
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
        user: {
          role: EMPLOYEE_ROLE,
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
        is_wfc: true,
        is_visit: true,
        is_over_tolerance: true,
        late_reason: true,
        visits: {
          select: {
            id: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            profile_photo: true,
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
        user: {
          role: EMPLOYEE_ROLE,
        },
      },
      select: {
        id: true,
        user_id: true,
        start_date: true,
        end_date: true,
        leave_type: true,
        user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            profile_photo: true,
          },
        },
      },
    });

    const totalActiveEmployees = activeEmployees.length;

    const isSelectedCurrentMonth = year === nowParts.year && month === nowParts.month;
    const todayApprovedLeaveEmployees = isSelectedCurrentMonth
      ? new Set(
          approvedLeaveThisMonth
            .filter((leave) => {
              const startKey = formatDateKey(normalizeDate(leave.start_date));
              const endKey = formatDateKey(normalizeDate(leave.end_date));

              return startKey <= todayKey && endKey >= todayKey;
            })
            .map((leave) => leave.user_id),
        )
      : new Set<string>();

    const todayRecordUserIds = new Set(
      todayRecords
        .filter((record) => Boolean(record.check_in_time))
        .map((record) => record.user.id),
    );

    const todayPresent = isSelectedCurrentMonth
      ? todayRecords.filter((record) => isOfficeRecord(record)).length
      : 0;

    const todayLate = isSelectedCurrentMonth
      ? todayRecords.filter(
          (record) =>
            record.check_in_status === "LATE" ||
            record.status === "LATE" ||
            Number(record.late_minutes || 0) > 0,
        ).length
      : 0;

    const todayWfh = isSelectedCurrentMonth
      ? todayRecords.filter((record) => isWfhRecord(record)).length
      : 0;

    const todayVisit = isSelectedCurrentMonth
      ? todayRecords.filter((record) => isVisitRecord(record)).length
      : 0;

    const todayOffice = isSelectedCurrentMonth
      ? todayRecords.filter((record) => isOfficeRecord(record)).length
      : 0;

    const todayCuti = todayApprovedLeaveEmployees.size;

    const todayPending = isSelectedCurrentMonth
      ? activeEmployees.filter(
          (employee) =>
            !todayRecordUserIds.has(employee.id) &&
            !todayApprovedLeaveEmployees.has(employee.id),
        ).length
      : 0;

    const totalLateMinutesMonth = monthRecords.reduce(
      (sum, record) => sum + Number(record.late_minutes || 0),
      0,
    );

    const totalWorkMinutesMonth = monthRecords.reduce(
      (sum, record) => sum + Number(record.work_minutes || 0),
      0,
    );

    const dayPercent = (value: number) => {
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

    const leaveUserIdsByDate = new Map<string, Set<string>>();

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
          const userIds = leaveUserIdsByDate.get(key) || new Set<string>();

          userIds.add(leave.user_id);
          leaveUserIdsByDate.set(key, userIds);
        }
      }
    }

    const dailyChart = Array.from({ length: chartDaysInMonth }, (_, index) => {
      const day = index + 1;
      const currentDate = dateOnly(year, month, day);
      const currentKey = formatDateKey(currentDate);

      const records = monthRecords.filter(
        (record) => formatJakartaDateKey(record.attendance_date) === currentKey,
      ).sort((a, b) => {
        const aTime = a.check_in_time?.getTime() || Number.MAX_SAFE_INTEGER;
        const bTime = b.check_in_time?.getTime() || Number.MAX_SAFE_INTEGER;

        return aTime - bTime;
      });

      const present = records.filter((record) => isOfficeRecord(record)).length;

      const late = records.filter(
        (record) =>
          record.check_in_status === "LATE" ||
          record.status === "LATE" ||
          Number(record.late_minutes || 0) > 0,
      ).length;

      const wfh = records.filter(
        (record) => isWfhRecord(record),
      ).length;

      const visit = records.filter(
        (record) => isVisitRecord(record),
      ).length;

      const office = records.filter((record) => isOfficeRecord(record)).length;

      const cuti = leaveUserIdsByDate.get(currentKey)?.size || 0;
      const recordsByUserId = new Set(
        records
          .filter((record) => Boolean(record.check_in_time))
          .map((record) => record.user.id),
      );
      const leaveEmployees = approvedLeaveThisMonth
        .filter((leave) => {
          const startKey = formatDateKey(normalizeDate(leave.start_date));
          const endKey = formatDateKey(normalizeDate(leave.end_date));

          return startKey <= currentKey && endKey >= currentKey;
        })
        .map((leave) => ({
          ...mapChartEmployee(leave.user),
          id: leave.user?.id || leave.user_id,
          leaveType: leave.leave_type,
          leaveTypeLabel: getLeaveTypeLabel(leave.leave_type),
        }));
      const leaveUserIds = new Set(leaveEmployees.map((employee) => employee.id));
      const pending = activeEmployees.filter(
        (employee) =>
          !recordsByUserId.has(employee.id) && !leaveUserIds.has(employee.id),
      ).length;

      return {
        label: String(day),
        date: currentKey,
        present,
        office,
        late,
        wfh,
        visit,
        cuti,
        pending,
        active: totalActiveEmployees,
        todayRecords: records.length,
        employees: {
          office: records
            .filter((record) => isOfficeRecord(record))
            .map((record) => mapChartEmployee(record.user)),
          present: records
            .filter((record) => isOfficeRecord(record))
            .map((record) => mapChartEmployee(record.user)),
          late: records
            .filter(
              (record) =>
                record.check_in_status === "LATE" ||
                record.status === "LATE" ||
                Number(record.late_minutes || 0) > 0,
            )
            .map((record) => mapChartEmployee(record.user)),
          wfh: records
            .filter((record) => isWfhRecord(record))
            .map((record) => mapChartEmployee(record.user)),
          visit: records
            .filter((record) => isVisitRecord(record))
            .map((record) => mapChartEmployee(record.user)),
          cuti: leaveEmployees,
          pending: activeEmployees
            .filter(
              (employee) =>
                !recordsByUserId.has(employee.id) && !leaveUserIds.has(employee.id),
            )
            .map((employee) => mapChartEmployee(employee)),
        },
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

    const lateReasons = todayRecords
      .filter(
        (record) =>
          record.is_over_tolerance ||
          record.late_reason ||
          Number(record.late_minutes || 0) > 0,
      )
      .map((record) => ({
        id: record.id,
        employeeName: record.user?.name || "Tanpa Nama",
        date: formatDateKey(record.attendance_date),
        checkIn: formatTime(record.check_in_time),
        lateMinutes: Number(record.late_minutes || 0),
        reason: record.late_reason || "Belum ada alasan",
      }));

    return NextResponse.json({
      month,
      year,
      today: todayKey,
      generatedAt: new Date().toISOString(),
      summary: {
        activeEmployees: totalActiveEmployees,
        todayRecords: isSelectedCurrentMonth ? todayRecords.length : 0,

        present: todayPresent,
        office: todayOffice,
        late: todayLate,
        wfh: todayWfh,
        visit: todayVisit,
        cuti: todayCuti,
        pending: todayPending,

        presentPercentage: dayPercent(todayPresent),
        latePercentage: dayPercent(todayLate),
        wfhPercentage: dayPercent(todayWfh),
        visitPercentage: dayPercent(todayVisit),
        cutiPercentage: dayPercent(todayCuti),
        pendingPercentage: dayPercent(todayPending),

        totalLateMinutesMonth,
        totalWorkMinutesMonth,
      },
      departmentStats,
      dailyChart,
      alerts,
      lateReasons,
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
