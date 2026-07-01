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

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const { searchParams } = new URL(req.url);

    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    if (!month || !year || month < 1 || month > 12) {
      return NextResponse.json(
        { error: "Bulan dan tahun tidak valid." },
        { status: 400 }
      );
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

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

        check_in_latitude: true,
        check_in_longitude: true,

        check_out_latitude: true,
        check_out_longitude: true,

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

      scheduledCheckIn: attendance.scheduled_check_in?.toISOString() ?? null,
      scheduledCheckOut: attendance.scheduled_check_out?.toISOString() ?? null,

      checkInTime: attendance.check_in_time?.toISOString() ?? null,
      checkOutTime: attendance.check_out_time?.toISOString() ?? null,

      checkInPhoto: photoToDataUrl(
        attendance.check_in_photo,
        attendance.check_in_photo_mime
      ),
      checkOutPhoto: photoToDataUrl(
        attendance.check_out_photo,
        attendance.check_out_photo_mime
      ),

      checkInLatitude: attendance.check_in_latitude,
      checkInLongitude: attendance.check_in_longitude,

      checkOutLatitude: attendance.check_out_latitude,
      checkOutLongitude: attendance.check_out_longitude,

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