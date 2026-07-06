import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AttendanceDetailRow = {
  attendanceId: string | null;
  employeeCode: string | null;
  employeeName: string | null;

  attendanceDate: Date | string | null;
  checkInTime: Date | string | null;
  checkOutTime: Date | string | null;

  status: string | null;
  workMode: string | null;

  checkInPhoto: unknown;
  checkOutPhoto: unknown;
  proofPhoto: unknown;

  attendanceLatitude: number | string | null;
  attendanceLongitude: number | string | null;

  lateReason: string | null;
  createdAt: Date | string | null;

  officeName: string | null;
  officeAddress: string | null;
  officeLatitude: number | string | null;
  officeLongitude: number | string | null;
};

function detectImageMime(buffer: Buffer) {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return "image/jpeg";
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }

  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return "image/jpeg";
}

function normalizeImageUrl(value: unknown) {
  if (!value) return null;

  if (Buffer.isBuffer(value)) {
    const mime = detectImageMime(value);
    return `data:${mime};base64,${value.toString("base64")}`;
  }

  if (value instanceof Uint8Array) {
    const buffer = Buffer.from(value);
    const mime = detectImageMime(buffer);
    return `data:${mime};base64,${buffer.toString("base64")}`;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "data" in value
  ) {
    const possibleBuffer = value as {
      type?: string;
      data?: number[];
    };

    if (
      possibleBuffer.type === "Buffer" &&
      Array.isArray(possibleBuffer.data)
    ) {
      const buffer = Buffer.from(possibleBuffer.data);
      const mime = detectImageMime(buffer);
      return `data:${mime};base64,${buffer.toString("base64")}`;
    }
  }

  const text = String(value).trim();

  if (!text) return null;

  if (
    text.startsWith("http://") ||
    text.startsWith("https://") ||
    text.startsWith("data:image") ||
    text.startsWith("blob:")
  ) {
    return text;
  }

  const cleanText = text
    .replaceAll("\\", "/")
    .replace(/^public\//, "")
    .replace(/^\.\/public\//, "")
    .replace(/^\/public\//, "/");

  if (cleanText.startsWith("/")) {
    return cleanText;
  }

  return `/${cleanText}`;
}

function formatDate(value: Date | string | null) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toDateInput(value: Date | string | null) {
  if (!value) return "";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(value: Date | string | null) {
  if (!value) return "-";

  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(".", ":");
}

function formatStatus(status: string | null) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "present") return "Hadir";
  if (normalized === "late") return "Terlambat";
  if (normalized === "pending") return "Pending";
  if (normalized === "cuti") return "Cuti";
  if (normalized === "approved") return "Disetujui";

  return status || "Belum diketahui";
}

function formatWorkMode(mode: string | null) {
  const normalized = String(mode || "").toLowerCase();

  if (normalized === "office") return "Kantor";
  if (normalized === "wfh") return "WFH";
  if (normalized === "visit") return "Kunjungan";

  return mode || "Kantor";
}

function toNumber(value: number | string | null) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return null;

  return numberValue;
}

function calculateDuration(
  checkInValue: Date | string | null,
  checkOutValue: Date | string | null
) {
  if (!checkInValue || !checkOutValue) return "-";

  const checkIn =
    checkInValue instanceof Date ? checkInValue : new Date(checkInValue);
  const checkOut =
    checkOutValue instanceof Date ? checkOutValue : new Date(checkOutValue);

  if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
    return "-";
  }

  const diffMs = checkOut.getTime() - checkIn.getTime();

  if (diffMs <= 0) return "0 menit";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} menit`;
  if (minutes === 0) return `${hours} jam`;

  return `${hours} jam ${minutes} menit`;
}

export async function GET(
  _req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    const params = await context.params;
    const id = String(params.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID absensi wajib dikirim.",
          report: null,
        },
        { status: 400 }
      );
    }

    const rows = await prisma.$queryRawUnsafe<AttendanceDetailRow[]>(
      `
        SELECT
          a.id AS attendanceId,
          u.employee_code AS employeeCode,
          u.name AS employeeName,

          a.attendance_date AS attendanceDate,
          a.check_in_time AS checkInTime,
          a.check_out_time AS checkOutTime,

          a.status AS status,
          a.work_mode AS workMode,

          a.check_in_photo AS checkInPhoto,
          a.check_out_photo AS checkOutPhoto,
          a.check_in_photo AS proofPhoto,

          a.check_in_latitude AS attendanceLatitude,
          a.check_in_longitude AS attendanceLongitude,

          a.late_reason AS lateReason,
          a.created_at AS createdAt,

          o.name AS officeName,
          o.address AS officeAddress,
          o.latitude AS officeLatitude,
          o.longitude AS officeLongitude

        FROM Attendance a
        LEFT JOIN users u ON u.id = a.user_id
        LEFT JOIN OfficeLocation o ON o.id = u.registered_office_id
        WHERE a.id = ?
        LIMIT 1
      `,
      id
    );

    const row = rows[0];

    if (!row) {
      return NextResponse.json(
        {
          success: false,
          message: "Data absensi tidak ditemukan.",
          report: null,
        },
        { status: 404 }
      );
    }

    const dateSource = row.attendanceDate || row.checkInTime || row.createdAt;

    return NextResponse.json({
      success: true,
      report: {
        id: String(row.attendanceId || ""),
        employeeName: row.employeeName || "Tanpa Nama",
        employeeCode: row.employeeCode || null,

        date: toDateInput(dateSource),
        dateLabel: formatDate(dateSource),

        checkIn: formatTime(row.checkInTime),
        checkOut: formatTime(row.checkOutTime),
        duration: calculateDuration(row.checkInTime, row.checkOutTime),

        status: String(row.status || "pending").toLowerCase(),
        statusLabel: formatStatus(row.status),

        workMode: String(row.workMode || "office").toLowerCase(),
        workModeLabel: formatWorkMode(row.workMode),

        checkInPhoto: normalizeImageUrl(row.checkInPhoto),
        checkOutPhoto: normalizeImageUrl(row.checkOutPhoto),
        proofPhoto: normalizeImageUrl(row.proofPhoto),

        officeName: row.officeName || null,
        officeAddress: row.officeAddress || null,
        officeLatitude: toNumber(row.officeLatitude),
        officeLongitude: toNumber(row.officeLongitude),

        attendanceLatitude: toNumber(row.attendanceLatitude),
        attendanceLongitude: toNumber(row.attendanceLongitude),

        lateReason: row.lateReason || null,
      },
    });
  } catch (error) {
    console.error("GET_ADMIN_ATTENDANCE_REPORT_DETAIL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil detail laporan kehadiran.",
        report: null,
      },
      { status: 500 }
    );
  }
}