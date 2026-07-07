import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { Buffer } from "node:buffer";
import { prisma } from "@/lib/prisma";
import { AttendanceStatus } from "@/generated/prisma/enums";

export const runtime = "nodejs";

const MAX_GPS_ACCURACY_METERS = 100;

type WorkMode = "office" | "wfh" | "wfc" | "visit";

type ParsedAttendanceBody = {
  photoBuffer: Buffer | null;
  photoMime: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  lateReason: string;
  workMode: WorkMode;
  activityNote: string;
  visitTitle: string;
  visitClientName: string;
  visitAddress: string;
  visitNote: string;
};

type GeoPoint = {
  lat: number;
  lng: number;
};

type OfficeGeofence = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

async function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;

  if (!token) throw new Error("Token login tidak ditemukan.");
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum ada di file .env");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);

  const userId =
    (payload.id as string | undefined) ||
    (payload.userId as string | undefined) ||
    (payload.sub as string | undefined);

  if (!userId) throw new Error("User ID tidak ditemukan di token.");

  return userId;
}

function getTodayDateOnly() {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function toJakartaDate(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

function timeToMinutes(time: string) {
  const [hourText, minuteText] = time.split(":");
  return Number(hourText || 0) * 60 + Number(minuteText || 0);
}

function dateToMinutes(date: Date) {
  const jakartaDate = toJakartaDate(date);
  return jakartaDate.getHours() * 60 + jakartaDate.getMinutes();
}

function calculateLateMinutes(
  checkInAt: Date,
  startTime: string,
  toleranceMinutes: number
) {
  const late =
    dateToMinutes(checkInAt) - timeToMinutes(startTime) - toleranceMinutes;

  return late > 0 ? late : 0;
}

function getShiftStartTime(shiftName?: string | null) {
  const name = String(shiftName || "").toUpperCase();

  if (name.includes("SHIFT SIANG") || name.includes("SIANG")) return "13:00";
  if (name.includes("SHIFT PAGI") || name.includes("PAGI")) return "08:00";
  if (name.includes("MAGANG") || name.includes("UTAMA")) return "08:00";

  return "08:00";
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeWorkMode(value: unknown): WorkMode {
  const mode = String(value || "office").trim().toLowerCase();

  if (mode === "wfh") return "wfh";
  if (mode === "wfc") return "wfc";
  if (mode === "visit" || mode === "kunjungan") return "visit";
  if (mode === "office" || mode === "wfo" || mode === "kantor") {
    return "office";
  }

  return "office";
}

function getWorkModeLabel(workMode: WorkMode) {
  if (workMode === "wfh") return "WFH";
  if (workMode === "wfc") return "WFC";
  if (workMode === "visit") return "Kunjungan";
  return "Kantor";
}

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return {
      buffer: Buffer.from(dataUrl, "base64"),
      mime: "image/jpeg",
    };
  }

  return {
    buffer: Buffer.from(match[2], "base64"),
    mime: match[1],
  };
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    mime: file.type || "image/jpeg",
  };
}

function getDistanceInMeters(from: GeoPoint, to: GeoPoint) {
  const earthRadius = 6371000;

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function findNearestValidOffice(
  userLocation: GeoPoint,
  offices: OfficeGeofence[]
) {
  return (
    offices
      .map((office) => {
        const distance = getDistanceInMeters(userLocation, {
          lat: office.latitude,
          lng: office.longitude,
        });

        return {
          office,
          distance,
          isWithinRadius: distance <= office.radius_meters,
        };
      })
      .filter((item) => item.isWithinRadius)
      .sort((a, b) => a.distance - b.distance)[0] ?? null
  );
}

function getFormText(formData: FormData, keys: string[]) {
  for (const key of keys) {
    const value = formData.get(key);

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

function getBodyText(body: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = body[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}

async function parseAttendanceBody(
  req: NextRequest
): Promise<ParsedAttendanceBody> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    const photo =
      formData.get("photo") ||
      formData.get("photoDataUrl") ||
      formData.get("checkInPhoto") ||
      formData.get("image");

    const latitude = toNumber(
      formData.get("latitude") ?? formData.get("checkInLatitude")
    );

    const longitude = toNumber(
      formData.get("longitude") ?? formData.get("checkInLongitude")
    );

    const accuracy = toNumber(
      formData.get("accuracy") ?? formData.get("checkInAccuracy")
    );

    const lateReason = getFormText(formData, [
      "lateReason",
      "late_reason",
      "reason",
      "lateNote",
      "late_note",
    ]);

    const workMode = normalizeWorkMode(
      formData.get("workMode") ||
        formData.get("work_mode") ||
        formData.get("attendanceMode") ||
        formData.get("attendance_mode")
    );

    const activityNote = getFormText(formData, [
      "activityNote",
      "activity_note",
      "note",
    ]);

    const visitTitle = getFormText(formData, [
      "visitTitle",
      "visit_title",
      "visitPlaceName",
      "visit_place_name",
      "placeName",
      "place_name",
      "title",
    ]);

    const visitClientName = getFormText(formData, [
      "visitClientName",
      "visit_client_name",
      "clientName",
      "client_name",
    ]);

    const visitAddress = getFormText(formData, [
      "visitAddress",
      "visit_address",
      "address",
    ]);

    const visitNote = getFormText(formData, [
      "visitNote",
      "visit_note",
      "visitPurpose",
      "visit_purpose",
      "purpose",
    ]);

    const baseData = {
      latitude,
      longitude,
      accuracy,
      lateReason,
      workMode,
      activityNote,
      visitTitle,
      visitClientName,
      visitAddress,
      visitNote,
    };

    if (photo instanceof File) {
      const result = await fileToBuffer(photo);

      return {
        ...baseData,
        photoBuffer: result.buffer,
        photoMime: result.mime,
      };
    }

    if (typeof photo === "string") {
      const result = dataUrlToBuffer(photo);

      return {
        ...baseData,
        photoBuffer: result.buffer,
        photoMime: result.mime,
      };
    }

    return {
      ...baseData,
      photoBuffer: null,
      photoMime: "image/jpeg",
    };
  }

  const body = (await req.json()) as Record<string, unknown>;

  const photoDataUrl =
    typeof body.photo === "string"
      ? body.photo
      : typeof body.photoDataUrl === "string"
        ? body.photoDataUrl
        : typeof body.checkInPhoto === "string"
          ? body.checkInPhoto
          : typeof body.image === "string"
            ? body.image
            : null;

  const latitude = toNumber(
    body.latitude ??
      body.checkInLatitude ??
      (body.location as { latitude?: unknown } | undefined)?.latitude
  );

  const longitude = toNumber(
    body.longitude ??
      body.checkInLongitude ??
      (body.location as { longitude?: unknown } | undefined)?.longitude
  );

  const accuracy = toNumber(
    body.accuracy ??
      body.checkInAccuracy ??
      (body.location as { accuracy?: unknown } | undefined)?.accuracy
  );

  const lateReason = getBodyText(body, [
    "lateReason",
    "late_reason",
    "reason",
    "lateNote",
    "late_note",
  ]);

  const workMode = normalizeWorkMode(
    body.workMode ??
      body.work_mode ??
      body.attendanceMode ??
      body.attendance_mode
  );

  const activityNote = getBodyText(body, [
    "activityNote",
    "activity_note",
    "note",
  ]);

  const visitTitle = getBodyText(body, [
    "visitTitle",
    "visit_title",
    "visitPlaceName",
    "visit_place_name",
    "placeName",
    "place_name",
    "title",
  ]);

  const visitClientName = getBodyText(body, [
    "visitClientName",
    "visit_client_name",
    "clientName",
    "client_name",
  ]);

  const visitAddress = getBodyText(body, [
    "visitAddress",
    "visit_address",
    "address",
  ]);

  const visitNote = getBodyText(body, [
    "visitNote",
    "visit_note",
    "visitPurpose",
    "visit_purpose",
    "purpose",
  ]);

  const baseData = {
    latitude,
    longitude,
    accuracy,
    lateReason,
    workMode,
    activityNote,
    visitTitle,
    visitClientName,
    visitAddress,
    visitNote,
  };

  if (!photoDataUrl) {
    return {
      ...baseData,
      photoBuffer: null,
      photoMime: "image/jpeg",
    };
  }

  const result = dataUrlToBuffer(photoDataUrl);

  return {
    ...baseData,
    photoBuffer: result.buffer,
    photoMime: result.mime,
  };
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const {
      photoBuffer,
      photoMime,
      latitude,
      longitude,
      accuracy,
      lateReason,
      workMode,
      activityNote,
      visitTitle,
      visitClientName,
      visitAddress,
      visitNote,
    } = await parseAttendanceBody(req);

    const isOfficeMode = workMode === "office";
    const isWfhMode = workMode === "wfh";
    const isWfcMode = workMode === "wfc";
    const isVisitMode = workMode === "visit";
    const isFlexibleMode = isWfhMode || isWfcMode || isVisitMode;

    if (!photoBuffer) {
      return NextResponse.json(
        { error: "Foto check-in wajib dikirim." },
        { status: 400 }
      );
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json(
        { error: "Lokasi GPS check-in wajib dikirim." },
        { status: 400 }
      );
    }

    if (accuracy === null) {
      return NextResponse.json(
        { error: "Akurasi GPS check-in wajib dikirim." },
        { status: 400 }
      );
    }

    if (accuracy > MAX_GPS_ACCURACY_METERS) {
      return NextResponse.json(
        {
          error: `Akurasi GPS terlalu rendah. Maksimal ±${MAX_GPS_ACCURACY_METERS} meter.`,
          accuracy,
        },
        { status: 400 }
      );
    }

    if (isVisitMode && (!visitTitle || !visitAddress || !visitNote)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Data kunjungan wajib diisi. Isi nama/tempat kunjungan, alamat, dan keperluan kunjungan.",
          message:
            "Data kunjungan wajib diisi. Isi nama/tempat kunjungan, alamat, dan keperluan kunjungan.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        employee_code: true,
        status: true,
        registered_office_id: true,
        shift: {
          select: {
            id: true,
            name: true,
            tolerance_minutes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Data user tidak ditemukan." },
        { status: 404 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Akun kamu sedang tidak aktif." },
        { status: 403 }
      );
    }

    let matchedOffice: {
      office: OfficeGeofence;
      distance: number;
      isWithinRadius: boolean;
    } | null = null;

    if (isOfficeMode) {
      const offices = await prisma.officeLocation.findMany({
        where: {
          status: "active",
        },
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
          radius_meters: true,
        },
      });

      if (offices.length === 0) {
        return NextResponse.json(
          { error: "Belum ada data kantor aktif untuk validasi GPS." },
          { status: 400 }
        );
      }

      matchedOffice = findNearestValidOffice(
        {
          lat: latitude,
          lng: longitude,
        },
        offices
      );

      if (!matchedOffice) {
        return NextResponse.json(
          {
            error: "Lokasi kamu berada di luar radius semua kantor aktif.",
            latitude,
            longitude,
            accuracy,
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();
    const today = getTodayDateOnly();

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        attendance_date: today,
      },
    });

    if (existingAttendance?.check_in_time) {
      return NextResponse.json(
        { error: "Kamu sudah melakukan check-in hari ini." },
        { status: 400 }
      );
    }

    const startTime = getShiftStartTime(user.shift?.name);
    const toleranceMinutes = user.shift?.tolerance_minutes || 0;
    const lateMinutes = calculateLateMinutes(now, startTime, toleranceMinutes);
    const isLate = lateMinutes > 0;
    const attendanceStatus = isLate ? "LATE" : "PRESENT";

    if (isLate && !lateReason) {
      return NextResponse.json(
        {
          success: false,
          requiresLateReason: true,
          error: "Kamu sudah melewati batas toleransi. Alasan telat wajib diisi.",
          message:
            "Kamu sudah melewati batas toleransi. Alasan telat wajib diisi.",
          lateMinutes,
          schedule: {
            shift: user.shift?.name || "Tanpa Shift",
            startTime,
            toleranceMinutes,
          },
        },
        { status: 400 }
      );
    }

    const checkInData = {
      check_in_time: now,
      check_in_photo: photoBuffer,
      check_in_photo_mime: photoMime,

      work_mode: workMode,
      is_wfh: isWfhMode,
      is_wfc: isWfcMode,
      is_visit: isVisitMode,

      check_in_latitude: latitude,
      check_in_longitude: longitude,
      check_in_accuracy: accuracy,
      check_in_distance: matchedOffice?.distance ?? null,
      check_in_within_radius: Boolean(matchedOffice?.isWithinRadius),

      registered_office_id: user.registered_office_id,
      check_in_office_id: matchedOffice?.office.id ?? null,

      status: attendanceStatus as any,
      check_in_status: isLate ? "LATE" : "ON_TIME",
      late_minutes: lateMinutes,
      is_over_tolerance: isLate,
      late_reason: isLate ? lateReason : null,

      activity_note: activityNote || null,
    };

    const attendance = await prisma.$transaction(async (tx: any) => {
      const savedAttendance = existingAttendance
        ? await tx.attendance.update({
            where: {
              id: existingAttendance.id,
            },
            data: {
              ...checkInData,
              work_minutes: existingAttendance.work_minutes ?? 0,
            },
          })
        : await tx.attendance.create({
            data: {
              user_id: userId,
              attendance_date: today,
              ...checkInData,
              work_minutes: 0,
            },
          });

      if (isVisitMode) {
        await tx.employeeVisit.create({
          data: {
            user_id: userId,
            attendance_id: savedAttendance.id,
            visit_date: today,
            title: visitTitle,
            client_name: visitClientName || null,
            address: visitAddress,
            latitude,
            longitude,
            accuracy,
            start_time: now,
            note: visitNote,
            status: "ongoing",
          },
        });
      }

      if (isFlexibleMode) {
        const modeLabel = getWorkModeLabel(workMode);
        const employeeName = user.name || "Karyawan";
        const coordinateText = `${latitude}, ${longitude}`;

        await tx.adminNotification.create({
          data: {
            attendance_id: savedAttendance.id,
            user_id: userId,
            type: workMode,
            title:
              workMode === "visit"
                ? "Karyawan melakukan kunjungan"
                : `Karyawan ${modeLabel}`,
            message:
              workMode === "visit"
                ? `${employeeName} check-in kunjungan di ${visitTitle}. Alamat: ${visitAddress}. Keperluan: ${visitNote}. GPS: ${coordinateText}.`
                : `${employeeName} check-in dengan mode ${modeLabel}. GPS: ${coordinateText}.`,
            status: "unread",
            is_read: false,
          },
        });
      }

      return savedAttendance;
    });

    return NextResponse.json({
      success: true,
      message: isLate
        ? `Check-in berhasil. Kamu terlambat ${lateMinutes} menit.`
        : "Check-in berhasil.",
      attendanceId: attendance.id,
      status: attendanceStatus,
      workMode,
      workModeLabel: getWorkModeLabel(workMode),
      isWfh: isWfhMode,
      isWfc: isWfcMode,
      isVisit: isVisitMode,
      lateMinutes,
      lateReason: isLate ? lateReason : null,
      schedule: {
        shift: user.shift?.name || "Tanpa Shift",
        startTime,
        toleranceMinutes,
      },
      office: matchedOffice
        ? {
            id: matchedOffice.office.id,
            name: matchedOffice.office.name,
            distance: Math.round(matchedOffice.distance),
            radius: matchedOffice.office.radius_meters,
          }
        : null,
      visit: isVisitMode
        ? {
            title: visitTitle,
            clientName: visitClientName || null,
            address: visitAddress,
            note: visitNote,
          }
        : null,
      gps: {
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
      },
    });
  } catch (error) {
    console.error("CHECK_IN_ERROR:", error);

    return NextResponse.json(
      { error: "Gagal melakukan check-in." },
      { status: 500 }
    );
  }
}