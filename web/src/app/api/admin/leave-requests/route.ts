import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LeaveStatus = "pending" | "approved" | "rejected";

const allowedStatuses: LeaveStatus[] = ["pending", "approved", "rejected"];

function jsonSuccess(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(
    {
      success: true,
      ...data,
    },
    { status }
  );
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
      error: message,
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      },
      requests: [],
      leaveRequests: [],
    },
    { status }
  );
}

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

function canManageLeave(role: string) {
  return ["owner"].includes(role.toLowerCase());
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

function getShortLeaveLabel(type: string) {
  if (type === "annual") return "Cuti";
  if (type === "permission") return "Izin";
  if (type === "sick") return "Sakit";

  return "Pengajuan";
}

function getStatusLabel(status: string) {
  if (status === "pending") return "Pending";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";

  return status || "-";
}

function getDefaultAdminNote(status: LeaveStatus) {
  if (status === "approved") {
    return "Pengajuan disetujui oleh admin.";
  }

  if (status === "rejected") {
    return "Pengajuan ditolak oleh admin.";
  }

  return null;
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
    id: string;
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

    employeeId: item.user?.id || item.user_id,
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

function getStats<T extends { status: string }>(items: T[]) {
  return {
    total: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  };
}

async function createEmployeeLeaveStatusNotification(params: {
  userId: string;
  leaveType: string;
  status: "approved" | "rejected";
  adminNote: string | null;
}) {
  try {
    const leaveLabel = getShortLeaveLabel(params.leaveType);
    const statusLabel =
      params.status === "approved" ? "Disetujui" : "Ditolak";

    const messageBase = `Pengajuan ${leaveLabel.toLowerCase()} kamu telah ${statusLabel.toLowerCase()} oleh admin.`;

    await prisma.adminNotification.create({
      data: {
        user_id: params.userId,
        type: "leave_status",
        title: `${leaveLabel} ${statusLabel}`,
        message: params.adminNote
          ? `${messageBase} Catatan admin: ${params.adminNote}`
          : messageBase,
        status: "unread",
        is_read: false,
      },
    });
  } catch (error) {
    console.error("CREATE_EMPLOYEE_LEAVE_STATUS_NOTIFICATION_ERROR:", error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active" || !canManageLeave(currentUser.role)) {
      return jsonError("Akses ditolak.", 403);
    }

    const statusFilter = req.nextUrl.searchParams.get("status") || "all";
    const typeFilter = req.nextUrl.searchParams.get("type") || "all";
    const search = req.nextUrl.searchParams.get("search") || "";

    const leaveRequests = await prisma.leaveRequest.findMany({
      where: {
        ...(statusFilter !== "all"
          ? {
              status: statusFilter,
            }
          : {}),
        ...(typeFilter !== "all"
          ? {
              leave_type: typeFilter,
            }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  reason: {
                    contains: search,
                  },
                },
                {
                  admin_note: {
                    contains: search,
                  },
                },
                {
                  user: {
                    name: {
                      contains: search,
                    },
                  },
                },
                {
                  user: {
                    email: {
                      contains: search,
                    },
                  },
                },
              ],
            }
          : {}),
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
            id: true,
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

    return jsonSuccess({
      message: "Data pengajuan cuti admin berhasil diambil.",
      stats: getStats(mappedRequests),
      requests: mappedRequests,
      leaveRequests: mappedRequests,
    });
  } catch (error) {
    console.error("GET /api/admin/leave-requests error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Gagal mengambil data pengajuan cuti admin.",
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

    const id = String(body.id || body.requestId || "").trim();
    const status = String(body.status || "").trim() as LeaveStatus;
    const adminNote = String(body.adminNote || body.admin_note || "").trim();

    if (!id) {
      return jsonError("ID pengajuan wajib dikirim.");
    }

    if (!status || !allowedStatuses.includes(status)) {
      return jsonError("Status pengajuan tidak valid.");
    }

    const existingRequest = await prisma.leaveRequest.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        user_id: true,
        leave_type: true,
        status: true,
      },
    });

    if (!existingRequest) {
      return jsonError("Pengajuan tidak ditemukan.", 404);
    }

    const finalAdminNote = adminNote || getDefaultAdminNote(status);

    const leaveRequest = await prisma.leaveRequest.update({
      where: {
        id,
      },
      data: {
        status,
        admin_note: finalAdminNote,
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
            id: true,
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

    const statusChanged = existingRequest.status !== status;

    if (
      statusChanged &&
      (status === "approved" || status === "rejected")
    ) {
      await createEmployeeLeaveStatusNotification({
        userId: leaveRequest.user_id,
        leaveType: leaveRequest.leave_type,
        status,
        adminNote: leaveRequest.admin_note,
      });
    }

    const mappedRequest = mapLeaveRequest(leaveRequest);

    return jsonSuccess({
      message: "Status pengajuan berhasil diperbarui.",
      request: mappedRequest,
      leaveRequest: mappedRequest,
    });
  } catch (error) {
    console.error("PATCH /api/admin/leave-requests error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Gagal memperbarui status pengajuan.",
      500
    );
  }
}