"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  History,
  Loader2,
  Search,
  TimerReset,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type AttendanceRecord = {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workMinutes: number;
};

const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

function formatDateLabel(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  const day = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
  }).format(parsedDate);

  const month = new Intl.DateTimeFormat("id-ID", {
    month: "long",
  }).format(parsedDate);

  const weekday = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
  }).format(parsedDate);

  return `${weekday}, ${day} ${month}`;
}

function formatShortDate(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(parsedDate);
}

function formatWorkDuration(minutes: number) {
  if (!minutes || minutes <= 0) return "-";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}j ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}j`;
  }

  return `${remainingMinutes}m`;
}

function getStatusStyle(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("terlambat")) {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (normalizedStatus.includes("cuti")) {
    return "bg-purple-50 text-purple-700 ring-purple-100";
  }

  if (normalizedStatus.includes("sakit")) {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (normalizedStatus.includes("tidak")) {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (normalizedStatus.includes("pulang cepat")) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

export default function HistoryPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonthLabel = useMemo(() => {
    return months.find((item) => item.value === month)?.label || "";
  }, [month]);

  async function getHistory() {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/attendance/history?month=${month}&year=${year}&sort=${sort}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        setRecords([]);
        return;
      }

      const data = await response.json();
      setRecords(data.records || []);
    } catch (error) {
      console.error("Gagal mengambil history:", error);
      setRecords([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    getHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, sort]);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <div className="hidden md:block">
        <AppHeader
          title="History"
          subtitle="Riwayat absensi karyawan"
          rightLabel={`${currentMonthLabel} ${year}`}
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-28 text-slate-950">
        <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                FaceAttend
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073456]">
                Laporan Presensi
              </h1>

              <p className="mt-2 text-sm font-bold text-slate-500">
                Riwayat kehadiran dan detail absensi kamu.
              </p>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white ring-1 ring-[#123c8c]">
              <History size={24} strokeWidth={2.6} />
            </div>
          </div>
        </section>

        <section className="mx-auto hidden max-w-7xl px-10 pt-8 md:block lg:px-16">
          <div className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-8 text-white">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute bottom-[-7rem] right-24 h-60 w-60 rounded-full bg-blue-300/10" />

            <div className="relative z-10 flex items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-white/15 text-white ring-1 ring-white/20">
                  <History size={38} strokeWidth={2.5} />
                </div>

                <div>
                  <h1 className="text-4xl font-black tracking-tight">
                    Riwayat Presensi
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                    Lihat daftar absensi, status kehadiran, jam masuk, jam
                    keluar, dan durasi kerja berdasarkan periode yang dipilih.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      {currentMonthLabel} {year}
                    </span>

                    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      {records.length} Data
                    </span>

                    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      {sort === "desc" ? "Terbaru" : "Terlama"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/20">
                <CalendarDays size={28} strokeWidth={2.4} />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl rounded-t-[2.5rem] bg-white px-5 pb-10 pt-8 md:mt-8 md:rounded-[2.5rem] md:px-8 lg:px-10">
          <div className="rounded-[1.8rem] border border-blue-100 bg-white p-5 md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                <CalendarDays size={24} strokeWidth={2.6} />
              </div>

              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Filter Riwayat
                </p>

                <h2 className="mt-1 text-base font-black text-slate-950 md:text-lg">
                  {currentMonthLabel} {year}
                </h2>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="h-13 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 md:h-14"
              >
                {months.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="h-13 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 md:h-14"
              >
                {[2024, 2025, 2026, 2027].map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={sort}
                onChange={(event) =>
                  setSort(event.target.value as "desc" | "asc")
                }
                className="h-13 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 md:h-14"
              >
                <option value="desc">Terbaru</option>
                <option value="asc">Terlama</option>
              </select>

              <button
                type="button"
                onClick={getHistory}
                className="inline-flex h-13 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-6 text-sm font-black text-white transition active:scale-[0.98] md:h-14"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                Terapkan
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3">
            <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Total
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950">
                {records.length}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Bulan
              </p>

              <p className="mt-2 truncate text-lg font-black text-slate-950 md:text-2xl">
                {currentMonthLabel}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Tahun
              </p>

              <p className="mt-2 text-2xl font-black text-slate-950">{year}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 text-sm font-bold text-slate-500">
                <Loader2 size={20} className="animate-spin text-[#123c8c]" />
                Memuat riwayat absensi...
              </div>
            ) : records.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf1ff] text-[#123c8c]">
                  <CalendarDays size={28} strokeWidth={2.6} />
                </div>

                <p className="mt-4 text-base font-black text-slate-700">
                  Belum ada data absensi
                </p>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-400">
                  Data absensi untuk periode {currentMonthLabel} {year} belum
                  tersedia.
                </p>
              </div>
            ) : (
              records.map((item) => (
                <Link
                  key={item.id}
                  href={`/history/${item.id}`}
                  className="block rounded-3xl border border-blue-100 bg-white p-5 transition hover:bg-[#f8fbff] active:scale-[0.99]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                        <p className="text-lg font-black leading-none">
                          {formatShortDate(item.date).split(" ")[0]}
                        </p>

                        <p className="mt-1 text-[10px] font-black uppercase leading-none">
                          {formatShortDate(item.date).split(" ")[1]}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-base font-black capitalize text-slate-950 md:text-xl">
                          {formatDateLabel(item.date)}
                        </h2>

                        <div
                          className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[11px] font-black ring-1 md:text-xs ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </div>

                        <div className="mt-4 grid gap-2 text-sm font-bold text-slate-500 sm:grid-cols-3">
                          <div className="flex items-center gap-2">
                            <Clock3
                              size={17}
                              className="shrink-0 text-[#123c8c]"
                              strokeWidth={2.6}
                            />
                            <span>
                              {item.checkIn} - {item.checkOut}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <TimerReset
                              size={17}
                              className="shrink-0 text-[#123c8c]"
                              strokeWidth={2.6}
                            />
                            <span>{formatWorkDuration(item.workMinutes)}</span>
                          </div>

                          {item.lateMinutes > 0 ? (
                            <span className="text-orange-600">
                              Terlambat {item.lateMinutes} menit
                            </span>
                          ) : item.earlyLeaveMinutes > 0 ? (
                            <span className="text-amber-600">
                              Pulang cepat {item.earlyLeaveMinutes} menit
                            </span>
                          ) : (
                            <span className="text-emerald-600">Normal</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f8fbff] text-slate-400">
                      <ChevronRight size={20} strokeWidth={2.6} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}
