import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { formatShiftSwapDate } from "@/lib/shift-swap-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPLOYEE_NOTIFICATION_TYPES = ["leave_status", "announcement", "shift_swap"];

async function getCurrentUser(req: NextRequest) {
  const authUser = await requireAuth(req);

  const user = await prisma.user.findUnique({
    where: {
      id: authUser.id,
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
      stats: {
        total: 0,
        unread: 0,
      },
      notifications: [],
    },
    { status }
  );
}

function getCurrentMonthRange() {
  const now = new Date();

  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

  return { start, end };
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

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNotificationHref(type: string) {
  if (type === "announcement") return "/pengumuman";
  if (type === "shift_swap") return "/tukar-shift";

  return "/cuti";
}

function getNotificationLabel(type: string) {
  if (type === "announcement") return "Pengumuman";
  if (type === "shift_swap") return "Tukar Shift";

  return "Cuti / Izin / Sakit";
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active") {
      return jsonError("Akun tidak aktif.", 403);
    }

    const { start, end } = getCurrentMonthRange();

    const notifications = await prisma.adminNotification.findMany({
      where: {
        user_id: currentUser.id,
        type: {
          in: EMPLOYEE_NOTIFICATION_TYPES,
        },
        created_at: {
          gte: start,
          lt: end,
        },
      },
      select: {
        id: true,
        user_id: true,
        type: true,
        title: true,
        message: true,
        status: true,
        is_read: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: "desc",
      },
      take: 100,
    });

    const mappedNotifications = notifications.map((item) => {
      const isRead = Boolean(item.is_read) || item.status === "read";

      return {
        id: item.id,
        rawId: item.id,
        type: item.type,
        typeLabel: getNotificationLabel(item.type),
        title: item.title || "Notifikasi",
        message: item.message || "-",
        status: isRead ? "read" : "unread",
        statusText: isRead ? "Dibaca" : "Belum Dibaca",
        isRead,
        createdAt: toIsoDate(item.created_at),
        updatedAt: toIsoDate(item.updated_at),
        dateText: formatDate(item.created_at),
        href: getNotificationHref(item.type),
      };
    });

    let swapNotifications: typeof mappedNotifications = [];
    let announcementNotifications: typeof mappedNotifications = [];

    try {
      const pendingShiftSwaps = await prisma.shiftSwapRequest.findMany({
        where: {
          target_user_id: currentUser.id,
          status: "pending",
        },
        include: {
          requester: {
            select: { name: true },
          },
        },
        orderBy: { created_at: "desc" },
      });

      swapNotifications = pendingShiftSwaps.map((item) => ({
        id: `swap-${item.id}`,
        rawId: item.id,
        type: "shift_swap",
        typeLabel: "Tukar Shift",
        title: "Permintaan Tukar Shift Masuk",
        message: `${item.requester?.name || "Rekan kerja"} mengajukan tukar shift (${item.requester_shift_name} ↔ ${item.target_shift_name}) ${formatShiftSwapDate(item.swap_date)}.`,
        status: "unread",
        statusText: "Belum Dibaca",
        isRead: false,
        createdAt: toIsoDate(item.created_at),
        updatedAt: toIsoDate(item.updated_at),
        dateText: formatDate(item.created_at),
        href: "/tukar-shift",
      }));
    } catch {
      // ignore if table doesn't exist yet
    }

    try {
      const publishedAnnouncements = await prisma.announcement.findMany({
        where: {
          status: "published",
        },
        orderBy: { created_at: "desc" },
        take: 50,
      });

      announcementNotifications = publishedAnnouncements.map((item) => ({
        id: `announcement-${item.id}`,
        rawId: item.id,
        type: "announcement",
        typeLabel: "Pengumuman",
        title: item.title || "Pengumuman Baru",
        message: item.content || "Ada pengumuman baru dari perusahaan.",
        status: "unread",
        statusText: "Belum Dibaca",
        isRead: false,
        createdAt: toIsoDate(item.created_at),
        updatedAt: toIsoDate(item.updated_at),
        dateText: formatDate(item.created_at),
        href: `/pengumuman/${item.id}`,
      }));
    } catch {
      // ignore if table doesn't exist yet
    }

    const allNotifications = [...swapNotifications, ...announcementNotifications, ...mappedNotifications];

    return NextResponse.json({
      success: true,
      stats: {
        total: allNotifications.length,
        unread: allNotifications.filter((item) => !item.isRead).length,
      },
      notifications: allNotifications,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);

    return jsonError(
      getApiErrorMessage(error, "Gagal mengambil notifikasi."),
      getApiErrorStatus(error)
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (currentUser.status !== "active") {
      return jsonError("Akun tidak aktif.", 403);
    }

    const body = await req.json();
    const id = String(body.id || body.rawId || "").trim();

    if (!id) {
      return jsonError("ID notifikasi wajib dikirim.");
    }

    const notification = await prisma.adminNotification.findFirst({
      where: {
        id,
        user_id: currentUser.id,
        type: {
          in: EMPLOYEE_NOTIFICATION_TYPES,
        },
      },
      select: {
        id: true,
      },
    });

    if (!notification) {
      return jsonError("Notifikasi tidak ditemukan.", 404);
    }

    await prisma.adminNotification.update({
      where: {
        id,
      },
      data: {
        status: "read",
        is_read: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil ditandai sudah dibaca.",
    });
  } catch (error) {
    console.error("PATCH /api/notifications error:", error);

    return jsonError(
      getApiErrorMessage(error, "Gagal memperbarui notifikasi."),
      getApiErrorStatus(error)
    );
  }
}
