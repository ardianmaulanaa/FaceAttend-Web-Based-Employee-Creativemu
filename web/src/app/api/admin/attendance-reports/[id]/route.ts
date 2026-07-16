import { NextRequest, NextResponse } from "next/server";
import { requireOwner } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AttendanceDetailRow = {
  attendanceId: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  userProfilePhoto: unknown;

  attendanceDate: Date | string | null;
  checkInTime: Date | string | null;
  checkOutTime: Date | string | null;

  status: string | null;
  workMode: string | null;
  checkOutWorkMode: string | null;

  checkInPhoto: unknown;
  checkOutPhoto: unknown;
  proofPhoto: unknown;

  checkInLatitude: number | string | null;
  checkInLongitude: number | string | null;
  checkInAccuracy: number | string | null;

  checkOutLatitude: number | string | null;
  checkOutLongitude: number | string | null;
  checkOutAccuracy: number | string | null;

  lateReason: string | null;
  createdAt: Date | string | null;

  officeName: string | null;
  officeAddress: string | null;
  officeLatitude: number | string | null;
  officeLongitude: number | string | null;

  visitTitle: string | null;
  visitClientName: string | null;
  visitAddress: string | null;
  visitNote: string | null;
  visitLatitude: number | string | null;
  visitLongitude: number | string | null;
  visitAccuracy: number | string | null;
  visitStartTime: Date | string | null;
  visitEndTime: Date | string | null;
};

type DatabaseColumnRow = {
  Field: string;
};

function quoteSqlIdentifier(value: string) {
  if (!/^[A-Za-z0-9_]+$/.test(value)) {
    throw new Error("Nama kolom database tidak valid.");
  }

  return `\`${value}\``;
}

function selectAttendanceColumn(
  columns: Set<string>,
  candidates: string[],
  alias: string,
  fallback = "NULL",
) {
  const column = candidates.find((candidate) => columns.has(candidate));

  if (!column) {
    return `${fallback} AS ${alias}`;
  }

  return `a.${quoteSqlIdentifier(column)} AS ${alias}`;
}

async function getAttendanceColumns() {
  const rows = await prisma.$queryRawUnsafe<DatabaseColumnRow[]>(
    "SHOW COLUMNS FROM Attendance",
  );

  return new Set(rows.map((row) => String(row.Field)));
}

function selectUserColumn(
  columns: Set<string>,
  candidates: string[],
  alias: string,
  fallback = "NULL",
) {
  const column = candidates.find((candidate) => columns.has(candidate));

  if (!column) {
    return `${fallback} AS ${alias}`;
  }

  return `u.${quoteSqlIdentifier(column)} AS ${alias}`;
}

async function getUserColumns() {
  const rows = await prisma.$queryRawUnsafe<DatabaseColumnRow[]>(
    "SHOW COLUMNS FROM users",
  );

  return new Set(rows.map((row) => String(row.Field)));
}

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

function normalizeWorkMode(
  mode: string | null | undefined,
  fallback = "office",
) {
  const normalized = String(mode || "").toLowerCase();

  if (normalized === "office" || normalized === "kantor") return "office";
  if (normalized === "wfh") return "wfh";
  if (normalized === "wfc") return "wfc";
  if (normalized === "visit" || normalized === "kunjungan") return "visit";

  return fallback;
}

function formatWorkMode(mode: string | null | undefined) {
  const normalized = normalizeWorkMode(mode);

  if (normalized === "office") return "Kantor";
  if (normalized === "wfh") return "WFH";
  if (normalized === "wfc") return "WFC";
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
  checkOutValue: Date | string | null,
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

function hasText(value: string | null | undefined) {
  return Boolean(String(value || "").trim());
}

function hasVisitData(row: AttendanceDetailRow) {
  return (
    hasText(row.visitTitle) ||
    hasText(row.visitClientName) ||
    hasText(row.visitAddress) ||
    hasText(row.visitNote)
  );
}

function resolveCheckOutWorkMode(row: AttendanceDetailRow) {
  const primaryWorkMode = normalizeWorkMode(row.workMode);
  const checkOutMode = normalizeWorkMode(row.checkOutWorkMode, "");

  if (checkOutMode) return checkOutMode;

  if (primaryWorkMode !== "visit" && hasVisitData(row)) {
    return "visit";
  }

  return null;
}

export async function GET(
  req: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    await requireOwner(req);

    const params = await context.params;
    const id = String(params.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID absensi wajib dikirim.",
          report: null,
        },
        { status: 400 },
      );
    }

    const attendanceColumns = await getAttendanceColumns();
    const userColumns = await getUserColumns();

    const rows = await prisma.$queryRawUnsafe<AttendanceDetailRow[]>(
      `
        SELECT
          a.id AS attendanceId,
         u.employee_code AS employeeCode,
          u.name AS employeeName,

          ${selectUserColumn(
            userColumns,
            [
              "profile_photo",
              "profilePhoto",
              "profile_photo_url",
              "photo_url",
              "avatar_url",
              "image",
              "image_url",
            ],
            "userProfilePhoto",
          )},

          a.attendance_date AS attendanceDate,
          a.check_in_time AS checkInTime,
          a.check_out_time AS checkOutTime,

          a.status AS status,
          a.work_mode AS workMode,

          ${selectAttendanceColumn(
            attendanceColumns,
            ["check_out_work_mode", "checkout_work_mode", "checkOutWorkMode"],
            "checkOutWorkMode",
          )},

          a.check_in_photo AS checkInPhoto,
          a.check_out_photo AS checkOutPhoto,
          a.check_in_photo AS proofPhoto,

          ${selectAttendanceColumn(
            attendanceColumns,
            ["check_in_latitude", "attendance_latitude", "latitude"],
            "checkInLatitude",
          )},

          ${selectAttendanceColumn(
            attendanceColumns,
            ["check_in_longitude", "attendance_longitude", "longitude"],
            "checkInLongitude",
          )},

          ${selectAttendanceColumn(
            attendanceColumns,
            ["check_in_accuracy", "attendance_accuracy", "accuracy"],
            "checkInAccuracy",
          )},

          ${selectAttendanceColumn(
            attendanceColumns,
            ["check_out_latitude"],
            "checkOutLatitude",
          )},

          ${selectAttendanceColumn(
            attendanceColumns,
            ["check_out_longitude"],
            "checkOutLongitude",
          )},

          ${selectAttendanceColumn(
            attendanceColumns,
            ["check_out_accuracy"],
            "checkOutAccuracy",
          )},

          a.late_reason AS lateReason,
          a.created_at AS createdAt,

          o.name AS officeName,
          o.address AS officeAddress,
          o.latitude AS officeLatitude,
          o.longitude AS officeLongitude,

          ev.title AS visitTitle,
          ev.client_name AS visitClientName,
          ev.address AS visitAddress,
          ev.note AS visitNote,
          ev.latitude AS visitLatitude,
          ev.longitude AS visitLongitude,
          ev.accuracy AS visitAccuracy,
          ev.start_time AS visitStartTime,
          ev.end_time AS visitEndTime

        FROM Attendance a
        LEFT JOIN users u ON u.id = a.user_id
        LEFT JOIN OfficeLocation o ON o.id = u.registered_office_id
        LEFT JOIN EmployeeVisit ev ON ev.id = (
          SELECT ev2.id
          FROM EmployeeVisit ev2
          WHERE ev2.attendance_id = a.id
          ORDER BY ev2.start_time DESC
          LIMIT 1
        )
        WHERE a.id = ?
        LIMIT 1
      `,
      id,
    );

    const row = rows[0];

    if (!row) {
      return NextResponse.json(
        {
          success: false,
          message: "Data absensi tidak ditemukan.",
          report: null,
        },
        { status: 404 },
      );
    }

    const dateSource = row.attendanceDate || row.checkInTime || row.createdAt;
    const primaryWorkMode = normalizeWorkMode(row.workMode);
    const checkOutWorkMode = resolveCheckOutWorkMode(row);
    const hasVisit = hasVisitData(row);
    const resolvedWorkMode =
      primaryWorkMode === "office" && hasVisit ? "visit" : primaryWorkMode;

    return NextResponse.json({
      success: true,
      report: {
        id: String(row.attendanceId || ""),
        employeeName: row.employeeName || "Tanpa Nama",
        employeeCode: row.employeeCode || null,

        profilePhoto: normalizeImageUrl(row.userProfilePhoto),
        profile_photo: normalizeImageUrl(row.userProfilePhoto),
        profile_photo_url: normalizeImageUrl(row.userProfilePhoto),
        photo_url: normalizeImageUrl(row.userProfilePhoto),
        avatar_url: normalizeImageUrl(row.userProfilePhoto),

        date: toDateInput(dateSource),
        dateLabel: formatDate(dateSource),

        checkIn: formatTime(row.checkInTime),
        checkOut: formatTime(row.checkOutTime),
        duration: calculateDuration(row.checkInTime, row.checkOutTime),

        status: String(row.status || "pending").toLowerCase(),
        statusLabel: formatStatus(row.status),

        workMode: resolvedWorkMode,
        workModeLabel: formatWorkMode(resolvedWorkMode),

        checkOutWorkMode,
        check_out_work_mode: checkOutWorkMode,
        checkoutWorkMode: checkOutWorkMode,
        checkOutWorkModeLabel: checkOutWorkMode
          ? formatWorkMode(checkOutWorkMode)
          : null,

        checkInPhoto: normalizeImageUrl(row.checkInPhoto),
        checkOutPhoto: normalizeImageUrl(row.checkOutPhoto),
        proofPhoto: normalizeImageUrl(row.proofPhoto),

        officeName: row.officeName || null,
        officeAddress: row.officeAddress || null,
        officeLatitude: toNumber(row.officeLatitude),
        officeLongitude: toNumber(row.officeLongitude),

        attendanceLatitude: toNumber(row.checkInLatitude),
        attendanceLongitude: toNumber(row.checkInLongitude),

        checkInLatitude: toNumber(row.checkInLatitude),
        checkInLongitude: toNumber(row.checkInLongitude),
        checkInAccuracy: toNumber(row.checkInAccuracy),

        checkOutLatitude: toNumber(row.checkOutLatitude),
        checkOutLongitude: toNumber(row.checkOutLongitude),
        checkOutAccuracy: toNumber(row.checkOutAccuracy),

        visitTitle: row.visitTitle || null,
        visitClientName: row.visitClientName || null,
        visitAddress: row.visitAddress || null,
        visitNote: row.visitNote || null,
        visitLatitude: toNumber(row.visitLatitude),
        visitLongitude: toNumber(row.visitLongitude),
        visitAccuracy: toNumber(row.visitAccuracy),
        visitStartTime: formatTime(row.visitStartTime),
        visitEndTime: formatTime(row.visitEndTime),

        checkOutVisitTitle:
          checkOutWorkMode === "visit" ? row.visitTitle || null : null,
        checkOutVisitClientName:
          checkOutWorkMode === "visit" ? row.visitClientName || null : null,
        checkOutVisitAddress:
          checkOutWorkMode === "visit" ? row.visitAddress || null : null,
        checkOutVisitNote:
          checkOutWorkMode === "visit" ? row.visitNote || null : null,

        lateReason: row.lateReason || null,
      },
    });
  } catch (error) {
    console.error("GET_ADMIN_ATTENDANCE_REPORT_DETAIL_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(
          error,
          "Gagal mengambil detail laporan kehadiran.",
        ),
        report: null,
      },
      { status: getApiErrorStatus(error) },
    );
  }
}
