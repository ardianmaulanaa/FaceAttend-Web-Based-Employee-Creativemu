"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock3, Search } from "lucide-react";
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

  const month = new Intl.DateTimeFormat("id-ID", {
    month: "long",
  }).format(parsedDate);

  const day = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
  }).format(parsedDate);

  const weekday = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
  }).format(parsedDate);

  return `${month} ${day} ${weekday}`;
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

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

export default function HistoryPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [sort, setSort] = useState<"desc" | "asc">("desc");

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [month, year, sort]);

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="History"
        subtitle="Riwayat absensi karyawan"
        rightLabel={authUser?.id || "EMP"}
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
              <CalendarDays size={24} strokeWidth={2.6} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Filter Riwayat
              </p>

              <h2 className="mt-1 text-lg font-black text-slate-950">
                Pilih bulan, tahun, dan urutan absensi.
              </h2>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="h-14 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
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
              className="h-14 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
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
              className="h-14 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
            >
              <option value="desc">Terbaru - Terlama</option>
              <option value="asc">Terlama - Terbaru</option>
            </select>

            <button
              type="button"
              onClick={getHistory}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-6 text-sm font-black text-white shadow-lg shadow-blue-900/20 active:scale-[0.98]"
            >
              <Search size={18} />
              Terapkan
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-3xl bg-white p-6 text-sm font-bold text-slate-500 shadow-lg">
              Memuat riwayat absensi...
            </div>
          ) : records.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-sm font-bold text-slate-500 shadow-lg">
              Belum ada data absensi pada periode ini.
            </div>
          ) : (
            records.map((item) => (
              <Link
                key={item.id}
                href={`/history/${item.id}`}
                className="block rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl active:scale-[0.99]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-xl font-black capitalize text-slate-950">
                      {formatDateLabel(item.date)}
                    </h2>

                    <div
                      className={`mt-3 inline-flex rounded-full px-4 py-2 text-xs font-black ring-1 ${getStatusStyle(
                        item.status
                      )}`}
                    >
                      {item.status}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8ff] px-4 py-3 text-[#123c8c]">
                    <Clock3 size={20} strokeWidth={2.6} />

                    <p className="text-lg font-black">
                      {item.checkIn} - {item.checkOut}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
