import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeaveType = "annual" | "permission" | "sick" | "other";
type LeaveStatus = "pending" | "approved" | "rejected";

const allowedLeaveTypes: LeaveType[] = [
  "annual",
  "permission",
  "sick",
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
  return ["owner"].includes(role.toLowerCase());
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

function formatDateDisplay(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getLeaveTypeLabel(type: string) {
  if (type === "annual") return "Cuti Tahunan";
  if (type === "permission") return "Izin";
  if (type === "sick") return "Sakit";

  return "Lainnya";
}

function getStatusLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";

  return status || "-";
}

function mapLeaveRequest(item: {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: Date;
  end_date: Date;
  total_days: number;
  reason: string;
  status: string;
  admin_note: string | null;
  created_at: Date;
  updated_at: Date;
  user?: {
    name: string;
    email: string;
    position: {
      name: string;
    } | null;
    department: {
      name: string;
    } | null;
  } | null;
}) {
  return {
    id: item.id,
    userId: item.user_id,

    employeeName: item.user?.name || "-",
    employeeEmail: item.user?.email || "-",
    employeePosition: item.user?.position?.name || "-",
    employeeDepartment: item.user?.department?.name || "-",

    leaveType: item.leave_type,
    leaveTypeLabel: getLeaveTypeLabel(item.leave_type),

    startDate: formatDateDisplay(item.start_date),
    endDate: formatDateDisplay(item.end_date),

    startDateRaw: toIsoDate(item.start_date),
    endDateRaw: toIsoDate(item.end_date),
    startDateIso: toIsoDate(item.start_date),
    endDateIso: toIsoDate(item.end_date),

    totalDays: item.total_days,
    reason: item.reason,

    status: item.status,
    statusLabel: getStatusLabel(item.status),

    adminNote: item.admin_note,
    createdAt: toIsoDate(item.created_at),
    updatedAt: toIsoDate(item.updated_at),
  };
}

async function createAdminNotification(params: {
  userId: string;
  userName: string;
  leaveType: LeaveType;
  totalDays: number;
  reason: string;
}) {
  try {
    const label = getLeaveTypeLabel(params.leaveType);

    await prisma.adminNotification.create({
      data: {
        user_id: params.userId,
        type: params.leaveType,
        title: `Pengajuan ${label}`,
        message: `${params.userName} mengajukan ${label.toLowerCase()} selama ${params.totalDays} hari. Alasan: ${params.reason}`,
        status: "unread",
        is_read: false,
      },
    });
  } catch (error) {
    console.error("CREATE_LEAVE_NOTIFICATION_ERROR:", error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active") {
      return jsonError("Akun tidak aktif.", 403);
    }

    const isAdmin = canManageLeave(currentUser.role);

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: isAdmin
        ? {}
        : {
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
        status: true,
        admin_note: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            name: true,
            email: true,
            position: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const mappedRequests = leaveRequests.map(mapLeaveRequest);

    const stats = {
      total: mappedRequests.length,
      pending: mappedRequests.filter((item) => item.status === "pending")
        .length,
      approved: mappedRequests.filter((item) => item.status === "approved")
        .length,
      rejected: mappedRequests.filter((item) => item.status === "rejected")
        .length,
    };

    return NextResponse.json({
      success: true,
      message: "Riwayat pengajuan berhasil diambil.",
      stats,
      requests: mappedRequests,
      leaveRequests: mappedRequests,
    });
  } catch (error) {
    console.error("GET /api/leave-requests error:", error);

    return jsonError(
      getApiErrorMessage(error, "Gagal mengambil data pengajuan cuti."),
      getApiErrorStatus(error)
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active") {
      return jsonError("Akun tidak aktif.", 403);
    }

    let body: {
      leaveType?: string;
      leave_type?: string;
      startDate?: string;
      start_date?: string;
      endDate?: string;
      end_date?: string;
      reason?: string;
    };

    try {
      body = await req.json();
    } catch {
      return jsonError("Body request tidak valid.");
    }

    const leaveType = String(
      body.leaveType || body.leave_type || ""
    ).trim() as LeaveType;

    const startDateText = String(
      body.startDate || body.start_date || ""
    ).trim();

    const endDateText = String(body.endDate || body.end_date || "").trim();

    const reason = String(body.reason || "").trim();

    if (!leaveType || !allowedLeaveTypes.includes(leaveType)) {
      return jsonError("Jenis pengajuan tidak valid.");
    }

    if (!startDateText) {
      return jsonError("Tanggal mulai wajib diisi.");
    }

    if (!endDateText) {
      return jsonError("Tanggal selesai wajib diisi.");
    }

    if (!reason) {
      return jsonError("Alasan pengajuan wajib diisi.");
    }

    const startDate = normalizeDateOnly(startDateText);
    const endDate = normalizeDateOnly(endDateText);

    if (!startDate || !endDate) {
      return jsonError("Format tanggal tidak valid.");
    }

    if (endDate.getTime() < startDate.getTime()) {
      return jsonError(
        "Tanggal selesai tidak boleh lebih awal dari tanggal mulai."
      );
    }

    const totalDays = calculateTotalDays(startDate, endDate);

    if (totalDays <= 0) {
      return jsonError("Total hari pengajuan tidak valid.");
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        user_id: currentUser.id,
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        total_days: totalDays,
        reason,
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
        status: true,
        admin_note: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            name: true,
            email: true,
            position: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    await createAdminNotification({
      userId: currentUser.id,
      userName: currentUser.name,
      leaveType,
      totalDays,
      reason,
    });

    const mappedRequest = mapLeaveRequest(leaveRequest);

    return NextResponse.json({
      success: true,
      message: "Pengajuan berhasil dikirim dan menunggu persetujuan admin.",
      request: mappedRequest,
      leaveRequest: mappedRequest,
    });
  } catch (error) {
    console.error("POST /api/leave-requests error:", error);

    return jsonError(
      getApiErrorMessage(error, "Gagal mengirim pengajuan cuti."),
      getApiErrorStatus(error)
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
        status: true,
        admin_note: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            name: true,
            email: true,
            position: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const mappedRequest = mapLeaveRequest(leaveRequest);

    return NextResponse.json({
      success: true,
      message: "Status pengajuan berhasil diperbarui.",
      request: mappedRequest,
      leaveRequest: mappedRequest,
    });
  } catch (error) {
    console.error("PATCH /api/leave-requests error:", error);

    return jsonError(
      getApiErrorMessage(error, "Gagal memperbarui pengajuan cuti."),
      getApiErrorStatus(error)
    );
  }
}
