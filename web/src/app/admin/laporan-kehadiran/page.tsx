"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Camera,
  Clock3,
  Eye,
  ImageIcon,
  Loader2,
  RefreshCcw,
  Search,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

type AttendanceReport = {
  id: string;
  employeeName: string;
  employeeCode: string | null;
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

function getCurrentMonth() {
  return new Date().getMonth() + 1;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
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
        }
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
          : "Gagal mengambil laporan kehadiran."
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    getAttendanceReports();
  }

  useEffect(() => {
    getAttendanceReports();
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
      <AppHeader
        title="Laporan Kehadiran"
        subtitle="Rekap absensi karyawan berdasarkan tanggal"
        variant="admin"
      />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-6 text-white md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <Camera size={25} strokeWidth={2.6} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                      Attendance Report
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                      Rekap Kehadiran Karyawan
                    </h2>
                  </div>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
                  Admin dapat melihat daftar karyawan berdasarkan tanggal
                  absensi. Klik nama karyawan untuk membuka detail foto bukti
                  absen dan lokasi kehadiran.
                </p>

                <button
                  type="button"
                  onClick={getAttendanceReports}
                  disabled={isLoading}
                  className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCcw size={16} />
                  )}
                  Refresh Data
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4 md:p-6">
                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
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

                <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                  <p className="text-xs font-bold text-[#123c8c]">Tanggal</p>
                  <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                    {stats.totalDates}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-[#123c8c]/70">
                    Hari terdata
                  </p>
                </div>

                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-bold text-emerald-700">
                    Ada Foto
                  </p>
                  <h3 className="mt-3 text-3xl font-black text-emerald-700">
                    {stats.withPhoto}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-emerald-700/70">
                    Bukti absen
                  </p>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-xs font-bold text-amber-700">
                    Ada Lokasi
                  </p>
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

          <div className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Filter Data
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Cari Rekap Kehadiran
                </h2>
              </div>

              <p className="max-w-md text-sm leading-6 text-slate-500">
                Kosongkan tanggal jika ingin melihat rekap dalam satu bulan.
              </p>
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
                  className="h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
              />

              <input
                type="number"
                value={month}
                min={1}
                max={12}
                onChange={(event) => setMonth(Number(event.target.value))}
                disabled={Boolean(selectedDate)}
                placeholder="Bulan"
                className="h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <input
                type="number"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                disabled={Boolean(selectedDate)}
                placeholder="Tahun"
                className="h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
              />

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98]"
              >
                <Search size={17} />
                Cari
              </button>
            </form>
          </div>

          {errorMessage ? (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Rekap Absensi
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Nama Karyawan per Tanggal
                </h2>
              </div>

              <p className="text-sm font-semibold text-slate-500">
                {reports.length} data ditemukan
              </p>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-12 text-sm font-bold text-slate-500">
                  <Loader2 size={18} className="animate-spin text-[#123c8c]" />
                  Memuat rekap kehadiran...
                </div>
              ) : groupedReports.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                    <ImageIcon size={26} strokeWidth={2.6} />
                  </div>

                  <p className="mt-4 text-sm font-black text-slate-500">
                    Belum ada rekap kehadiran pada filter ini.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {groupedReports.map((group) => (
                    <section
                      key={group.dateLabel}
                      className="rounded-[2rem] border border-blue-100 bg-[#f8fbff] p-4 md:p-5"
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

                      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {group.items.map((item) => (
                          <Link
                            key={item.id}
                            href={`/admin/laporan-kehadiran/${item.id}`}
                            className="group rounded-3xl border border-blue-100 bg-white p-4 shadow-sm shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 active:scale-[0.99]"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                                  <UserRound size={23} strokeWidth={2.6} />
                                </div>

                                <div className="min-w-0">
                                  <h4 className="truncate text-base font-black text-slate-950">
                                    {item.employeeName}
                                  </h4>

                                  <p className="mt-1 text-xs font-bold text-slate-500">
                                    {item.employeeCode || "-"}
                                  </p>
                                </div>
                              </div>

                              <span
                                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-black ring-1 ${getStatusStyle(
                                  item.status
                                )}`}
                              >
                                {item.statusLabel}
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-bold text-slate-500">
                              <div className="rounded-2xl bg-[#f8fbff] p-3">
                                <p className="text-slate-400">Masuk</p>
                                <p className="mt-1 font-black text-slate-800">
                                  {item.checkIn}
                                </p>
                              </div>

                              <div className="rounded-2xl bg-[#f8fbff] p-3">
                                <p className="text-slate-400">Keluar</p>
                                <p className="mt-1 font-black text-slate-800">
                                  {item.checkOut}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
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

                            <div className="mt-4 inline-flex items-center gap-2 text-xs font-black text-[#123c8c]">
                              <Eye size={15} />
                              Lihat detail foto dan lokasi
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