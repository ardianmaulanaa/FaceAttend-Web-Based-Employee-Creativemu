import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { Buffer } from "node:buffer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

function photoToDataUrl(
  photo: Uint8Array | Buffer | null,
  mime: string | null
) {
  if (!photo) return null;

  const buffer = Buffer.isBuffer(photo) ? photo : Buffer.from(photo);

  return `data:${mime || "image/jpeg"};base64,${buffer.toString("base64")}`;
}

function getAttendanceStatus(
  checkInTime: Date | null,
  checkOutTime: Date | null
) {
  if (checkOutTime) return "CHECKED_OUT";
  if (checkInTime) return "CHECKED_IN";
  return "PENDING";
}

function toIsoString(date: Date | null) {
  return date ? date.toISOString() : null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const { searchParams } = new URL(req.url);

    const now = new Date();

    const month = Number(searchParams.get("month") || now.getMonth() + 1);
    const year = Number(searchParams.get("year") || now.getFullYear());

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Bulan dan tahun tidak valid." },
        { status: 400 }
      );
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const attendances = await prisma.attendance.findMany({
      where: {
        user_id: userId,
        attendance_date: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: {
        attendance_date: "desc",
      },
      select: {
        id: true,
        attendance_date: true,

        scheduled_check_in: true,
        scheduled_check_out: true,

        check_in_time: true,
        check_out_time: true,

        check_in_photo: true,
        check_out_photo: true,

        check_in_photo_mime: true,
        check_out_photo_mime: true,

        registered_office_id: true,
        registered_office: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius_meters: true,
          },
        },

        check_in_office_id: true,
        check_in_office: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius_meters: true,
          },
        },

        check_in_latitude: true,
        check_in_longitude: true,
        check_in_accuracy: true,
        check_in_distance: true,
        check_in_within_radius: true,

        check_out_office_id: true,
        check_out_office: {
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius_meters: true,
          },
        },

        check_out_latitude: true,
        check_out_longitude: true,
        check_out_accuracy: true,
        check_out_distance: true,
        check_out_within_radius: true,

        late_minutes: true,
        early_leave_minutes: true,
        work_minutes: true,

        status: true,
        check_in_status: true,
        check_out_status: true,

        note: true,
      },
    });

    const result = attendances.map((attendance) => ({
      id: attendance.id,

      attendanceDate: attendance.attendance_date.toISOString(),

      scheduledCheckIn: toIsoString(attendance.scheduled_check_in),
      scheduledCheckOut: toIsoString(attendance.scheduled_check_out),

      checkInTime: toIsoString(attendance.check_in_time),
      checkOutTime: toIsoString(attendance.check_out_time),

      checkInPhoto: photoToDataUrl(
        attendance.check_in_photo,
        attendance.check_in_photo_mime
      ),
      checkOutPhoto: photoToDataUrl(
        attendance.check_out_photo,
        attendance.check_out_photo_mime
      ),

      registeredOffice: attendance.registered_office
        ? {
            id: attendance.registered_office.id,
            name: attendance.registered_office.name,
            address: attendance.registered_office.address,
            latitude: attendance.registered_office.latitude,
            longitude: attendance.registered_office.longitude,
            radiusMeters: attendance.registered_office.radius_meters,
          }
        : null,

      checkInOffice: attendance.check_in_office
        ? {
            id: attendance.check_in_office.id,
            name: attendance.check_in_office.name,
            address: attendance.check_in_office.address,
            latitude: attendance.check_in_office.latitude,
            longitude: attendance.check_in_office.longitude,
            radiusMeters: attendance.check_in_office.radius_meters,
          }
        : null,

      checkInGps: {
        latitude: attendance.check_in_latitude,
        longitude: attendance.check_in_longitude,
        accuracy: attendance.check_in_accuracy,
        distance: attendance.check_in_distance,
        withinRadius: attendance.check_in_within_radius,
      },

      checkOutOffice: attendance.check_out_office
        ? {
            id: attendance.check_out_office.id,
            name: attendance.check_out_office.name,
            address: attendance.check_out_office.address,
            latitude: attendance.check_out_office.latitude,
            longitude: attendance.check_out_office.longitude,
            radiusMeters: attendance.check_out_office.radius_meters,
          }
        : null,

      checkOutGps: {
        latitude: attendance.check_out_latitude,
        longitude: attendance.check_out_longitude,
        accuracy: attendance.check_out_accuracy,
        distance: attendance.check_out_distance,
        withinRadius: attendance.check_out_within_radius,
      },

      lateMinutes: attendance.late_minutes,
      earlyLeaveMinutes: attendance.early_leave_minutes,
      workMinutes: attendance.work_minutes,

      status: getAttendanceStatus(
        attendance.check_in_time,
        attendance.check_out_time
      ),
      rawStatus: attendance.status,
      checkInStatus: attendance.check_in_status,
      checkOutStatus: attendance.check_out_status,

      note: attendance.note,
    }));

    return NextResponse.json({
      success: true,
      month,
      year,
      attendances: result,
    });
  } catch (error) {
    console.error("GET_HISTORY_ERROR:", error);

    return NextResponse.json(
      { error: "Gagal mengambil riwayat absensi." },
      { status: 500 }
    );
  }
}