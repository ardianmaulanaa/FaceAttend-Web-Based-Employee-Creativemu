"use client";

import { FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Camera,
  ChevronDown,
  Eye,
  FileDown,
  ImageIcon,
  Search,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import { AppLoadingState } from "@/components/ui/AppUI";

type AttendanceReport = {
  id: string;
  employeeName: string;
  employeeCode: string | null;
  profilePhoto?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  date: string;
  dateLabel: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  status: string;
  statusLabel: string;
  workMode: string;
  workModeLabel: string;
  hasPhoto: boolean;
  hasLocation: boolean;
};

type AttendanceReportResponse = {
  success: boolean;
  message?: string;
  reports: AttendanceReport[];
};

type StatusFilter = "all" | "present" | "late" | "cuti";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "cuti", label: "Cuti" },
];

function getStatusStyle(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "present" || normalized === "hadir") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (normalized === "late" || normalized === "terlambat") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (normalized === "cuti") {
    return "bg-blue-50 text-[#123c8c] ring-blue-100";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function normalizeProfilePhotoUrl(photo?: string | null) {
  if (!photo) return "";

  const cleanPhoto = photo.trim();

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

function getAttendanceReportProfilePhoto(item: AttendanceReport) {
  return normalizeProfilePhotoUrl(
    item.profilePhoto ||
      item.profile_photo ||
      item.profile_photo_url ||
      item.photo_url ||
      item.avatar_url ||
      "",
  );
}

function AttendanceReportMotionStyles() {
  return (
    <style>{`
      @keyframes attendanceReportEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes attendanceReportRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes attendanceReportAvatarEnter {
        0% {
          opacity: 0;
          transform: scale(0.94);
        }

        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .attendance-report-enter {
        animation: attendanceReportEnter 320ms ease-out both;
      }

      .attendance-report-row-enter {
        opacity: 0;
        animation: attendanceReportRowEnter 300ms ease-out both;
      }

      .attendance-report-avatar-enter {
        animation: attendanceReportAvatarEnter 260ms ease-out both;
      }

      .attendance-report-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      input[type="date"].attendance-report-field {
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        min-height: 48px;
        line-height: normal;
      }

      input[type="date"].attendance-report-field::-webkit-date-and-time-value {
        text-align: left;
        min-height: 1.5em;
        margin: auto 0;
      }

      input[type="date"].attendance-report-field::-webkit-calendar-picker-indicator {
        opacity: 0.6;
        cursor: pointer;
        padding: 4px;
      }

      .attendance-report-opening {
        opacity: 0.72 !important;
        transform: translateY(-2px) scale(0.992) !important;
        box-shadow: 0 18px 40px rgb(148 163 184 / 0.28) !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .attendance-report-enter,
        .attendance-report-row-enter,
        .attendance-report-avatar-enter,
        .attendance-report-opening {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

function EmployeeProfileAvatar({ item }: { item: AttendanceReport }) {
  const [imageError, setImageError] = useState(false);
  const profilePhoto = getAttendanceReportProfilePhoto(item);

  if (profilePhoto && !imageError) {
    return (
      <div className="attendance-report-avatar-enter h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-[#eaf1ff] ring-1 ring-blue-100">
        <img
          src={profilePhoto}
          alt={`Foto profil ${item.employeeName}`}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div className="attendance-report-avatar-enter flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
      <UserRound size={23} strokeWidth={2.6} />
    </div>
  );
}

export default function AdminAttendanceReportPage() {
  const router = useRouter();
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [openingReportId, setOpeningReportId] = useState("");

  async function getAttendanceReports(
    searchOverride?: string,
    employeeIdOverride?: string,
  ) {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const queryParams = new URLSearchParams();

      if (selectedDate) {
        queryParams.set("date", selectedDate);
      }

      const effectiveSearch = searchOverride ?? searchKeyword;
      const effectiveEmployeeId = employeeIdOverride ?? selectedEmployeeId;

      if (effectiveEmployeeId.trim()) {
        queryParams.set("employeeId", effectiveEmployeeId.trim());
      } else if (effectiveSearch.trim()) {
        queryParams.set("search", effectiveSearch.trim());
      }

      if (statusFilter !== "all") {
        queryParams.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/admin/attendance-reports?${queryParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data: AttendanceReportResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setReports([]);
        setErrorMessage(data.message || "Gagal mengambil laporan kehadiran.");
        return;
      }

      setReports(data.reports || []);
    } catch (error) {
      console.error("GET_ATTENDANCE_REPORTS_ERROR:", error);

      setReports([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil laporan kehadiran.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void getAttendanceReports();
  }

  function openAttendanceDetail(
    event: MouseEvent<HTMLAnchorElement>,
    reportId: string,
  ) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    setOpeningReportId(reportId);

    window.setTimeout(() => {
      router.push(`/admin/laporan-kehadiran/${reportId}`);
    }, 140);
  }

  function handleExportPdf() {
    if (!reports.length || isLoading) return;

    const params = new URLSearchParams();

    if (selectedDate) {
      params.set("date", selectedDate);
    }

    if (selectedEmployeeId.trim()) {
      params.set("employeeId", selectedEmployeeId.trim());
    } else if (searchKeyword.trim()) {
      params.set("search", searchKeyword.trim());
    }

    if (statusFilter !== "all") {
      params.set("status", statusFilter);
    }

    window.open(
      `/admin/laporan-kehadiran/print?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  }

  useEffect(() => {
    const initialSearch = new URLSearchParams(window.location.search).get(
      "search",
    );
    const initialEmployeeId = new URLSearchParams(window.location.search).get(
      "employeeId",
    );
    const initialEmployeeName = new URLSearchParams(window.location.search).get(
      "employeeName",
    );

    if (initialEmployeeId) {
      setSelectedEmployeeId(initialEmployeeId);
    }

    if (initialEmployeeName || initialSearch) {
      setSearchKeyword(initialEmployeeName || initialSearch || "");
    }

    void getAttendanceReports(
      initialEmployeeName || initialSearch || undefined,
      initialEmployeeId || undefined,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, statusFilter]);

  const groupedReports = useMemo(() => {
    const groups = new Map<string, AttendanceReport[]>();

    reports.forEach((item) => {
      const key = item.dateLabel || "Tanpa Tanggal";

      if (!groups.has(key)) {
        groups.set(key, []);
      }

      groups.get(key)?.push(item);
    });

    return Array.from(groups.entries()).map(([dateLabel, items]) => ({
      dateLabel,
      items,
    }));
  }, [reports]);

  const stats = useMemo(() => {
    const total = reports.length;
    const totalDates = groupedReports.length;
    const withPhoto = reports.filter((item) => item.hasPhoto).length;
    const withLocation = reports.filter((item) => item.hasLocation).length;
    const uncheckout = reports.filter(
      (item) => item.checkIn !== "-" && item.checkOut === "-",
    ).length;

    return {
      total,
      totalDates,
      withPhoto,
      withLocation,
      uncheckout,
    };
  }, [reports, groupedReports.length]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AttendanceReportMotionStyles />

      <AppHeader title="Laporan Kehadiran" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <div className="attendance-report-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-6 text-white md:p-8">
                <div className="flex flex-col items-center text-center gap-3 md:flex-row md:items-center md:text-left">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <Camera size={25} strokeWidth={2.6} />
                  </div>

                  <div>
                    <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                      Rekap Kehadiran Karyawan
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4 md:p-6">
                <div
                  className="attendance-report-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                  style={{ animationDelay: "60ms" }}
                >
                  <p className="text-xs font-bold text-slate-500">
                    Total Rekap
                  </p>
                  <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                    {stats.total}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Data presensi
                  </p>
                </div>

                <div
                  className="attendance-report-row-enter rounded-2xl border border-amber-200 bg-amber-50 p-4"
                  style={{ animationDelay: "100ms" }}
                >
                  <p className="text-xs font-bold text-amber-800">Belum Checkout</p>
                  <h3 className="mt-3 text-3xl font-black text-amber-800">
                    {stats.uncheckout}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-amber-700/80">
                    Belum jam keluar
                  </p>
                </div>

                <div
                  className="attendance-report-row-enter rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                  style={{ animationDelay: "140ms" }}
                >
                  <p className="text-xs font-bold text-emerald-700">Ada Foto</p>
                  <h3 className="mt-3 text-3xl font-black text-emerald-700">
                    {stats.withPhoto}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-emerald-700/70">
                    Bukti absen
                  </p>
                </div>

                <div
                  className="attendance-report-row-enter rounded-2xl border border-blue-100 bg-blue-50 p-4"
                  style={{ animationDelay: "180ms" }}
                >
                  <p className="text-xs font-bold text-[#123c8c]">Ada Lokasi</p>
                  <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                    {stats.withLocation}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#123c8c]/70">
                    Titik GPS
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className="attendance-report-enter rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Filter Data
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Cari Rekap Kehadiran
                </h2>
              </div>
            </div>

            <form
              onSubmit={handleSearchSubmit}
              className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
            >
              <div className="w-full">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Cari Karyawan
                </label>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={searchKeyword}
                    onChange={(event) => {
                      setSearchKeyword(event.target.value);
                      setSelectedEmployeeId("");
                    }}
                    placeholder="Nama / kode karyawan..."
                    className="attendance-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Tanggal Presensi
                </label>
                <div className="relative flex items-center">
                  <CalendarDays
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    title="Kosongkan untuk menampilkan tanggal presensi terbaru"
                    className="attendance-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div className="w-full">
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Status Kehadiran
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="attendance-report-field h-12 w-full appearance-none rounded-2xl border border-blue-100 bg-[#f8fbff] pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
              >
                <Search size={17} />
                Cari
              </button>
            </form>
          </div>

          {errorMessage ? (
            <div className="attendance-report-row-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div
            className="attendance-report-enter rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
            style={{ animationDelay: "150ms" }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Rekap Presensi
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Nama Karyawan per Tanggal
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold text-slate-500">
                  {reports.length} data ditemukan
                </p>

                <button
                  type="button"
                  onClick={handleExportPdf}
                  disabled={isLoading || reports.length === 0}
                  title="Export PDF"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 text-xs font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FileDown size={17} strokeWidth={2.6} />
                  PDF
                </button>
              </div>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="attendance-report-row-enter">
                  <AppLoadingState text="Memuat rekap kehadiran..." />
                </div>
              ) : groupedReports.length === 0 ? (
                <div className="attendance-report-row-enter rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                    <ImageIcon size={26} strokeWidth={2.6} />
                  </div>

                  <p className="mt-4 text-sm font-black text-slate-500">
                    Belum ada rekap kehadiran pada filter ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedReports.map((group, groupIndex) => (
                    <section
                      key={group.dateLabel}
                      className="attendance-report-row-enter rounded-[2rem] border border-blue-100 bg-white p-4 md:p-5"
                      style={{
                        animationDelay: `${groupIndex * 70}ms`,
                      }}
                    >
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                            <CalendarDays size={22} strokeWidth={2.6} />
                          </div>

                          <div>
                            <h3 className="text-xl font-black text-slate-950">
                              {group.dateLabel}
                            </h3>

                            <p className="text-sm font-semibold text-slate-500">
                              {group.items.length} karyawan memiliki rekap
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {group.items.map((item, index) => (
                          <Link
                            key={item.id}
                            href={`/admin/laporan-kehadiran/${item.id}`}
                            onClick={(event) =>
                              openAttendanceDetail(event, item.id)
                            }
                            className={`attendance-report-row-enter group block rounded-2xl border border-blue-100 bg-white px-3 py-3 shadow-sm shadow-slate-200/60 transition duration-300 hover:-translate-y-0.5 hover:border-[#123c8c]/30 hover:bg-[#fbfdff] hover:shadow-xl hover:shadow-slate-300/40 active:scale-[0.99] md:rounded-[1.6rem] md:px-5 md:py-4 ${
                              openingReportId === item.id
                                ? "attendance-report-opening"
                                : ""
                            }`}
                            style={{
                              animationDelay: `${index * 45}ms`,
                            }}
                          >
                            <div className="flex items-center gap-3 md:justify-between">
                              <div className="flex min-w-0 flex-1 items-center gap-3 md:w-[260px] md:flex-none">
                                <EmployeeProfileAvatar item={item} />

                                <div className="min-w-0 flex-1">
                                  <h4 className="text-sm font-black text-slate-950 leading-snug break-words sm:text-base">
                                    {item.employeeName}
                                  </h4>

                                  <p className="mt-0.5 text-[11px] font-bold text-slate-400 leading-snug break-words sm:text-xs">
                                    {item.employeeCode || item.workModeLabel}
                                  </p>

                                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-black text-slate-500 md:hidden">
                                    <span>
                                      Masuk{" "}
                                      <span className="text-slate-900">
                                        {item.checkIn}
                                      </span>
                                    </span>

                                    <span>
                                      Keluar{" "}
                                      <span className="text-slate-900">
                                        {item.checkOut}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="hidden grid-cols-2 gap-2 text-xs font-bold text-slate-500 md:grid md:w-[260px]">
                                <div className="rounded-2xl border border-blue-50 bg-white px-4 py-3">
                                  <p className="text-slate-400">Masuk</p>
                                  <p className="mt-1 font-black text-slate-800">
                                    {item.checkIn}
                                  </p>
                                </div>

                                <div className="rounded-2xl border border-blue-50 bg-white px-4 py-3">
                                  <p className="text-slate-400">Keluar</p>
                                  <p className="mt-1 font-black text-slate-800">
                                    {item.checkOut}
                                  </p>
                                </div>
                              </div>

                              <div className="flex shrink-0 flex-col items-end gap-1.5 md:flex-1 md:flex-row md:flex-wrap md:items-center md:gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-black ring-1 md:px-3 md:text-[11px] ${getStatusStyle(
                                    item.status,
                                  )}`}
                                >
                                  {item.statusLabel}
                                </span>

                                {item.checkIn !== "-" && item.checkOut === "-" ? (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700 ring-1 ring-amber-200 md:px-3 md:text-[11px]">
                                    Belum Checkout
                                  </span>
                                ) : null}

                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-black text-[#123c8c] md:px-3 md:text-[11px]">
                                  {item.workModeLabel}
                                </span>

                                {item.hasPhoto ? (
                                  <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700 sm:inline-flex">
                                    Ada Foto
                                  </span>
                                ) : (
                                  <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500 sm:inline-flex">
                                    Tanpa Foto
                                  </span>
                                )}

                                {item.hasLocation ? (
                                  <span className="hidden rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700 sm:inline-flex">
                                    Ada Lokasi
                                  </span>
                                ) : null}
                              </div>

                              <div className="hidden shrink-0 items-center justify-start md:flex md:w-[220px] md:justify-end">
                                <span className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-xs font-black text-[#123c8c] transition group-hover:bg-[#eaf1ff]">
                                  Lihat detail
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
