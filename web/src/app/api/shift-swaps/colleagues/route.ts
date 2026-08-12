import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import {
  getShiftKind,
  getShiftWindowForSwapDate,
  toShiftSwapDate,
} from "@/lib/shift-swap-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);
    const swapDateParam = req.nextUrl.searchParams.get("swapDate") || "";
    const selectedDate = swapDateParam ? toShiftSwapDate(swapDateParam) : new Date();

    const currentUser = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: {
        id: true,
        shift: { select: { name: true } },
      },
    });

    const rawShiftName = currentUser?.shift?.name || "UTAMA";
    const userShiftUpper = rawShiftName.toUpperCase().trim();

    const userShiftKind = getShiftKind(userShiftUpper);
    const isPrimaryShift = userShiftKind === "utama";

    // Allowed colleague shift keywords for "Tukar Rekan"
    let allowedColleagueKeywords: string[] = [];
    if (userShiftKind === "utama") {
      allowedColleagueKeywords = ["SIANG"];
    } else if (userShiftKind === "siang") {
      allowedColleagueKeywords = ["UTAMA", "PAGI"];
    } else if (userShiftKind === "pagi") {
      allowedColleagueKeywords = ["SIANG"];
    } else {
      allowedColleagueKeywords = ["PAGI", "SIANG"];
    }

    // Fetch active employees (excluding self and excluding MAGANG)
    const colleagues = await prisma.user.findMany({
      where: {
        id: { not: authUser.id },
        role: { in: ["employee", "EMPLOYEE"] },
        status: { in: ["active", "ACTIVE"] },
      },
      select: {
        id: true,
        name: true,
        employee_code: true,
        profile_photo: true,
        shift: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const filteredColleagues = colleagues.filter((col) => {
      const shiftName = String(col.shift?.name || "").toUpperCase();
      if (shiftName.includes("MAGANG")) return false;

      return allowedColleagueKeywords.some((kw) => shiftName.includes(kw));
    });

    // Fetch active shifts from DB (excluding MAGANG)
    const activeShifts = await prisma.shift.findMany({
      where: {
        status: { in: ["active", "ACTIVE"] },
        NOT: {
          name: {
            contains: "MAGANG",
          },
        },
      },
      select: {
        id: true,
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
      orderBy: {
        name: "asc",
      },
    });

    // Clean, normalize to CAPS LOCK, and deduplicate shift options
    type AvailableShiftItem = {
      id: string;
      name: string;
      startTime?: string | null;
      endTime?: string | null;
    };

    const shiftMap = new Map<string, AvailableShiftItem>();

    for (const s of activeShifts) {
      const upperName = s.name.toUpperCase().trim();
      if (upperName.includes("MAGANG")) continue;

      if (!shiftMap.has(upperName)) {
        const window = getShiftWindowForSwapDate(
          {
            name: upperName,
            start_time: s.start_time,
            end_time: s.end_time,
            work_schedules: s.work_schedules,
          },
          selectedDate,
        );

        shiftMap.set(upperName, {
          id: s.id,
          name: upperName,
          startTime: window?.startTime || s.start_time,
          endTime: window?.endTime || s.end_time,
        });
      }
    }

    // Ensure default fallback shifts exist if not present in DB
    if (!shiftMap.has("SHIFT SIANG")) {
      shiftMap.set("SHIFT SIANG", {
        id: "shift-siang-default",
        name: "SHIFT SIANG",
        startTime: "13:00",
        endTime: "21:00",
      });
    }

    if (!shiftMap.has("SHIFT PAGI")) {
      shiftMap.set("SHIFT PAGI", {
        id: "shift-pagi-default",
        name: "SHIFT PAGI",
        startTime: "06:00",
        endTime: "14:00",
      });
    }

    if (!shiftMap.has("UTAMA")) {
      shiftMap.set("UTAMA", {
        id: "shift-utama-default",
        name: "UTAMA",
        startTime: "08:00",
        endTime: "17:00",
      });
    }

    const allShiftOptions = Array.from(shiftMap.values());

    // Target shift options for "Geser Shift Mandiri":
    // Only karyawan utama can move to shift pagi / shift siang.
    const availableShifts: AvailableShiftItem[] = isPrimaryShift
      ? allShiftOptions.filter((s) => s.name.includes("SIANG"))
      : [];

    return NextResponse.json({
      success: true,
      currentShiftName: userShiftUpper,
      canSelfShift: isPrimaryShift,
      colleagues: filteredColleagues.map((col) => ({
        id: col.id,
        name: col.name,
        employeeCode: col.employee_code,
        profilePhoto: col.profile_photo,
        shiftName: String(col.shift?.name || "UTAMA").toUpperCase(),
      })),
      availableShifts,
    });
  } catch (error) {
    console.error("GET_SHIFT_SWAP_COLLEAGUES_ERROR:", error);
    return NextResponse.json(
      { error: getApiErrorMessage(error, "Gagal mengambil daftar rekan kerja.") },
      { status: getApiErrorStatus(error) },
    );
  }
}
