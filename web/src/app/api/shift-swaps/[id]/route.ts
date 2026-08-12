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
  getShiftSwapCutoffMessage,
  getShiftWindowForSwapDate,
} from "@/lib/shift-swap-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getApprovalLeaveBlockMessage(params: {
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

  const employeeName = requesterLeave
    ? params.requesterName || "Pengaju"
    : params.targetUserName || "Kamu";
  const leaveLabel = getLeaveTypeLabel(blockedLeave.leave_type);

  return `${employeeName} sedang dalam periode ${leaveLabel} pada ${formatJakartaDate(
    params.swapDate,
  )}. Tukar shift tidak dapat disetujui kecuali untuk periode lembur.`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAuth(req);
    await ensureShiftSwapTable();

    const resolvedParams = await params;
    const swapId = resolvedParams.id;
    const body = await req.json();
    const action = String(body.action || "").toLowerCase().trim();

    if (action !== "approve" && action !== "reject" && action !== "cancel") {
      return NextResponse.json(
        { error: "Aksi tidak valid. Pilih setuju (approve), tolak (reject), atau batalkan (cancel)." },
        { status: 400 },
      );
    }

    const swapRequest = await prisma.shiftSwapRequest.findUnique({
      where: { id: swapId },
      include: {
        requester: { select: { id: true, name: true, shift_id: true } },
        target_user: { select: { id: true, name: true, shift_id: true } },
      },
    });

    if (!swapRequest) {
      return NextResponse.json(
        { error: "Pengajuan tukar shift tidak ditemukan." },
        { status: 404 },
      );
    }

    if (action === "cancel") {
      if (user.id !== swapRequest.requester_id && user.id !== swapRequest.target_user_id) {
        return NextResponse.json(
          { error: "Kamu tidak memiliki akses untuk membatalkan pengajuan ini." },
          { status: 403 },
        );
      }

      if (swapRequest.status === "cancelled") {
        return NextResponse.json(
          { error: "Pengajuan ini sudah dibatalkan sebelumnya." },
          { status: 400 },
        );
      }

      const cancelReason = String(body.cancelReason || body.reason || "").trim() || "Dibatalkan oleh karyawan";

      const updatedSwap = await prisma.shiftSwapRequest.update({
        where: { id: swapId },
        data: {
          status: "cancelled",
        },
      });

      const cancellerName = user.id === swapRequest.requester_id ? swapRequest.requester.name : swapRequest.target_user.name;

      // Send notifications to BOTH users
      const notificationTargets = Array.from(new Set([swapRequest.requester_id, swapRequest.target_user_id]));
      for (const targetId of notificationTargets) {
        try {
          await prisma.adminNotification.create({
            data: {
              user_id: targetId,
              type: "shift_swap",
              title: "Tukar Shift Dibatalkan",
              message: `${cancellerName} membatalkan tukar shift (${swapRequest.requester_shift_name} ↔ ${swapRequest.target_shift_name}) tanggal ${formatJakartaDate(swapRequest.swap_date)}. Alasan: ${cancelReason}`,
              status: "unread",
            },
          });
        } catch {
          // ignore notification insert error
        }
      }

      return NextResponse.json({
        success: true,
        message: `Pengajuan tukar shift berhasil dibatalkan. Notifikasi telah dikirimkan ke kedua karyawan.`,
        request: updatedSwap,
      });
    }

    if (swapRequest.target_user_id !== user.id) {
      return NextResponse.json(
        { error: "Kamu tidak memiliki akses untuk menanggapi pengajuan tukar shift ini." },
        { status: 403 },
      );
    }

    if (swapRequest.status !== "pending") {
      return NextResponse.json(
        { error: `Pengajuan ini sudah ${swapRequest.status === "approved" ? "disetujui" : "ditolak"}.` },
        { status: 400 },
      );
    }

    if (action === "approve") {
      if (
        !canSwapShiftPair(
          swapRequest.requester_shift_name,
          swapRequest.target_shift_name,
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Aturan tukar shift: Utama hanya bisa tukar dengan Shift Siang, Shift Pagi hanya bisa tukar dengan Shift Siang, dan Shift Utama tidak bisa tukar dengan Shift Pagi.",
          },
          { status: 400 },
        );
      }

      const activeShifts = await prisma.shift.findMany({
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
      const findShift = (shiftName: string) => {
        const upperName = shiftName.trim().toUpperCase();

        return (
          activeShifts.find(
            (shift) => shift.name.trim().toUpperCase() === upperName,
          ) || buildFallbackShift(shiftName)
        );
      };
      const requesterWindow = getShiftWindowForSwapDate(
        findShift(swapRequest.requester_shift_name),
        swapRequest.swap_date,
      );
      const targetWindow = getShiftWindowForSwapDate(
        findShift(swapRequest.target_shift_name),
        swapRequest.swap_date,
      );

      if (!requesterWindow || !targetWindow) {
        return NextResponse.json(
          { error: "Jadwal shift pada tanggal tersebut belum lengkap atau bukan hari kerja." },
          { status: 400 },
        );
      }

      const cutoffMessage = getShiftSwapCutoffMessage({
        swapDate: swapRequest.swap_date,
        windows: [requesterWindow, targetWindow],
      });

      if (cutoffMessage) {
        return NextResponse.json({ error: cutoffMessage }, { status: 400 });
      }

      const leaveBlockMessage = await getApprovalLeaveBlockMessage({
        requesterId: swapRequest.requester_id,
        requesterName: swapRequest.requester.name,
        targetUserId: swapRequest.target_user_id,
        targetUserName: swapRequest.target_user.name,
        swapDate: swapRequest.swap_date,
      });

      if (leaveBlockMessage) {
        return NextResponse.json({ error: leaveBlockMessage }, { status: 400 });
      }
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    const updatedSwap = await prisma.shiftSwapRequest.update({
      where: { id: swapId },
      data: { status: newStatus },
    });

    // Swap status updated. Effective shift for the date will be handled dynamically by getEffectiveShiftNameForDate without permanently mutating user default shift.

    try {
      await prisma.adminNotification.create({
        data: {
          user_id: swapRequest.requester_id,
          type: "shift_swap",
          title: action === "approve" ? "Tukar Shift Disetujui" : "Tukar Shift Ditolak",
          message:
            action === "approve"
              ? `${swapRequest.target_user.name} menyetujui tukar shift (${swapRequest.requester_shift_name} ↔ ${swapRequest.target_shift_name}). Jadwal shift kamu otomatis disesuaikan.`
              : `${swapRequest.target_user.name} menolak pengajuan tukar shift (${swapRequest.requester_shift_name} ↔ ${swapRequest.target_shift_name}).`,
          status: "unread",
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? `Permintaan tukar shift dari ${swapRequest.requester.name} telah kamu setujui. Shift kalian berdua otomatis ditukar!`
          : `Permintaan tukar shift dari ${swapRequest.requester.name} telah kamu tolak.`,
      request: updatedSwap,
    });
  } catch (error) {
    console.error("PATCH_SHIFT_SWAP_ERROR:", error);
    return NextResponse.json(
      { error: getApiErrorMessage(error, "Gagal memproses pengajuan tukar shift.") },
      { status: getApiErrorStatus(error) },
    );
  }
}
