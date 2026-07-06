import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const db = prisma as any;

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

async function ensureAdmin(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  if (user.role.toLowerCase() !== "admin") {
    throw new Error("Akses hanya untuk admin.");
  }

  return user;
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

function formatStatus(status: string) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";

  return status;
}

export async function GET(req: NextRequest) {
  try {
    await ensureAdmin(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";

    const where =
      status === "all"
        ? {}
        : {
            status,
          };

    const requests = await db.leaveRequest.findMany({
      where,
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
        user: {
          select: {
            id: true,
            employee_code: true,
            name: true,
            email: true,
            employee_type: true,
            shift: {
              select: {
                name: true,
              },
            },
            department: {
              select: {
                name: true,
              },
            },
            position: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    const total = await db.leaveRequest.count();

    const pending = await db.leaveRequest.count({
      where: {
        status: "pending",
      },
    });

    const approved = await db.leaveRequest.count({
      where: {
        status: "approved",
      },
    });

    const rejected = await db.leaveRequest.count({
      where: {
        status: "rejected",
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        total,
        pending,
        approved,
        rejected,
      },
      requests: requests.map((item: any) => ({
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
        employee: {
          id: item.user.id,
          employeeCode: item.user.employee_code,
          name: item.user.name,
          email: item.user.email,
          employeeType: item.user.employee_type,
          shift: item.user.shift?.name || null,
          department: item.user.department?.name || null,
          position: item.user.position?.name || null,
        },
      })),
    });
  } catch (error) {
    console.error("ADMIN_GET_LEAVE_REQUESTS_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal mengambil laporan pengajuan cuti.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await ensureAdmin(req);

    const body = await req.json();

    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim();
    const adminNote = String(body.adminNote || "").trim();
    const locationUnlockApproved = Boolean(body.locationUnlockApproved);

    if (!id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: "ID pengajuan dan status wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Status tidak valid.",
        },
        { status: 400 },
      );
    }

    const updatedRequest = await db.leaveRequest.update({
      where: {
        id,
      },
      data: {
        status,
        admin_note: adminNote || null,
        location_unlock_approved: status === "approved" ? locationUnlockApproved : false,
      },
      select: {
        id: true,
        status: true,
        admin_note: true,
        location_unlock_approved: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status pengajuan karyawan berhasil diperbarui.",
      request: updatedRequest,
    });
  } catch (error) {
    console.error("ADMIN_UPDATE_LEAVE_REQUEST_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui status pengajuan cuti.",
      },
      { status: 500 },
    );
  }
}
