import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";
type NotificationType = "sick" | "leave" | "permission" | "wfh" | "wfc" | "visit";

const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs"];

async function getCurrentUser(req: NextRequest) {
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

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  return user;
}

function canAccess(role: string) {
  return VIEW_ROLES.includes(role.toLowerCase() as AllowedRole);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status }
  );
}

function toIsoDate(value: Date | string | null | undefined) {
  if (!value) return null;

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toISOString();
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "-";

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined
) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);

  if (start !== "-" && end !== "-" && start !== end) {
    return `${start} - ${end}`;
  }

  return start;
}

function normalizeLeaveType(leaveType: string): NotificationType {
  const value = leaveType.toLowerCase();

  if (value.includes("sick") || value.includes("sakit")) return "sick";
  if (value.includes("permission") || value.includes("izin")) return "permission";

  return "leave";
}

function getLeaveTitle(type: NotificationType) {
  if (type === "sick") return "Pengajuan Sakit";
  if (type === "permission") return "Pengajuan Izin";

  return "Pengajuan Cuti";
}

function normalizeAdminNotificationType(
  type: string,
  title: string,
  message: string
): NotificationType | null {
  const text = `${type} ${title} ${message}`.toLowerCase();

  if (text.includes("wfc")) return "wfc";
  if (text.includes("wfh")) return "wfh";
  if (text.includes("visit") || text.includes("kunjungan")) return "visit";

  return null;
}

function normalizeStatusText(status: string) {
  const value = status.toLowerCase();

  if (value === "pending") return "Pending";
  if (value === "approved" || value === "approve") return "Disetujui";
  if (value === "rejected" || value === "reject") return "Ditolak";
  if (value === "unread") return "Belum Dibaca";
  if (value === "read") return "Dibaca";

  return status || "Baru";
}

function getLeaveMessage(params: {
  reason: string | null;
  totalDays: number | null;
  adminNote: string | null;
}) {
  const details = [];

  if (params.reason) details.push(params.reason);
  if (params.totalDays) details.push(`${params.totalDays} hari`);
  if (params.adminNote) details.push(`Catatan admin: ${params.adminNote}`);

  return details.join(" • ") || "-";
}

function getAdminNotificationStatus(status: string, isRead: boolean) {
  if (isRead) return "read";

  const value = status.toLowerCase();

  if (value === "read") return "read";

  return "unread";
}

function getNotificationHref(type: NotificationType, attendanceId?: string | null) {
  if (type === "sick" || type === "leave" || type === "permission") {
    return "/admin/cuti";
  }

  if (attendanceId) {
    return `/admin/laporan-kehadiran/${attendanceId}`;
  }

  return "/admin/laporan-kehadiran";
}

function sortByCreatedAt<T extends { createdAt: string | null }>(items: T[]) {
  return items.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

    return dateB - dateA;
  });
}

function getStats(
  notifications: Array<{
    type: NotificationType;
    status: string;
  }>
) {
  return {
    total: notifications.length,
    unread: notifications.filter((item) => item.status === "unread").length,
    pending: notifications.filter((item) => item.status === "pending").length,
    sick: notifications.filter((item) => item.type === "sick").length,
    leave: notifications.filter((item) => item.type === "leave").length,
    permission: notifications.filter((item) => item.type === "permission").length,
    wfh: notifications.filter((item) => item.type === "wfh").length,
    wfc: notifications.filter((item) => item.type === "wfc").length,
    visit: notifications.filter((item) => item.type === "visit").length,
  };
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active" || !canAccess(currentUser.role)) {
      return jsonError("Akses ditolak.", 403);
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
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
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 100,
    });

    const adminNotifications = await prisma.adminNotification.findMany({
      select: {
        id: true,
        attendance_id: true,
        user_id: true,
        type: true,
        title: true,
        message: true,
        status: true,
        is_read: true,
        created_at: true,
        updated_at: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      take: 100,
    });

    const leaveNotifications = leaveRequests.map((item) => {
      const type = normalizeLeaveType(item.leave_type || "");
      const status = String(item.status || "pending").toLowerCase();

      return {
        id: `leave-${item.id}`,
        rawId: item.id,
        source: "LeaveRequest",
        type,
        title: getLeaveTitle(type),
        message: getLeaveMessage({
          reason: item.reason,
          totalDays: item.total_days,
          adminNote: item.admin_note,
        }),
        employeeName: item.user?.name || "Karyawan",
        employeeEmail: item.user?.email || "-",
        status,
        statusText: normalizeStatusText(status),
        isRead: status !== "pending",
        createdAt: toIsoDate(item.created_at),
        updatedAt: toIsoDate(item.updated_at),
        dateText: formatDateRange(item.start_date, item.end_date),
        href: getNotificationHref(type),
      };
    });

    const adminNotificationItems = adminNotifications
      .map((item) => {
        const type = normalizeAdminNotificationType(
          item.type || "",
          item.title || "",
          item.message || ""
        );

        if (!type) return null;

        const status = getAdminNotificationStatus(item.status || "unread", Boolean(item.is_read));

        return {
          id: `admin-${item.id}`,
          rawId: item.id,
          source: "AdminNotification",
          type,
          title:
            item.title ||
            (type === "visit"
              ? "Karyawan Melakukan Kunjungan"
              : type === "wfc"
                ? "Karyawan Melakukan WFC"
                : "Karyawan Melakukan WFH"),
          message: item.message || "-",
          employeeName: item.user?.name || "Karyawan",
          employeeEmail: item.user?.email || "-",
          status,
          statusText: normalizeStatusText(status),
          isRead: status === "read",
          createdAt: toIsoDate(item.created_at),
          updatedAt: toIsoDate(item.updated_at),
          dateText: formatDate(item.created_at),
          href: getNotificationHref(type, item.attendance_id),
        };
      })
      .filter(Boolean);

    const notifications = sortByCreatedAt([
      ...leaveNotifications,
      ...(adminNotificationItems as NonNullable<
        (typeof adminNotificationItems)[number]
      >[]),
    ]);

    return NextResponse.json({
      success: true,
      stats: getStats(notifications),
      notifications,
    });
  } catch (error) {
    console.error("GET /api/admin/notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil notifikasi admin.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active" || !canAccess(currentUser.role)) {
      return jsonError("Akses ditolak.", 403);
    }

    const body = await req.json();
    const id = String(body.id || "").trim();

    if (!id) {
      return jsonError("ID notifikasi wajib dikirim.");
    }

    const notification = await prisma.adminNotification.update({
      where: {
        id,
      },
      data: {
        is_read: true,
        status: "read",
      },
      select: {
        id: true,
        status: true,
        is_read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil ditandai sudah dibaca.",
      notification,
    });
  } catch (error) {
    console.error("PATCH /api/admin/notifications error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui notifikasi.",
      },
      { status: 500 }
    );
  }
}