"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Camera,
  Eye,
  FileDown,
  ImageIcon,
  Loader2,
  Search,
  UserRound,
  Download,
  Printer,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

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

type StatusFilter = "all" | "present" | "late" | "pending" | "cuti";

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua Status" },
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "pending", label: "Pending" },
  { value: "cuti", label: "Cuti" },
];

function getStatusStyle(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (
    normalized === "present" ||
    normalized === "hadir" ||
    normalized.includes("masuk kerja")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (
    normalized === "late" ||
    normalized === "terlambat" ||
    normalized.includes("cuti") ||
    normalized.includes("sakit") ||
    normalized.includes("izin") ||
    normalized.includes("tidak")
  ) {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function getMonthLabel(month: number) {
  const date = new Date(getCurrentYear(), Math.max(0, month - 1), 1);

  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
  }).format(date);
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

      @media (prefers-reduced-motion: reduce) {
        .attendance-report-enter,
        .attendance-report-row-enter,
        .attendance-report-avatar-enter {
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
        {/* eslint-disable-next-line @next/next/no-img-element */}
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
  const [reports, setReports] = useState<AttendanceReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [month, setMonth] = useState(getCurrentMonth());
  const [year, setYear] = useState(getCurrentYear());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  function handleExportCSV() {
    if (reports.length === 0) return;
    const headers = ["Tanggal", "Nama Karyawan", "Kode/Email", "Jam Masuk", "Jam Keluar", "Durasi Kerja", "Mode Kerja", "Status"];
    const rows = reports.map((item) => [
      item.dateLabel,
      item.employeeName,
      item.employeeCode || "",
      item.checkIn,
      item.checkOut,
      item.duration,
      item.workModeLabel,
      item.statusLabel
    ]);
    const csvContent = "\uFEFF" + "sep=,\n" + [headers.join(","), ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Laporan_Kehadiran_FaceAttend_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handlePrintPDF() {
    window.print();
  }

  async function getAttendanceReports() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const queryParams = new URLSearchParams();

      if (selectedDate) {
        queryParams.set("date", selectedDate);
      } else {
        queryParams.set("month", String(month));
        queryParams.set("year", String(year));
      }

      if (searchKeyword.trim()) {
        queryParams.set("search", searchKeyword.trim());
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

  function handleExportPdf() {
    if (!reports.length || isLoading) return;

    const params = new URLSearchParams();

    if (selectedDate) {
      params.set("date", selectedDate);
    } else {
      params.set("month", String(month));
      params.set("year", String(year));
    }

    if (searchKeyword.trim()) {
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
    void getAttendanceReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, month, year, statusFilter]);

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

    return {
      total,
      totalDates,
      withPhoto,
      withLocation,
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
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
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
                    Data absensi
                  </p>
                </div>

                <div
                  className="attendance-report-row-enter rounded-2xl border border-blue-100 bg-blue-50 p-4"
                  style={{ animationDelay: "100ms" }}
                >
                  <p className="text-xs font-bold text-[#123c8c]">Tanggal</p>
                  <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                    {stats.totalDates}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#123c8c]/70">
                    Hari terdata
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
                  className="attendance-report-row-enter rounded-2xl border border-amber-100 bg-amber-50 p-4"
                  style={{ animationDelay: "180ms" }}
                >
                  <p className="text-xs font-bold text-amber-700">Ada Lokasi</p>
                  <h3 className="mt-3 text-3xl font-black text-amber-700">
                    {stats.withLocation}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-amber-700/70">
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
                  className="mt-6 grid gap-3 lg:grid-cols-[1.3fr_0.9fr_0.6fr_0.6fr_0.8fr_auto]"
                >
                  <div className="relative">
                    <Search
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      value={searchKeyword}
                      onChange={(event) => setSearchKeyword(event.target.value)}
                      placeholder="Cari nama / kode karyawan..."
                      className="attendance-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(event) => setSelectedDate(event.target.value)}
                    className="attendance-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />

                  <input
                    type="number"
                    value={month}
                    min={1}
                    max={12}
                    onChange={(event) => setMonth(Number(event.target.value))}
                    disabled={Boolean(selectedDate)}
                    placeholder="Bulan"
                    className="attendance-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <input
                    type="number"
                    value={year}
                    onChange={(event) => setYear(Number(event.target.value))}
                    disabled={Boolean(selectedDate)}
                    placeholder="Tahun"
                    className="attendance-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                  />

                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="attendance-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
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
                id="print-area-container"
                className="attendance-report-enter rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
                style={{ animationDelay: "150ms" }}
              >
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden;
                    }
                    #print-area-container, #print-area-container * {
                      visibility: visible;
                    }
                    #print-area-container {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      border: none !important;
                      box-shadow: none !important;
                      background: transparent !important;
                      padding: 0 !important;
                    }
                  }
                `}</style>

                {/* Print Only Header */}
                <div className="hidden print:block text-center mb-6">
                  <h1 className="text-2xl font-black uppercase text-[#123c8c]">Laporan Kehadiran Karyawan</h1>
                  <p className="text-sm font-bold text-slate-500">Aplikasi FaceAttend - Dicetak pada {new Date().toLocaleDateString("id-ID")}</p>
                </div>

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                      Rekap Absensi
                    </p>

                    <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                      Nama Karyawan per Tanggal
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 print:hidden">
                    <p className="text-sm font-semibold text-slate-500 mr-2">
                      {reports.length} data ditemukan
                    </p>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      disabled={reports.length === 0}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-xs font-black text-white shadow-md shadow-emerald-900/10 transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download size={15} />
                      Ekspor CSV
                    </button>

                    <button
                      type="button"
                      onClick={handleExportPdf}
                      disabled={isLoading || reports.length === 0}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 text-xs font-black text-white shadow-md shadow-blue-900/10 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FileDown size={15} />
                      Unduh PDF
                    </button>

                    <button
                      type="button"
                      onClick={handlePrintPDF}
                      disabled={reports.length === 0}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white text-[#123c8c] px-4 text-xs font-black shadow-md shadow-blue-900/5 transition hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Printer size={15} />
                      Cetak Layar
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  {isLoading ? (
                    <div className="attendance-report-row-enter flex items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-12 text-sm font-bold text-slate-500">
                      <Loader2 size={18} className="animate-spin text-[#123c8c]" />
                      Memuat rekap kehadiran...
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
                    <>
                      <div className="space-y-5 print:hidden">
                        {groupedReports.map((group, groupIndex) => (
                        <section
                          key={group.dateLabel}
                          className="attendance-report-row-enter rounded-[2rem] border border-blue-100 bg-[#f8fbff] dark:border-slate-800 dark:bg-[#0d1117] p-4 md:p-5"
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

                          <div className="mt-4 space-y-3">
                            {group.items.map((item, index) => (
                              <Link
                                key={item.id}
                                href={`/admin/laporan-kehadiran/${item.id}`}
                                className="attendance-report-row-enter group block rounded-[1.6rem] border border-blue-100 bg-white dark:border-slate-800 dark:bg-[#161b22] px-4 py-4 shadow-sm shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-[#123c8c]/30 hover:bg-[#fbfdff] dark:hover:bg-[#1c212a] hover:shadow-xl hover:shadow-slate-300/40 active:scale-[0.99] md:px-5"
                                style={{
                                  animationDelay: `${index * 45}ms`,
                                }}
                              >
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                  <div className="flex min-w-0 items-center gap-3 md:w-[260px]">
                                    <EmployeeProfileAvatar item={item} />

                                    <div className="min-w-0">
                                      <h4 className="truncate text-base font-black text-slate-950">
                                        {item.employeeName}
                                      </h4>

                                      <p className="mt-1 truncate text-xs font-bold text-slate-400">
                                        {item.employeeCode || item.workModeLabel}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-500 md:w-[260px]">
                                    <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                                      <p className="text-slate-400">Masuk</p>
                                      <p className="mt-1 font-black text-slate-800">
                                        {item.checkIn}
                                      </p>
                                    </div>

                                    <div className="rounded-2xl bg-[#f8fbff] px-4 py-3">
                                      <p className="text-slate-400">Keluar</p>
                                      <p className="mt-1 font-black text-slate-800">
                                        {item.checkOut}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-1 flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStatusStyle(
                                        item.status,
                                      )}`}
                                    >
                                      {item.statusLabel}
                                    </span>

                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-black text-[#123c8c]">
                                      {item.workModeLabel}
                                    </span>

                                    {item.hasPhoto ? (
                                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                                        Ada Foto
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                                        Tanpa Foto
                                      </span>
                                    )}

                                    {item.hasLocation ? (
                                      <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                                        Ada Lokasi
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="flex shrink-0 items-center justify-start md:w-[220px] md:justify-end">
                                    <span className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 text-xs font-black text-[#123c8c] transition group-hover:bg-[#eaf1ff]">
                                      <Eye size={15} />
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

                    <div className="hidden print:block mt-6">
                      <table className="w-full border-collapse border border-slate-300 text-sm">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Tanggal</th>
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Nama Karyawan</th>
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Kode Karyawan</th>
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Jam Masuk</th>
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Jam Keluar</th>
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Durasi</th>
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Mode</th>
                            <th className="border border-slate-300 px-3 py-2 text-left font-black">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((item) => (
                            <tr key={item.id}>
                              <td className="border border-slate-300 px-3 py-2">{item.dateLabel}</td>
                              <td className="border border-slate-300 px-3 py-2 font-bold">{item.employeeName}</td>
                              <td className="border border-slate-300 px-3 py-2">{item.employeeCode || "-"}</td>
                              <td className="border border-slate-300 px-3 py-2">{item.checkIn}</td>
                              <td className="border border-slate-300 px-3 py-2">{item.checkOut}</td>
                              <td className="border border-slate-300 px-3 py-2">{item.duration}</td>
                              <td className="border border-slate-300 px-3 py-2">{item.workModeLabel}</td>
                              <td className="border border-slate-300 px-3 py-2 font-bold">{item.statusLabel}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                  )}
                </div>
              </div>
        </section>
      </main>
    </MobileShell>
  );
}
