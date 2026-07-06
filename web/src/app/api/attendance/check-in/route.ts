import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getDistanceInMeters } from "@/lib/geo";
import { AttendanceStatus, CheckInStatus, type DayOfWeek } from "@/generated/prisma/enums";
import { attendanceStore, findDemoUserById } from "@/lib/demoStore";

export const runtime = "nodejs";

const MAX_GPS_ACCURACY_METERS = 150;

type WorkMode = "office" | "wfh" | "visit" | "flexible";

type AttendanceUser = {
  id: string;
  status: string;
  employee_type: string;
  registered_office_id: string | null;
  shift?: {
    name: string;
    tolerance_minutes: number;
    work_schedules: {
      check_in_time: string | null;
      check_out_time: string | null;
      is_work_day: boolean;
    }[];
  } | null;
};

type OfficeGeofence = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

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

function getJakartaDayOfWeek(date = new Date()): DayOfWeek {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  }).format(date);

  return day.toUpperCase() as DayOfWeek;
}

function timeToMinutes(time?: string | null) {
  if (!time) return null;
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function getJakartaMinutes(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(parts.find((part) => part.type === "minute")?.value || 0);

  return hour * 60 + minute;
}

function combineDateAndTime(dateKey: string, time?: string | null) {
  if (!time) return null;
  return new Date(`${dateKey}T${time}:00.000+07:00`);
}

function getDefaultSchedule(shiftName?: string | null) {
  const name = String(shiftName || "").toLowerCase();

  if (name.includes("b") || name.includes("siang")) {
    return { checkIn: "13:00", checkOut: "21:00" };
  }

  return { checkIn: "08:00", checkOut: "17:00" };
}

function normalizeWorkMode(value: FormDataEntryValue | null): WorkMode {
  const mode = String(value || "office").toLowerCase();
  if (["wfh", "visit", "flexible"].includes(mode)) return mode as WorkMode;
  return "office";
}

function toNumber(value: FormDataEntryValue | null) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function fileToBuffer(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) return { buffer: null, mime: "image/jpeg" };
  return {
    buffer: Buffer.from(await value.arrayBuffer()),
    mime: value.type || "image/jpeg",
  };
}

function findNearestOffice(location: { lat: number; lng: number }, offices: OfficeGeofence[]) {
  return offices
    .map((office) => {
      const distance = getDistanceInMeters(location, {
        lat: office.latitude,
        lng: office.longitude,
      });

      return {
        office,
        distance,
        isWithinRadius: distance <= office.radius_meters,
      };
    })
    .sort((a, b) => a.distance - b.distance)[0] ?? null;
}

async function getApprovedLocationUnlock(userId: string, date: Date) {
  return prisma.leaveRequest.findFirst({
    where: {
      user_id: userId,
      status: "approved",
      location_unlock_approved: true,
      start_date: { lte: date },
      end_date: { gte: date },
    },
    orderBy: { created_at: "desc" },
    select: {
      id: true,
      leave_type: true,
      requested_work_mode: true,
      visit_location_name: true,
      visit_address: true,
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("faceattend_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Belum login." }, { status: 401 });
    }

    const payload = await verifyToken(token);

    if (payload.role !== "employee") {
      return NextResponse.json(
        { error: "Hanya karyawan yang dapat check-in." },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const { buffer: photoBuffer, mime: photoMime } = await fileToBuffer(
      formData.get("photo") || formData.get("checkInPhoto"),
    );
    const latitude = toNumber(formData.get("latitude") || formData.get("checkInLatitude"));
    const longitude = toNumber(formData.get("longitude") || formData.get("checkInLongitude"));
    const accuracy = toNumber(formData.get("accuracy") || formData.get("checkInAccuracy"));
    const requestedMode = normalizeWorkMode(formData.get("workMode"));

    if (!photoBuffer) {
      return NextResponse.json({ error: "Foto check-in wajib dikirim." }, { status: 400 });
    }

    if (latitude === null || longitude === null || accuracy === null) {
      return NextResponse.json({ error: "Lokasi GPS check-in wajib dikirim." }, { status: 400 });
    }

    if (accuracy > MAX_GPS_ACCURACY_METERS) {
      return NextResponse.json(
        {
          error: `Akurasi GPS terlalu rendah. Maksimal ±�${MAX_GPS_ACCURACY_METERS} meter.`,
          accuracy,
        },
        { status: 400 },
      );
    }

    const isDemo = payload.id.includes("-DEMO-");
    let user: any = null;

    if (isDemo) {
      const demoUser = findDemoUserById(payload.id);
      if (demoUser) {
        user = {
          id: demoUser.id,
          status: demoUser.status,
          employee_type: demoUser.employee_category,
          registered_office_id: "office-1",
          shift: {
            name: "Flexible Shift",
            tolerance_minutes: 0,
            work_schedules: [],
          },
        };
      }
    } else {
      user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          status: true,
          employee_type: true,
          registered_office_id: true,
          shift: {
            select: {
              name: true,
              tolerance_minutes: true,
              work_schedules: {
                where: { day_of_week: getJakartaDayOfWeek() },
                select: { check_in_time: true, check_out_time: true, is_work_day: true },
              },
            },
          },
        },
      });
    }

    if (!user || user.status !== "active") {
      return NextResponse.json({ error: "Akun karyawan tidak aktif." }, { status: 403 });
    }

    const todayKey = getJakartaDateKey();
    const todayDate = toDateOnly(todayKey);
    let existingAttendance: any = null;

    if (isDemo) {
      const demoKey = `${payload.id}-${todayKey}`;
      existingAttendance = attendanceStore.get(demoKey) || null;
    } else {
      existingAttendance = await prisma.attendance.findFirst({
        where: { user_id: payload.id, attendance_date: todayDate },
        select: { id: true, check_in_time: true, work_minutes: true },
      });
    }

    if (existingAttendance?.check_in_time) {
      return NextResponse.json({ error: "Kamu sudah melakukan check-in hari ini." }, { status: 409 });
    }

    const approvedUnlock = await getApprovedLocationUnlock(payload.id, todayDate);
    const effectiveMode = approvedUnlock?.requested_work_mode || requestedMode;
    const requiresOfficeRadius = effectiveMode === "office" && !approvedUnlock;

    const offices = await prisma.officeLocation.findMany({
      where: { status: "active" },
      select: { id: true, name: true, latitude: true, longitude: true, radius_meters: true },
    });
    const nearestOffice = findNearestOffice({ lat: latitude, lng: longitude }, offices);

    if (requiresOfficeRadius && (!nearestOffice || !nearestOffice.isWithinRadius)) {
      return NextResponse.json(
        {
          error: "Lokasi kamu berada di luar radius kantor. Ajukan WFH/kunjungan/lembur dan minta admin membuka kunci lokasi.",
          latitude,
          longitude,
          accuracy,
        },
        { status: 400 },
      );
    }

    const attendanceUser = user as AttendanceUser;
    const defaultSchedule = getDefaultSchedule(attendanceUser.shift?.name);
    const schedule = attendanceUser.shift?.work_schedules?.[0];
    const checkInTime = schedule?.check_in_time || defaultSchedule.checkIn;
    const checkOutTime = schedule?.check_out_time || defaultSchedule.checkOut;
    const startMinutes = timeToMinutes(checkInTime) ?? 8 * 60;
    const now = new Date();
    const nowMinutes = getJakartaMinutes(now);
    const toleranceMinutes = attendanceUser.shift?.tolerance_minutes || 0;
    const shiftName = String(attendanceUser.shift?.name || "").toLowerCase();
    const isFlexible =
      effectiveMode === "flexible" ||
      effectiveMode === "visit" ||
      ["shift", "magang"].includes(String(attendanceUser.employee_type || "").toLowerCase()) ||
      shiftName.includes("shift") ||
      shiftName.includes("flex") ||
      shiftName.includes("bebas");
    const approvedOvertimeAfterFive =
      approvedUnlock?.leave_type === "overtime" &&
      ["office", "wfh"].includes(effectiveMode) &&
      nowMinutes >= 17 * 60;
    const lateMinutes = isFlexible || approvedOvertimeAfterFive
      ? 0
      : Math.max(0, nowMinutes - startMinutes - toleranceMinutes);

    const attendanceStatus = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
    const noteParts = [
      `mode=${effectiveMode}`,
      approvedUnlock ? `location_unlock=${approvedUnlock.leave_type}` : null,
      approvedOvertimeAfterFive ? "overtime_after_17=true" : null,
      approvedUnlock?.visit_location_name ? `visit=${approvedUnlock.visit_location_name}` : null,
    ].filter(Boolean);

    const data = {
      user_id: payload.id,
      attendance_date: todayDate,
      scheduled_check_in: combineDateAndTime(todayKey, checkInTime),
      scheduled_check_out: combineDateAndTime(todayKey, checkOutTime),
      check_in_time: now,
      check_in_photo: photoBuffer,
      check_in_photo_mime: photoMime,
      check_in_latitude: latitude,
      check_in_longitude: longitude,
      check_in_accuracy: accuracy,
      check_in_distance: nearestOffice?.distance ?? null,
      check_in_within_radius: Boolean(nearestOffice?.isWithinRadius || approvedUnlock),
      registered_office_id: attendanceUser.registered_office_id,
      check_in_office_id: nearestOffice?.isWithinRadius ? nearestOffice.office.id : null,
      work_mode: effectiveMode === "office" ? "office" : effectiveMode,
      is_wfh: effectiveMode === "wfh",
      is_visit: effectiveMode === "visit" || Boolean(approvedUnlock?.leave_type === "visit"),
      status: attendanceStatus,
      check_in_status: lateMinutes > 0 ? CheckInStatus.LATE : CheckInStatus.ON_TIME,
      late_minutes: lateMinutes,
      late_seconds: lateMinutes * 60,
      is_over_tolerance: lateMinutes > 0,
      activity_note: noteParts.join(" | ").slice(0, 255) || null,
      note: approvedUnlock ? "Lokasi dibuka berdasarkan approval admin." : null,
    };

    let attendanceRecord: any = null;
    if (isDemo) {
      const demoKey = `${payload.id}-${todayKey}`;
      attendanceRecord = {
        ...data,
        id: existingAttendance?.id || `demo-att-${Date.now()}`,
        check_in_time: now,
        check_out_time: null,
        check_in_photo_url: "/placeholder-avatar.png",
        check_out_photo_url: null,
      };
      attendanceStore.set(demoKey, attendanceRecord);
    } else {
      attendanceRecord = existingAttendance
        ? await prisma.attendance.update({ where: { id: existingAttendance.id }, data })
        : await prisma.attendance.create({ data });
    }

    return NextResponse.json({
      success: true,
      message: approvedOvertimeAfterFive
        ? "Check-in lembur berhasil. Lokasi dibuka berdasarkan approval admin."
        : lateMinutes > 0
          ? `Check-in berhasil. Kamu terlambat ${lateMinutes} menit.`
          : "Check-in berhasil.",
      attendanceId: attendanceRecord.id,
      status: attendanceRecord.status,
      workMode: effectiveMode,
      lateMinutes,
      locationUnlock: Boolean(approvedUnlock),
      office: nearestOffice
        ? {
          id: nearestOffice.office.id,
          name: nearestOffice.office.name,
          distance: Math.round(nearestOffice.distance),
          withinRadius: nearestOffice.isWithinRadius,
        }
        : null,
    });
  } catch (error) {
    console.error("CHECK_IN_ERROR", error);

    return NextResponse.json(
      { error: "Gagal melakukan check-in." },
      { status: 500 },
    );
  }
}
