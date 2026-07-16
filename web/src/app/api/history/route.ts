import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export const runtime = "nodejs";

function photoToDataUrl(
  photo: Uint8Array | Buffer | null,
  mime: string | null,
) {
  if (!photo) return null;

  const buffer = Buffer.isBuffer(photo) ? photo : Buffer.from(photo);

  return `data:${mime || "image/jpeg"};base64,${buffer.toString("base64")}`;
}

function getAttendanceStatus(
  checkInTime: Date | null,
  checkOutTime: Date | null,
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
    const { id: userId } = await requireAuth(req);

    const { searchParams } = new URL(req.url);

    const now = new Date();

    const month = Number(searchParams.get("month") || now.getMonth() + 1);
    const year = Number(searchParams.get("year") || now.getFullYear());

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Bulan dan tahun tidak valid." },
        { status: 400 },
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

    const result = attendances.map((attendance) => {
      const registeredOffice = attendance.registered_office as {
        id: string;
        name: string;
        address: string | null;
        latitude: number;
        longitude: number;
        radius_meters: number;
      } | null;

      const checkInOffice = attendance.check_in_office as {
        id: string;
        name: string;
        address: string | null;
        latitude: number;
        longitude: number;
        radius_meters: number;
      } | null;

      const checkOutOffice = attendance.check_out_office as {
        id: string;
        name: string;
        address: string | null;
        latitude: number;
        longitude: number;
        radius_meters: number;
      } | null;

      return {
        id: attendance.id,

        attendanceDate: attendance.attendance_date.toISOString(),

        scheduledCheckIn: toIsoString(attendance.scheduled_check_in),
        scheduledCheckOut: toIsoString(attendance.scheduled_check_out),

        checkInTime: toIsoString(attendance.check_in_time),
        checkOutTime: toIsoString(attendance.check_out_time),

        checkInPhoto: photoToDataUrl(
          attendance.check_in_photo,
          attendance.check_in_photo_mime,
        ),
        checkOutPhoto: photoToDataUrl(
          attendance.check_out_photo,
          attendance.check_out_photo_mime,
        ),

        registeredOffice: registeredOffice
          ? {
              id: registeredOffice.id,
              name: registeredOffice.name,
              address: registeredOffice.address,
              latitude: registeredOffice.latitude,
              longitude: registeredOffice.longitude,
              radiusMeters: registeredOffice.radius_meters,
            }
          : null,

        checkInOffice: checkInOffice
          ? {
              id: checkInOffice.id,
              name: checkInOffice.name,
              address: checkInOffice.address,
              latitude: checkInOffice.latitude,
              longitude: checkInOffice.longitude,
              radiusMeters: checkInOffice.radius_meters,
            }
          : null,

        checkInGps: {
          latitude: attendance.check_in_latitude,
          longitude: attendance.check_in_longitude,
          accuracy: attendance.check_in_accuracy,
          distance: attendance.check_in_distance,
          withinRadius: attendance.check_in_within_radius,
        },

        checkOutOffice: checkOutOffice
          ? {
              id: checkOutOffice.id,
              name: checkOutOffice.name,
              address: checkOutOffice.address,
              latitude: checkOutOffice.latitude,
              longitude: checkOutOffice.longitude,
              radiusMeters: checkOutOffice.radius_meters,
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
          attendance.check_out_time,
        ),
        rawStatus: attendance.status,
        checkInStatus: attendance.check_in_status,
        checkOutStatus: attendance.check_out_status,

        note: attendance.note,
      };
    });

    return NextResponse.json({
      success: true,
      month,
      year,
      attendances: result,
    });
  } catch (error) {
    console.error("GET_HISTORY_ERROR:", error);

    return NextResponse.json(
      { error: getApiErrorMessage(error, "Gagal mengambil riwayat absensi.") },
      { status: getApiErrorStatus(error) }
    );
  }
}
