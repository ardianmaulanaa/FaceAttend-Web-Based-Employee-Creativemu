"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarOff,
  ChevronDown,
  Clock3,
  Eye,
  FileText,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type DashboardStats = {
  totalEmployees: number;
  checkInToday: number;
  checkOutToday: number;
  lateToday: number;
  absentToday: number;
  izinToday?: number;
  sakitToday?: number;
  cutiToday?: number;
};

type RecentAttendance = {
  id: string;
  attendanceId: string | null;
  name: string;
  employeeCode?: string | null;
  profilePhoto?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  position: string | null;
  department: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  lateMinutes: number;
  workMinutes: number;
  workMode?: string | null;
  work_mode?: string | null;
  checkInWorkMode?: string | null;
  check_in_work_mode?: string | null;
  checkOutWorkMode?: string | null;
  check_out_work_mode?: string | null;
  attendanceMode?: string | null;
  attendance_mode?: string | null;
  mode?: string | null;
  hasPhoto?: boolean;
  hasLocation?: boolean;
};

type DashboardResponse = {
  stats: DashboardStats;
  recentAttendance: RecentAttendance[];
};

function normalizeProfilePhotoUrl(value: string | null | undefined) {
  if (!value) return "";

  const cleanPhoto = String(value).trim();

  if (!cleanPhoto) return "";

  if (
    cleanPhoto.startsWith("http://") ||
    cleanPhoto.startsWith("https://") ||
    cleanPhoto.startsWith("data:") ||
    cleanPhoto.startsWith("/")
  ) {
    return cleanPhoto;
  }

  if (cleanPhoto.startsWith("uploads/")) {
    return `/${cleanPhoto}`;
  }

  return `/uploads/profiles/${cleanPhoto}`;
}

function getDashboardProfilePhoto(item: RecentAttendance) {
  return normalizeProfilePhotoUrl(
    item.profilePhoto ||
      item.profile_photo ||
      item.profile_photo_url ||
      item.photo_url ||
      item.avatar_url ||
      "",
  );
}

function getInitialName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function getStatusClass(item: RecentAttendance) {
  if (item.checkOutTime) {
    return "bg-[#eaf1ff] text-[#123c8c]";
  }

  if (item.lateMinutes > 0 || item.status?.toUpperCase() === "LATE") {
    return "bg-amber-50 text-amber-700";
  }

  if (item.checkInTime) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getStatusLabel(item: RecentAttendance) {
  if (item.checkOutTime) return "Selesai";

  if (item.lateMinutes > 0 || item.status?.toUpperCase() === "LATE") {
    return "Terlambat";
  }

  if (item.checkInTime) return "Check-in";

  return "Belum Absen";
}

function formatTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(":", ".");
}

function formatMinutes(minutes: number, hasCheckOut = false) {
  if (!hasCheckOut) return "-";

  const safeMinutes = Math.max(0, Number(minutes || 0));
  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  return `${hours}:${String(remainingMinutes).padStart(2, "0")}`;
}

function getAttendanceKey(item: RecentAttendance, index: number) {
  return (
    item.attendanceId ||
    `${item.id || "attendance"}-${item.employeeCode || "employee"}-${index}`
  );
}

function getEmployeeSubtitle(item: RecentAttendance) {
  if (item.position) return item.position;
  if (item.department) return item.department;

  return "-";
}

function getEmployeeMeta(item: RecentAttendance) {
  return [item.employeeCode, item.department, item.position]
    .filter(Boolean)
    .join(" - ");
}

function normalizeWorkMode(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function resolveWorkMode(item: RecentAttendance) {
  // Hook ke beberapa kemungkinan nama field dari API / database.
  // Ini penting karena sebagian endpoint bisa mengirim camelCase,
  // sebagian lain snake_case.
  const candidates = [
    item.workMode,
    item.work_mode,
    item.checkInWorkMode,
    item.check_in_work_mode,
    item.checkOutWorkMode,
    item.check_out_work_mode,
    item.attendanceMode,
    item.attendance_mode,
    item.mode,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeWorkMode(candidate);

    if (!normalized) continue;

    if (
      normalized === "wfh" ||
      normalized === "workfromhome" ||
      normalized === "home" ||
      normalized === "remote"
    ) {
      return "WFH";
    }

    if (normalized === "wfa" || normalized === "workfromanywhere") {
      return "WFA";
    }

    if (
      normalized === "visit" ||
      normalized === "kunjungan" ||
      normalized === "field" ||
      normalized === "lapangan"
    ) {
      return "Kunjungan";
    }

    if (
      normalized === "office" ||
      normalized === "wfo" ||
      normalized === "kantor" ||
      normalized === "workfromoffice"
    ) {
      return "Kantor";
    }

    // Kalau backend mengirim nilai lain, tampilkan apa adanya,
    // jangan salah paksa menjadi "Kantor".
    return String(candidate).trim();
  }

  // Belum ada presensi / API tidak mengirim mode kerja.
  return "";
}

function getWorkModeClass(label: string) {
  if (label === "WFH") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  if (label === "WFA") {
    return "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200";
  }

  if (label === "Kunjungan") {
    return "bg-teal-50 text-teal-700 ring-1 ring-teal-200";
  }

  return "bg-blue-50 text-[#123c8c] ring-1 ring-blue-100";
}

function getAttendanceDetailHref(item: RecentAttendance) {
  const source = "from=dashboard";

  if (item.attendanceId) {
    return `/admin/laporan-kehadiran/${item.attendanceId}?${source}`;
  }

  return `/admin/rekap-kehadiran-karyawan/${item.id}?${source}`;
}

function EmployeeProfileAvatar({ item }: { item: RecentAttendance }) {
  const [imageError, setImageError] = useState(false);
  const profilePhoto = getDashboardProfilePhoto(item);

  if (profilePhoto && !imageError) {
    return (
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#eaf1ff] ring-1 ring-blue-100 md:h-11 md:w-11">
        <img
          src={profilePhoto}
          alt={`Foto profil ${item.name}`}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-sm font-black text-[#123c8c] ring-1 ring-blue-100 md:h-11 md:w-11">
      {getInitialName(item.name) || <UserRound size={22} strokeWidth={2.6} />}
    </div>
  );
}

function MobileAttendanceCard({
  item,
  index,
}: {
  item: RecentAttendance;
  index: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const employeeMeta = getEmployeeMeta(item) || getEmployeeSubtitle(item);

  return (
    <div
      className="dashboard-row-enter border-b border-blue-100 px-4 py-4 last:border-b-0"
      style={{
        animationDelay: `${index * 45}ms`,
      }}
    >
      <div className="flex w-full items-center justify-between gap-3">
        <Link
          href={`/admin/daftar-karyawan/${item.id}`}
          className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-80"
        >
          <EmployeeProfileAvatar item={item} />

          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-black text-slate-950 hover:text-[#123c8c]">
              {item.name}
            </p>

            <p className="mt-1 truncate text-xs font-bold text-slate-500">
              {employeeMeta}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href={getAttendanceDetailHref(item)}
            className={`rounded-full px-3 py-1 text-[11px] font-black transition hover:opacity-80 ${getStatusClass(
              item,
            )}`}
          >
            {getStatusLabel(item)}
          </Link>

          <button
            type="button"
            onClick={() => setIsOpen((current) => !current)}
            aria-expanded={isOpen}
            className="p-1"
          >
            <ChevronDown
              size={22}
              strokeWidth={3}
              className={`text-[#123c8c] transition duration-200 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {isOpen ? (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#f6f8ff] p-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                Check-in
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {formatTime(item.checkInTime)}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                Check-out
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {formatTime(item.checkOutTime)}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                Durasi
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {formatMinutes(item.workMinutes, Boolean(item.checkOutTime))}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                Status
              </p>
              <p className="mt-1 text-sm font-black text-slate-800">
                {getStatusLabel(item)}
              </p>
            </div>
          </div>

          <Link
            href={getAttendanceDetailHref(item)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#123c8c] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#0f3274]"
          >
            <Eye size={15} />
            Lihat Detail Kehadiran
          </Link>
        </div>
      ) : null}
    </div>
  );
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function DashboardMotionStyles() {
  return (
    <style>{`
      @keyframes dashboardEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes dashboardRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .dashboard-enter {
        animation: dashboardEnter 320ms ease-out both;
      }

      .dashboard-row-enter {
        opacity: 0;
        animation: dashboardRowEnter 300ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .dashboard-enter,
        .dashboard-row-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal mengambil data dashboard admin.",
        );
      }

      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data dashboard.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const dashboardStats = data?.stats;

    return [
      {
        label: "Total Karyawan",
        value: String(dashboardStats?.totalEmployees ?? 0),
        description: "Karyawan aktif",
        icon: UsersRound,
        color: "text-[#123c8c]",
      },
      {
        label: "Check-in",
        value: String(dashboardStats?.checkInToday ?? 0),
        description: "Sudah masuk",
        icon: LogIn,
        color: "text-emerald-600",
      },
      {
        label: "Check-out",
        value: String(dashboardStats?.checkOutToday ?? 0),
        description: "Sudah keluar",
        icon: LogOut,
        color: "text-blue-600",
      },
      {
        label: "Terlambat",
        value: String(dashboardStats?.lateToday ?? 0),
        description: "Telat masuk",
        icon: Clock3,
        color: "text-amber-600",
      },
      {
        label: "Izin",
        value: String(dashboardStats?.izinToday ?? 0),
        description: "Izin tidak masuk",
        icon: FileText,
        color: "text-orange-600",
      },
      {
        label: "Sakit",
        value: String(dashboardStats?.sakitToday ?? 0),
        description: "Surat izin sakit",
        icon: Stethoscope,
        color: "text-rose-600",
      },
      {
        label: "Cuti",
        value: String(dashboardStats?.cutiToday ?? 0),
        description: "Sedang cuti",
        icon: CalendarOff,
        color: "text-purple-600",
      },
    ];
  }, [data]);

  return (
    <MobileShell variant="admin">
      <DashboardMotionStyles />

      <AppHeader title="Admin Dasbor" variant="admin" />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="dashboard-enter overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
          <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
            <div className="bg-[#123c8c] p-6 text-white md:p-8 flex flex-col justify-center">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <LayoutDashboard size={25} strokeWidth={2.6} />
                </div>

                <div>
                  <h2 className="text-2xl font-black tracking-tight md:text-3xl">
                    Ringkasan Presensi
                  </h2>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 p-3.5 md:p-5">
              {stats.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="dashboard-row-enter rounded-2xl border border-blue-100/80 bg-[#f6f8ff] p-3 transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md hover:shadow-slate-200/60"
                    style={{
                      animationDelay: `${index * 40}ms`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-bold text-slate-500 truncate">
                        {item.label}
                      </p>

                      <Icon
                        size={15}
                        strokeWidth={2.5}
                        className={item.color || "text-[#123c8c]"}
                      />
                    </div>

                    {isLoading ? (
                      <div className="mt-2.5 h-6 w-12 animate-pulse rounded-lg bg-blue-100" />
                    ) : (
                      <h3
                        className={`mt-2 text-xl md:text-2xl font-black ${item.color || "text-[#123c8c]"}`}
                      >
                        {item.value}
                      </h3>
                    )}

                    <p className="mt-0.5 text-[10px] font-semibold text-slate-400 truncate">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="dashboard-row-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div
          className="dashboard-enter rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
          style={{
            animationDelay: "100ms",
          }}
        >
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Laporan Hari Ini
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Presensi Terbaru
              </h2>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {isLoading ? (
              <div className="dashboard-row-enter flex items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-white px-5 py-10 text-sm font-bold text-slate-500">
                <Loader2 size={18} className="animate-spin text-[#123c8c]" />
                Mengambil data presensi...
              </div>
            ) : data?.recentAttendance.length ? (
              data.recentAttendance.map((item, index) => {
                return (
                  <div
                    key={getAttendanceKey(item, index)}
                    className="dashboard-row-enter group rounded-2xl border border-blue-100 bg-white px-4 py-4 shadow-sm shadow-slate-200/60 transition duration-300 hover:-translate-y-0.5 hover:border-[#123c8c]/30 hover:bg-[#fbfdff] hover:shadow-xl hover:shadow-slate-300/40 md:rounded-[1.6rem] md:px-5 md:py-4"
                    style={{
                      animationDelay: `${index * 45}ms`,
                    }}
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <Link
                        href={`/admin/daftar-karyawan/${item.id}`}
                        className="flex items-center gap-3 md:w-[260px] md:shrink-0 transition hover:opacity-80"
                      >
                        <EmployeeProfileAvatar item={item} />

                        <div className="min-w-0 flex-1">
                          <h4 className="truncate text-base font-black text-slate-950 hover:text-[#123c8c]">
                            {item.name}
                          </h4>

                          <p className="mt-1 truncate text-xs font-bold text-slate-400">
                            {item.employeeCode ? `${item.employeeCode} • ` : ""}
                            {getEmployeeSubtitle(item)}
                          </p>
                        </div>
                      </Link>

                      <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-500 md:w-[320px] md:shrink-0">
                        <div className="rounded-2xl border border-blue-50 bg-[#f8fbff] px-3.5 py-2.5">
                          <p className="text-[11px] font-bold text-slate-400">
                            Masuk
                          </p>
                          <p className="mt-0.5 text-sm font-black text-slate-800">
                            {formatTime(item.checkInTime)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-blue-50 bg-[#f8fbff] px-3.5 py-2.5">
                          <p className="text-[11px] font-bold text-slate-400">
                            Keluar
                          </p>
                          <p className="mt-0.5 text-sm font-black text-slate-800">
                            {formatTime(item.checkOutTime)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-blue-50 bg-[#f8fbff] px-3.5 py-2.5">
                          <p className="text-[11px] font-bold text-slate-400">
                            Durasi
                          </p>
                          <p className="mt-0.5 text-sm font-black text-slate-800">
                            {formatMinutes(
                              item.workMinutes,
                              Boolean(item.checkOutTime),
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 md:flex-1 md:justify-start">
                        <Link
                          href={getAttendanceDetailHref(item)}
                          className={`rounded-full px-3 py-1 text-xs font-black transition hover:opacity-80 ${getStatusClass(
                            item,
                          )}`}
                        >
                          {getStatusLabel(item)}
                        </Link>

                        {item.checkInTime && !item.checkOutTime ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-200">
                            Belum Checkout
                          </span>
                        ) : null}

                        {resolveWorkMode(item) ? (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${getWorkModeClass(
                              resolveWorkMode(item),
                            )}`}
                          >
                            {resolveWorkMode(item)}
                          </span>
                        ) : null}

                        {item.hasPhoto ? (
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            Ada Foto
                          </span>
                        ) : null}

                        {item.hasLocation ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                            Ada Lokasi
                          </span>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 items-center justify-end">
                        <Link
                          href={getAttendanceDetailHref(item)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-xs font-black text-[#123c8c] shadow-sm transition hover:bg-[#eaf1ff] hover:shadow-md"
                        >
                          <Eye size={15} />
                          Lihat Detail Kehadiran
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="dashboard-row-enter rounded-3xl border border-blue-100 bg-white px-5 py-10 text-center text-sm font-bold text-slate-500">
                Belum ada data check-in atau check-out hari ini.
              </div>
            )}
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
