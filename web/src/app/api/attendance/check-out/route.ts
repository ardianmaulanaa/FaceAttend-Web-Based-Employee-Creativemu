import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { getDistanceInMeters } from "@/lib/geo";

export const runtime = "nodejs";

const MAX_GPS_ACCURACY_METERS = 100;

type WorkMode = "office" | "wfh" | "visit" | "flexible";

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
    },
  });
}

async function hasApprovedOvertime(userId: string, date: Date) {
  const request = await prisma.leaveRequest.findFirst({
    where: {
      user_id: userId,
      status: "approved",
      leave_type: "overtime",
      start_date: { lte: date },
      end_date: { gte: date },
    },
    select: { id: true },
  });
  return Boolean(request);
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
        { error: "Hanya karyawan yang dapat check-out." },
        { status: 403 },
      );
    }

    const formData = await req.formData();
    const { buffer: photoBuffer, mime: photoMime } = await fileToBuffer(
      formData.get("photo") || formData.get("checkOutPhoto"),
    );
    const latitude = toNumber(formData.get("latitude") || formData.get("checkOutLatitude"));
    const longitude = toNumber(formData.get("longitude") || formData.get("checkOutLongitude"));
    const accuracy = toNumber(formData.get("accuracy") || formData.get("checkOutAccuracy"));
    const requestedMode = normalizeWorkMode(formData.get("workMode"));

    if (!photoBuffer) {
      return NextResponse.json({ error: "Foto check-out wajib dikirim." }, { status: 400 });
    }

    if (latitude === null || longitude === null || accuracy === null) {
      return NextResponse.json({ error: "Lokasi GPS check-out wajib dikirim." }, { status: 400 });
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

    const todayKey = getJakartaDateKey();
    const todayDate = toDateOnly(todayKey);
    const attendance = await prisma.attendance.findFirst({
      where: { user_id: payload.id, attendance_date: todayDate },
      select: {
        id: true,
        check_in_time: true,
        check_out_time: true,
        scheduled_check_out: true,
        work_mode: true,
        is_wfh: true,
        is_visit: true,
        status: true,
        activity_note: true,
      },
    });

    if (!attendance?.check_in_time) {
      return NextResponse.json({ error: "Kamu belum check-in hari ini." }, { status: 400 });
    }

    if (attendance.check_out_time) {
      return NextResponse.json({ error: "Kamu sudah melakukan check-out hari ini." }, { status: 409 });
    }

    const approvedUnlock = await getApprovedLocationUnlock(payload.id, todayDate);
    const hasOvertimeRequest = await hasApprovedOvertime(payload.id, todayDate);
    const effectiveMode = approvedUnlock?.requested_work_mode || attendance.work_mode || requestedMode;
    const requiresOfficeRadius = effectiveMode === "office" && !approvedUnlock;

    const offices = await prisma.officeLocation.findMany({
      where: { status: "active" },
      select: { id: true, name: true, latitude: true, longitude: true, radius_meters: true },
    });
    const nearestOffice = findNearestOffice({ lat: latitude, lng: longitude }, offices);

    if (requiresOfficeRadius && (!nearestOffice || !nearestOffice.isWithinRadius)) {
      return NextResponse.json(
        {
          error: "Lokasi check-out berada di luar radius kantor. Minta admin membuka kunci lokasi jika sedang WFH/kunjungan/lembur.",
          latitude,
          longitude,
          accuracy,
        },
        { status: 400 },
      );
    }

    const now = new Date();
    const workMinutes = Math.max(
      0,
      Math.floor((now.getTime() - new Date(attendance.check_in_time).getTime()) / 60000),
    );
    const scheduledCheckOutMinutes = attendance.scheduled_check_out
      ? getJakartaMinutes(new Date(attendance.scheduled_check_out))
      : 17 * 60;
    const nowMinutes = getJakartaMinutes(now);
    const approvedOvertimeAfterFive =
      (approvedUnlock?.leave_type === "overtime" || hasOvertimeRequest) &&
      ["office", "wfh"].includes(effectiveMode) &&
      nowMinutes >= 17 * 60;
    const earlyLeaveMinutes = approvedOvertimeAfterFive
      ? 0
      : Math.max(0, scheduledCheckOutMinutes - nowMinutes);
    const existingNote = attendance.activity_note ? `${attendance.activity_note} | ` : "";
    const noteParts = [
      `${existingNote}checkout_mode=${effectiveMode}`,
      approvedUnlock ? `location_unlock=${approvedUnlock.leave_type}` : null,
      approvedOvertimeAfterFive ? "overtime_after_17=true" : null,
    ].filter(Boolean);

    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        check_out_time: now,
        check_out_photo: photoBuffer,
        check_out_photo_mime: photoMime,
        check_out_latitude: latitude,
        check_out_longitude: longitude,
        check_out_accuracy: accuracy,
        check_out_distance: nearestOffice?.distance ?? null,
        check_out_within_radius: Boolean(nearestOffice?.isWithinRadius || approvedUnlock),
        check_out_office_id: nearestOffice?.isWithinRadius ? nearestOffice.office.id : null,
        check_out_status: earlyLeaveMinutes > 0 ? "EARLY" : "NORMAL",
        early_leave_minutes: earlyLeaveMinutes,
        work_minutes: workMinutes,
        work_mode: effectiveMode === "office" ? "office" : effectiveMode,
        is_wfh: effectiveMode === "wfh",
        is_visit: effectiveMode === "visit" || Boolean(approvedUnlock?.leave_type === "visit"),
        status: attendance.status === "PENDING" ? "PRESENT" : attendance.status,
        activity_note: noteParts.join(" | ").slice(0, 255),
        note: approvedUnlock ? "Lokasi check-out dibuka berdasarkan approval admin." : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      message: approvedOvertimeAfterFive
        ? "Check-out lembur berhasil. Status lembur otomatis aktif setelah jam 17.00."
        : "Check-out berhasil.",
      attendanceId: updated.id,
      workMinutes,
      earlyLeaveMinutes,
      workMode: effectiveMode,
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
    console.error("CHECK_OUT_ERROR", error);

    return NextResponse.json(
      { error: "Gagal melakukan check-out." },
      { status: 500 },
    );
  }
}
