"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BriefcaseBusiness,
  Camera,
  CheckCircle2,
  Clock3,
  ImageUp,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Power,
  RotateCcw,
  ScanFace,
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
type WorkMode = "office" | "wfh" | "wfc" | "visit";

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
  } | null;
};

type AuthMeResponse = {
  user?: CurrentUser;
  data?: CurrentUser | { user?: CurrentUser };
  currentUser?: CurrentUser;
};

type TodayAttendance = {
  id?: string;
  checkInTime?: string | null;
  check_in_time?: string | null;
  checkOutTime?: string | null;
  check_out_time?: string | null;
  workMode?: WorkMode | string | null;
  work_mode?: WorkMode | string | null;
  workModeLabel?: string | null;
};

type TodayAttendanceResponse = {
  success?: boolean;
  attendance?: TodayAttendance | null;
  todayAttendance?: TodayAttendance | null;
  data?: TodayAttendance | { attendance?: TodayAttendance | null } | null;
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

function isMobileAttendanceDevice() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();

  return /iphone|ipod|android.*mobile|blackberry|iemobile|opera mini|mobile/.test(
    userAgent,
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

  return null;
}

function hasAttendanceCheckIn(attendance: TodayAttendance | null) {
  return Boolean(attendance?.checkInTime || attendance?.check_in_time);
}

function hasAttendanceCheckOut(attendance: TodayAttendance | null) {
  return Boolean(attendance?.checkOutTime || attendance?.check_out_time);
}

function getAttendanceWorkMode(attendance: TodayAttendance | null): WorkMode {
  const mode = attendance?.workMode || attendance?.work_mode;

  if (mode === "wfh" || mode === "wfc" || mode === "visit") return mode;

  return "office";
}

function getShiftStartTime(shiftName?: string | null) {
  const name = String(shiftName || "").toUpperCase();

  if (name.includes("SHIFT SIANG") || name.includes("SIANG")) return "13:00";

  return DEFAULT_SHIFT_START_TIME;
}

function getShiftToleranceMinutes(user: CurrentUser | null) {
  const tolerance =
    user?.shift?.tolerance_minutes ?? user?.shift?.toleranceMinutes ?? 0;

  const parsedTolerance = Number(tolerance);

  return Number.isFinite(parsedTolerance) && parsedTolerance >= 0
    ? parsedTolerance
    : 0;
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
  const startTime = getShiftStartTime(user?.shift?.name);
  const toleranceMinutes = getShiftToleranceMinutes(user);

  return timeToMinutes(startTime) + toleranceMinutes;
}

function getLateLimitLabel(user: CurrentUser | null) {
  return minutesToClock(getLateLimitMinutes(user));
}

function isLateCheckInNow(user: CurrentUser | null) {
  const nowMinutes = getJakartaMinutesNow();
  const lateLimitMinutes = getLateLimitMinutes(user);

  return nowMinutes > lateLimitMinutes;
}

function getShiftEndTime(shiftName?: string | null) {
  const name = String(shiftName || "").toUpperCase();

  if (name.includes("SHIFT SIANG") || name.includes("SIANG")) return "21:00";

  return DEFAULT_SHIFT_END_TIME;
}

function getEarlyCheckoutMinutes(user: CurrentUser | null) {
  const nowMinutes = getJakartaMinutesNow();
  const endMinutes = timeToMinutes(getShiftEndTime(user?.shift?.name));

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

function getWorkModeLabel(workMode: WorkMode) {
  if (workMode === "wfh") return "WFH";
  if (workMode === "wfc") return "WFC";
  if (workMode === "visit") return "Kunjungan";
  return "Kantor";
}

function getWorkModeDescription(workMode: WorkMode) {
  if (workMode === "office") return "Wajib berada dalam radius kantor.";
  if (workMode === "wfh") return "Bebas lokasi, GPS tetap disimpan.";
  if (workMode === "wfc") return "Bebas lokasi kerja, GPS tetap disimpan.";
  return "Bebas lokasi, wajib isi data kunjungan.";
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

      @keyframes attendanceFloatGlow {
        0%, 100% {
          transform: translate3d(0, 0, 0) scale(1);
        }

        50% {
          transform: translate3d(12px, -10px, 0) scale(1.04);
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

      .attendance-float-glow {
        animation: attendanceFloatGlow 6s ease-in-out infinite;
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
        .attendance-scan-line,
        .attendance-float-glow {
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
          ? "Camera Active"
          : cameraStarting
            ? "Starting..."
            : "Camera Off"}
    </span>
  );
}

function PhotoFrameOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div className="absolute inset-0 rounded-[1.35rem] border border-white/45 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.28)]" />
      <div className="absolute inset-[0.55rem] rounded-[1.05rem] border border-white/25" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/18 via-white/5 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/20 via-slate-950/5 to-transparent" />

      <div className="absolute left-4 top-4 h-10 w-10 rounded-tl-[1.1rem] border-l-[3px] border-t-[3px] border-white/70" />
      <div className="absolute right-4 top-4 h-10 w-10 rounded-tr-[1.1rem] border-r-[3px] border-t-[3px] border-white/70" />
      <div className="absolute bottom-4 left-4 h-10 w-10 rounded-bl-[1.1rem] border-b-[3px] border-l-[3px] border-white/70" />
      <div className="absolute bottom-4 right-4 h-10 w-10 rounded-br-[1.1rem] border-b-[3px] border-r-[3px] border-white/70" />
    </div>
  );
}

function CameraEmptyState({
  cameraStarting,
  laptopBlocked,
}: {
  cameraStarting: boolean;
  laptopBlocked: boolean;
}) {
  return (
    <div className="attendance-row-enter absolute inset-0 flex items-center justify-center px-6 text-center text-white">
      <div>
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl md:h-24 md:w-24">
          {cameraStarting ? (
            <Loader2 size={38} className="animate-spin" />
          ) : laptopBlocked ? (
            <AlertCircle size={38} />
          ) : (
            <Camera size={38} />
          )}
        </div>

        <p className="mt-4 text-sm font-black text-white">
          {laptopBlocked
            ? "Absensi Mobile Only"
            : cameraStarting
              ? "Starting Camera"
              : "Camera Preview"}
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
          {laptopBlocked
            ? "Check-in dan check-out hanya dapat dilakukan melalui HP."
            : cameraStarting
              ? "Mohon tunggu sampai kamera memuat gambar."
              : "Kamera sedang mati. Klik Aktifkan Kamera di bawah layar kamera."}
        </p>
      </div>
    </div>
  );
}

function CameraControlButton({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <AppButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      variant="soft"
      full
      className={cn(
        "min-h-11 rounded-2xl px-3 text-xs shadow-lg backdrop-blur-md transition hover:-translate-y-0.5 active:scale-[0.98] md:min-h-12 md:text-sm",
        danger ? "bg-red-500/95 text-white" : "bg-white text-[#123c8c]",
      )}
    >
      {children}
    </AppButton>
  );
}

function ActionButton({
  label,
  subtitle,
  loading,
  primary,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  subtitle: string;
  loading: boolean;
  primary?: boolean;
  icon: ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <AppButton
      type="button"
      full
      onClick={onClick}
      disabled={disabled}
      variant={primary ? "primary" : "secondary"}
      className={cn(
        "min-h-[4.5rem] rounded-[1.45rem] px-3 shadow-xl transition hover:-translate-y-0.5 active:scale-[0.98] md:min-h-[70px] md:rounded-2xl md:px-5",
        primary
          ? "bg-[#123c8c] text-white shadow-blue-900/25"
          : "border border-blue-200 bg-white text-[#123c8c] shadow-slate-200/70 md:bg-[#f8fbff]",
      )}
    >
      <span className="flex w-full items-center justify-center gap-2 md:gap-3">
        {loading ? (
          <Loader2 size={22} className="animate-spin" />
        ) : (
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
              primary ? "bg-white/15" : "bg-blue-50",
            )}
          >
            {icon}
          </span>
        )}

        <span className="text-left">
          <span
            className={cn(
              "block text-[9px] font-black uppercase tracking-[0.18em] md:text-[11px] md:tracking-[0.22em]",
              primary ? "text-blue-100" : "text-slate-400",
            )}
          >
            {subtitle}
          </span>

          <span className="block text-base font-black md:text-lg">
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
        alt="Last attendance capture"
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
              Attendance Proof
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
  onChange,
  onOpenVisit,
}: {
  value: WorkMode;
  disabled: boolean;
  onChange: (value: WorkMode) => void;
  onOpenVisit: () => void;
}) {
  return (
    <div className="attendance-row-enter grid grid-cols-[1fr_auto] items-end gap-2 rounded-[1.6rem] border border-blue-100 bg-[#f8fbff] p-3">
      <AppSelect
        label="Mode Attendance"
        value={value}
        onChange={(event) => onChange(event.target.value as WorkMode)}
        disabled={disabled}
      >
        <option value="office">Kantor</option>
        <option value="wfh">WFH</option>
        <option value="visit">Kunjungan</option>
      </AppSelect>

      {value === "visit" ? (
        <button
          type="button"
          onClick={onOpenVisit}
          disabled={disabled}
          className="mb-0.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100 transition hover:bg-orange-100 active:scale-95 disabled:opacity-60"
          aria-label="Isi data kunjungan"
        >
          <BriefcaseBusiness size={21} strokeWidth={2.7} />
        </button>
      ) : null}

      <p className="col-span-2 text-xs font-semibold leading-5 text-slate-500">
        {getWorkModeDescription(value)}
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

      <div className="fixed inset-0 z-[82] flex items-end justify-center bg-slate-950/45 px-4 pb-4 backdrop-blur-sm animate-[visitOverlayIn_180ms_ease-out] md:items-center md:pb-0">
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
                    diisi sebelum absensi dikirim.
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
}: {
  confirm: EarlyCheckoutConfirm;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
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

      <div className="fixed inset-0 z-[84] flex items-end justify-center bg-slate-950/45 px-4 pb-4 backdrop-blur-sm animate-[earlyOverlayIn_180ms_ease-out] md:items-center md:pb-0">
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

      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 px-4 pb-4 backdrop-blur-sm animate-[lateOverlayIn_180ms_ease-out] md:items-center md:pb-0">
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
                    terlebih dahulu sebelum melanjutkan absensi.
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
                Alasan ini akan tersimpan di laporan absensi admin.
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
                  "Simpan Alasan"
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

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(false);

  const [todayAttendance, setTodayAttendance] =
    useState<TodayAttendance | null>(null);
  const [isTodayAttendanceLoading, setIsTodayAttendanceLoading] =
    useState(false);

  const [isLaptopBlocked, setIsLaptopBlocked] = useState(false);

  const [workMode, setWorkMode] = useState<WorkMode>("office");
  const [visitForm, setVisitForm] = useState<VisitForm>(emptyVisitForm);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
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
  const [earlyCheckoutConfirm, setEarlyCheckoutConfirm] =
    useState<EarlyCheckoutConfirm>(emptyEarlyCheckoutConfirm);
  const [customAlert, setCustomAlert] = useState<CustomAlert>(emptyAlert);

  const [statusTitle, setStatusTitle] = useState("Waiting for Camera");
  const [statusText, setStatusText] = useState(
    "Pilih mode attendance, aktifkan kamera, lalu izinkan lokasi GPS sebelum melakukan absensi.",
  );

  const shiftStartTime = getShiftStartTime(currentUser?.shift?.name);
  const shiftEndTime = getShiftEndTime(currentUser?.shift?.name);
  const shiftToleranceMinutes = getShiftToleranceMinutes(currentUser);
  const lateLimitLabel = getLateLimitLabel(currentUser);

  const hasCheckedInToday = hasAttendanceCheckIn(todayAttendance);
  const hasCheckedOutToday = hasAttendanceCheckOut(todayAttendance);
  const lockedWorkMode = getAttendanceWorkMode(todayAttendance);

  useEffect(() => {
    mountedRef.current = true;

    const blocked = !isMobileAttendanceDevice();
    setIsLaptopBlocked(blocked);

    void loadCurrentUser();
    void loadTodayAttendance();

    if (blocked) {
      safeSetStatus(
        "Absensi hanya lewat HP",
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
      "Absensi hanya lewat HP",
      "Untuk menjaga validasi kamera dan lokasi, check-in/check-out tidak dapat dilakukan melalui laptop atau desktop. Silakan buka FaceAttend melalui browser HP.",
      "warning",
    );
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

      if (hasCheckedOutToday) {
        setWorkMode(mode);
        setIsVisitModalOpen(false);
        setVisitForm(emptyVisitForm);

        showCustomAlert(
          "Absensi hari ini sudah selesai",
          `Kamu sudah check-in dan check-out hari ini dengan mode ${modeLabel}. Mode attendance tidak bisa diubah lagi.`,
          "warning",
        );

        safeSetStatus(
          "Absensi Selesai",
          `Absensi hari ini sudah selesai dengan mode ${modeLabel}.`,
        );

        return;
      }

      if (value === "visit") {
        setWorkMode("visit");
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

      setWorkMode(mode);
      setIsVisitModalOpen(false);
      setVisitForm(emptyVisitForm);

      showCustomAlert(
        "Mode attendance terkunci",
        `Kamu sudah check-in hari ini dengan mode ${modeLabel}. Kamu tidak bisa mengganti mode check-in setelah absensi masuk.`,
        "warning",
      );

      safeSetStatus(
        "Mode Attendance Terkunci",
        `Kamu sudah check-in hari ini dengan mode ${modeLabel}. Jika ada kunjungan di tengah pekerjaan, pilih mode Kunjungan lalu lakukan Check-out.`,
      );

      return;
    }

    setWorkMode(value);

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

  function validateVisitForm() {
    if (workMode !== "visit") return true;

    if (
      !visitForm.visitTitle.trim() ||
      !visitForm.visitAddress.trim() ||
      !visitForm.visitNote.trim()
    ) {
      setIsVisitModalOpen(true);

      showCustomAlert(
        "Data kunjungan belum lengkap",
        "Isi nama/tempat kunjungan, alamat kunjungan, dan keperluan kunjungan terlebih dahulu sebelum melanjutkan absensi.",
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

      const data = (await response.json()) as AuthMeResponse | CurrentUser;

      if (!response.ok) {
        throw new Error("Gagal mengambil data shift karyawan.");
      }

      const user = normalizeCurrentUser(data);

      if (!user) {
        throw new Error("Data user tidak valid.");
      }

      if (mountedRef.current) {
        setCurrentUser(user);
      }

      return user;
    } catch (error) {
      console.error("LOAD_CURRENT_USER_ERROR:", error);
      safeSetStatus(
        "Data Shift Belum Siap",
        error instanceof Error
          ? error.message
          : "Gagal mengambil data shift karyawan.",
      );

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
        return null;
      }

      const attendance = normalizeTodayAttendance(data);

      if (mountedRef.current) {
        setTodayAttendance(attendance);

        if (hasAttendanceCheckIn(attendance)) {
          const mode = getAttendanceWorkMode(attendance);

          setWorkMode(mode);

          safeSetStatus(
            "Mode Attendance Terkunci",
            `Kamu sudah check-in hari ini dengan mode ${getWorkModeLabel(
              mode,
            )}. Mode tidak bisa diubah sampai check-out.`,
          );
        }
      }

      return attendance;
    } catch {
      setTodayAttendance(null);
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
        "Camera Off",
        "Kamera sudah dimatikan. Klik Aktifkan Kamera sebelum melakukan absensi.",
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
              "Element video belum siap. Refresh halaman lalu coba lagi.",
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
      safeSetStatus("Starting Camera", "Mengaktifkan kamera...");

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
        safeSetStatus(
          "Akses Kamera Ditolak",
          "Akses kamera ditolak. Aktifkan izin kamera di browser untuk melakukan absensi.",
        );

        showCustomAlert(
          "Akses Kamera Ditolak",
          "Kamera belum bisa digunakan karena izin kamera ditolak. Buka pengaturan browser lalu izinkan kamera.",
          "warning",
        );

        return;
      }

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

  async function toggleCamera() {
    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    if (streamRef.current) {
      releaseCamera(true, true);
      return;
    }

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
    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    const latestAttendance = await loadTodayAttendance();

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

    if (!validateVisitForm()) return;

    if (workMode === "visit") {
      setLateReason("");
      setIsLateReasonOpen(false);

      safeSetStatus(
        "Kunjungan Bebas Toleransi",
        "Mode kunjungan tidak terikat jam masuk, shift, atau batas keterlambatan. Absensi akan dikirim sebagai kunjungan.",
      );

      await handleAttendance("check-in", "");
      return;
    }

    const user = currentUser || (await loadCurrentUser());

    if (!user) {
      showCustomAlert(
        "Data shift belum terbaca",
        "Refresh halaman lalu coba lagi.",
        "warning",
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

  async function requestCheckOut() {
    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    if (workMode === "visit" && !validateVisitForm()) return;

    const user = currentUser || (await loadCurrentUser());

    if (!user) {
      showCustomAlert(
        "Data shift belum terbaca",
        "Refresh halaman lalu coba lagi.",
        "warning",
      );
      return;
    }

    const earlyMinutes = getEarlyCheckoutMinutes(user);

    if (earlyMinutes > 0) {
      const endLabel = getShiftEndTime(user.shift?.name);
      const earlyLabel = formatDurationHoursMinutes(earlyMinutes);

      setEarlyCheckoutConfirm({
        open: true,
        earlyMinutes,
        earlyLabel,
        endLabel,
      });

      safeSetStatus(
        "Checkout Lebih Awal",
        `Kamu masih lebih awal ${earlyLabel} dari jam pulang ${endLabel}. Konfirmasi jika tetap ingin check-out.`,
      );

      return;
    }

    await handleAttendance("check-out");
  }

  async function confirmEarlyCheckout() {
    setEarlyCheckoutConfirm(emptyEarlyCheckoutConfirm);
    await handleAttendance("check-out");
  }

  function handleSaveLateReason() {
    if (!lateReason.trim()) {
      showCustomAlert(
        "Alasan belum diisi",
        "Isi alasan keterlambatan terlebih dahulu.",
        "warning",
      );
      return;
    }

    setIsLateReasonOpen(false);

    safeSetStatus(
      "Alasan Siap Dikirim",
      "Alasan keterlambatan sudah tersimpan sementara. Silakan tekan tombol Check-in untuk mengirim absensi.",
    );

    showCustomAlert(
      "Alasan siap dikirim",
      "Alasan keterlambatan sudah tersimpan. Silakan tekan tombol Check-in untuk melanjutkan absensi.",
      "success",
    );
  }

  async function handleAttendance(action: AttendanceAction, reason = "") {
    if (isLaptopBlocked) {
      showLaptopBlockedAlert();
      return;
    }

    if (workMode === "visit" && !validateVisitForm()) return;

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

      formData.append("workMode", workMode);
      formData.append("work_mode", workMode);
      formData.append("activityNote", getWorkModeLabel(workMode));
      formData.append("attendanceAction", action);

      if (workMode === "visit") {
        formData.append("skipLateValidation", "true");
        formData.append("ignoreLateValidation", "true");
        formData.append("isVisitAttendance", "true");
        formData.append("lateReason", "");
        formData.append("late_reason", "");
      }

      if (action === "check-out" && workMode === "visit") {
        formData.append("checkOutWorkMode", "visit");
        formData.append("check_out_work_mode", "visit");
        formData.append("checkOutActivityNote", "Kunjungan");
        formData.append("check_out_activity_note", "Kunjungan");
      }

      if (action === "check-in" && reason.trim()) {
        formData.append("lateReason", reason.trim());
        formData.append("late_reason", reason.trim());
      }

      if (workMode === "visit") {
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
        const message = data.error || data.message || "Absensi gagal.";

        if (data.requiresLateReason && workMode !== "visit") {
          setIsLateReasonOpen(true);
          safeSetStatus("Check-in Terlambat", message);
          return;
        }

        showCustomAlert(
          action === "check-out" ? "Check-out belum bisa" : "Absensi gagal",
          message,
          "warning",
        );

        safeSetStatus("Attendance Failed", message);
        return;
      }

      const officeName = data.office?.name;
      const distance = data.office?.distance;
      const radius = data.office?.radius;
      const modeLabel = data.workModeLabel || getWorkModeLabel(workMode);

      safeSetStatus(
        "Attendance Success",
        officeName
          ? `${data.message} Mode ${modeLabel}. Lokasi valid di ${officeName}. Jarak ${distance} meter dari kantor, radius ${radius} meter. Akurasi GPS ±${Math.round(
              accuracy,
            )} meter.`
          : `${data.message || "Absensi berhasil."} Mode ${modeLabel}. GPS tersimpan dengan akurasi ±${Math.round(
              accuracy,
            )} meter.`,
      );

      setLateReason("");
      setIsLateReasonOpen(false);

      if (workMode === "visit") {
        setVisitForm(emptyVisitForm);
      }

      await loadTodayAttendance();

      showCustomAlert(
        action === "check-in" ? "Check-in berhasil" : "Check-out berhasil",
        action === "check-in"
          ? `${data.message || "Absensi berhasil."} Mode: ${modeLabel}.`
          : data.message || "Absensi berhasil.",
        "success",
      );
    } catch (error) {
      const message = isPermissionDeniedError(error)
        ? "Izin kamera atau lokasi ditolak. Aktifkan izin kamera dan GPS di browser terlebih dahulu."
        : error instanceof Error
          ? error.message
          : "Gagal melakukan absensi. Pastikan kamera dan lokasi GPS diizinkan.";

      safeSetStatus("Attendance Failed", message);
      showCustomAlert("Absensi gagal", message, "warning");

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
          title="Face Attendance"
          subtitle="Ambil foto dan lokasi GPS untuk absensi"
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
        <div className="attendance-float-glow pointer-events-none fixed -left-32 top-20 hidden h-72 w-72 rounded-full bg-orange-200/20 blur-3xl md:block" />
        <div className="attendance-float-glow pointer-events-none fixed -right-32 bottom-24 hidden h-72 w-72 rounded-full bg-blue-300/20 blur-3xl md:block" />
        <section className="attendance-enter mx-auto w-full max-w-7xl px-5 pt-4 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                FaceAttend
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-[#073456]">
                Face Attendance
              </h1>

              <p className="mt-1 text-xs font-bold text-slate-500">
                Mode: {getWorkModeLabel(workMode)}
              </p>
            </div>

            <CameraStatusIcon
              cameraReady={cameraReady}
              cameraStarting={cameraStarting}
              laptopBlocked={isLaptopBlocked}
            />
          </div>
        </section>

        <section className="relative z-10 mx-auto grid w-full max-w-7xl gap-3 px-5 pt-3 md:px-10 md:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-16">
          <AppCard
            padding="md"
            className="attendance-card-enter flex flex-col rounded-[2rem] border-white/80 bg-white/95 p-3 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
          >
            <div className="attendance-row-enter mb-4 hidden items-start justify-between gap-4 md:flex">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Camera
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Attendance Capture
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Foto, GPS, dan mode attendance akan disimpan sebagai bukti.
                </p>
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
                loading || isTodayAttendanceLoading || hasCheckedOutToday
              }
              onChange={handleWorkModeChange}
              onOpenVisit={() => {
                if (hasCheckedOutToday) {
                  showCustomAlert(
                    "Absensi hari ini sudah selesai",
                    "Kamu sudah check-in dan check-out hari ini. Data kunjungan tidak bisa diubah lagi.",
                    "warning",
                  );

                  return;
                }

                if (hasCheckedInToday) {
                  setWorkMode("visit");
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
                  ? `Absensi hari ini sudah selesai dengan mode ${getWorkModeLabel(
                      lockedWorkMode,
                    )}. Mode attendance tidak bisa diubah lagi.`
                  : `Check-in sudah masuk dengan mode ${getWorkModeLabel(
                      lockedWorkMode,
                    )}. Kamu tidak bisa check-in ulang. Jika ada kunjungan di tengah pekerjaan, pilih mode Kunjungan lalu tekan Check-out.`}
              </div>
            ) : null}

            <div className="attendance-camera-enter mt-3 rounded-[1.9rem] bg-white p-2 shadow-[0_22px_55px_rgba(15,23,42,0.20)] ring-1 ring-slate-200/80">
              <div className="relative overflow-hidden rounded-[1.45rem] border border-slate-200 bg-slate-950 shadow-inner">
                <div className="relative h-[56dvh] min-h-[360px] max-h-[620px] md:h-auto md:aspect-[16/10] md:min-h-0 md:max-h-none lg:aspect-[16/10]">
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
                      "h-full w-full object-cover transition",
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
                      : cameraReady
                        ? "Camera Active"
                        : cameraStarting
                          ? "Starting..."
                          : "Camera Off"}
                  </div>

                  <div className="attendance-row-enter absolute bottom-4 left-4 z-30 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-black text-[#123c8c] backdrop-blur-md">
                    {getWorkModeLabel(workMode)}
                  </div>

                  {!cameraReady ? (
                    <CameraEmptyState
                      cameraStarting={cameraStarting}
                      laptopBlocked={isLaptopBlocked}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            <div className="attendance-row-enter mt-3 grid grid-cols-2 gap-2">
              <CameraControlButton
                onClick={toggleCamera}
                disabled={loading || cameraStarting || isLaptopBlocked}
                danger={cameraReady}
              >
                {cameraStarting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Power size={16} />
                )}
                {cameraReady ? "Matikan" : "Aktifkan"}
              </CameraControlButton>

              <CameraControlButton
                onClick={startCamera}
                disabled={loading || cameraStarting || isLaptopBlocked}
              >
                {cameraStarting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RotateCcw size={16} />
                )}
                Restart
              </CameraControlButton>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="attendance-row-enter mt-3 grid grid-cols-2 gap-3">
              <ActionButton
                label="Check-in"
                subtitle="Masuk"
                loading={checkInProcessing || isUserLoading}
                disabled={
                  loading || cameraStarting || isUserLoading || isLaptopBlocked
                }
                primary
                icon={<LogIn size={22} />}
                onClick={requestCheckIn}
              />

              <ActionButton
                label="Check-out"
                subtitle="Keluar"
                loading={checkOutProcessing}
                disabled={loading || cameraStarting || isLaptopBlocked}
                icon={<LogOut size={22} />}
                onClick={requestCheckOut}
              />
            </div>

            <LastPhoto url={lastPhotoUrl} />
          </AppCard>

          <div className="hidden space-y-5 md:block">
            <ProofCard cameraReady={cameraReady} workMode={workMode} />

            <AppCard
              padding="md"
              className="attendance-card-enter rounded-[2rem] border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Verification Status
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

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
                  title="GPS Location"
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

        <EarlyCheckoutConfirmModal
          confirm={earlyCheckoutConfirm}
          loading={loading}
          onCancel={() => setEarlyCheckoutConfirm(emptyEarlyCheckoutConfirm)}
          onConfirm={confirmEarlyCheckout}
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
