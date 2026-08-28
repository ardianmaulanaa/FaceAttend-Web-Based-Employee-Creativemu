"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  ImageUp,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  RefreshCw,
  ScanFace,
  Settings,
  ShieldCheck,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import {
  AppButton,
  AppCard,
  AppInput,
  AppSelect,
  AppTextarea,
} from "@/components/ui/AppUI";

type AttendanceAction = "check-in" | "check-out";
type AlertType = "success" | "error" | "warning";
type WorkMode = "office" | "wfh" | "visit";
type BrowserGuide = {
  name: string;
  steps: string[];
};

type CustomAlert = {
  open: boolean;
  title: string;
  message: string;
  type: AlertType;
};

type EarlyCheckoutConfirm = {
  open: boolean;
  earlyMinutes: number;
  earlyLabel: string;
  endLabel: string;
  reason: string;
};

type EarlyCheckinConfirm = {
  open: boolean;
  earlyMinutes: number;
  earlyLabel: string;
  startLabel: string;
};

type WorkSchedule = {
  day_of_week?: string | null;
  dayOfWeek?: string | null;
  is_work_day?: boolean | null;
  isWorkDay?: boolean | null;
  check_in_time?: string | null;
  checkInTime?: string | null;
  check_out_time?: string | null;
  checkOutTime?: string | null;
};

type VisitForm = {
  visitTitle: string;
  visitClientName: string;
  visitAddress: string;
  visitNote: string;
};

type CurrentUser = {
  id?: string;
  name?: string;
  email?: string;
  shift?: {
    id?: string;
    name?: string | null;
    tolerance_minutes?: number | null;
    toleranceMinutes?: number | null;
    start_time?: string | null;
    end_time?: string | null;
    check_in_open?: string | null;
    check_out_open?: string | null;
    work_schedules?: WorkSchedule[] | null;
    workSchedules?: WorkSchedule[] | null;
  } | null;
  wfh_quota_monthly?: number | null;
  wfh_quota_used_monthly?: number | null;
  wfh_quota_remaining_monthly?: number | null;
};

type AuthMeResponse = {
  user?: CurrentUser;
  data?: CurrentUser | { user?: CurrentUser };
  currentUser?: CurrentUser;
};

type TodayAttendance = {
  checkIn?: string | null;
  id?: string;
  checkInTime?: string | null;
  check_in_time?: string | null;
  checkOut?: string | null;
  checkOutTime?: string | null;
  check_out_time?: string | null;
  workMinutes?: number | null;
  work_minutes?: number | null;
  workMode?: WorkMode | string | null;
  work_mode?: WorkMode | string | null;
  workModeLabel?: string | null;
  checkOutWorkMode?: WorkMode | string | null;
  check_out_work_mode?: WorkMode | string | null;
};

type LeaveBlock = {
  active?: boolean;
  id?: string;
  leaveType?: string;
  leaveTypeLabel?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  message?: string;
} | null;

type TodayAttendanceResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  attendance?: TodayAttendance | null;
  todayAttendance?: TodayAttendance | null;
  data?: TodayAttendance | { attendance?: TodayAttendance | null } | null;
  leaveBlock?: LeaveBlock;
};

const DEFAULT_SHIFT_START_TIME = "08:00";
const DEFAULT_SHIFT_END_TIME = "17:00";

const emptyAlert: CustomAlert = {
  open: false,
  title: "",
  message: "",
  type: "warning",
};

const emptyEarlyCheckoutConfirm: EarlyCheckoutConfirm = {
  open: false,
  earlyMinutes: 0,
  earlyLabel: "",
  endLabel: "",
  reason: "",
};

const emptyEarlyCheckinConfirm: EarlyCheckinConfirm = {
  open: false,
  earlyMinutes: 0,
  earlyLabel: "",
  startLabel: "",
};

const emptyVisitForm: VisitForm = {
  visitTitle: "",
  visitClientName: "",
  visitAddress: "",
  visitNote: "",
};

const cameraOptions: MediaStreamConstraints = {
  video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isCameraAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError(message: string) {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

function getBrowserErrorName(error: unknown) {
  return error instanceof Error ? error.name : "";
}

function isPermissionDeniedError(error: unknown) {
  const name = getBrowserErrorName(error);

  return (
    name === "NotAllowedError" ||
    name === "PermissionDeniedError" ||
    name === "SecurityError"
  );
}

function getCameraPermissionGuide(): BrowserGuide {
  if (typeof navigator === "undefined") {
    return {
      name: "Browser",
      steps: [
        "Buka pengaturan izin situs.",
        "Ubah izin Camera atau Kamera menjadi Allow/Izinkan.",
        "Kembali ke halaman presensi lalu tekan Aktifkan Kamera.",
      ],
    };
  }

  const userAgent = navigator.userAgent || "";
  const isIOS = /iPad|iPhone|iPod/.test(userAgent);
  const isAndroid = /Android/i.test(userAgent);
  const isEdge = /Edg\//.test(userAgent);
  const isFirefox = /Firefox\//.test(userAgent);
  const isChrome =
    /Chrome|CriOS/i.test(userAgent) && !isEdge && !/OPR\//.test(userAgent);
  const isSafari =
    /Safari/i.test(userAgent) && !isChrome && !isEdge && !isFirefox;

  if (isIOS && isSafari) {
    return {
      name: "Safari iPhone",
      steps: [
        "Buka Settings iPhone.",
        "Masuk ke Safari lalu pilih Camera.",
        "Pilih Allow atau Ask, lalu buka ulang halaman presensi.",
      ],
    };
  }

  if (isAndroid && isChrome) {
    return {
      name: "Chrome Android",
      steps: [
        "Tekan ikon gembok di address bar.",
        "Masuk ke Permissions lalu pilih Camera.",
        "Ubah menjadi Allow, lalu kembali dan tekan Aktifkan Kamera.",
      ],
    };
  }

  if (isChrome) {
    return {
      name: "Google Chrome",
      steps: [
        "Klik ikon gembok atau kamera di address bar.",
        "Buka Site settings.",
        "Ubah Camera menjadi Allow, lalu refresh halaman.",
      ],
    };
  }

  if (isEdge) {
    return {
      name: "Microsoft Edge",
      steps: [
        "Klik ikon gembok di address bar.",
        "Buka Permissions for this site.",
        "Ubah Camera menjadi Allow, lalu refresh halaman.",
      ],
    };
  }

  if (isFirefox) {
    return {
      name: "Firefox",
      steps: [
        "Klik ikon kamera atau gembok di address bar.",
        "Hapus blokir kamera atau pilih Allow.",
        "Refresh halaman lalu tekan Aktifkan Kamera.",
      ],
    };
  }

  return {
    name: "Browser",
    steps: [
      "Buka pengaturan izin situs dari ikon gembok di address bar.",
      "Ubah izin Camera atau Kamera menjadi Allow/Izinkan.",
      "Refresh halaman presensi lalu tekan Aktifkan Kamera.",
    ],
  };
}

function isMobileAttendanceDevice() {
  if (typeof navigator === "undefined" || typeof window === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent || "";
  const userAgentData = navigator as Navigator & {
    userAgentData?: { mobile?: boolean; platform?: string };
  };
  const platform =
    userAgentData.userAgentData?.platform || navigator.platform || "";
  const isPhoneUserAgent =
    /iPhone|iPod|Windows Phone|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    ) || /Android.+Mobile/i.test(userAgent);
  const isDesktopPlatform = /Mac|Win|Linux|CrOS/i.test(platform);
  const hasTouchInput =
    navigator.maxTouchPoints > 0 ||
    window.matchMedia("(pointer: coarse)").matches;
  const isSmallScreen =
    Math.min(window.screen.width, window.screen.height) <= 820;
  const isMobileClientHint = userAgentData.userAgentData?.mobile === true;

  if (isDesktopPlatform) return false;

  return (
    hasTouchInput && isSmallScreen && (isPhoneUserAgent || isMobileClientHint)
  );
}

function normalizeCurrentUser(
  data: AuthMeResponse | CurrentUser,
): CurrentUser | null {
  const maybeData = data as AuthMeResponse;

  const user =
    maybeData.user ||
    maybeData.currentUser ||
    (maybeData.data && "user" in maybeData.data ? maybeData.data.user : null) ||
    (maybeData.data && !("user" in maybeData.data) ? maybeData.data : null) ||
    data;

  if (!user || typeof user !== "object") return null;

  return user as CurrentUser;
}

async function readOptionalJson(response: Response) {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function getResponseMessage(data: Record<string, unknown>, fallback: string) {
  return String(data.message || data.error || fallback);
}

function normalizeTodayAttendance(
  data: TodayAttendanceResponse,
): TodayAttendance | null {
  if (!data || typeof data !== "object") return null;

  if (data.attendance) return data.attendance;
  if (data.todayAttendance) return data.todayAttendance;

  if (data.data && typeof data.data === "object") {
    if ("attendance" in data.data) {
      return data.data.attendance || null;
    }

    return data.data as TodayAttendance;
  }

  if (
    "checkIn" in data ||
    "checkInTime" in data ||
    "checkOut" in data ||
    "workMinutes" in data
  ) {
    return data as TodayAttendance;
  }

  return null;
}

function hasFilledAttendanceTime(value?: string | null) {
  const time = String(value || "").trim();

  return Boolean(time && time !== "--:--" && time !== "-");
}

function hasAttendanceCheckIn(attendance: TodayAttendance | null) {
  return (
    hasFilledAttendanceTime(attendance?.checkIn) ||
    hasFilledAttendanceTime(attendance?.checkInTime) ||
    hasFilledAttendanceTime(attendance?.check_in_time)
  );
}

function hasAttendanceCheckOut(attendance: TodayAttendance | null) {
  return (
    hasFilledAttendanceTime(attendance?.checkOut) ||
    hasFilledAttendanceTime(attendance?.checkOutTime) ||
    hasFilledAttendanceTime(attendance?.check_out_time)
  );
}

function getAttendanceWorkMode(attendance: TodayAttendance | null): WorkMode {
  const mode = attendance?.workMode || attendance?.work_mode;

  if (mode === "wfh" || mode === "visit") return mode;

  return "office";
}

function getShiftStartTime(
  shift?:
    | string
    | null
    | {
        name?: string | null;
        start_time?: string | null;
      },
) {
  if (shift && typeof shift !== "string" && shift.start_time) {
    return shift.start_time;
  }

  const name = String(
    typeof shift === "string" ? shift : shift?.name || "",
  ).toUpperCase();

  if (name.includes("SIANG")) return "13:00";
  if (name.includes("PAGI")) return "07:30";

  return DEFAULT_SHIFT_START_TIME;
}

function getShiftEndTime(
  shift?:
    | string
    | null
    | {
        name?: string | null;
        end_time?: string | null;
      },
) {
  if (shift && typeof shift !== "string" && shift.end_time) {
    return shift.end_time;
  }

  const name = String(
    typeof shift === "string" ? shift : shift?.name || "",
  ).toUpperCase();

  if (name.includes("SIANG")) return "21:00";
  if (name.includes("PAGI")) return "15:30";

  return DEFAULT_SHIFT_END_TIME;
}

function getJakartaDayOfWeek() {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
  })
    .format(new Date())
    .toUpperCase();
}

function normalizeScheduleTime(value?: string | null) {
  const text = String(value || "").trim();

  return /^\d{2}:\d{2}/.test(text) ? text.slice(0, 5) : "";
}

function getTodayWorkSchedule(user: CurrentUser | null) {
  const schedules =
    user?.shift?.work_schedules || user?.shift?.workSchedules || [];
  const today = getJakartaDayOfWeek();

  return (
    schedules.find((schedule) => {
      const day = schedule.day_of_week || schedule.dayOfWeek || "";

      return String(day).toUpperCase() === today;
    }) || null
  );
}

function getShiftToleranceMinutes(user: CurrentUser | null) {
  const tolerance =
    user?.shift?.tolerance_minutes ?? user?.shift?.toleranceMinutes ?? 5;

  const parsedTolerance = Number(tolerance);

  return Number.isFinite(parsedTolerance) && parsedTolerance >= 0
    ? parsedTolerance
    : 5;
}

function getShiftStartTimeFromUser(user: CurrentUser | null) {
  const schedule = getTodayWorkSchedule(user);
  const scheduleStartTime = normalizeScheduleTime(
    schedule?.check_in_time || schedule?.checkInTime,
  );
  const isWorkDay = schedule?.is_work_day ?? schedule?.isWorkDay;

  if (scheduleStartTime && isWorkDay !== false) {
    return scheduleStartTime;
  }

  return getShiftStartTime(user?.shift);
}

function getShiftEndTimeFromUser(user: CurrentUser | null) {
  const schedule = getTodayWorkSchedule(user);
  const scheduleEndTime = normalizeScheduleTime(
    schedule?.check_out_time || schedule?.checkOutTime,
  );
  const isWorkDay = schedule?.is_work_day ?? schedule?.isWorkDay;

  if (scheduleEndTime && isWorkDay !== false) {
    return scheduleEndTime;
  }

  return getShiftEndTime(user?.shift);
}

function timeToMinutes(time: string) {
  const [hourText, minuteText] = time.split(":");
  const hour = Number(hourText || 0);
  const minute = Number(minuteText || 0);

  return hour * 60 + minute;
}

function minutesToClock(totalMinutes: number) {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hour = Math.floor(normalizedMinutes / 60);
  const minute = normalizedMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getJakartaMinutesNow() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((part) => part.type === "hour")?.value || 0);
  const minute = Number(
    parts.find((part) => part.type === "minute")?.value || 0,
  );

  return hour * 60 + minute;
}

function getLateLimitMinutes(user: CurrentUser | null) {
  const startTime = getShiftStartTimeFromUser(user);
  const toleranceMinutes = getShiftToleranceMinutes(user);

  return timeToMinutes(startTime) + toleranceMinutes;
}

function getLateLimitLabel(user: CurrentUser | null) {
  return minutesToClock(getLateLimitMinutes(user));
}

function getEarlyCheckinMinutes(user: CurrentUser | null) {
  const nowMinutes = getJakartaMinutesNow();
  const startTimeStr = getShiftStartTimeFromUser(user);
  const startMinutes = timeToMinutes(startTimeStr);

  return nowMinutes < startMinutes ? startMinutes - nowMinutes : 0;
}

function isLateCheckInNow(user: CurrentUser | null) {
  const nowMinutes = getJakartaMinutesNow();
  const lateLimitMinutes = getLateLimitMinutes(user);

  return nowMinutes > lateLimitMinutes;
}

function getEarlyCheckoutMinutes(user: CurrentUser | null) {
  const nowMinutes = getJakartaMinutesNow();
  const endTimeStr = getShiftEndTimeFromUser(user);
  const endMinutes = timeToMinutes(endTimeStr);

  return nowMinutes < endMinutes ? endMinutes - nowMinutes : 0;
}

function formatDurationHoursMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.floor(totalMinutes));
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;

  if (hours <= 0) return `${minutes} menit`;
  if (minutes <= 0) return `${hours} jam`;

  return `${hours} jam ${minutes} menit`;
}

function getAttendanceDateValue(value?: string | null) {
  if (!value || value === "--:--") return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function getDisplayedWorkMinutes(attendance: TodayAttendance | null) {
  if (!attendance || !hasAttendanceCheckIn(attendance)) return 0;

  const savedMinutes = Number(
    attendance.workMinutes ?? attendance.work_minutes ?? 0,
  );

  if (hasAttendanceCheckOut(attendance)) {
    return Number.isFinite(savedMinutes) ? Math.max(0, savedMinutes) : 0;
  }

  const checkInDate = getAttendanceDateValue(
    attendance.checkInTime || attendance.check_in_time,
  );

  if (!checkInDate) return Number.isFinite(savedMinutes) ? savedMinutes : 0;

  const elapsedMinutes = Math.floor(
    (Date.now() - checkInDate.getTime()) / 60_000,
  );

  return Math.max(
    Number.isFinite(savedMinutes) ? savedMinutes : 0,
    elapsedMinutes,
  );
}

function getWorkModeLabel(workMode: WorkMode) {
  if (workMode === "wfh") return "WFH";
  if (workMode === "visit") return "Kunjungan";
  return "Kantor";
}

function getWorkModeDescription(workMode: WorkMode) {
  if (workMode === "office") return "Wajib berada dalam radius kantor.";
  if (workMode === "wfh") return "Bebas lokasi, GPS tetap disimpan.";
  return "Bebas lokasi, wajib isi data kunjungan.";
}

function getAllowedCheckOutModes(checkInWorkMode: WorkMode): WorkMode[] {
  if (checkInWorkMode === "wfh") return ["wfh"];
  if (checkInWorkMode === "visit") return ["visit", "office"];

  return ["office", "visit"];
}

function getWfhQuotaRemaining(user: CurrentUser | null) {
  if (!user) return null;

  const remaining = Number(user.wfh_quota_remaining_monthly ?? 0);

  return Number.isFinite(remaining) ? Math.max(0, remaining) : 0;
}

function AttendanceMotionStyles() {
  return (
    <style>{`
      @keyframes attendanceEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes attendanceCardEnter {
        0% {
          opacity: 0;
          transform: translateY(14px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes attendanceCameraEnter {
        0% {
          opacity: 0;
          transform: translateY(12px) scale(0.985);
          filter: blur(4px);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }
      }

      @keyframes attendanceRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes attendanceIconPop {
        0% {
          opacity: 0;
          transform: translateY(8px) scale(0.92);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes attendancePulseScan {
        0%, 100% {
          opacity: 0.5;
          transform: translateY(-35%);
        }

        50% {
          opacity: 0.95;
          transform: translateY(35%);
        }
      }

      .attendance-enter {
        animation: attendanceEnter 330ms ease-out both;
      }

      .attendance-card-enter {
        opacity: 0;
        animation: attendanceCardEnter 350ms ease-out both;
      }

      .attendance-camera-enter {
        animation: attendanceCameraEnter 420ms ease-out both;
      }

      .attendance-row-enter {
        opacity: 0;
        animation: attendanceRowEnter 310ms ease-out both;
      }

      .attendance-icon-pop {
        animation: attendanceIconPop 280ms ease-out both;
      }

      .attendance-scan-line {
        animation: attendancePulseScan 2.4s ease-in-out infinite;
      }

      .attendance-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease,
          transform 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .attendance-enter,
        .attendance-card-enter,
        .attendance-camera-enter,
        .attendance-row-enter,
        .attendance-icon-pop,
        .attendance-scan-line {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
        }
      }
    `}</style>
  );
}

function CameraStatusIcon({
  cameraReady,
  cameraStarting,
  laptopBlocked,
}: {
  cameraReady: boolean;
  cameraStarting: boolean;
  laptopBlocked: boolean;
}) {
  return (
    <div
      className={cn(
        "attendance-icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-blue-100/50 ring-1",
        laptopBlocked && "bg-orange-50 text-orange-600 ring-orange-100",
        !laptopBlocked &&
          cameraReady &&
          "bg-[#123c8c] text-white ring-[#123c8c]",
        !laptopBlocked &&
          cameraStarting &&
          "bg-amber-50 text-amber-700 ring-amber-100",
        !laptopBlocked &&
          !cameraReady &&
          !cameraStarting &&
          "bg-white text-slate-400 ring-blue-100",
      )}
    >
      {cameraStarting ? (
        <Loader2 size={23} className="animate-spin" />
      ) : laptopBlocked ? (
        <AlertCircle size={24} strokeWidth={2.5} />
      ) : (
        <ScanFace size={24} strokeWidth={2.5} />
      )}
    </div>
  );
}

function StatusPill({
  cameraReady,
  cameraStarting,
  laptopBlocked,
}: {
  cameraReady: boolean;
  cameraStarting: boolean;
  laptopBlocked: boolean;
}) {
  return (
    <span
      className={cn(
        "attendance-row-enter rounded-full px-4 py-2 text-xs font-black",
        laptopBlocked && "bg-orange-50 text-orange-700",
        !laptopBlocked && cameraReady && "bg-emerald-50 text-emerald-700",
        !laptopBlocked && cameraStarting && "bg-amber-50 text-amber-700",
        !laptopBlocked &&
          !cameraReady &&
          !cameraStarting &&
          "bg-slate-100 text-slate-500",
      )}
    >
      {laptopBlocked
        ? "Mobile Only"
        : cameraReady
          ? "Kamera Aktif"
          : cameraStarting
            ? "Starting..."
            : "Kamera Mati"}
    </span>
  );
}

function PhotoFrameOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/18 via-white/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/20 via-slate-950/5 to-transparent" />
    </div>
  );
}
function CameraEmptyState({
  cameraStarting,
  permissionDenied,
  laptopBlocked,
  cameraOffByUser,
  deniedAttempts,
  onRetry,
  onTurnOn,
}: {
  cameraStarting: boolean;
  permissionDenied: boolean;
  laptopBlocked: boolean;
  cameraOffByUser?: boolean;
  deniedAttempts: number;
  onRetry: () => void;
  onTurnOn?: () => void;
}) {
  return (
    <div className="attendance-row-enter absolute inset-0 flex items-center justify-center px-6 text-center text-white">
      <div>
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl md:h-20 md:w-20">
          {cameraStarting ? (
            <Loader2 size={32} className="animate-spin" />
          ) : laptopBlocked ? (
            <AlertCircle size={32} />
          ) : cameraOffByUser ? (
            <CameraOff size={32} />
          ) : (
            <Camera size={32} />
          )}
        </div>

        <p className="mt-3 text-sm font-black text-white">
          {laptopBlocked
            ? "Presensi khusus HP"
            : cameraOffByUser
              ? "Kamera Dimatikan"
              : permissionDenied
                ? "Izin Kamera Ditolak"
                : cameraStarting
                  ? "Menyalakan Kamera"
                  : "Pratinjau Kamera"}
        </p>

        <p className="mt-1 text-xs font-semibold leading-4 text-slate-400">
          {laptopBlocked
            ? "Check-in dan check-out hanya dapat dilakukan melalui HP."
            : cameraOffByUser
              ? "Kamera dimatikan secara manual. Tekan tombol untuk menyalakan kembali."
              : permissionDenied
                ? deniedAttempts >= 3
                  ? "Izin kamera masih diblokir. Ikuti panduan di bawah."
                  : "Tekan tombol di bawah untuk mencoba meminta izin kamera lagi."
                : cameraStarting
                  ? "Mohon tunggu sampai kamera memuat gambar."
                  : "Kamera sedang memuat otomatis."}
        </p>

        {cameraOffByUser && onTurnOn ? (
          <button
            type="button"
            onClick={onTurnOn}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#123c8c] shadow-lg transition hover:bg-slate-100 active:scale-95"
          >
            <Camera size={15} />
            Nyalakan Kamera
          </button>
        ) : null}

        {permissionDenied && !laptopBlocked && !cameraOffByUser ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#123c8c] shadow-lg transition hover:bg-slate-100 active:scale-95"
          >
            <RefreshCw size={15} />
            Coba Minta Izin Lagi
          </button>
        ) : null}
      </div>
    </div>
  );
}

function CameraPermissionGuide({ guide }: { guide: BrowserGuide }) {
  return (
    <div className="attendance-row-enter mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <Settings size={19} />
        </div>

        <div>
          <p className="text-sm font-black">
            Panduan izin kamera untuk {guide.name}
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs font-bold leading-5">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  subtitle,
  icon,
  loading,
  disabled,
  primary = false,
  onClick,
}: {
  label: string;
  subtitle: string;
  icon: ReactNode;
  loading: boolean;
  disabled: boolean;
  primary?: boolean;
  onClick: () => void;
}) {
  return (
    <AppButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      variant={primary ? "primary" : "secondary"}
      className={cn(
        "min-h-[3.25rem] py-2 rounded-2xl px-2.5 shadow-lg transition hover:-translate-y-0.5 active:scale-[0.98] sm:min-h-[4rem] md:min-h-[70px] md:rounded-2xl md:px-5",
        disabled
          ? "border border-slate-200 bg-slate-200 text-slate-400 shadow-none hover:translate-y-0"
          : primary
            ? "bg-[#123c8c] text-white shadow-blue-900/25"
            : "border border-blue-200 bg-white text-[#123c8c] shadow-slate-200/70 md:bg-[#f8fbff]",
      )}
    >
      <span className="flex w-full items-center justify-center gap-1.5 sm:gap-2 md:gap-3">
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10 sm:rounded-2xl",
              disabled
                ? "bg-slate-300/70"
                : primary
                  ? "bg-white/15"
                  : "bg-blue-50",
            )}
          >
            {icon}
          </span>
        )}

        <span className="text-left">
          <span
            className={cn(
              "block text-[8px] font-black uppercase tracking-[0.14em] sm:text-[9px] md:text-[11px] md:tracking-[0.22em]",
              disabled
                ? "text-slate-400"
                : primary
                  ? "text-blue-100"
                  : "text-slate-400",
            )}
          >
            {subtitle}
          </span>

          <span className="block text-sm font-black sm:text-base md:text-lg">
            {loading ? "Proses..." : label}
          </span>
        </span>
      </span>
    </AppButton>
  );
}

function LastPhoto({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <div className="attendance-row-enter mt-5 hidden rounded-3xl border border-blue-100 bg-[#f6f8ff] p-4 md:block">
      <div className="mb-3 flex items-center gap-2">
        <ImageUp size={18} className="text-[#123c8c]" />
        <p className="text-sm font-black text-slate-950">Foto Terakhir</p>
      </div>

      <img
        src={url}
        alt="Last presensi capture"
        className="h-36 w-36 rounded-2xl object-cover shadow-md"
      />
    </div>
  );
}

function ProofCard({
  cameraReady,
  workMode,
}: {
  cameraReady: boolean;
  workMode: WorkMode;
}) {
  return (
    <div className="attendance-card-enter overflow-hidden rounded-[2rem] bg-[#123c8c] text-white shadow-2xl shadow-blue-900/20">
      <div className="relative p-6 md:p-8">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-blue-300/10" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck size={29} strokeWidth={2.6} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
              Bukti Presensi
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
              {cameraReady ? "Ready to Capture" : "Camera Standby"}
            </h2>

            <p className="mt-2 text-sm font-bold text-blue-100">
              Mode: {getWorkModeLabel(workMode)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="attendance-row-enter rounded-3xl border border-blue-100 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/60">
      {icon}
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
      <div className="mt-1 text-sm text-slate-500">{children}</div>
    </div>
  );
}

function WorkModeFilter({
  value,
  disabled,
  allowedModes,
  isVisitDataRequired,
  wfhQuotaRemaining,
  onChange,
  onOpenVisit,
}: {
  value: WorkMode;
  disabled: boolean;
  allowedModes?: WorkMode[];
  isVisitDataRequired: boolean;
  wfhQuotaRemaining: number | null;
  onChange: (value: WorkMode) => void;
  onOpenVisit: () => void;
}) {
  const isWfhQuotaEmpty = wfhQuotaRemaining !== null && wfhQuotaRemaining <= 0;
  const isModeAllowed = (mode: WorkMode) =>
    !allowedModes || allowedModes.includes(mode);
  const shouldDisableOfficeOption = !isModeAllowed("office");
  const shouldDisableWfhOption =
    !isModeAllowed("wfh") || (isWfhQuotaEmpty && value !== "wfh");
  const shouldDisableVisitOption = !isModeAllowed("visit");

  return (
    <div className="attendance-row-enter grid grid-cols-[1fr_auto] items-center gap-2 rounded-[1.2rem] border border-blue-100 bg-[#f8fbff] p-2 sm:p-3">
      <AppSelect
        label="Mode Presensi"
        value={value}
        onChange={(event) => onChange(event.target.value as WorkMode)}
        disabled={disabled}
      >
        <option value="office" disabled={shouldDisableOfficeOption}>
          Kantor
        </option>
        <option value="wfh" disabled={shouldDisableWfhOption}>
          {shouldDisableWfhOption ? "WFH - kuota habis" : "WFH"}
        </option>
        <option value="visit" disabled={shouldDisableVisitOption}>
          Kunjungan
        </option>
      </AppSelect>

      {value === "visit" && isVisitDataRequired ? (
        <button
          type="button"
          onClick={onOpenVisit}
          disabled={disabled}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition hover:bg-orange-100 active:scale-95 disabled:opacity-60 sm:h-12 sm:w-12 sm:rounded-2xl"
          aria-label="Isi data kunjungan"
        >
          <BriefcaseBusiness size={19} strokeWidth={2.7} />
        </button>
      ) : null}

      <p className="col-span-2 hidden text-xs font-semibold leading-5 text-slate-500 sm:block">
        {value === "wfh" && wfhQuotaRemaining !== null
          ? `${getWorkModeDescription(value)} Sisa kuota bulan ini ${wfhQuotaRemaining}.`
          : getWorkModeDescription(value)}
      </p>
    </div>
  );
}

function VisitDataModal({
  form,
  loading,
  onChange,
  onClose,
  onSave,
}: {
  form: VisitForm;
  loading: boolean;
  onChange: <K extends keyof VisitForm>(key: K, value: VisitForm[K]) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  const canSave =
    form.visitTitle.trim().length > 0 &&
    form.visitAddress.trim().length > 0 &&
    form.visitNote.trim().length > 0 &&
    !loading;

  return (
    <>
      <style jsx global>{`
        @keyframes visitOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes visitModalIn {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="fixed inset-0 z-[82] flex items-end justify-center bg-slate-950/45 px-4 pb-4 animate-[visitOverlayIn_180ms_ease-out] md:items-center md:pb-0">
        <AppCard className="relative max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto border-white/80 bg-white p-0 shadow-2xl shadow-slate-950/25 animate-[visitModalIn_230ms_ease-out]">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <BriefcaseBusiness size={24} strokeWidth={2.7} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                    Data Kunjungan
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Isi detail kunjungan
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Khusus mode kunjungan, tempat, alamat, dan keperluan wajib
                    diisi sebelum presensi dikirim.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95 disabled:opacity-60"
                aria-label="Tutup popup"
              >
                <X size={19} strokeWidth={2.7} />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <AppInput
                label="Nama Tempat / Tujuan Kunjungan"
                value={form.visitTitle}
                onChange={(event) => onChange("visitTitle", event.target.value)}
                placeholder="Contoh: PT Maju Jaya"
                disabled={loading}
              />

              <AppInput
                label="Nama Client / PIC"
                value={form.visitClientName}
                onChange={(event) =>
                  onChange("visitClientName", event.target.value)
                }
                placeholder="Opsional"
                disabled={loading}
              />

              <AppTextarea
                label="Alamat Kunjungan"
                value={form.visitAddress}
                onChange={(event) =>
                  onChange("visitAddress", event.target.value)
                }
                placeholder="Contoh: Jl. Kaliurang No. 10, Yogyakarta"
                className="min-h-24 rounded-[1.5rem]"
                disabled={loading}
              />

              <AppTextarea
                label="Keperluan Kunjungan"
                value={form.visitNote}
                onChange={(event) => onChange("visitNote", event.target.value)}
                placeholder="Contoh: Meeting project, survey lokasi, atau presentasi."
                className="min-h-24 rounded-[1.5rem]"
                disabled={loading}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <AppButton
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                full
              >
                Batal
              </AppButton>

              <AppButton
                type="button"
                disabled={!canSave}
                onClick={onSave}
                full
              >
                Simpan
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </>
  );
}

function CustomAttendanceAlert({
  alert,
  onClose,
}: {
  alert: CustomAlert;
  onClose: () => void;
}) {
  if (!alert.open) return null;

  const isSuccess = alert.type === "success";
  const isError = alert.type === "error";

  return (
    <>
      <style jsx global>{`
        @keyframes attendanceToastIn {
          from {
            opacity: 0;
            transform: translateX(28px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>

      <div className="fixed right-4 top-4 z-[90] w-[calc(100%-2rem)] max-w-[26rem] animate-[attendanceToastIn_230ms_ease-out] md:right-6 md:top-6">
        <div className="relative overflow-hidden rounded-[1.8rem] border border-white/80 bg-white/85 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-2xl ring-1 ring-white/70">
          <div
            className={cn(
              "absolute inset-x-0 top-0 h-24",
              isSuccess &&
                "bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.20),transparent_48%)]",
              isError &&
                "bg-[radial-gradient(circle_at_top_left,rgba(239,68,68,0.20),transparent_48%)]",
              !isSuccess &&
                !isError &&
                "bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.22),transparent_48%)]",
            )}
          />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-slate-500 shadow-sm ring-1 ring-white/70 transition hover:bg-white hover:text-slate-700 active:scale-95"
            aria-label="Tutup alert"
          >
            <X size={19} strokeWidth={2.7} />
          </button>

          <div className="relative flex gap-4 pr-10">
            <div
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1",
                isSuccess && "bg-emerald-50 text-emerald-600 ring-emerald-100",
                isError && "bg-red-50 text-red-600 ring-red-100",
                !isSuccess &&
                  !isError &&
                  "bg-orange-50 text-orange-600 ring-orange-100",
              )}
            >
              {isSuccess ? (
                <CheckCircle2 size={29} strokeWidth={2.8} />
              ) : (
                <AlertCircle size={29} strokeWidth={2.8} />
              )}
            </div>

            <div className="min-w-0 pt-1">
              <p
                className={cn(
                  "inline-flex rounded-full bg-white/60 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ring-1 ring-white/70",
                  isSuccess && "text-emerald-700",
                  isError && "text-red-700",
                  !isSuccess && !isError && "text-orange-700",
                )}
              >
                {isSuccess ? "Berhasil" : isError ? "Gagal" : "Perhatian"}
              </p>

              <h2 className="mt-2 text-lg font-black tracking-tight text-slate-950">
                {alert.title}
              </h2>

              <p className="mt-1 line-clamp-3 text-sm font-semibold leading-6 text-slate-500">
                {alert.message}
              </p>
            </div>
          </div>

          <AppButton
            type="button"
            full
            onClick={onClose}
            className="relative mt-4 min-h-11 rounded-2xl"
          >
            Mengerti
          </AppButton>
        </div>
      </div>
    </>
  );
}

function EarlyCheckoutConfirmModal({
  confirm,
  loading,
  onCancel,
  onConfirm,
  onReasonChange,
}: {
  confirm: EarlyCheckoutConfirm;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  onReasonChange: (reason: string) => void;
}) {
  if (!confirm.open) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes earlyOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes earlyModalIn {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="fixed inset-0 z-[84] flex items-end justify-center bg-slate-950/45 px-4 pb-4 animate-[earlyOverlayIn_180ms_ease-out] md:items-center md:pb-0">
        <AppCard className="relative w-full max-w-md overflow-hidden border-white/80 bg-white p-0 shadow-2xl shadow-slate-950/25 animate-[earlyModalIn_230ms_ease-out]">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
                  <Clock3 size={24} strokeWidth={2.7} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
                    Checkout Lebih Awal
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Apakah kamu yakin akan checkout pekerjaan lebih awal?
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Jam kerja kamu berakhir pukul {confirm.endLabel}. Kamu masih
                    lebih awal {confirm.earlyLabel} dari jam pulang yang
                    ditentukan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95 disabled:opacity-60"
                aria-label="Tutup popup checkout lebih awal"
              >
                <X size={19} strokeWidth={2.7} />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-amber-100 bg-amber-50/70 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-700">
                Sisa waktu kerja
              </p>

              <p className="mt-1 text-2xl font-black text-amber-900">
                {confirm.earlyLabel}
              </p>

              <p className="mt-1 text-xs font-bold text-amber-700/75">
                Format waktu ditampilkan dalam jam dan menit.
              </p>
            </div>

            <div className="mt-5">
              <AppTextarea
                label="Alasan pulang cepat"
                value={confirm.reason}
                onChange={(event) => onReasonChange(event.target.value)}
                placeholder="Masukkan alasan pulang cepat..."
                className="min-h-24 rounded-[1.5rem]"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-slate-500">
                Alasan ini akan tersimpan sebagai catatan admin.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <AppButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                full
              >
                Batal
              </AppButton>

              <AppButton
                type="button"
                disabled={loading}
                onClick={onConfirm}
                full
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses
                  </>
                ) : (
                  "Ya, Check-out"
                )}
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </>
  );
}

function EarlyCheckinConfirmModal({
  confirm,
  loading,
  onCancel,
  onConfirm,
}: {
  confirm: EarlyCheckinConfirm;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!confirm.open) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes earlyCheckinOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes earlyCheckinModalIn {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="fixed inset-0 z-[84] flex items-end justify-center bg-slate-950/45 px-4 pb-4 animate-[earlyCheckinOverlayIn_180ms_ease-out] md:items-center md:pb-0">
        <AppCard className="relative w-full max-w-md overflow-hidden border-white/80 bg-white p-0 shadow-2xl shadow-slate-950/25 animate-[earlyCheckinModalIn_230ms_ease-out]">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#123c8c] ring-1 ring-blue-100">
                  <Clock3 size={24} strokeWidth={2.7} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                    Check-in Lebih Awal
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Apakah kamu yakin ingin bekerja lebih awal?
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Jam kerja kamu mulai pukul {confirm.startLabel}. Kamu masih
                    lebih awal {confirm.earlyLabel} dari jadwal masuk.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95 disabled:opacity-60"
                aria-label="Tutup popup check-in lebih awal"
              >
                <X size={19} strokeWidth={2.7} />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-blue-100 bg-blue-50/70 p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Lebih awal
              </p>

              <p className="mt-1 text-2xl font-black text-[#123456]">
                {confirm.earlyLabel}
              </p>

              <p className="mt-1 text-xs font-bold text-[#123c8c]/75">
                Waktu kerja tetap akan dihitung dari jam check-in yang dikirim.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <AppButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                full
              >
                Batal
              </AppButton>

              <AppButton
                type="button"
                disabled={loading}
                onClick={onConfirm}
                full
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses
                  </>
                ) : (
                  "Ya, Check-in"
                )}
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </>
  );
}

function LateReasonModal({
  value,
  loading,
  lateLimitLabel,
  toleranceMinutes,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: string;
  loading: boolean;
  lateLimitLabel: string;
  toleranceMinutes: number;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = value.trim().length > 0 && !loading;

  return (
    <>
      <style jsx global>{`
        @keyframes lateOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes lateModalIn {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 px-4 pb-4 animate-[lateOverlayIn_180ms_ease-out] md:items-center md:pb-0">
        <AppCard className="relative w-full max-w-md overflow-hidden border-white/80 bg-white p-0 shadow-2xl shadow-slate-950/25 animate-[lateModalIn_230ms_ease-out]">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <Clock3 size={24} strokeWidth={2.7} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                    Check-in Terlambat
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Isi alasan telat
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Kamu sudah melewati batas toleransi shift. Isi alasan
                    terlebih dahulu sebelum melanjutkan presensi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95 disabled:opacity-60"
                aria-label="Tutup popup"
              >
                <X size={19} strokeWidth={2.7} />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
                    Batas Toleransi
                  </p>

                  <p className="mt-1 text-lg font-black text-orange-800">
                    {lateLimitLabel}
                  </p>

                  <p className="mt-1 text-xs font-bold text-orange-700/70">
                    Toleransi shift: {toleranceMinutes} menit
                  </p>
                </div>

                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                  Wajib alasan
                </div>
              </div>
            </div>

            <div className="mt-5">
              <AppTextarea
                label="Alasan terlambat"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Contoh: Terlambat karena macet di perjalanan."
                className="min-h-32 rounded-[1.5rem]"
              />

              <p className="mt-2 text-xs font-semibold text-slate-400">
                Alasan ini akan tersimpan di laporan presensi admin.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <AppButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                full
              >
                Batal
              </AppButton>

              <AppButton
                type="button"
                disabled={!canSubmit}
                onClick={onSubmit}
                full
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses
                  </>
                ) : (
                  "Konfirmasi & Check-in"
                )}
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </>
  );
}

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(false);
  const lastPhotoUrlRef = useRef<string | null>(null);
  const leaveBlockRef = useRef<LeaveBlock>(null);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendance | null>(null);
  const [leaveBlock, setLeaveBlock] = useState<LeaveBlock>(null);
  const [isTodayAttendanceLoading, setIsTodayAttendanceLoading] =
    useState(false);

  const [isLaptopBlocked, setIsLaptopBlocked] = useState(false);

  const [workMode, setWorkMode] = useState<WorkMode>("office");
  const workModeRef = useRef<WorkMode>("office");
  const [visitForm, setVisitForm] = useState<VisitForm>(emptyVisitForm);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [cameraDeniedAttempts, setCameraDeniedAttempts] = useState(0);
  const [isCameraOffByUser, setIsCameraOffByUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<AttendanceAction | null>(
    null,
  );

  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);
  const [lastLatitude, setLastLatitude] = useState<number | null>(null);
  const [lastLongitude, setLastLongitude] = useState<number | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);

  const [lateReason, setLateReason] = useState("");
  const [isLateReasonOpen, setIsLateReasonOpen] = useState(false);
  const [earlyCheckinConfirm, setEarlyCheckinConfirm] =
    useState<EarlyCheckinConfirm>(emptyEarlyCheckinConfirm);
  const [earlyCheckoutConfirm, setEarlyCheckoutConfirm] =
    useState<EarlyCheckoutConfirm>(emptyEarlyCheckoutConfirm);
  const [customAlert, setCustomAlert] = useState<CustomAlert>(emptyAlert);
  const [, setWorkMinuteTick] = useState(0);

  const [statusTitle, setStatusTitle] = useState("Waiting for Camera");
  const [statusText, setStatusText] = useState(
    "Pilih mode presensi, aktifkan kamera, lalu izinkan lokasi GPS sebelum melakukan presensi.",
  );

  const shiftStartTime = getShiftStartTimeFromUser(currentUser);
  const shiftEndTime = getShiftEndTimeFromUser(currentUser);
  const shiftToleranceMinutes = getShiftToleranceMinutes(currentUser);
  const lateLimitLabel = getLateLimitLabel(currentUser);

  const hasCheckedInToday = hasAttendanceCheckIn(todayAttendance);
  const hasCheckedOutToday = hasAttendanceCheckOut(todayAttendance);
  const lockedWorkMode = getAttendanceWorkMode(todayAttendance);
  const allowedCheckOutModes =
    hasCheckedInToday && !hasCheckedOutToday
      ? getAllowedCheckOutModes(lockedWorkMode)
      : undefined;
  const isVisitDataRequired =
    workMode === "visit" && (!hasCheckedInToday || lockedWorkMode === "office");
  const isLeaveBlocked = Boolean(leaveBlock?.active);
  const displayedWorkMinutes = getDisplayedWorkMinutes(todayAttendance);
  const displayedWorkDuration =
    formatDurationHoursMinutes(displayedWorkMinutes);
  const browserGuide =
    cameraPermissionDenied && cameraDeniedAttempts >= 3
      ? getCameraPermissionGuide()
      : null;

  useEffect(() => {
    mountedRef.current = true;

    const blocked = !isMobileAttendanceDevice();
    setIsLaptopBlocked(blocked);

    void loadCurrentUser();
    void loadTodayAttendance();

    if (blocked) {
      safeSetStatus(
        "Presensi hanya lewat HP",
        "Check-in dan check-out tidak dapat dilakukan melalui laptop atau desktop.",
      );

      showLaptopBlockedAlert();

      return () => {
        mountedRef.current = false;
        releaseCamera(false, false);

        if (lastPhotoUrlRef.current) {
          URL.revokeObjectURL(lastPhotoUrlRef.current);
          lastPhotoUrlRef.current = null;
        }
      };
    }

    const timer = window.setTimeout(startCamera, 700);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      releaseCamera(false, false);

      if (lastPhotoUrlRef.current) {
        URL.revokeObjectURL(lastPhotoUrlRef.current);
        lastPhotoUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hasCheckedInToday || hasCheckedOutToday) return;

    const timer = window.setInterval(() => {
      setWorkMinuteTick((current) => current + 1);
    }, 60_000);

    return () => window.clearInterval(timer);
  }, [hasCheckedInToday, hasCheckedOutToday]);

  function safeSetStatus(title: string, text: string) {
    if (!mountedRef.current) return;
    setStatusTitle(title);
    setStatusText(text);
  }

  function showCustomAlert(title: string, message: string, type: AlertType) {
    setCustomAlert({
      open: true,
      title,
      message,
      type,
    });
  }

  function closeCustomAlert() {
    setCustomAlert(emptyAlert);
  }

  function showLaptopBlockedAlert() {
    showCustomAlert(
      "Presensi hanya lewat HP",
      "Untuk menjaga validasi kamera dan lokasi, check-in/check-out tidak dapat dilakukan melalui laptop atau desktop. Silakan buka Presensi melalui browser HP.",
      "warning",
    );
  }

  function showLeaveBlockedAlert() {
    const currentLeaveBlock = leaveBlockRef.current || leaveBlock;
    const message =
      currentLeaveBlock?.message ||
      "Kamu sedang dalam periode cuti/sakit/izin. Check-in dan check-out tidak dapat dilakukan.";

    showCustomAlert("Presensi tidak tersedia", message, "warning");
    safeSetStatus("Presensi Dinonaktifkan", message);
  }

  function setSelectedWorkMode(mode: WorkMode) {
    workModeRef.current = mode;
    setWorkMode(mode);
  }

  function updateVisitForm<K extends keyof VisitForm>(
    key: K,
    value: VisitForm[K],
  ) {
    setVisitForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleWorkModeChange(value: WorkMode) {
    if (hasCheckedInToday) {
      const mode = lockedWorkMode;
      const modeLabel = getWorkModeLabel(mode);
      const allowedModes = getAllowedCheckOutModes(mode);

      if (hasCheckedOutToday) {
        setSelectedWorkMode(mode);
        setIsVisitModalOpen(false);
        setVisitForm(emptyVisitForm);

        showCustomAlert(
          "Presensi hari ini sudah selesai",
          `Kamu sudah check-in dan check-out hari ini dengan mode ${modeLabel}. Mode presensi tidak bisa diubah lagi.`,
          "warning",
        );

        safeSetStatus(
          "Presensi Selesai",
          `Presensi hari ini sudah selesai dengan mode ${modeLabel}.`,
        );

        return;
      }

      if (!allowedModes.includes(value)) {
        setSelectedWorkMode(mode);
        setIsVisitModalOpen(false);
        setVisitForm(emptyVisitForm);

        showCustomAlert(
          "Mode check-out terkunci",
          mode === "wfh"
            ? "Kamu check-in WFH, jadi check-out wajib WFH."
            : `Kamu check-in ${modeLabel}, jadi check-out hanya bisa ${allowedModes
                .map(getWorkModeLabel)
                .join(" atau ")}.`,
          "warning",
        );

        safeSetStatus(
          "Mode Check-out Terkunci",
          `Check-in sudah tercatat dengan mode ${modeLabel}.`,
        );

        return;
      }

      setSelectedWorkMode(value);

      if (value === "visit" && mode === "office") {
        setIsVisitModalOpen(true);
        setLateReason("");

        showCustomAlert(
          "Mode kunjungan untuk check-out",
          mode === "office"
            ? "Kamu sudah check-in dari kantor. Jika ada kunjungan di tengah pekerjaan, isi data kunjungan lalu tekan Check-out. Kamu tetap tidak bisa check-in ulang."
            : `Kamu sudah check-in dengan mode ${modeLabel}. Jika ada kunjungan tambahan, isi data kunjungan lalu tekan Check-out.`,
          "warning",
        );

        safeSetStatus(
          "Kunjungan untuk Check-out",
          "Data kunjungan akan dikirim saat check-out sebagai catatan aktivitas, bukan sebagai check-in ulang.",
        );

        return;
      }

      setIsVisitModalOpen(false);
      if (value !== "visit") {
        setVisitForm(emptyVisitForm);
      }

      safeSetStatus(
        `Mode Check-out ${getWorkModeLabel(value)}`,
        `Check-in sudah tercatat dengan mode ${modeLabel}. Tombol Masuk tetap terkunci, mode layar sekarang dipakai untuk Check-out.`,
      );

      return;
    }

    const remainingWfhQuota = getWfhQuotaRemaining(currentUser);

    if (
      value === "wfh" &&
      remainingWfhQuota !== null &&
      remainingWfhQuota <= 0
    ) {
      setSelectedWorkMode("office");
      setIsVisitModalOpen(false);
      setVisitForm(emptyVisitForm);

      showCustomAlert(
        "Kuota WFH habis",
        "Kuota WFH bulan ini sudah habis. Pilih mode Kantor atau hubungi admin.",
        "warning",
      );

      safeSetStatus("WFH Tidak Tersedia", "Kuota WFH bulan ini sudah habis.");

      return;
    }

    setSelectedWorkMode(value);

    if (value === "visit") {
      setLateReason("");
      setIsVisitModalOpen(true);
    } else {
      setIsVisitModalOpen(false);
      setVisitForm(emptyVisitForm);
    }

    safeSetStatus(
      `Mode ${getWorkModeLabel(value)}`,
      getWorkModeDescription(value),
    );
  }

  function validateVisitForm(mode = workModeRef.current) {
    if (mode !== "visit") return true;
    if (
      hasCheckedInToday &&
      !hasCheckedOutToday &&
      lockedWorkMode === "visit"
    ) {
      return true;
    }

    if (
      !visitForm.visitTitle.trim() ||
      !visitForm.visitAddress.trim() ||
      !visitForm.visitNote.trim()
    ) {
      setIsVisitModalOpen(true);

      showCustomAlert(
        "Data kunjungan belum lengkap",
        "Isi nama/tempat kunjungan, alamat kunjungan, dan keperluan kunjungan terlebih dahulu sebelum melanjutkan presensi.",
        "warning",
      );

      return false;
    }

    return true;
  }

  async function loadCurrentUser() {
    try {
      setIsUserLoading(true);

      const response = await fetch("/api/auth/me", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readOptionalJson(response);

      if (!response.ok) {
        const message = getResponseMessage(
          data,
          "Gagal mengambil data shift karyawan.",
        );

        if (response.status === 401 || response.status === 403) {
          await fetch("/api/auth/logout", {
            method: "POST",
            cache: "no-store",
          }).catch(() => null);

          window.localStorage.removeItem("presensi_read_announcement_id");
          window.sessionStorage.clear();

          const reason = response.status === 403 ? "inactive" : "expired";
          window.location.replace(`/login?reason=${reason}&redirect=/presensi`);
          return null;
        }

        throw new Error(message);
      }

      let user = normalizeCurrentUser(data as AuthMeResponse | CurrentUser);

      if (!user) {
        throw new Error("Data user tidak valid.");
      }

      if (mountedRef.current) {
        setCurrentUser(user);
      }

      return user;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal mengambil data shift karyawan.";

      safeSetStatus("Data Shift Belum Siap", message);

      return null;
    } finally {
      if (mountedRef.current) {
        setIsUserLoading(false);
      }
    }
  }

  async function loadTodayAttendance() {
    try {
      setIsTodayAttendanceLoading(true);

      const response = await fetch("/api/attendance/today", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as TodayAttendanceResponse;

      if (!response.ok) {
        setTodayAttendance(null);
        setLeaveBlock(null);
        leaveBlockRef.current = null;
        return null;
      }

      const attendance = normalizeTodayAttendance(data);
      const currentLeaveBlock = data.leaveBlock || null;
      leaveBlockRef.current = currentLeaveBlock;

      if (mountedRef.current) {
        setTodayAttendance(attendance);
        setLeaveBlock(currentLeaveBlock);

        if (currentLeaveBlock?.active) {
          safeSetStatus(
            "Presensi Dinonaktifkan",
            currentLeaveBlock.message ||
              "Kamu sedang dalam periode cuti/sakit/izin.",
          );
          return attendance;
        }

        if (hasAttendanceCheckIn(attendance)) {
          const mode = getAttendanceWorkMode(attendance);
          const currentMode = workModeRef.current;
          const allowedModes = hasAttendanceCheckOut(attendance)
            ? [mode]
            : getAllowedCheckOutModes(mode);
          const nextMode = allowedModes.includes(currentMode)
            ? currentMode
            : mode;

          setSelectedWorkMode(nextMode);

          safeSetStatus(
            hasAttendanceCheckOut(attendance)
              ? "Presensi Selesai"
              : `Mode Check-out ${getWorkModeLabel(nextMode)}`,
            hasAttendanceCheckOut(attendance)
              ? `Presensi hari ini sudah selesai dengan mode ${getWorkModeLabel(
                  mode,
                )}.`
              : `Check-in sudah tercatat dengan mode ${getWorkModeLabel(
                  mode,
                )}. Mode layar sekarang dipakai untuk Check-out.`,
          );
        }
      }

      return attendance;
    } catch {
      setTodayAttendance(null);
      setLeaveBlock(null);
      leaveBlockRef.current = null;
      return null;
    } finally {
      if (mountedRef.current) {
        setIsTodayAttendanceLoading(false);
      }
    }
  }

  function releaseCamera(updateStatus = true, updateState = true) {
    startingRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (updateState && mountedRef.current) {
      setCameraReady(false);
      setCameraStarting(false);
    }

    if (updateStatus) {
      safeSetStatus(
        "Kamera Mati",
        "Kamera sudah dimatikan. Klik Aktifkan Kamera sebelum melakukan presensi.",
      );
    }
  }

  function waitForVideoElement(): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      function checkVideo() {
        if (!mountedRef.current) {
          reject(createAbortError("Halaman kamera sudah ditutup."));
          return;
        }

        if (videoRef.current) {
          resolve(videoRef.current);
          return;
        }

        if (Date.now() - startTime > 4000) {
          reject(
            new Error(
              "Element video belum siap. Buka ulang halaman lalu coba lagi.",
            ),
          );
          return;
        }

        window.requestAnimationFrame(checkVideo);
      }

      checkVideo();
    });
  }

  function waitForCameraFrame(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const ready = () =>
        video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;

      if (ready()) {
        resolve();
        return;
      }

      let intervalId: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", checkReady);
        video.removeEventListener("canplay", checkReady);
        video.removeEventListener("playing", checkReady);

        if (intervalId) clearInterval(intervalId);

        clearTimeout(timeoutId);
      };

      const checkReady = () => {
        if (!mountedRef.current) {
          cleanup();
          reject(createAbortError("Halaman kamera sudah ditutup."));
          return;
        }

        if (ready()) {
          cleanup();
          resolve();
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            "Kamera belum memuat gambar. Tunggu sebentar lalu coba lagi.",
          ),
        );
      }, 7000);

      video.addEventListener("loadedmetadata", checkReady);
      video.addEventListener("canplay", checkReady);
      video.addEventListener("playing", checkReady);
      intervalId = setInterval(checkReady, 150);
    });
  }

  async function startCamera() {
    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    if (startingRef.current) return;

    try {
      startingRef.current = true;
      setCameraReady(false);
      setCameraStarting(true);
      safeSetStatus("Menyalakan Kamera", "Mengaktifkan kamera...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung kamera.");
      }

      const video = await waitForVideoElement();

      if (streamRef.current) {
        releaseCamera(false, true);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const stream = await navigator.mediaDevices.getUserMedia(cameraOptions);

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();
      await waitForCameraFrame(video);

      setCameraReady(true);
      setCameraStarting(false);
      setCameraPermissionDenied(false);
      setCameraDeniedAttempts(0);

      safeSetStatus(
        "Camera Ready",
        "Kamera sudah aktif. Kamu bisa melakukan check-in atau check-out.",
      );
    } catch (error) {
      if (isCameraAbortError(error)) {
        setCameraStarting(false);
        startingRef.current = false;
        return;
      }

      releaseCamera(false, true);

      if (isPermissionDeniedError(error)) {
        setCameraPermissionDenied(true);
        setCameraDeniedAttempts((current) => current + 1);
        safeSetStatus(
          "Akses Kamera Ditolak",
          "Akses kamera ditolak. Tekan Aktifkan Kamera untuk mencoba lagi.",
        );

        showCustomAlert(
          "Akses Kamera Ditolak",
          "Kamera belum bisa digunakan karena izin kamera ditolak. Coba aktifkan lagi, nanti panduan browser muncul setelah 3 kali gagal.",
          "warning",
        );

        return;
      }

      setCameraPermissionDenied(false);

      safeSetStatus(
        "Camera Permission Needed",
        error instanceof Error
          ? error.message
          : "Aktifkan izin kamera di browser terlebih dahulu.",
      );

      console.warn(
        "CAMERA_WARNING",
        error instanceof Error ? error.message : error,
      );
    } finally {
      startingRef.current = false;
    }
  }

  async function retryCameraPermission() {
    setIsCameraOffByUser(false);
    await startCamera();
  }

  async function handleToggleCamera() {
    if (isCameraOffByUser) {
      setIsCameraOffByUser(false);
      await startCamera();
    } else {
      setIsCameraOffByUser(true);
      releaseCamera(true, false);
      setCameraReady(false);
      safeSetStatus(
        "Kamera Dimatikan",
        "Kamera dimatikan secara manual. Tekan tombol kamera untuk menyalakan kembali.",
      );
    }
  }

  async function handleRefreshCamera() {
    setIsCameraOffByUser(false);
    releaseCamera(true, false);
    setCameraReady(false);
    await startCamera();
  }

  function getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Browser tidak mendukung GPS."));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }

  async function capturePhoto(): Promise<File> {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) {
      throw new Error("Kamera belum siap.");
    }

    await waitForCameraFrame(video);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas tidak tersedia.");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengambil foto."));
            return;
          }

          if (lastPhotoUrlRef.current) {
            URL.revokeObjectURL(lastPhotoUrlRef.current);
          }

          const previewUrl = URL.createObjectURL(blob);

          lastPhotoUrlRef.current = previewUrl;
          setLastPhotoUrl(previewUrl);

          resolve(
            new File([blob], `attendance-${Date.now()}.jpg`, {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        0.9,
      );
    });
  }

  async function requestCheckIn() {
    const selectedWorkMode = workModeRef.current;

    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    const latestAttendance = await loadTodayAttendance();

    if (leaveBlockRef.current?.active) {
      showLeaveBlockedAlert();
      return;
    }

    if (hasAttendanceCheckIn(latestAttendance)) {
      const mode = getAttendanceWorkMode(latestAttendance);

      showCustomAlert(
        "Sudah check-in",
        mode === "office"
          ? "Kamu sudah check-in hari ini melalui Kantor. Kamu tidak bisa check-in ulang sebagai Kunjungan. Jika ada kunjungan di tengah pekerjaan, pilih mode Kunjungan lalu tekan Check-out."
          : `Kamu sudah check-in hari ini dengan mode ${getWorkModeLabel(
              mode,
            )}. Kamu tidak bisa check-in ulang.`,
        "warning",
      );

      safeSetStatus(
        "Check-in Ditolak",
        `Kamu sudah check-in hari ini dengan mode ${getWorkModeLabel(
          mode,
        )}. Silakan lakukan check-out jika sudah selesai bekerja.`,
      );

      return;
    }

    if (!validateVisitForm(selectedWorkMode)) return;

    const remainingWfhQuota = getWfhQuotaRemaining(currentUser);

    if (
      selectedWorkMode === "wfh" &&
      remainingWfhQuota !== null &&
      remainingWfhQuota <= 0
    ) {
      showCustomAlert(
        "Kuota WFH habis",
        "Kuota WFH bulan ini sudah habis. Pilih mode Kantor atau hubungi admin.",
        "warning",
      );
      safeSetStatus("Check-in WFH Ditolak", "Kuota WFH bulan ini sudah habis.");
      return;
    }

    if (selectedWorkMode === "visit") {
      setLateReason("");
      setIsLateReasonOpen(false);

      safeSetStatus(
        "Kunjungan Bebas Toleransi",
        "Mode kunjungan tidak terikat jam masuk, shift, atau batas keterlambatan. Presensi akan dikirim sebagai kunjungan.",
      );

      await handleAttendance("check-in", "");
      return;
    }

    const user = currentUser || (await loadCurrentUser());

    if (!user) {
      showCustomAlert(
        "Data shift belum terbaca",
        "Buka ulang halaman lalu coba lagi.",
        "warning",
      );
      return;
    }

    const earlyMinutes = getEarlyCheckinMinutes(user);

    if (earlyMinutes > 0) {
      const startLabel = getShiftStartTimeFromUser(user);
      const earlyLabel = formatDurationHoursMinutes(earlyMinutes);

      setEarlyCheckinConfirm({
        open: true,
        earlyMinutes,
        earlyLabel,
        startLabel,
      });

      safeSetStatus(
        "Check-in Lebih Awal",
        `Kamu masih lebih awal ${earlyLabel} dari jam masuk ${startLabel}. Konfirmasi jika tetap ingin check-in.`,
      );

      return;
    }

    const shouldAskLateReason = isLateCheckInNow(user);

    if (shouldAskLateReason && !lateReason.trim()) {
      setIsLateReasonOpen(true);
      return;
    }

    await handleAttendance(
      "check-in",
      shouldAskLateReason ? lateReason.trim() : "",
    );
  }

  async function confirmEarlyCheckin() {
    setEarlyCheckinConfirm(emptyEarlyCheckinConfirm);
    setLateReason("");
    setIsLateReasonOpen(false);
    await handleAttendance("check-in", "");
  }

  async function requestCheckOut() {
    let selectedWorkMode = workModeRef.current;

    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    if (leaveBlockRef.current?.active) {
      showLeaveBlockedAlert();
      return;
    }

    const latestAttendance = await loadTodayAttendance();
    selectedWorkMode = workModeRef.current;
    const latestCheckedInMode = getAttendanceWorkMode(latestAttendance);
    const latestAllowedModes = hasAttendanceCheckIn(latestAttendance)
      ? getAllowedCheckOutModes(latestCheckedInMode)
      : [];

    if (!latestAllowedModes.includes(selectedWorkMode)) {
      const fallbackMode = latestCheckedInMode;

      setSelectedWorkMode(fallbackMode);
      showCustomAlert(
        "Mode check-out terkunci",
        fallbackMode === "wfh"
          ? "Kamu check-in WFH, jadi check-out wajib WFH."
          : `Mode check-out yang dipilih tidak sesuai dengan check-in ${getWorkModeLabel(
              fallbackMode,
            )}.`,
        "warning",
      );
      return;
    }

    if (selectedWorkMode === "visit" && !validateVisitForm(selectedWorkMode)) {
      return;
    }

    const user = currentUser || (await loadCurrentUser());

    if (!user) {
      showCustomAlert(
        "Data shift belum terbaca",
        "Buka ulang halaman lalu coba lagi.",
        "warning",
      );
      return;
    }

    const earlyMinutes = getEarlyCheckoutMinutes(user);

    if (earlyMinutes > 0) {
      const endLabel = getShiftEndTimeFromUser(user);
      const earlyLabel = formatDurationHoursMinutes(earlyMinutes);

      setEarlyCheckoutConfirm({
        open: true,
        earlyMinutes,
        earlyLabel,
        endLabel,
        reason: "",
      });

      safeSetStatus(
        "Checkout Lebih Awal",
        `Kamu masih lebih awal ${earlyLabel} dari jam pulang ${endLabel}. Silakan isi alasan pulang cepat untuk melanjutkan check-out.`,
      );

      return;
    }

    await handleAttendance("check-out");
  }

  async function confirmEarlyCheckout() {
    const reason = earlyCheckoutConfirm.reason?.trim() ?? "";
    setEarlyCheckoutConfirm(emptyEarlyCheckoutConfirm);
    await handleAttendance("check-out", reason);
  }

  async function handleSaveLateReason() {
    const trimmedReason = lateReason.trim();
    if (!trimmedReason) {
      showCustomAlert(
        "Alasan belum diisi",
        "Isi alasan keterlambatan terlebih dahulu.",
        "warning",
      );
      return;
    }

    setIsLateReasonOpen(false);
    await handleAttendance("check-in", trimmedReason);
  }

  async function handleAttendance(action: AttendanceAction, reason = "") {
    const checkedInMode = getAttendanceWorkMode(todayAttendance);
    const selectedModeFromUi = workModeRef.current;
    const selectedWorkMode =
      action === "check-out" &&
      hasAttendanceCheckIn(todayAttendance) &&
      !hasAttendanceCheckOut(todayAttendance) &&
      !getAllowedCheckOutModes(checkedInMode).includes(selectedModeFromUi)
        ? checkedInMode
        : selectedModeFromUi;

    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    if (leaveBlockRef.current?.active) {
      showLeaveBlockedAlert();
      return;
    }

    if (selectedWorkMode === "visit" && !validateVisitForm(selectedWorkMode)) {
      return;
    }

    const remainingWfhQuota = getWfhQuotaRemaining(currentUser);

    if (
      action === "check-in" &&
      selectedWorkMode === "wfh" &&
      remainingWfhQuota !== null &&
      remainingWfhQuota <= 0
    ) {
      showCustomAlert(
        "Kuota WFH habis",
        "Kuota WFH bulan ini sudah habis. Pilih mode Kantor atau hubungi admin.",
        "warning",
      );
      safeSetStatus("Check-in WFH Ditolak", "Kuota WFH bulan ini sudah habis.");
      return;
    }

    try {
      setLoading(true);
      setActiveAction(action);
      safeSetStatus(
        "Processing",
        "Menyiapkan kamera, mengambil foto, dan lokasi GPS...",
      );

      if (!streamRef.current || !cameraReady) await startCamera();

      const video = await waitForVideoElement();

      if (!streamRef.current) throw new Error("Kamera belum siap.");

      await waitForCameraFrame(video);

      const photo = await capturePhoto();
      const position = await getCurrentLocation();
      const { latitude, longitude, accuracy } = position.coords;

      setLastLatitude(latitude);
      setLastLongitude(longitude);
      setLastAccuracy(accuracy);

      const formData = new FormData();
      const prefix = action === "check-in" ? "checkIn" : "checkOut";

      formData.append("photo", photo);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("accuracy", String(accuracy));
      formData.append(`${prefix}Latitude`, String(latitude));
      formData.append(`${prefix}Longitude`, String(longitude));
      formData.append(`${prefix}Accuracy`, String(accuracy));

      formData.append("workMode", selectedWorkMode);
      formData.append("work_mode", selectedWorkMode);
      formData.append("activityNote", getWorkModeLabel(selectedWorkMode));
      formData.append("attendanceAction", action);

      if (selectedWorkMode === "visit") {
        formData.append("skipLateValidation", "true");
        formData.append("ignoreLateValidation", "true");
        formData.append("isVisitAttendance", "true");
        formData.append("lateReason", "");
        formData.append("late_reason", "");
      }

      if (action === "check-out") {
        formData.append("checkOutWorkMode", selectedWorkMode);
        formData.append("check_out_work_mode", selectedWorkMode);
        formData.append(
          "checkOutActivityNote",
          getWorkModeLabel(selectedWorkMode),
        );
        formData.append(
          "check_out_activity_note",
          getWorkModeLabel(selectedWorkMode),
        );
      }

      if (action === "check-in" && reason.trim()) {
        formData.append("lateReason", reason.trim());
        formData.append("late_reason", reason.trim());
      }

      if (action === "check-out" && reason.trim()) {
        formData.append("earlyLeaveReason", reason.trim());
        formData.append("early_leave_reason", reason.trim());
      }

      if (selectedWorkMode === "visit") {
        const visitTitle = visitForm.visitTitle.trim();
        const visitClientName = visitForm.visitClientName.trim();
        const visitAddress = visitForm.visitAddress.trim();
        const visitNote = visitForm.visitNote.trim();

        formData.append("visitTitle", visitTitle);
        formData.append("visitPlaceName", visitTitle);
        formData.append("visitClientName", visitClientName);
        formData.append("visitAddress", visitAddress);
        formData.append("visitNote", visitNote);
        formData.append("visitPurpose", visitNote);

        formData.append(`${prefix}VisitTitle`, visitTitle);
        formData.append(`${prefix}VisitPlaceName`, visitTitle);
        formData.append(`${prefix}VisitClientName`, visitClientName);
        formData.append(`${prefix}VisitAddress`, visitAddress);
        formData.append(`${prefix}VisitNote`, visitNote);
        formData.append(`${prefix}VisitPurpose`, visitNote);
      }

      const response = await fetch(`/api/attendance/${action}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.message || data.error || "Presensi gagal.";

        if (data.requiresLateReason && selectedWorkMode !== "visit") {
          setIsLateReasonOpen(true);
          safeSetStatus("Check-in Terlambat", message);
          return;
        }

        showCustomAlert(
          action === "check-out" ? "Check-out belum bisa" : "Presensi gagal",
          message,
          "warning",
        );

        safeSetStatus("Presensi Gagal", message);
        return;
      }

      const officeName = data.office?.name;
      const distance = data.office?.distance;
      const radius = data.office?.radius;
      const modeLabel =
        data.workModeLabel || getWorkModeLabel(selectedWorkMode);

      safeSetStatus(
        "Presensi Berhasil",
        officeName
          ? `${data.message} Mode ${modeLabel}. Lokasi valid di ${officeName}. Jarak ${distance} meter dari kantor, radius ${radius} meter. Akurasi GPS ±${Math.round(
              accuracy,
            )} meter.`
          : `${data.message || "Presensi berhasil."} Mode ${modeLabel}. GPS tersimpan dengan akurasi ±${Math.round(
              accuracy,
            )} meter.`,
      );

      setLateReason("");
      setIsLateReasonOpen(false);

      if (selectedWorkMode === "visit") {
        setVisitForm(emptyVisitForm);
      }

      await loadTodayAttendance();

      showCustomAlert(
        action === "check-in" ? "Check-in berhasil" : "Check-out berhasil",
        action === "check-in"
          ? `${data.message || "Presensi berhasil."} Mode: ${modeLabel}.`
          : data.message || "Presensi berhasil.",
        "success",
      );
    } catch (error) {
      const message = isPermissionDeniedError(error)
        ? "Izin kamera atau lokasi ditolak. Aktifkan izin kamera dan GPS di browser terlebih dahulu."
        : error instanceof Error
          ? error.message
          : "Gagal melakukan presensi. Pastikan kamera dan lokasi GPS diizinkan.";

      safeSetStatus("Presensi Gagal", message);
      showCustomAlert("Presensi gagal", message, "warning");

      if (!isPermissionDeniedError(error)) {
        console.warn(
          "ATTENDANCE_WARNING",
          error instanceof Error ? error.message : error,
        );
      }
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  const checkInProcessing = loading && activeAction === "check-in";
  const checkOutProcessing = loading && activeAction === "check-out";

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <AttendanceMotionStyles />

      <div className="hidden md:block">
        <AppHeader
          title="Presensi Wajah"
          rightLabel={
            isLaptopBlocked
              ? "MOBILE ONLY"
              : cameraReady
                ? getWorkModeLabel(workMode)
                : undefined
          }
          variant="employee"
        />
      </div>

      <main className="relative min-h-dvh overflow-x-hidden bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] text-slate-950 md:min-h-dvh md:pb-28">
        <section className="attendance-enter mx-auto w-full max-w-7xl px-5 pt-4 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                Presensi
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#073456]">
                Presensi Wajah
              </h1>

              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-slate-500">
                <span>Mode: {getWorkModeLabel(workMode)}</span>
                {currentUser?.shift?.start_time && (
                  <>
                    <span>•</span>
                    <span className="text-[#123c8c]">
                      Jam: {currentUser.shift.start_time}-{currentUser.shift.end_time || "17:00"}
                    </span>
                    <span>•</span>
                    <span className="text-[#123c8c]">
                      Tol: {currentUser.shift.tolerance_minutes ?? 5}m
                    </span>
                  </>
                )}
              </div>
            </div>

            <CameraStatusIcon
              cameraReady={cameraReady}
              cameraStarting={cameraStarting}
              laptopBlocked={isLaptopBlocked}
            />
          </div>
        </section>

        <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-3 px-3.5 pt-2 pb-16 md:px-6 md:py-4 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <AppCard
            padding="sm"
            className="attendance-card-enter flex flex-col rounded-2xl border-white/80 bg-white/95 p-3 shadow-md shadow-slate-300/20 backdrop-blur-xl md:p-5"
          >
            <div className="attendance-row-enter mb-4 hidden items-start justify-between gap-4 md:flex">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Camera
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Ambil Presensi
                </h2>


              </div>

              <StatusPill
                cameraReady={cameraReady}
                cameraStarting={cameraStarting}
                laptopBlocked={isLaptopBlocked}
              />
            </div>

            <WorkModeFilter
              value={workMode}
              disabled={
                loading ||
                isTodayAttendanceLoading ||
                hasCheckedOutToday ||
                (hasCheckedInToday &&
                  !hasCheckedOutToday &&
                  lockedWorkMode === "wfh")
              }
              allowedModes={allowedCheckOutModes}
              isVisitDataRequired={isVisitDataRequired}
              wfhQuotaRemaining={getWfhQuotaRemaining(currentUser)}
              onChange={handleWorkModeChange}
              onOpenVisit={() => {
                if (hasCheckedOutToday) {
                  showCustomAlert(
                    "Presensi hari ini sudah selesai",
                    "Kamu sudah check-in dan check-out hari ini. Data kunjungan tidak bisa diubah lagi.",
                    "warning",
                  );

                  return;
                }

                if (hasCheckedInToday) {
                  if (lockedWorkMode !== "office") {
                    showCustomAlert(
                      "Data kunjungan tidak perlu diisi ulang",
                      lockedWorkMode === "visit"
                        ? "Kamu sudah mengisi data kunjungan saat check-in. Tekan Check-out untuk menyelesaikan kunjungan."
                        : "Kamu check-in WFH, jadi check-out wajib WFH.",
                      "warning",
                    );

                    return;
                  }

                  setSelectedWorkMode("visit");
                  setIsVisitModalOpen(true);

                  showCustomAlert(
                    "Data kunjungan untuk check-out",
                    lockedWorkMode === "office"
                      ? "Kamu sudah check-in dari kantor. Isi data kunjungan jika ada aktivitas kunjungan di tengah pekerjaan, lalu tekan Check-out."
                      : `Kamu sudah check-in dengan mode ${getWorkModeLabel(
                          lockedWorkMode,
                        )}. Data kunjungan akan dikirim saat Check-out.`,
                    "warning",
                  );

                  safeSetStatus(
                    "Kunjungan untuk Check-out",
                    "Isi data kunjungan, lalu tekan tombol Check-out. Sistem tidak akan membuat check-in ulang.",
                  );

                  return;
                }

                setIsVisitModalOpen(true);
              }}
            />

            {hasCheckedInToday ? (
              <div className="attendance-row-enter mt-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-700">
                {hasCheckedOutToday
                  ? `Presensi hari ini sudah selesai dengan mode ${getWorkModeLabel(
                      lockedWorkMode,
                    )}. Mode attendance tidak bisa diubah lagi.`
                  : lockedWorkMode === "wfh"
                    ? "Check-in sudah masuk dengan mode WFH. Check-out dikunci WFH supaya kuota tidak berubah karena pilihan mode lain."
                    : lockedWorkMode === "office"
                      ? "Check-in sudah masuk dengan mode Kantor. Check-out bisa Kantor atau Kunjungan."
                      : "Check-in sudah masuk dengan mode Kunjungan. Check-out bisa Kunjungan atau Kantor, tanpa isi ulang data kunjungan."}
              </div>
            ) : null}

            <div className="attendance-camera-enter mt-1.5 overflow-hidden rounded-2xl bg-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.12)]">
              <div className="relative overflow-hidden bg-slate-950 shadow-inner">
                <div className="relative h-[32dvh] min-h-[190px] max-h-[290px] sm:h-[35dvh] sm:min-h-[220px] sm:max-h-[340px] md:h-auto md:aspect-[16/10] md:min-h-0 md:max-h-none lg:aspect-[16/10]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={() => {
                      const video = videoRef.current;

                      if (
                        video &&
                        video.readyState >= 2 &&
                        video.videoWidth > 0 &&
                        video.videoHeight > 0
                      ) {
                        setCameraReady(true);
                        setCameraStarting(false);
                      }
                    }}
                    onCanPlay={() => {
                      const video = videoRef.current;

                      if (
                        video &&
                        video.readyState >= 2 &&
                        video.videoWidth > 0 &&
                        video.videoHeight > 0
                      ) {
                        setCameraReady(true);
                        setCameraStarting(false);
                      }
                    }}
                    className={cn(
                      "h-full w-full object-cover transition scale-x-[-1]",
                      cameraReady ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <PhotoFrameOverlay />

                  {cameraReady ? (
                    <div className="attendance-scan-line pointer-events-none absolute left-5 right-5 top-1/2 z-30 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />
                  ) : null}

                  <div className="attendance-row-enter absolute left-4 top-4 z-30 rounded-full bg-slate-950/55 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur-md md:left-5 md:top-5 md:text-xs">
                    {isLaptopBlocked
                      ? "Mobile Only"
                      : isCameraOffByUser
                        ? "Kamera Off"
                        : cameraReady
                          ? "Kamera Aktif"
                          : cameraStarting
                            ? "Starting..."
                            : "Kamera Mati"}
                  </div>

                  <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5 md:right-4 md:top-4">
                    <button
                      type="button"
                      onClick={handleRefreshCamera}
                      disabled={cameraStarting || loading}
                      title="Muat Ulang Kamera"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md transition hover:bg-slate-900 active:scale-95 disabled:opacity-50"
                      aria-label="Muat Ulang Kamera"
                    >
                      <RefreshCw
                        size={14}
                        className={
                          cameraStarting
                            ? "animate-spin text-white"
                            : "text-white"
                        }
                      />
                    </button>

                    <button
                      type="button"
                      onClick={handleToggleCamera}
                      disabled={cameraStarting || loading}
                      title={
                        isCameraOffByUser ? "Nyalakan Kamera" : "Matikan Kamera"
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md transition hover:bg-slate-900 active:scale-95 disabled:opacity-50"
                      aria-label={
                        isCameraOffByUser ? "Nyalakan Kamera" : "Matikan Kamera"
                      }
                    >
                      {isCameraOffByUser ? (
                        <Camera size={14} className="text-[#ff8a00]" />
                      ) : (
                        <CameraOff size={14} className="text-white" />
                      )}
                    </button>
                  </div>

                  <div className="attendance-row-enter absolute bottom-4 left-4 z-30 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-[#123c8c] backdrop-blur-md">
                    {getWorkModeLabel(workMode)}
                  </div>

                  {!cameraReady ? (
                    <CameraEmptyState
                      cameraStarting={cameraStarting}
                      permissionDenied={cameraPermissionDenied}
                      laptopBlocked={isLaptopBlocked}
                      cameraOffByUser={isCameraOffByUser}
                      deniedAttempts={cameraDeniedAttempts}
                      onRetry={retryCameraPermission}
                      onTurnOn={handleToggleCamera}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {browserGuide ? (
              <CameraPermissionGuide guide={browserGuide} />
            ) : null}

            <canvas ref={canvasRef} className="hidden" />

            <div className="attendance-row-enter mt-3 grid grid-cols-2 gap-3">
              <ActionButton
                label={hasCheckedInToday ? "Sudah masuk" : "Check-in"}
                subtitle="Masuk"
                loading={checkInProcessing || isUserLoading}
                disabled={
                  loading ||
                  cameraStarting ||
                  isUserLoading ||
                  isLaptopBlocked ||
                  isLeaveBlocked ||
                  hasCheckedInToday
                }
                primary={!hasCheckedInToday}
                icon={<LogIn size={22} />}
                onClick={requestCheckIn}
              />

              <ActionButton
                label={hasCheckedOutToday ? "Sudah keluar" : "Check-out"}
                subtitle="Keluar"
                loading={checkOutProcessing}
                disabled={
                  loading ||
                  cameraStarting ||
                  isLaptopBlocked ||
                  isLeaveBlocked ||
                  !hasCheckedInToday ||
                  hasCheckedOutToday
                }
                primary={hasCheckedInToday && !hasCheckedOutToday}
                icon={<LogOut size={22} />}
                onClick={requestCheckOut}
              />
            </div>

            {isLeaveBlocked ? (
              <div className="attendance-row-enter mt-3 rounded-2xl border border-slate-200 bg-slate-100 p-4 text-xs font-bold leading-5 text-slate-600">
                {leaveBlock?.message ||
                  "Kamu sedang dalam periode cuti/sakit/izin. Check-in dan check-out tidak dapat dilakukan."}
              </div>
            ) : null}

            <LastPhoto url={lastPhotoUrl} />
          </AppCard>

          <div className="hidden space-y-5 md:block">
            <ProofCard cameraReady={cameraReady} workMode={workMode} />

            <AppCard
              padding="md"
              className="attendance-card-enter rounded-[2rem] border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Status Verifikasi
              </p>

              <div className="attendance-row-enter mt-4 flex items-start gap-4 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-5">
                <CheckCircle2
                  size={24}
                  className="mt-0.5 shrink-0 text-[#123c8c]"
                />

                <div>
                  <h3 className="font-black text-slate-950">{statusTitle}</h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {statusText}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoTile
                  title="Jam Kerja"
                  icon={<Clock3 size={22} className="text-[#123c8c]" />}
                >
                  {workMode === "visit" ? (
                    <div className="space-y-1">
                      <p className="font-black text-orange-600">
                        Kunjungan bebas batas telat
                      </p>
                      <p className="font-semibold text-slate-400">
                        Tidak mengikuti toleransi shift atau batas masuk.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p>
                        {shiftStartTime} - {shiftEndTime}
                      </p>
                      <p className="font-semibold text-slate-400">
                        Toleransi: {shiftToleranceMinutes} menit
                      </p>
                      <p className="font-semibold text-slate-400">
                        Batas telat: {lateLimitLabel}
                      </p>
                    </div>
                  )}
                </InfoTile>

                <InfoTile
                  title="Menit Kerja"
                  icon={
                    <BriefcaseBusiness size={22} className="text-[#123c8c]" />
                  }
                >
                  <div className="space-y-1">
                    <p className="font-black text-[#123456]">
                      {displayedWorkMinutes} menit
                    </p>
                    <p className="font-semibold text-slate-400">
                      {hasCheckedInToday
                        ? displayedWorkDuration
                        : "Mulai dihitung setelah check-in."}
                    </p>
                  </div>
                </InfoTile>

                <InfoTile
                  title="Lokasi GPS"
                  icon={<MapPin size={22} className="text-[#123c8c]" />}
                >
                  {lastLatitude !== null && lastLongitude !== null ? (
                    <div className="space-y-1">
                      <p>Lat: {lastLatitude.toFixed(6)}</p>
                      <p>Lng: {lastLongitude.toFixed(6)}</p>
                      <p>
                        Accuracy:{" "}
                        {lastAccuracy !== null
                          ? `±${Math.round(lastAccuracy)} meter`
                          : "-"}
                      </p>
                    </div>
                  ) : (
                    <p>Diminta saat absen</p>
                  )}
                </InfoTile>
              </div>
            </AppCard>
          </div>
        </section>

        {isVisitModalOpen ? (
          <VisitDataModal
            form={visitForm}
            loading={loading}
            onChange={updateVisitForm}
            onClose={() => {
              if (!loading) setIsVisitModalOpen(false);
            }}
            onSave={() => {
              if (!validateVisitForm()) return;
              setIsVisitModalOpen(false);
              showCustomAlert(
                "Data kunjungan tersimpan",
                hasCheckedInToday
                  ? "Data kunjungan siap dikirim saat check-out."
                  : "Data kunjungan siap dikirim saat check-in.",
                "success",
              );

              safeSetStatus(
                "Data Kunjungan Siap",
                hasCheckedInToday
                  ? "Tekan tombol Check-out untuk mengirim data kunjungan."
                  : "Tekan tombol Check-in untuk mengirim data kunjungan.",
              );
            }}
          />
        ) : null}

        <EarlyCheckinConfirmModal
          confirm={earlyCheckinConfirm}
          loading={loading}
          onCancel={() => setEarlyCheckinConfirm(emptyEarlyCheckinConfirm)}
          onConfirm={confirmEarlyCheckin}
        />

        <EarlyCheckoutConfirmModal
          confirm={earlyCheckoutConfirm}
          loading={loading}
          onCancel={() => setEarlyCheckoutConfirm(emptyEarlyCheckoutConfirm)}
          onConfirm={confirmEarlyCheckout}
          onReasonChange={(reason) =>
            setEarlyCheckoutConfirm((prev) => ({ ...prev, reason }))
          }
        />

        {isLateReasonOpen ? (
          <LateReasonModal
            value={lateReason}
            loading={loading}
            lateLimitLabel={lateLimitLabel}
            toleranceMinutes={shiftToleranceMinutes}
            onChange={setLateReason}
            onCancel={() => {
              setIsLateReasonOpen(false);
              setLateReason("");
            }}
            onSubmit={handleSaveLateReason}
          />
        ) : null}

        <CustomAttendanceAlert alert={customAlert} onClose={closeCustomAlert} />

        <BottomNav />
      </main>
    </MobileShell>
  );
}
