import type { UploadApiResponse } from "cloudinary";
import { jwtVerify } from "jose";
import { Buffer } from "node:buffer";
import { NextRequest, NextResponse } from "next/server";

import { getCloudinary } from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import {
  getDistanceInMeters,
  isGpsAccuracyAllowed,
  isValidGeofence,
  isValidGpsCoordinate,
  type OfficeGeofence,
} from "@/lib/geo";

export const runtime = "nodejs";

const MAX_GPS_ACCURACY_METERS = 100;
const MAX_PHOTO_SIZE = 4 * 1024 * 1024;

const ALLOWED_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

type WorkMode = "office" | "wfh" | "wfc" | "visit";

type ParsedAttendanceBody = {
  photoBuffer: Uint8Array<ArrayBuffer> | null;
  photoMime: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

function isMobileAttendanceRequest(req: NextRequest) {
  const secChMobile = req.headers.get("sec-ch-ua-mobile");

  if (secChMobile === "?1") return true;

  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();

  return /iphone|ipod|android.*mobile|blackberry|iemobile|opera mini|mobile/.test(
    userAgent,
  );
}

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

function getTodayDateOnly() {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function toJakartaDate(date = new Date()) {
  return new Date(date.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
}

function getDayOfWeekEnum(date = new Date()) {
  const dayIndex = toJakartaDate(date).getDay();

  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return days[dayIndex];
}

function timeToMinutes(time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText || 0);
  const minute = Number(minuteText || 0);

  return hour * 60 + minute;
}

function dateToMinutes(date: Date) {
  const jakartaDate = toJakartaDate(date);

  return jakartaDate.getHours() * 60 + jakartaDate.getMinutes();
}

function normalizeScheduleTime(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") {
    if (/^\d{2}:\d{2}/.test(value)) {
      return value.slice(0, 5);
    }

    const parsedDate = new Date(value);

    if (!Number.isNaN(parsedDate.getTime())) {
      return new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
        .format(parsedDate)
        .replace(".", ":");
    }

    return "";
  }

  if (value instanceof Date) {
    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(value)
      .replace(".", ":");
  }

  return "";
}

function getShiftDefaultCheckOutTime(shiftName?: string | null) {
  const name = String(shiftName || "").toUpperCase();

  if (name.includes("SHIFT SIANG")) return "21:00";
  if (name.includes("SIANG")) return "21:00";

  if (name.includes("SHIFT PAGI")) return "17:00";
  if (name.includes("PAGI")) return "17:00";

  if (name.includes("MAGANG")) return "17:00";
  if (name.includes("UTAMA")) return "17:00";

  return "17:00";
}

function calculateEarlyLeaveMinutes(
  checkOutAt: Date,
  scheduledCheckOut: string,
) {
  const checkOutMinutes = dateToMinutes(checkOutAt);
  const scheduledMinutes = timeToMinutes(scheduledCheckOut);
  const early = scheduledMinutes - checkOutMinutes;

  return early > 0 ? early : 0;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeWorkMode(value: unknown): WorkMode {
  const mode = String(value || "office")
    .trim()
    .toLowerCase();

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
      buffer: Uint8Array.from(Buffer.from(dataUrl, "base64")),
      mime: "image/jpeg",
    };
  }

  return {
    buffer: Uint8Array.from(Buffer.from(match[2], "base64")),
    mime: match[1],
  };
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();

  return {
    buffer: new Uint8Array(arrayBuffer),
    mime: file.type || "image/jpeg",
  };
}

async function uploadCheckOutPhoto(
  photoBuffer: Uint8Array<ArrayBuffer>,
  userId: string,
): Promise<UploadApiResponse> {
  const cloudinary = getCloudinary();

  return new Promise<UploadApiResponse>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "faceattend/attendance/check-out",
        public_id: `user-${userId}-${Date.now()}`,
        resource_type: "image",
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Cloudinary tidak mengembalikan hasil upload."));
          return;
        }

        resolve(result);
      },
    );

    uploadStream.end(Buffer.from(photoBuffer));
  });
}

async function deleteCloudinaryPhoto(publicId: string | null | undefined) {
  if (!publicId) return;

  try {
    const cloudinary = getCloudinary();

    await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
      invalidate: true,
    });
  } catch (error) {
    console.warn("DELETE_CHECK_OUT_PHOTO_WARNING:", error);
  }
}

async function parseAttendanceBody(
  req: NextRequest,
): Promise<ParsedAttendanceBody> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    const photo =
      formData.get("photo") ||
      formData.get("photoDataUrl") ||
      formData.get("checkOutPhoto") ||
      formData.get("image");

    const latitude = toNumber(
      formData.get("latitude") ?? formData.get("checkOutLatitude"),
    );

    const longitude = toNumber(
      formData.get("longitude") ?? formData.get("checkOutLongitude"),
    );

    const accuracy = toNumber(
      formData.get("accuracy") ?? formData.get("checkOutAccuracy"),
    );

    if (photo instanceof File) {
      const result = await fileToBuffer(photo);

      return {
        photoBuffer: result.buffer,
        photoMime: result.mime,
        latitude,
        longitude,
        accuracy,
      };
    }

    if (typeof photo === "string") {
      const result = dataUrlToBuffer(photo);

      return {
        photoBuffer: result.buffer,
        photoMime: result.mime,
        latitude,
        longitude,
        accuracy,
      };
    }

    return {
      photoBuffer: null,
      photoMime: "image/jpeg",
      latitude,
      longitude,
      accuracy,
    };
  }

  const body = (await req.json()) as Record<string, unknown>;
  const location =
    typeof body.location === "object" && body.location !== null
      ? (body.location as Record<string, unknown>)
      : {};

  const photoDataUrl =
    typeof body.photo === "string"
      ? body.photo
      : typeof body.photoDataUrl === "string"
        ? body.photoDataUrl
        : typeof body.checkOutPhoto === "string"
          ? body.checkOutPhoto
          : typeof body.image === "string"
            ? body.image
            : null;

  const latitude = toNumber(
    body.latitude ?? body.checkOutLatitude ?? location.latitude,
  );

  const longitude = toNumber(
    body.longitude ?? body.checkOutLongitude ?? location.longitude,
  );

  const accuracy = toNumber(
    body.accuracy ?? body.checkOutAccuracy ?? location.accuracy,
  );

  if (!photoDataUrl) {
    return {
      photoBuffer: null,
      photoMime: "image/jpeg",
      latitude,
      longitude,
      accuracy,
    };
  }

  const result = dataUrlToBuffer(photoDataUrl);

  return {
    photoBuffer: result.buffer,
    photoMime: result.mime,
    latitude,
    longitude,
    accuracy,
  };
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!isMobileAttendanceRequest(req)) {
      return NextResponse.json(
        {
          error:
            "Absensi hanya dapat dilakukan melalui browser HP. Laptop atau desktop tidak diizinkan.",
        },
        { status: 403 },
      );
    }

    const { photoBuffer, photoMime, latitude, longitude, accuracy } =
      await parseAttendanceBody(req);

    if (!photoBuffer) {
      return NextResponse.json(
        { error: "Foto check-out wajib dikirim." },
        { status: 400 },
      );
    }

    if (!ALLOWED_PHOTO_MIME_TYPES.has(photoMime.toLowerCase())) {
      return NextResponse.json(
        { error: "Format foto harus JPG, PNG, atau WEBP." },
        { status: 400 },
      );
    }

    if (photoBuffer.byteLength > MAX_PHOTO_SIZE) {
      return NextResponse.json(
        { error: "Ukuran foto maksimal 4MB." },
        { status: 400 },
      );
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json(
        { error: "Lokasi GPS check-out wajib dikirim." },
        { status: 400 },
      );
    }

    if (accuracy === null) {
      return NextResponse.json(
        { error: "Akurasi GPS check-out wajib dikirim." },
        { status: 400 },
      );
    }

    if (!isValidGpsCoordinate({ lat: latitude, lng: longitude })) {
      return NextResponse.json(
        { error: "Koordinat GPS check-out tidak valid." },
        { status: 400 },
      );
    }

    if (!isGpsAccuracyAllowed(accuracy, MAX_GPS_ACCURACY_METERS)) {
      return NextResponse.json(
        {
          error: `Akurasi GPS terlalu rendah. Maksimal ±${MAX_GPS_ACCURACY_METERS} meter.`,
          accuracy,
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        name: true,
        status: true,
        registered_office_id: true,
        shift: {
          select: {
            id: true,
            name: true,
            work_schedules: {
              select: {
                id: true,
                day_of_week: true,
                is_work_day: true,
                check_out_time: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Data user tidak ditemukan." },
        { status: 404 },
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Akun kamu sedang tidak aktif." },
        { status: 403 },
      );
    }

    const now = new Date();
    const today = getTodayDateOnly();

    const attendance = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        attendance_date: today,
      },
    });

    if (!attendance || !attendance.check_in_time) {
      return NextResponse.json(
        { error: "Kamu belum melakukan check-in hari ini." },
        { status: 400 },
      );
    }

    if (attendance.check_out_time) {
      return NextResponse.json(
        { error: "Kamu sudah melakukan check-out hari ini." },
        { status: 400 },
      );
    }

    const workMode = normalizeWorkMode(attendance.work_mode);
    const isOfficeMode = workMode === "office";
    const isWfhMode = workMode === "wfh";
    const isWfcMode = workMode === "wfc";
    const isVisitMode = workMode === "visit";
    const isFlexibleMode = isWfhMode || isWfcMode || isVisitMode;

    let matchedOffice: {
      office: OfficeGeofence;
      distance: number;
      isWithinRadius: boolean;
    } | null = null;

    if (isOfficeMode) {
      const officeId =
        attendance.registered_office_id || user.registered_office_id;

      if (!officeId) {
        return NextResponse.json(
          {
            success: false,
            error: "Akun kamu belum memiliki kantor terdaftar.",
            message:
              "Hubungi admin untuk mengatur kantor karyawan terlebih dahulu.",
          },
          { status: 400 },
        );
      }

      const registeredOffice = await prisma.officeLocation.findFirst({
        where: {
          id: officeId,
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

      if (!registeredOffice) {
        return NextResponse.json(
          {
            success: false,
            error: "Kantor terdaftar tidak ditemukan atau sedang tidak aktif.",
            message:
              "Hubungi admin untuk memastikan kantor karyawan masih aktif.",
          },
          { status: 400 },
        );
      }

      const officeLatitude = toNumber(registeredOffice.latitude);
      const officeLongitude = toNumber(registeredOffice.longitude);
      const officeRadius = toNumber(registeredOffice.radius_meters);

      if (
        officeLatitude === null ||
        officeLongitude === null ||
        officeRadius === null
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Data titik GPS kantor belum lengkap.",
            message:
              "Latitude, longitude, atau radius kantor belum lengkap di master data kantor.",
          },
          { status: 400 },
        );
      }

      if (
        !isValidGeofence({
          id: registeredOffice.id,
          name: registeredOffice.name,
          latitude: officeLatitude,
          longitude: officeLongitude,
          radius_meters: officeRadius,
        })
      ) {
        return NextResponse.json(
          {
            success: false,
            error: "Data geofence kantor tidak valid.",
            message:
              "Latitude harus -90 sampai 90, longitude -180 sampai 180, dan radius kantor harus lebih dari 0 meter.",
          },
          { status: 400 },
        );
      }

      const distance = getDistanceInMeters(
        {
          lat: latitude,
          lng: longitude,
        },
        {
          lat: officeLatitude,
          lng: officeLongitude,
        },
      );

      const isWithinRadius = distance <= officeRadius;

      if (!isWithinRadius) {
        return NextResponse.json(
          {
            success: false,
            error: `Lokasi kamu berada di luar radius kantor ${registeredOffice.name}.`,
            message: `Kamu hanya bisa check-out mode Kantor di radius kantor terdaftar: ${registeredOffice.name}.`,
            latitude,
            longitude,
            accuracy,
            distance: Math.round(distance),
            radius: officeRadius,
            office: {
              id: registeredOffice.id,
              name: registeredOffice.name,
              latitude: officeLatitude,
              longitude: officeLongitude,
              radius: officeRadius,
            },
          },
          { status: 400 },
        );
      }

      matchedOffice = {
        office: {
          id: registeredOffice.id,
          name: registeredOffice.name,
          latitude: officeLatitude,
          longitude: officeLongitude,
          radius_meters: officeRadius,
        },
        distance,
        isWithinRadius,
      };
    }

    const todayName = getDayOfWeekEnum(now);

    const todaySchedule = user.shift?.work_schedules?.find((schedule) => {
      return String(schedule.day_of_week).toUpperCase() === todayName;
    });

    if (todaySchedule && todaySchedule.is_work_day === false) {
      return NextResponse.json(
        { error: "Hari ini bukan jadwal kerja kamu." },
        { status: 400 },
      );
    }

    const scheduledCheckOutTime =
      normalizeScheduleTime(todaySchedule?.check_out_time) ||
      getShiftDefaultCheckOutTime(user.shift?.name);

    const workMinutes = Math.max(
      0,
      Math.floor((now.getTime() - attendance.check_in_time.getTime()) / 60000),
    );

    const earlyLeaveMinutes = calculateEarlyLeaveMinutes(
      now,
      scheduledCheckOutTime,
    );

    const checkOutStatus =
      earlyLeaveMinutes > 0 ? ("EARLY" as const) : ("NORMAL" as const);

    const uploadedPhoto = await uploadCheckOutPhoto(photoBuffer, userId);

    let updatedAttendance;

    try {
      updatedAttendance = await prisma.$transaction(async (tx) => {
        const savedAttendance = await tx.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          check_out_time: now,
          check_out_photo: null,
          check_out_photo_mime: photoMime,
          check_out_photo_url: uploadedPhoto.secure_url,
          check_out_photo_public_id: uploadedPhoto.public_id,

          check_out_latitude: latitude,
          check_out_longitude: longitude,
          check_out_accuracy: accuracy,
          check_out_distance: matchedOffice?.distance ?? null,
          check_out_within_radius: Boolean(matchedOffice?.isWithinRadius),
          check_out_office_id: matchedOffice?.office.id ?? null,

          registered_office_id:
            attendance.registered_office_id ?? user.registered_office_id,

          work_minutes: workMinutes,
          early_leave_minutes: earlyLeaveMinutes,
          check_out_status: checkOutStatus,
        },
      });

      if (isVisitMode) {
        await tx.employeeVisit.updateMany({
          where: {
            attendance_id: attendance.id,
            user_id: userId,
            status: {
              not: "cancelled",
            },
          },
          data: {
            end_time: now,
            status: "completed",
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
                ? "Karyawan selesai kunjungan"
                : `Karyawan selesai ${modeLabel}`,
            message:
              workMode === "visit"
                ? `${employeeName} melakukan check-out kunjungan. GPS check-out: ${coordinateText}.`
                : `${employeeName} melakukan check-out mode ${modeLabel}. GPS check-out: ${coordinateText}.`,
            status: "unread",
            is_read: false,
          },
        });
      }

        return savedAttendance;
      });
    } catch (databaseError) {
      await deleteCloudinaryPhoto(uploadedPhoto.public_id);
      throw databaseError;
    }

    if (
      attendance.check_out_photo_public_id &&
      attendance.check_out_photo_public_id !== uploadedPhoto.public_id
    ) {
      await deleteCloudinaryPhoto(attendance.check_out_photo_public_id);
    }

    return NextResponse.json({
      success: true,
      message:
        earlyLeaveMinutes > 0
          ? `Check-out berhasil. Kamu pulang lebih awal ${earlyLeaveMinutes} menit.`
          : "Check-out berhasil.",
      attendanceId: updatedAttendance.id,
      photoUrl: uploadedPhoto.secure_url,
      workMode,
      workModeLabel: getWorkModeLabel(workMode),
      isWfh: isWfhMode,
      isWfc: isWfcMode,
      isVisit: isVisitMode,
      office: matchedOffice
        ? {
            id: matchedOffice.office.id,
            name: matchedOffice.office.name,
            distance: Math.round(matchedOffice.distance),
            radius: matchedOffice.office.radius_meters,
          }
        : null,
      gps: {
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
      },
      schedule: {
        shift: user.shift?.name || "Tanpa Shift",
        scheduledCheckOutTime,
      },
      workMinutes,
      earlyLeaveMinutes,
      checkOutStatus,
    });
  } catch (error) {
    console.error("CHECK_OUT_ERROR:", error);

    return NextResponse.json(
      { error: getApiErrorMessage(error, "Gagal melakukan check-out.") },
      { status: getApiErrorStatus(error) },
    );
  }
}
