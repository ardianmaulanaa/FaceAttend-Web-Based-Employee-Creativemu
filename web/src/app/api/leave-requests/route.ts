import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const db = prisma as any;

type LeaveType = "annual" | "permission" | "sick" | "overtime" | "visit" | "wfh" | "other";
type LeaveStatus = "pending" | "approved" | "rejected";

const allowedLeaveTypes: LeaveType[] = [
  "annual",
  "permission",
  "sick",
  "overtime",
  "visit",
  "wfh",
  "other",
];

const allowedStatuses: LeaveStatus[] = ["pending", "approved", "rejected"];

async function getCurrentUser(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;

  if (!token) {
    throw new Error("Token login tidak ditemukan. Silakan login ulang.");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum ada di file .env.");
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

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  return user;
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
      requests: [],
      leaveRequests: [],
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
    },
    { status }
  );
}

function canManageLeave(role: string) {
  return ["owner", "admin", "cs"].includes(role.toLowerCase());
}

function normalizeDateOnly(value: string) {
  if (!value) return null;

  const date = new Date(`${value}T00:00:00.000+07:00`);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function calculateTotalDays(startDate: Date, endDate: Date) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return 0;

  return Math.floor(diffMs / 86400000) + 1;
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
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

function formatStatus(status: string) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";

  return status;
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

function mapLeaveRequest(item: {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason: string;
  requested_work_mode: string | null;
  location_unlock_requested: boolean;
  location_unlock_approved: boolean;
  visit_location_name: string | null;
  visit_address: string | null;
  visit_latitude: number | null;
  visit_longitude: number | null;
  status: string;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: item.id,
    userId: item.user_id,
    leaveType: item.leave_type,
    leaveTypeLabel: formatLeaveType(item.leave_type),
    startDate: toIsoDate(item.start_date),
    endDate: toIsoDate(item.end_date),
    startDateRaw: toIsoDate(item.start_date),
    endDateRaw: toIsoDate(item.end_date),
    totalDays: Number(item.total_days || 0),
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
    adminNote: item.admin_note || null,
    createdAt: toIsoDate(item.created_at),
    updatedAt: toIsoDate(item.updated_at),
  };
}

async function createAdminNotification(params: {
  userId: string;
  userName: string;
  leaveType: string;
  totalDays: number;
  reason: string;
}) {
  try {
    const leaveLabel = formatLeaveType(params.leaveType);
    const message = `${params.userName} mengajukan ${leaveLabel.toLowerCase()} selama ${params.totalDays} hari dengan alasan: ${params.reason}.`;

    await prisma.adminNotification.create({
      data: {
        user_id: params.userId,
        type: "leave-request",
        title: "Pengajuan Cuti Baru",
        message,
        status: "unread",
        is_read: false,
      },
    });
  } catch (error) {
    console.error("CREATE_ADMIN_NOTIFICATION_ERROR:", error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        user_id: currentUser.id,
      },
      select: {
        id: true,
        user_id: true,
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
        updated_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const mappedRequests = leaveRequests.map(mapLeaveRequest as any) as any[];

    const stats = {
      total: mappedRequests.length,
      pending: mappedRequests.filter((item) => item.status === "pending").length,
      approved: mappedRequests.filter((item) => item.status === "approved").length,
      rejected: mappedRequests.filter((item) => item.status === "rejected").length,
    };

    return NextResponse.json({
      success: true,
      stats,
      requests: mappedRequests,
      leaveRequests: mappedRequests,
    });
  } catch (error) {
    console.error("GET /api/leave-requests error:", error);

    return jsonError(
      error instanceof Error ? error.message : "Gagal mengambil data pengajuan cuti.",
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    const body = await req.json();

    const leaveType = String(body.leaveType || "").trim();
    const startDateRaw = String(body.startDate || "").trim();
    const endDateRaw = String(body.endDate || "").trim();
    const reason = String(body.reason || "").trim();

    const requestedWorkMode = getRequestedWorkMode(
      leaveType,
      String(body.requestedWorkMode || "").trim()
    );
    const locationUnlockRequested = shouldRequestLocationUnlock(
      leaveType,
      body.locationUnlockRequested
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
          error: "Jenis cuti, tanggal mulai, tanggal selesai, dan alasan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!allowedLeaveTypes.includes(leaveType as any)) {
      return NextResponse.json(
        {
          success: false,
          error: "Jenis pengajuan tidak valid.",
        },
        { status: 400 }
      );
    }

    const startDate = normalizeDateOnly(startDateRaw);
    const endDate = normalizeDateOnly(endDateRaw);

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Format tanggal tidak valid.",
        },
        { status: 400 }
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const totalDays = calculateTotalDays(startDate, endDate);

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        user_id: currentUser.id,
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
        user_id: true,
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
        updated_at: true,
      },
    });

    await createAdminNotification({
      userId: currentUser.id,
      userName: currentUser.name,
      leaveType,
      totalDays,
      reason,
    });

    const mappedRequest = mapLeaveRequest(leaveRequest as any);

    return NextResponse.json({
      success: true,
      message: "Pengajuan berhasil dikirim.",
      request: mappedRequest,
      leaveRequest: mappedRequest,
    });
  } catch (error) {
    console.error("POST /api/leave-requests error:", error);

    return jsonError(
      error instanceof Error ? error.message : "Gagal membuat pengajuan.",
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active" || !canManageLeave(currentUser.role)) {
      return jsonError("Akses ditolak.", 403);
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim() as LeaveStatus;
    const adminNote = String(body.adminNote || body.admin_note || "").trim();

    if (!id) {
      return jsonError("ID pengajuan wajib dikirim.");
    }

    if (!status || !allowedStatuses.includes(status)) {
      return jsonError("Status pengajuan tidak valid.");
    }

    const leaveRequest = await prisma.leaveRequest.update({
      where: {
        id,
      },
      data: {
        status,
        admin_note:
          adminNote ||
          (status === "approved"
            ? "Pengajuan disetujui oleh admin."
            : status === "rejected"
              ? "Pengajuan ditolak oleh admin."
              : null),
      },
      select: {
        id: true,
        user_id: true,
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
        updated_at: true,
      },
    });

    const mappedRequest = mapLeaveRequest(leaveRequest as any);

    return NextResponse.json({
      success: true,
      message: "Status pengajuan berhasil diperbarui.",
      request: mappedRequest,
      leaveRequest: mappedRequest,
    });
  } catch (error) {
    console.error("PATCH /api/leave-requests error:", error);

    return jsonError(
      error instanceof Error ? error.message : "Gagal memperbarui pengajuan cuti.",
      500
    );
  }
}
