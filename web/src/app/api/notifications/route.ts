import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMPLOYEE_NOTIFICATION_TYPES = ["leave_status", "announcement"];

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

  return "/cuti";
}

function getNotificationLabel(type: string) {
  if (type === "announcement") return "Pengumuman";

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

    return NextResponse.json({
      success: true,
      stats: {
        total: mappedNotifications.length,
        unread: mappedNotifications.filter((item) => !item.isRead).length,
      },
      notifications: mappedNotifications,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);

    return jsonError(
      error instanceof Error
        ? error.message
        : "Gagal mengambil notifikasi.",
      500
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
      error instanceof Error
        ? error.message
        : "Gagal memperbarui notifikasi.",
      500
    );
  }
}