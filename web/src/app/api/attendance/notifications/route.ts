import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  isDatabaseUnavailable,
  listDemoAttendanceNotifications,
} from "@/lib/demoStore";

type DbNotificationRow = {
  id: string;
  employee_name: string;
  check_in_time: Date | null;
  check_out_time: Date | null;
  status: string | null;
};

function mapDbRowsToNotifications(rows: DbNotificationRow[]) {
  const notifications: Array<{
    id: string;
    type: "check-in" | "check-out" | "absent";
    employeeName: string;
    happenedAt: string;
    message: string;
  }> = [];

  for (const row of rows) {
    if (row.check_in_time) {
      notifications.push({
        id: `${row.id}-check-in`,
        type: "check-in",
        employeeName: row.employee_name,
        happenedAt: row.check_in_time.toISOString(),
        message: `${row.employee_name} melakukan check-in`,
      });
    }

    if (row.check_out_time) {
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
        message: `${row.employee_name} tercatat absen`,
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

    if (payload.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Hanya admin yang dapat melihat notifikasi",
        },
        { status: 403 },
      );
    }

    const rows = await prisma.$queryRaw<DbNotificationRow[]>`
      SELECT
        a.id,
        u.name AS employee_name,
        a.check_in_time,
        a.check_out_time,
        a.status
      FROM attendances a
      INNER JOIN users u ON u.id = a.employee_id
      WHERE u.role = 'employee'
      ORDER BY COALESCE(a.check_out_time, a.check_in_time, a.created_at) DESC
      LIMIT 30
    `;

    return NextResponse.json({
      success: true,
      data: mapDbRowsToNotifications(rows),
    });
  } catch (error) {
    console.error(error);

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({
        success: true,
        data: listDemoAttendanceNotifications().slice(0, 20),
      });
    }

    return NextResponse.json(
      { success: false, message: "Gagal mengambil notifikasi presensi" },
      { status: 500 },
    );
  }
}
