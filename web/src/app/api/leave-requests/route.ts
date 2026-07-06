import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
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

function toDateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function countTotalDays(startDate: Date, endDate: Date) {
  const oneDay = 1000 * 60 * 60 * 24;
  const diff = endDate.getTime() - startDate.getTime();

  return Math.floor(diff / oneDay) + 1;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

function formatLeaveType(type: string) {
  if (type === "annual") return "Cuti Tahunan";
  if (type === "permission") return "Izin";
  if (type === "sick") return "Sakit";
  if (type === "overtime") return "Lembur";
  if (type === "visit") return "Kunjungan";
  if (type === "wfh") return "WFH";
  if (type === "other") return "Lainnya";

  return type;
}

function getRequestedWorkMode(type: string, rawMode: string) {
  if (["office", "wfh", "visit", "flexible"].includes(rawMode)) return rawMode;
  if (type === "wfh") return "wfh";
  if (type === "visit") return "visit";
  if (type === "overtime") return "office";
  return null;
}

function shouldRequestLocationUnlock(type: string, explicitValue: unknown) {
  if (typeof explicitValue === "boolean") return explicitValue;
  return ["wfh", "visit", "overtime"].includes(type);
}

const allowedLeaveTypes = [
  "annual",
  "permission",
  "sick",
  "overtime",
  "visit",
  "wfh",
  "other",
];

function formatStatus(status: string) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";

  return status;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const requests = await prisma.leaveRequest.findMany({
      where: {
        user_id: userId,
      },
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        leave_type: true,
        start_date: true,
        end_date: true,
        total_days: true,
        reason: true,
        requested_work_mode: true,
        location_unlock_requested: true,
        location_unlock_approved: true,
        visit_location_name: true,
        visit_address: true,
        visit_latitude: true,
        visit_longitude: true,
        status: true,
        admin_note: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      requests: requests.map((item) => ({
        id: item.id,
        leaveType: item.leave_type,
        leaveTypeLabel: formatLeaveType(item.leave_type),
        startDate: formatDate(item.start_date),
        endDate: formatDate(item.end_date),
        totalDays: item.total_days,
        reason: item.reason,
        requestedWorkMode: item.requested_work_mode,
        locationUnlockRequested: item.location_unlock_requested,
        locationUnlockApproved: item.location_unlock_approved,
        visitLocationName: item.visit_location_name,
        visitAddress: item.visit_address,
        visitLatitude: item.visit_latitude,
        visitLongitude: item.visit_longitude,
        status: item.status,
        statusLabel: formatStatus(item.status),
        adminNote: item.admin_note,
        createdAt: formatDate(item.created_at),
      })),
    });
  } catch (error) {
    console.error("GET_LEAVE_REQUESTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data pengajuan cuti.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const body = await req.json();

    const leaveType = String(body.leaveType || "").trim();
    const startDateRaw = String(body.startDate || "").trim();
    const endDateRaw = String(body.endDate || "").trim();
    const reason = String(body.reason || "").trim();
    const requestedWorkMode = getRequestedWorkMode(
      leaveType,
      String(body.requestedWorkMode || "").trim(),
    );
    const locationUnlockRequested = shouldRequestLocationUnlock(
      leaveType,
      body.locationUnlockRequested,
    );
    const visitLocationName = String(body.visitLocationName || "").trim();
    const visitAddress = String(body.visitAddress || "").trim();
    const visitLatitude =
      body.visitLatitude === null || body.visitLatitude === undefined || body.visitLatitude === ""
        ? null
        : Number(body.visitLatitude);
    const visitLongitude =
      body.visitLongitude === null || body.visitLongitude === undefined || body.visitLongitude === ""
        ? null
        : Number(body.visitLongitude);

    if (!leaveType || !startDateRaw || !endDateRaw || !reason) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Jenis cuti, tanggal mulai, tanggal selesai, dan alasan wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!allowedLeaveTypes.includes(leaveType)) {
      return NextResponse.json(
        {
          success: false,
          error: "Jenis pengajuan tidak valid.",
        },
        { status: 400 },
      );
    }

    if (
      (visitLatitude !== null && !Number.isFinite(visitLatitude)) ||
      (visitLongitude !== null && !Number.isFinite(visitLongitude))
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Koordinat lokasi kunjungan tidak valid.",
        },
        { status: 400 },
      );
    }

    const startDate = toDateOnly(startDateRaw);
    const endDate = toDateOnly(endDateRaw);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tanggal tidak valid.",
        },
        { status: 400 },
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
        },
        { status: 400 },
      );
    }

    const totalDays = countTotalDays(startDate, endDate);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        user_id: userId,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason,
        requested_work_mode: requestedWorkMode,
        location_unlock_requested: locationUnlockRequested,
        location_unlock_approved: false,
        visit_location_name: visitLocationName || null,
        visit_address: visitAddress || null,
        visit_latitude: visitLatitude,
        visit_longitude: visitLongitude,
        status: "pending",
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Pengajuan karyawan berhasil dikirim.",
      request: leaveRequest,
    });
  } catch (error) {
    console.error("CREATE_LEAVE_REQUEST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal membuat pengajuan cuti.",
      },
      { status: 500 },
    );
  }
}
