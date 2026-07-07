import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { canViewAdminPanel } from "@/lib/adminAccess";
import {
  isDatabaseUnavailable,
  listDemoRoleNotifications,
} from "@/lib/demoStore";

type NotificationType =
  | "check-in"
  | "check-out"
  | "absent"
  | "complaint"
  | "call"
  | "leave-request";

type DbNotificationRow = {
  id: string;
  employee_name: string;
  check_in_time: Date | null;
  check_out_time: Date | null;
  status: string | null;
};

function buildCustomerServiceNotifications() {
  const now = Date.now();
  const nowIso = (offsetMinutes: number) =>
    new Date(now - offsetMinutes * 60 * 1000).toISOString();

  return [
    {
      id: "CS-NOTIF-1",
      type: "complaint" as const,
      employeeName: "Customer A",
      happenedAt: nowIso(5),
      message: "Keluhan customer: kesulitan akses akun. Mohon follow-up.",
    },
    {
      id: "CS-NOTIF-2",
      type: "call" as const,
      employeeName: "Customer B",
      happenedAt: nowIso(14),
      message: "Panggilan masuk customer terkait status layanan.",
    },
    {
      id: "CS-NOTIF-3",
      type: "complaint" as const,
      employeeName: "Customer C",
      happenedAt: nowIso(32),
      message: "Keluhan customer: konfirmasi pembayaran belum diterima.",
    },
  ];
}

function mapDbRowsToNotifications(rows: DbNotificationRow[], role: string) {
  const notifications: Array<{
    id: string;
    type: NotificationType;
    employeeName: string;
    happenedAt: string;
    message: string;
  }> = [];

  if (role === "cs") {
    return buildCustomerServiceNotifications();
  }

  for (const row of rows) {
    if (row.check_in_time) {
      notifications.push({
        id: `${row.id}-check-in`,
        type: "check-in",
        employeeName: row.employee_name,
        happenedAt: row.check_in_time.toISOString(),
        message:
          role === "admin"
            ? `${row.employee_name} check-in. Pantau kepatuhan jam kerja.`
            : `${row.employee_name} melakukan check-in`,
      });
    }

    if (row.check_out_time && role !== "admin") {
      notifications.push({
        id: `${row.id}-check-out`,
        type: "check-out",
        employeeName: row.employee_name,
        happenedAt: row.check_out_time.toISOString(),
        message: `${row.employee_name} melakukan check-out`,
      });
    }

    if (
      !row.check_in_time &&
      String(row.status || "").toLowerCase() === "absent"
    ) {
      notifications.push({
        id: `${row.id}-absent`,
        type: "absent",
        employeeName: row.employee_name,
        happenedAt: new Date().toISOString(),
        message:
          role === "admin"
            ? `${row.employee_name} tercatat absen. Perlu tindak lanjut HR.`
            : `${row.employee_name} tercatat absen`,
      });
    }
  }

  return notifications
    .sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))
    .slice(0, 20);
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("faceattend_token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    const payload = await verifyToken(token);

    const rows = canViewAdminPanel(payload.role)
      ? await prisma.$queryRaw<DbNotificationRow[]>`
          SELECT
            a.id,
            u.name AS employee_name,
            a.check_in_time,
            a.check_out_time,
            a.status
          FROM Attendance a
          INNER JOIN users u ON u.id = a.user_id
          WHERE u.role = 'employee'
          ORDER BY COALESCE(a.check_out_time, a.check_in_time, a.created_at) DESC
          LIMIT 30
        `
      : await prisma.$queryRaw<DbNotificationRow[]>`
          SELECT
            a.id,
            u.name AS employee_name,
            a.check_in_time,
            a.check_out_time,
            a.status
          FROM Attendance a
          INNER JOIN users u ON u.id = a.user_id
          WHERE a.user_id = ${payload.id}
          ORDER BY COALESCE(a.check_out_time, a.check_in_time, a.created_at) DESC
          LIMIT 30
        `;

    const leaveRequests = canViewAdminPanel(payload.role)
      ? await prisma.leaveRequest.findMany({
          where: { status: "pending" },
          include: { user: { select: { name: true } } },
          orderBy: { created_at: "desc" },
          take: 15,
        })
      : [];

    const attendanceNotifications = mapDbRowsToNotifications(rows, payload.role);
    const leaveNotifications = leaveRequests.map((req) => ({
      id: req.id,
      type: "leave-request" as const,
      employeeName: req.user.name,
      happenedAt: req.created_at.toISOString(),
      message: `${req.user.name} mengajukan ${
        req.leave_type === "annual"
          ? "cuti tahunan"
          : req.leave_type === "sick"
            ? "izin sakit"
            : req.leave_type === "permission"
              ? "izin kerja"
              : req.leave_type
      } (${req.total_days} hari) baru. Klik untuk meninjau.`,
    }));

    const allNotifications = [...leaveNotifications, ...attendanceNotifications]
      .sort((a, b) => b.happenedAt.localeCompare(a.happenedAt))
      .slice(0, 20);

    return NextResponse.json({
      success: true,
      data: allNotifications,
    });
  } catch (error) {
    console.error(error);

    if (isDatabaseUnavailable(error)) {
      const cookieStore = await cookies();
      const token = cookieStore.get("faceattend_token")?.value;

      if (!token) {
        return NextResponse.json({ success: true, data: [] });
      }

      const payload = await verifyToken(token);
      const demoItems = listDemoRoleNotifications(payload.role);

      return NextResponse.json({
        success: true,
        data: demoItems.slice(0, 20),
      });
    }

    return NextResponse.json(
      { success: false, message: "Gagal mengambil notifikasi presensi" },
      { status: 500 },
    );
  }
}
