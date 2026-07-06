import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { canViewAdminPanel } from "@/lib/adminAccess";
import { AttendanceStatus, CheckInStatus, type DayOfWeek } from "@/generated/prisma/enums";

export const runtime = "nodejs";

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

async function getPayload(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;
  if (!token) throw new Error("Belum login.");
  return verifyToken(token);
}

function formatTime(date?: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload(req);
    const url = new URL(req.url);
    const scope = String(url.searchParams.get("scope") || "employee");
    const todayOnly = url.searchParams.get("today") === "1";

    const where: {
      user_id?: string;
      visit_date?: Date;
    } = {};

    if (scope === "employee") {
      where.user_id = payload.id;
    } else if (!canViewAdminPanel(payload.role)) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    if (todayOnly) {
      where.visit_date = toDateOnly(getJakartaDateKey());
    }

    const visits = await prisma.employeeVisit.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        visit_date: true,
        title: true,
        client_name: true,
        address: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        start_time: true,
        end_time: true,
        note: true,
        status: true,
        visit_photo_mime: true,
        user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      visits: visits.map((visit) => ({
        id: visit.id,
        title: visit.title,
        clientName: visit.client_name,
        address: visit.address,
        latitude: visit.latitude,
        longitude: visit.longitude,
        accuracy: visit.accuracy,
        startTime: formatTime(visit.start_time),
        endTime: formatTime(visit.end_time),
        note: visit.note,
        status: visit.status,
        hasPhoto: Boolean(visit.visit_photo_mime),
        photoUrl: visit.visit_photo_mime ? `/api/visits/${visit.id}/photo` : null,
        employee: {
          id: visit.user.id,
          name: visit.user.name,
          employeeCode: visit.user.employee_code,
          department: visit.user.department?.name || null,
        },
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Gagal mengambil bukti kunjungan." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload(req);

    if (payload.role !== "employee") {
      return NextResponse.json({ success: false, message: "Hanya karyawan yang dapat mengirim bukti kunjungan." }, { status: 403 });
    }

    const formData = await req.formData();
    const title = String(formData.get("title") || "Kunjungan kerja").trim();
    const clientName = String(formData.get("clientName") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const note = String(formData.get("note") || "").trim();
    const latitude = toNumber(formData.get("latitude"));
    const longitude = toNumber(formData.get("longitude"));
    const accuracy = toNumber(formData.get("accuracy"));
    const { buffer, mime } = await fileToBuffer(formData.get("photo"));

    if (!title) {
      return NextResponse.json({ success: false, message: "Judul kunjungan wajib diisi." }, { status: 400 });
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json({ success: false, message: "Lokasi GPS bukti kunjungan wajib dikirim." }, { status: 400 });
    }

    if (!buffer) {
      return NextResponse.json({ success: false, message: "Foto bukti kunjungan wajib dikirim." }, { status: 400 });
    }

    const todayKey = getJakartaDateKey();
    const todayDate = toDateOnly(todayKey);
    let attendance = await prisma.attendance.findFirst({
      where: { user_id: payload.id, attendance_date: todayDate },
      select: { id: true },
      orderBy: { created_at: "desc" },
    });

    let newAttendanceCreated = false;

    if (!attendance) {
      // Auto check-in today since they are doing a visit!
      const user = await prisma.user.findUnique({
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

      if (user && user.status === "active") {
        const defaultSchedule = getDefaultSchedule(user.shift?.name);
        const schedule = user.shift?.work_schedules?.[0];
        const checkInTime = schedule?.check_in_time || defaultSchedule.checkIn;
        const checkOutTime = schedule?.check_out_time || defaultSchedule.checkOut;
        const startMinutes = timeToMinutes(checkInTime) ?? 8 * 60;
        const now = new Date();
        const nowMinutes = getJakartaMinutes(now);
        const toleranceMinutes = user.shift?.tolerance_minutes || 0;
        const shiftName = String(user.shift?.name || "").toLowerCase();
        const isFlexible =
          ["shift", "magang"].includes(String(user.employee_type || "").toLowerCase()) ||
          shiftName.includes("shift") ||
          shiftName.includes("flex") ||
          shiftName.includes("bebas");

        const lateMinutes = isFlexible ? 0 : Math.max(0, nowMinutes - startMinutes - toleranceMinutes);
        const attendanceStatus = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
        const checkInStatus = lateMinutes > 0 ? CheckInStatus.LATE : CheckInStatus.ON_TIME;

        attendance = await prisma.attendance.create({
          data: {
            user_id: payload.id,
            attendance_date: todayDate,
            scheduled_check_in: combineDateAndTime(todayKey, checkInTime),
            scheduled_check_out: combineDateAndTime(todayKey, checkOutTime),
            check_in_time: now,
            check_in_photo: buffer,
            check_in_photo_mime: mime,
            check_in_latitude: latitude,
            check_in_longitude: longitude,
            check_in_accuracy: accuracy,
            check_in_distance: null,
            check_in_within_radius: true,
            registered_office_id: user.registered_office_id,
            work_mode: "visit",
            is_visit: true,
            status: attendanceStatus,
            check_in_status: checkInStatus,
            late_minutes: lateMinutes,
            late_seconds: lateMinutes * 60,
            is_over_tolerance: lateMinutes > 0,
            activity_note: `mode=visit | visit_title=${title.slice(0, 100)}`,
          },
          select: { id: true },
        });
        newAttendanceCreated = true;
      }
    }

    const visit = await prisma.employeeVisit.create({
      data: {
        user_id: payload.id,
        attendance_id: attendance?.id || null,
        visit_date: todayDate,
        title: title.slice(0, 150),
        client_name: clientName || null,
        address: address || null,
        latitude,
        longitude,
        accuracy,
        start_time: new Date(),
        note: note || null,
        status: "completed",
        visit_photo: buffer,
        visit_photo_mime: mime,
      },
      select: { id: true },
    });

    if (attendance?.id && !newAttendanceCreated) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          is_visit: true,
          work_mode: "visit",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Bukti kunjungan berhasil disimpan.",
      visit,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Gagal menyimpan bukti kunjungan." },
      { status: 500 },
    );
  }
}