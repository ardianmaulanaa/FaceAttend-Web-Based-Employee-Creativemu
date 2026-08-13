import { prisma } from "@/lib/prisma";

type ShiftWithSchedules = {
  name: string;
  start_time?: string | null;
  end_time?: string | null;
  work_schedules?: Array<{
    day_of_week: string;
    is_work_day: boolean;
    check_in_time?: string | null;
    check_out_time?: string | null;
  }>;
};

export function toShiftSwapDate(dateStr: string) {
  const clean = dateStr.split("T")[0].trim();

  return new Date(`${clean}T00:00:00.000Z`);
}

export function formatShiftSwapDate(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDateOnlyRange(date: Date) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return { start, end };
}

function getDayOfWeekKey(date: Date) {
  const days = [
    "SUNDAY",
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
  ];

  return days[date.getUTCDay()];
}

function normalizeTime(value?: string | null) {
  if (!value) return null;

  const match = value.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);

  return hour * 60 + minute;
}

export function getShiftKind(shiftName?: string | null) {
  const name = String(shiftName || "").toUpperCase();

  if (name.includes("SIANG")) return "siang";
  if (name.includes("PAGI")) return "pagi";
  if (name.includes("UTAMA")) return "utama";

  return "other";
}

export function canSwapShiftPair(firstShiftName?: string | null, secondShiftName?: string | null) {
  const firstKind = getShiftKind(firstShiftName);
  const secondKind = getShiftKind(secondShiftName);

  if (firstKind === "other" || secondKind === "other") return false;
  if (firstKind === secondKind) return false;
  if (
    (firstKind === "utama" && secondKind === "pagi") ||
    (firstKind === "pagi" && secondKind === "utama")
  ) {
    return false;
  }

  return true;
}

export function buildFallbackShift(shiftName: string): ShiftWithSchedules {
  const kind = getShiftKind(shiftName);

  if (kind === "pagi") {
    return {
      name: shiftName,
      start_time: "09:00",
      end_time: "17:00",
    };
  }

  if (kind === "siang") {
    return {
      name: shiftName,
      start_time: "12:30",
      end_time: "20:30",
    };
  }

  return {
    name: shiftName,
    start_time: "09:00",
    end_time: "18:00",
  };
}

function getJakartaDateParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const getPart = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value || "0");

  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
}

function getSwapDateKey(date: Date) {
  return formatShiftSwapDate(date);
}

function getJakartaTodayKey(now = new Date()) {
  const parts = getJakartaDateParts(now);

  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

function dateKeyToNumber(dateKey: string) {
  return Number(dateKey.replaceAll("-", ""));
}

export function getShiftSwapCutoffMessage(params: {
  swapDate: Date;
  windows: Array<{ shiftName: string; startTime: string }>;
  now?: Date;
}) {
  const swapDateKey = getSwapDateKey(params.swapDate);
  const todayKey = getJakartaTodayKey(params.now);
  const swapDateNumber = dateKeyToNumber(swapDateKey);
  const todayNumber = dateKeyToNumber(todayKey);

  if (swapDateNumber < todayNumber) {
    return "Tanggal tukar/geser shift tidak boleh sebelum hari ini.";
  }

  return null;
}

/**
 * Cek apakah karyawan boleh mengajukan tukar shift untuk swapDate berdasarkan
 * status presensi aktual (check-in / check-out) hari ini:
 *
 * Aturan:
 * - Jika swapDate = BESOK → selalu boleh.
 * - Jika swapDate = HARI INI:
 *   a) Sudah check-out  → boleh (shift selesai, bisa approve untuk besok juga).
 *   b) Sudah check-in tapi belum check-out → TIDAK boleh untuk hari ini
 *      (hanya boleh untuk besok — redirect ke pesan error).
 *   c) Belum check-in → boleh jika waktu sekarang >= (jam shift mulai - 60 menit).
 *      Jika belum waktunya → TIDAK boleh untuk hari ini.
 *
 * Returns null jika diizinkan, atau string pesan error jika tidak diizinkan.
 */
export async function getShiftSwapCutoffMessageWithAttendance(params: {
  userId: string;
  swapDate: Date;
  shiftStartTime?: string | null; // format "HH:mm"
  now?: Date;
}): Promise<string | null> {
  const now = params.now || new Date();
  const swapDateKey = getSwapDateKey(params.swapDate);
  const todayKey = getJakartaTodayKey(now);
  const swapDateNumber = dateKeyToNumber(swapDateKey);
  const todayNumber = dateKeyToNumber(todayKey);

  // Tanggal di masa lalu — tolak
  if (swapDateNumber < todayNumber) {
    return "Tanggal tukar/geser shift tidak boleh sebelum hari ini.";
  }

  // swapDate = besok atau lebih → selalu boleh
  if (swapDateNumber > todayNumber) {
    return null;
  }

  // swapDate = hari ini — cek attendance aktual
  try {
    const todayParts = getJakartaDateParts(now);
    const todayStart = new Date(
      Date.UTC(todayParts.year, todayParts.month - 1, todayParts.day),
    );
    const todayEnd = new Date(todayStart);
    todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

    const todayAttendance = await prisma.attendance.findFirst({
      where: {
        user_id: params.userId,
        attendance_date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      select: {
        check_in_time: true,
        check_out_time: true,
      },
    });

    const hasCheckedIn = Boolean(todayAttendance?.check_in_time);
    const hasCheckedOut = Boolean(todayAttendance?.check_out_time);

    // Sudah check-out → shift selesai, boleh akses tukar shift untuk hari ini
    if (hasCheckedIn && hasCheckedOut) {
      return null;
    }

    // Sudah check-in tapi belum check-out → hanya boleh untuk besok
    if (hasCheckedIn && !hasCheckedOut) {
      return (
        "Kamu sudah check-in. Pengajuan tukar/geser shift untuk hari ini tidak dapat dilakukan saat sedang bekerja. " +
        "Pilih tanggal besok agar kamu dan rekan bisa saling konfirmasi."
      );
    }

    // Belum check-in → cek window 1 jam sebelum shift mulai
    const shiftStart = normalizeTime(params.shiftStartTime);
    if (shiftStart) {
      const shiftStartMinutes = timeToMinutes(shiftStart);
      const openWindowMinutes = shiftStartMinutes - 60; // 1 jam sebelum shift

      const jakartaParts = getJakartaDateParts(now);
      const currentMinutes = jakartaParts.hour * 60 + jakartaParts.minute;

      if (currentMinutes < openWindowMinutes) {
        const openHour = Math.floor(openWindowMinutes / 60);
        const openMin = openWindowMinutes % 60;
        const openTimeStr = `${String(openHour).padStart(2, "0")}:${String(openMin).padStart(2, "0")}`;
        return (
          `Pengajuan tukar/geser shift untuk hari ini baru dibuka pukul ${openTimeStr} WIB ` +
          `(1 jam sebelum shift dimulai). Silakan coba lagi setelah waktu tersebut atau pilih tanggal besok.`
        );
      }
    }

    // Belum check-in dan sudah dalam window 1 jam sebelum shift → boleh
    return null;
  } catch {
    // Jika gagal cek attendance, izinkan saja agar tidak memblokir
    return null;
  }
}

export function getShiftWindowForSwapDate(shift: ShiftWithSchedules, date: Date) {
  const dayKey = getDayOfWeekKey(date);
  const schedule = shift.work_schedules?.find(
    (item) => String(item.day_of_week).toUpperCase() === dayKey,
  );

  if (schedule && schedule.is_work_day === false) return null;

  const startTime =
    normalizeTime(schedule?.check_in_time) || normalizeTime(shift.start_time);
  const endTime =
    normalizeTime(schedule?.check_out_time) || normalizeTime(shift.end_time);

  if (!startTime || !endTime) return null;

  const startMinutes = timeToMinutes(startTime);
  let endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60;
  }

  return {
    shiftName: shift.name,
    startTime,
    endTime,
    startMinutes,
    endMinutes,
  };
}

export function shiftWindowsOverlap(
  first: { startMinutes: number; endMinutes: number },
  second: { startMinutes: number; endMinutes: number },
) {
  return first.startMinutes < second.endMinutes && second.startMinutes < first.endMinutes;
}

export async function ensureShiftSwapTable() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS shift_swap_requests (
        id VARCHAR(36) NOT NULL PRIMARY KEY,
        requester_id VARCHAR(36) NOT NULL,
        target_user_id VARCHAR(36) NOT NULL,
        swap_date DATE NOT NULL,
        requester_shift_name VARCHAR(100) NOT NULL,
        target_shift_name VARCHAR(100) NOT NULL,
        reason TEXT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
        updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
        INDEX idx_swap_date (swap_date),
        INDEX idx_swap_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (error) {
    console.warn("ENSURE_SHIFT_SWAP_TABLE_WARNING:", error);
  }
}

export async function getEffectiveShiftNameForDate(
  userId: string,
  date: Date,
  defaultShiftName?: string | null,
) {
  try {
    const { start, end } = getDateOnlyRange(date);
    const swap = await prisma.shiftSwapRequest.findFirst({
      where: {
        status: "approved",
        swap_date: {
          gte: start,
          lt: end,
        },
        OR: [{ requester_id: userId }, { target_user_id: userId }],
      },
    });

    if (!swap) return defaultShiftName || "";

    if (swap.requester_id === userId) {
      return swap.target_shift_name;
    } else {
      return swap.requester_shift_name;
    }
  } catch {
    return defaultShiftName || "";
  }
}
