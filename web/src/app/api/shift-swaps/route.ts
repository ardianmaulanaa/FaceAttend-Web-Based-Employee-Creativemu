import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import {
  findActiveLeaveForDate,
  formatJakartaDate,
  getLeaveTypeLabel,
} from "@/lib/leave-attendance-guard";
import { prisma } from "@/lib/prisma";
import {
  buildFallbackShift,
  canSwapShiftPair,
  ensureShiftSwapTable,
  formatShiftSwapDate,
  getShiftKind,
  getShiftSwapCutoffMessage,
  getShiftWindowForSwapDate,
  toShiftSwapDate,
} from "@/lib/shift-swap-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getShiftSwapLeaveBlock(params: {
  requesterId: string;
  requesterName?: string | null;
  targetUserId: string;
  targetUserName?: string | null;
  swapDate: Date;
}) {
  const [requesterLeave, targetLeave] = await Promise.all([
    findActiveLeaveForDate({
      userId: params.requesterId,
      date: params.swapDate,
    }),
    findActiveLeaveForDate({
      userId: params.targetUserId,
      date: params.swapDate,
    }),
  ]);

  const blockedLeave = requesterLeave || targetLeave;
  if (!blockedLeave) return null;

  const isRequesterBlocked = Boolean(requesterLeave);
  const employeeName = isRequesterBlocked
    ? params.requesterName || "Kamu"
    : params.targetUserName || "Rekan kerja";
  const leaveLabel = getLeaveTypeLabel(blockedLeave.leave_type);

  return `${employeeName} sedang dalam periode ${leaveLabel} pada ${formatJakartaDate(
    params.swapDate,
  )}. Tukar shift tidak dapat diajukan kecuali untuk periode lembur.`;
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await ensureShiftSwapTable();

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        shift: { select: { name: true } },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const currentShiftName = String(user.shift?.name || "UTAMA").toUpperCase();

    const sentRequests = await prisma.shiftSwapRequest.findMany({
      where: { requester_id: user.id },
      include: {
        target_user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            profile_photo: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const incomingRequests = await prisma.shiftSwapRequest.findMany({
      where: {
        target_user_id: user.id,
        requester_id: { not: user.id },
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            profile_photo: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const pendingIncomingCount = incomingRequests.filter(
      (req) => req.status === "pending",
    ).length;

    return NextResponse.json({
      success: true,
      isEligible: true,
      currentShiftName,
      pendingIncomingCount,
      sentRequests: sentRequests.map((item) => ({
        id: item.id,
        isSelfShift: item.target_user_id === item.requester_id,
        targetUser: {
          id: item.target_user.id,
          name: item.target_user.name,
          employeeCode: item.target_user.employee_code,
          profilePhoto: item.target_user.profile_photo,
        },
        swapDate: formatShiftSwapDate(item.swap_date),
        requesterShiftName: item.requester_shift_name,
        targetShiftName: item.target_shift_name,
        reason: item.reason,
        status: item.status,
        createdAt: item.created_at.toISOString(),
      })),
      incomingRequests: incomingRequests.map((item) => ({
        id: item.id,
        isSelfShift: false,
        requester: {
          id: item.requester.id,
          name: item.requester.name,
          employeeCode: item.requester.employee_code,
          profilePhoto: item.requester.profile_photo,
        },
        swapDate: formatShiftSwapDate(item.swap_date),
        requesterShiftName: item.requester_shift_name,
        targetShiftName: item.target_shift_name,
        reason: item.reason,
        status: item.status,
        createdAt: item.created_at.toISOString(),
      })),
    });
  } catch (error) {
    console.error("GET_SHIFT_SWAPS_ERROR:", error);
    return NextResponse.json(
      { error: getApiErrorMessage(error, "Gagal mengambil pengajuan tukar shift.") },
      { status: getApiErrorStatus(error) },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    await ensureShiftSwapTable();

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        name: true,
        shift: {
          select: {
            name: true,
            start_time: true,
            end_time: true,
            work_schedules: {
              select: {
                day_of_week: true,
                is_work_day: true,
                check_in_time: true,
                check_out_time: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
    }

    const requesterShiftName = user.shift?.name || "Shift Utama";

    const body = await req.json();
    const mode = String(body.mode || "").toLowerCase().trim(); // 'swap' or 'self'
    const targetUserId = String(body.targetUserId || "").trim();
    const targetShiftName = String(body.targetShiftName || "").trim();
    const swapDateStr = String(body.swapDate || "").trim();
    const reason = String(body.reason || "").trim();

    const isSelfShift = mode === "self" || targetUserId === user.id || Boolean(targetShiftName && !targetUserId);

    if (!swapDateStr) {
      return NextResponse.json(
        { error: "Tanggal pergeseran / tukar shift wajib diisi." },
        { status: 400 },
      );
    }

    const swapDate = toShiftSwapDate(swapDateStr);

    // MODE GESER SHIFT MANDIRI (Self Shift Adjustment)
    if (isSelfShift) {
      const requesterShiftUpper = requesterShiftName.trim().toUpperCase();
      const targetShiftUpper = targetShiftName.trim().toUpperCase();

      if (getShiftKind(requesterShiftUpper) !== "utama") {
        return NextResponse.json(
          { error: "Geser shift hanya berlaku untuk karyawan utama." },
          { status: 400 },
        );
      }

      if (!targetShiftName) {
        return NextResponse.json(
          { error: "Pilih shift tujuan (misalnya Shift Siang)." },
          { status: 400 },
        );
      }

      const targetShiftKind = getShiftKind(targetShiftUpper);

      if (targetShiftKind !== "siang") {
        return NextResponse.json(
          { error: "Karyawan utama hanya bisa geser ke Shift Siang." },
          { status: 400 },
        );
      }

      if (targetShiftUpper === requesterShiftUpper) {
        return NextResponse.json(
          { error: `Kamu sudah berada pada ${requesterShiftName}. Pilih shift yang berbeda.` },
          { status: 400 },
        );
      }

      const targetShiftList = await prisma.shift.findMany({
        where: {
          status: { in: ["active", "ACTIVE"] },
        },
        select: {
          name: true,
          start_time: true,
          end_time: true,
          work_schedules: {
            select: {
              day_of_week: true,
              is_work_day: true,
              check_in_time: true,
              check_out_time: true,
            },
          },
        },
      });
      const targetShift =
        targetShiftList.find(
          (shift) => shift.name.trim().toUpperCase() === targetShiftUpper,
        ) || buildFallbackShift(targetShiftName);
      const targetWindow = getShiftWindowForSwapDate(targetShift, swapDate);

      if (!targetWindow) {
        return NextResponse.json(
          { error: "Jadwal shift tujuan pada tanggal tersebut belum lengkap atau bukan hari kerja." },
          { status: 400 },
        );
      }

      const cutoffMessage = getShiftSwapCutoffMessage({
        swapDate,
        windows: [targetWindow],
      });

      if (cutoffMessage) {
        return NextResponse.json({ error: cutoffMessage }, { status: 400 });
      }

      // Check if already submitted for this date
      const existingPendingOrApproved = await prisma.shiftSwapRequest.findFirst({
        where: {
          requester_id: user.id,
          swap_date: swapDate,
          status: { in: ["pending", "approved"] },
        },
      });

      if (existingPendingOrApproved) {
        if (
          existingPendingOrApproved.status === "approved" &&
          existingPendingOrApproved.target_user_id === user.id
        ) {
          return NextResponse.json({
            success: true,
            message: `Jam kerja untuk tanggal tersebut sudah digeser ke ${existingPendingOrApproved.target_shift_name}. Presensi akan menggunakan jadwal ${existingPendingOrApproved.target_shift_name}.`,
            request: existingPendingOrApproved,
          });
        }

        return NextResponse.json(
          { error: "Kamu sudah memiliki pergeseran/tukar shift untuk tanggal tersebut." },
          { status: 400 },
        );
      }

      const createdSwap = await prisma.shiftSwapRequest.create({
        data: {
          requester_id: user.id,
          target_user_id: user.id,
          swap_date: swapDate,
          requester_shift_name: requesterShiftName,
          target_shift_name: targetShiftName,
          reason: reason || "Geser shift mandiri",
          status: "approved",
        },
      });

      try {
        await prisma.adminNotification.create({
          data: {
            user_id: user.id,
            type: "shift_swap",
            title: "Geser Shift Mandiri",
            message: `${user.name} melakukan geser shift mandiri dari ${requesterShiftName} ke ${targetShiftName} pada ${swapDateStr}.`,
            status: "unread",
          },
        });
      } catch {
        // ignore notification failure
      }

      return NextResponse.json({
        success: true,
        message: `Jam kerja berhasil digeser ke ${targetShiftName} untuk tanggal tersebut. Presensi akan menggunakan jadwal ${targetShiftName}.`,
        request: createdSwap,
      });
    }

    // MODE TUKAR SHIFT DENGAN REKAN KERJA
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Rekan kerja tujuan dan tanggal tukar shift wajib diisi." },
        { status: 400 },
      );
    }

    if (targetUserId === user.id) {
      return NextResponse.json(
        { error: "Gunakan menu Geser Shift Mandiri untuk menggeser shift pribadi." },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        shift: {
          select: {
            name: true,
            start_time: true,
            end_time: true,
            work_schedules: {
              select: {
                day_of_week: true,
                is_work_day: true,
                check_in_time: true,
                check_out_time: true,
              },
            },
          },
        },
      },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Rekan kerja tujuan tidak ditemukan." },
        { status: 404 },
      );
    }

    const targetShiftNameForColleague = targetUser.shift?.name || "Shift Utama";
    const requesterShiftUpper = requesterShiftName.trim().toUpperCase();
    const targetShiftUpper = targetShiftNameForColleague.trim().toUpperCase();

    if (!canSwapShiftPair(requesterShiftUpper, targetShiftUpper)) {
      return NextResponse.json(
        {
          error:
            "Aturan tukar shift: Utama hanya bisa tukar dengan Shift Siang, Shift Pagi hanya bisa tukar dengan Shift Siang, dan Shift Utama tidak bisa tukar dengan Shift Pagi.",
        },
        { status: 400 },
      );
    }

    const leaveBlockMessage = await getShiftSwapLeaveBlock({
      requesterId: user.id,
      requesterName: "Kamu",
      targetUserId,
      targetUserName: targetUser.name,
      swapDate,
    });

    if (leaveBlockMessage) {
      return NextResponse.json({ error: leaveBlockMessage }, { status: 400 });
    }

    if (!user.shift || !targetUser.shift) {
      return NextResponse.json(
        { error: "Shift karyawan belum lengkap. Lengkapi shift terlebih dahulu sebelum tukar shift." },
        { status: 400 },
      );
    }

    const requesterWindow = getShiftWindowForSwapDate(user.shift, swapDate);
    const targetWindow = getShiftWindowForSwapDate(targetUser.shift, swapDate);

    if (!requesterWindow || !targetWindow) {
      return NextResponse.json(
        { error: "Jadwal kerja pada tanggal tersebut belum lengkap atau bukan hari kerja." },
        { status: 400 },
      );
    }

    const cutoffMessage = getShiftSwapCutoffMessage({
      swapDate,
      windows: [requesterWindow, targetWindow],
    });

    if (cutoffMessage) {
      return NextResponse.json({ error: cutoffMessage }, { status: 400 });
    }

    const existingPending = await prisma.shiftSwapRequest.findFirst({
      where: {
        requester_id: user.id,
        target_user_id: targetUserId,
        swap_date: swapDate,
        status: "pending",
      },
    });

    if (existingPending) {
      return NextResponse.json(
        { error: "Kamu sudah mengirim pengajuan tukar shift ke karyawan ini untuk tanggal tersebut." },
        { status: 400 },
      );
    }

    const createdSwap = await prisma.shiftSwapRequest.create({
      data: {
        requester_id: user.id,
        target_user_id: targetUserId,
        swap_date: swapDate,
        requester_shift_name: requesterShiftName,
        target_shift_name: targetShiftNameForColleague,
        reason: reason || null,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      message: `Pengajuan tukar shift ke ${targetUser.name} berhasil dikirim dan menunggu konfirmasi.`,
      request: createdSwap,
    });
  } catch (error) {
    console.error("POST_SHIFT_SWAP_ERROR:", error);
    return NextResponse.json(
      { error: getApiErrorMessage(error, "Gagal membuat pengajuan tukar shift.") },
      { status: getApiErrorStatus(error) },
    );
  }
}
