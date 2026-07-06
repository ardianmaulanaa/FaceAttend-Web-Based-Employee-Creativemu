import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ColumnInfo = {
  COLUMN_NAME: string;
};

type AttendanceRow = {
  attendanceId: string | null;
  userId: string | null;
  employeeCode: string | null;
  employeeName: string | null;
  attendanceDate: Date | string | null;
  checkInTime: Date | string | null;
  checkOutTime: Date | string | null;
  status: string | null;
  workMode: string | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  proofPhoto: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  lateReason: string | null;
  createdAt: Date | string | null;
};

const attendanceImageColumns = {
  checkIn: [
    "check_in_photo",
    "check_in_image",
    "check_in_selfie",
    "check_in_photo_url",
    "photo_check_in",
    "clock_in_photo",
    "face_photo",
    "selfie_photo",
    "attendance_photo",
  ],
  checkOut: [
    "check_out_photo",
    "check_out_image",
    "check_out_selfie",
    "check_out_photo_url",
    "photo_check_out",
    "clock_out_photo",
  ],
  proof: [
    "photo",
    "photo_url",
    "proof_photo",
    "image",
    "image_url",
    "selfie",
    "selfie_photo",
    "attendance_photo",
  ],
};

async function getTableColumns(tableName: string) {
  const rows = await prisma.$queryRawUnsafe<ColumnInfo[]>(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ?
    `,
    tableName
  );

  return new Set(rows.map((row) => row.COLUMN_NAME));
}

function pickColumn(columns: Set<string>, candidates: string[]) {
  return candidates.find((candidate) => columns.has(candidate)) || null;
}

function columnSelect(
  tableAlias: string,
  column: string | null,
  alias: string
) {
  if (!column) return `NULL AS \`${alias}\``;

  return `${tableAlias}.\`${column}\` AS \`${alias}\``;
}

function normalizeImageUrl(value: string | null) {
  if (!value) return null;

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

  if (diffMs <= 0) return "-";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `${minutes} menit`;

  if (minutes === 0) return `${hours} jam`;

  return `${hours} jam ${minutes} menit`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const search = String(searchParams.get("search") || "").trim();
    const date = String(searchParams.get("date") || "").trim();
    const status = String(searchParams.get("status") || "")
      .trim()
      .toLowerCase();

    const month = Number(searchParams.get("month") || new Date().getMonth() + 1);
    const year = Number(searchParams.get("year") || new Date().getFullYear());

    const attendanceColumns = await getTableColumns("Attendance");

    const userColumn = pickColumn(attendanceColumns, [
      "user_id",
      "employee_id",
      "userId",
      "employeeId",
    ]);

    const dateColumn = pickColumn(attendanceColumns, [
      "attendance_date",
      "date",
      "work_date",
      "created_at",
      "check_in_time",
    ]);

    const checkInColumn = pickColumn(attendanceColumns, [
      "check_in_time",
      "checkInTime",
      "clock_in_time",
      "time_in",
      "created_at",
    ]);

    const checkOutColumn = pickColumn(attendanceColumns, [
      "check_out_time",
      "checkOutTime",
      "clock_out_time",
      "time_out",
    ]);

    const statusColumn = pickColumn(attendanceColumns, ["status"]);

    const workModeColumn = pickColumn(attendanceColumns, [
      "work_mode",
      "workMode",
      "mode",
    ]);

    const checkInPhotoColumn = pickColumn(
      attendanceColumns,
      attendanceImageColumns.checkIn
    );

    const checkOutPhotoColumn = pickColumn(
      attendanceColumns,
      attendanceImageColumns.checkOut
    );

    const proofPhotoColumn = pickColumn(
      attendanceColumns,
      attendanceImageColumns.proof
    );

    const latitudeColumn = pickColumn(attendanceColumns, [
      "latitude",
      "check_in_latitude",
      "lat",
    ]);

    const longitudeColumn = pickColumn(attendanceColumns, [
      "longitude",
      "check_in_longitude",
      "lng",
      "lon",
    ]);

    const lateReasonColumn = pickColumn(attendanceColumns, [
      "late_reason",
      "reason",
      "note",
      "description",
    ]);

    const createdAtColumn = pickColumn(attendanceColumns, [
      "created_at",
      "createdAt",
    ]);

    const whereClauses: string[] = [];
    const queryValues: unknown[] = [];

    if (date && dateColumn) {
      whereClauses.push(`DATE(a.\`${dateColumn}\`) = ?`);
      queryValues.push(date);
    } else if (dateColumn) {
      whereClauses.push(`MONTH(a.\`${dateColumn}\`) = ?`);
      whereClauses.push(`YEAR(a.\`${dateColumn}\`) = ?`);
      queryValues.push(month);
      queryValues.push(year);
    }

    if (status && status !== "all" && statusColumn) {
      whereClauses.push(`LOWER(a.\`${statusColumn}\`) = ?`);
      queryValues.push(status);
    }

    if (search) {
      whereClauses.push(
        `(LOWER(u.\`name\`) LIKE ? OR LOWER(u.\`employee_code\`) LIKE ?)`
      );

      const keyword = `%${search.toLowerCase()}%`;

      queryValues.push(keyword);
      queryValues.push(keyword);
    }

    const whereSql = whereClauses.length
      ? `WHERE ${whereClauses.join(" AND ")}`
      : "";

    const joinSql = userColumn
      ? `LEFT JOIN \`users\` u ON u.\`id\` = a.\`${userColumn}\``
      : `LEFT JOIN \`users\` u ON 1 = 0`;

    const orderColumn = dateColumn || createdAtColumn || "id";

    const rows = await prisma.$queryRawUnsafe<AttendanceRow[]>(
      `
        SELECT
          a.\`id\` AS \`attendanceId\`,
          ${columnSelect("a", userColumn, "userId")},
          u.\`employee_code\` AS \`employeeCode\`,
          u.\`name\` AS \`employeeName\`,
          ${columnSelect("a", dateColumn, "attendanceDate")},
          ${columnSelect("a", checkInColumn, "checkInTime")},
          ${columnSelect("a", checkOutColumn, "checkOutTime")},
          ${columnSelect("a", statusColumn, "status")},
          ${columnSelect("a", workModeColumn, "workMode")},
          ${columnSelect("a", checkInPhotoColumn, "checkInPhoto")},
          ${columnSelect("a", checkOutPhotoColumn, "checkOutPhoto")},
          ${columnSelect("a", proofPhotoColumn, "proofPhoto")},
          ${columnSelect("a", latitudeColumn, "latitude")},
          ${columnSelect("a", longitudeColumn, "longitude")},
          ${columnSelect("a", lateReasonColumn, "lateReason")},
          ${columnSelect("a", createdAtColumn, "createdAt")}
        FROM \`Attendance\` a
        ${joinSql}
        ${whereSql}
        ORDER BY a.\`${orderColumn}\` DESC
        LIMIT 500
      `,
      ...queryValues
    );

    const reports = rows.map((row) => {
      const dateSource =
        row.attendanceDate || row.checkInTime || row.createdAt || null;

      const checkInPhoto = normalizeImageUrl(row.checkInPhoto);
      const checkOutPhoto = normalizeImageUrl(row.checkOutPhoto);
      const proofPhoto = normalizeImageUrl(row.proofPhoto);

      const latitude = toNumber(row.latitude);
      const longitude = toNumber(row.longitude);

      return {
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
        hasPhoto: Boolean(checkInPhoto || checkOutPhoto || proofPhoto),
        hasLocation: Boolean(latitude && longitude),
      };
    });

    return NextResponse.json({
      success: true,
      reports,
    });
  } catch (error) {
    console.error("GET_ADMIN_ATTENDANCE_REPORTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil laporan kehadiran.",
        reports: [],
      },
      {
        status: 500,
      }
    );
  }
}