import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { canViewAdminPanel } from "@/lib/adminAccess";
import { AttendanceStatus } from "@/generated/prisma/enums";
import { attendanceStore, findDemoUserById } from "@/lib/demoStore";

export const dynamic = "force-dynamic";

function isDemoUserId(userId: string) {
  return userId.includes("-DEMO-") || userId.startsWith("EMP-DEMO") || userId.includes("DEMO");
}

const CHECK_IN_LIMIT_MINUTES = 8 * 60;

function getJakartaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toDateOnly(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function combineDateAndTime(dateKey: string, minutes: number) {
  const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
  const minute = String(minutes % 60).padStart(2, "0");
  return new Date(`${dateKey}T${hour}:${minute}:00.000+07:00`);
}

function getJakartaMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);
  const second = Number(parts.find((part) => part.type === "second")?.value || 0);

  return { minutes: hour * 60 + minute, second };
}

function parseTimeLabel(value: Date | null | undefined) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(value);
}

function formatScheduledLimit() {
  return "08:00:00";
}

async function getAuthPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get("faceattend_token")?.value;

  if (!token) return null;

  return verifyToken(token);
}

function computeLateFromAttendance(attendance: {
  scheduled_check_in: Date | null;
  check_in_time: Date | null;
  late_minutes: number;
  late_seconds: number;
  is_over_tolerance: boolean;
}) {
  if (attendance.scheduled_check_in && attendance.check_in_time) {
    const diffSeconds = Math.max(
      0,
      Math.floor(
        (attendance.check_in_time.getTime() - attendance.scheduled_check_in.getTime()) / 1000,
      ),
    );

    return {
      isLate: diffSeconds > 0,
      lateMinutes: Math.floor(diffSeconds / 60),
      lateSeconds: diffSeconds % 60,
    };
  }

  return {
    isLate: attendance.is_over_tolerance || attendance.late_minutes > 0,
    lateMinutes: Math.max(0, attendance.late_minutes || 0),
    lateSeconds: Math.max(0, attendance.late_seconds || 0),
  };
}

export async function GET(req: Request) {
  try {
    const payload = await getAuthPayload();

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    const isDemo = isDemoUserId(payload.id);
    let userExists = isDemo;
    let demoUserName = "Karyawan";

    if (isDemo) {
      const demoUser = findDemoUserById(payload.id);
      if (demoUser) {
        userExists = true;
        demoUserName = demoUser.name;
      }
    } else {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true },
      });
      userExists = Boolean(dbUser);
    }

    if (!userExists) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 401 },
      );
    }

    const todayKey = getJakartaDateKey();
    const todayDate = toDateOnly(todayKey);
    const url = new URL(req.url);
    const scope = String(url.searchParams.get("scope") || "employee");

    if (scope === "admin") {
      if (!canViewAdminPanel(payload.role)) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak" },
          { status: 403 },
        );
      }

      const [employeesCount, lateAttendances] = await Promise.all([
        prisma.user.count({ where: { role: "employee", status: "active" } }),
        prisma.attendance.findMany({
          where: {
            attendance_date: todayDate,
            OR: [
              { is_over_tolerance: true },
              { late_minutes: { gt: 0 } },
              { status: AttendanceStatus.LATE },
            ],
          },
          orderBy: { check_in_time: "asc" },
          select: {
            id: true,
            late_reason: true,
            late_minutes: true,
            late_seconds: true,
            is_over_tolerance: true,
            scheduled_check_in: true,
            check_in_time: true,
            user: { select: { id: true, name: true } },
          },
        }),
      ]);

      const rows = lateAttendances.map((item) => {
        const computed = computeLateFromAttendance(item);

        return {
          id: item.id,
          employeeId: item.user.id,
          employeeName: item.user.name,
          checkInTime: parseTimeLabel(item.check_in_time),
          scheduledCheckIn: parseTimeLabel(item.scheduled_check_in),
          lateReason: item.late_reason || "Belum diisi",
          lateMinutes: computed.lateMinutes,
          lateSeconds: computed.lateSeconds,
          isLate: computed.isLate,
        };
      });

      const lateCount = rows.length;
      const latePercentage =
        employeesCount > 0 ? Number(((lateCount / employeesCount) * 100).toFixed(2)) : 0;

      return NextResponse.json({
        success: true,
        data: {
          dateKey: todayKey,
          totalEmployees: employeesCount,
          lateCount,
          latePercentage,
          rows,
        },
      });
    }

    if (payload.role !== "employee") {
      return NextResponse.json(
        { success: false, message: "Popup telat hanya untuk karyawan" },
        { status: 403 },
      );
    }

    let attendance: any = null;
    if (isDemo) {
      const demoKey = `${payload.id}-${todayKey}`;
      attendance = attendanceStore.get(demoKey) || null;
    } else {
      attendance = await prisma.attendance.findFirst({
        where: { user_id: payload.id, attendance_date: todayDate },
        select: {
          id: true,
          late_reason: true,
          late_minutes: true,
          late_seconds: true,
          is_over_tolerance: true,
          scheduled_check_in: true,
          check_in_time: true,
          user: { select: { name: true } },
        },
      });
    }

    const now = getJakartaMinutes();
    const hasPassedLimit = now.minutes >= CHECK_IN_LIMIT_MINUTES;

    if (!attendance) {
      const lateTotalSeconds = hasPassedLimit
        ? Math.max(0, (now.minutes - CHECK_IN_LIMIT_MINUTES) * 60 + now.second)
        : 0;

      return NextResponse.json(
        {
          success: true,
          data: {
            isLate: hasPassedLimit,
            hasReason: false,
            employeeName: isDemo ? demoUserName : (payload.email || "Karyawan"),
            scheduledCheckIn: formatScheduledLimit(),
            checkInTime: "Belum check-in",
            lateMinutes: Math.floor(lateTotalSeconds / 60),
            lateSeconds: lateTotalSeconds % 60,
          },
        },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
          },
        }
      );
    }

    const computed = computeLateFromAttendance(attendance);
    const lateBecauseNoReasonAfterLimit = hasPassedLimit && !attendance.late_reason;
    const isLate = computed.isLate || lateBecauseNoReasonAfterLimit;

    return NextResponse.json(
      {
        success: true,
        data: {
          isLate,
          hasReason: Boolean(attendance.late_reason?.trim()),
          employeeName: isDemo ? demoUserName : attendance.user.name,
          scheduledCheckIn: parseTimeLabel(attendance.scheduled_check_in) || formatScheduledLimit(),
          checkInTime: parseTimeLabel(attendance.check_in_time),
          lateMinutes: computed.lateMinutes || Math.max(0, now.minutes - CHECK_IN_LIMIT_MINUTES),
          lateSeconds: computed.lateSeconds,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      }
    );
  } catch (error) {
    console.error("GET_LATE_REASON_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Gagal mengambil data keterlambatan" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const payload = await getAuthPayload();

    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    const isDemo = isDemoUserId(payload.id);
    let userExists = isDemo;
    if (!isDemo) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true },
      });
      userExists = Boolean(dbUser);
    }

    if (!userExists) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 401 },
      );
    }

    if (payload.role !== "employee") {
      return NextResponse.json(
        { success: false, message: "Hanya karyawan yang dapat mengirim alasan telat" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const lateReason = String(body.reason || "").trim();

    if (!lateReason) {
      return NextResponse.json(
        { success: false, message: "Alasan keterlambatan wajib diisi" },
        { status: 400 },
      );
    }

    const todayKey = getJakartaDateKey();
    const todayDate = toDateOnly(todayKey);
    const now = getJakartaMinutes();

    if (now.minutes < CHECK_IN_LIMIT_MINUTES) {
      return NextResponse.json(
        { success: false, message: "Belum melewati jam masuk 08.00" },
        { status: 400 },
      );
    }

    const lateTotalSeconds = Math.max(
      0,
      (now.minutes - CHECK_IN_LIMIT_MINUTES) * 60 + now.second,
    );

    const data = {
      scheduled_check_in: combineDateAndTime(todayKey, CHECK_IN_LIMIT_MINUTES),
      late_reason: lateReason.slice(0, 255),
      late_minutes: Math.floor(lateTotalSeconds / 60),
      late_seconds: lateTotalSeconds % 60,
      is_over_tolerance: true,
      status: AttendanceStatus.LATE,
    };

    if (isDemo) {
      const demoKey = `${payload.id}-${todayKey}`;
      attendanceStore.set(demoKey, {
        id: `demo-att-${Date.now()}`,
        employee_id: payload.id,
        attendance_date: todayKey,
        check_in_time: null,
        check_out_time: null,
        check_in_photo_url: null,
        check_out_photo_url: null,
        check_in_latitude: null,
        check_in_longitude: null,
        check_out_latitude: null,
        check_out_longitude: null,
        work_mode: "office",
        leave_type: null,
        leave_letter_url: null,
        work_location_name: null,
        notes: null,
        ...data,
      });
    } else {
      const existing = await prisma.attendance.findFirst({
        where: { user_id: payload.id, attendance_date: todayDate },
        select: { id: true, check_in_time: true },
      });

      if (existing) {
        await prisma.attendance.update({ where: { id: existing.id }, data });
      } else {
        await prisma.attendance.create({
          data: {
            user_id: payload.id,
            attendance_date: todayDate,
            work_mode: "office",
            ...data,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Alasan keterlambatan berhasil disimpan.",
      data: {
        lateReason: lateReason.slice(0, 255),
        lateMinutes: Math.floor(lateTotalSeconds / 60),
        lateSeconds: lateTotalSeconds % 60,
        isLate: true,
      },
    });
  } catch (error) {
    console.error("POST_LATE_REASON_ERROR", error);

    return NextResponse.json(
      { success: false, message: "Gagal menyimpan alasan telat" },
      { status: 500 },
    );
  }
}