"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  AppBadge,
  AppButton,
  AppCard,
  AppEmptyState,
  AppLoadingState,
  AppSelect,
} from "@/components/ui/AppUI";

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

const years = [2024, 2025, 2026, 2027];

function formatDateLabel(date: string) {
  const parsedDate = new Date(`${date}T00:00:00`);
  const weekday = new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(
    parsedDate
  );
  const day = new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(
    parsedDate
  );
  const month = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
    parsedDate
  );

  return `${weekday}, ${day} ${month}`;
}

function formatShortDate(date: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T00:00:00`));
}

function formatWorkDuration(minutes: number) {
  if (!minutes || minutes <= 0) return "-";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) return `${hours}j ${remainingMinutes}m`;
  if (hours > 0) return `${hours}j`;

  return `${remainingMinutes}m`;
}

function getStatusVariant(status: string): "green" | "yellow" | "red" | "gray" | "blue" {
  const value = status.toLowerCase();

  if (value.includes("terlambat")) return "yellow";
  if (value.includes("cuti")) return "blue";
  if (value.includes("sakit")) return "red";
  if (value.includes("tidak")) return "red";
  if (value.includes("pulang cepat")) return "yellow";

  return "green";
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function HeroBadge({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
      {children}
    </span>
  );
}

function MobileHeader() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
            FaceAttend
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073456]">
            Laporan Presensi
          </h1>
        </div>

        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white ring-1 ring-[#123c8c]">
          <History size={24} strokeWidth={2.6} />
        </div>
      </div>
    </section>
  );
}

function DesktopHero({
  monthLabel,
  year,
  total,
  sort,
}: {
  monthLabel: string;
  year: number;
  total: number;
  sort: "desc" | "asc";
}) {
  return (
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
                Lihat daftar absensi, status kehadiran, jam masuk, jam keluar,
                dan durasi kerja berdasarkan periode yang dipilih.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <HeroBadge>
                  {monthLabel} {year}
                </HeroBadge>
                <HeroBadge>{total} Data</HeroBadge>
                <HeroBadge>{sort === "desc" ? "Terbaru" : "Terlama"}</HeroBadge>
              </div>
            </div>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/20">
            <CalendarDays size={28} strokeWidth={2.4} />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  large = false,
}: {
  label: string;
  value: ReactNode;
  large?: boolean;
}) {
  return (
    <AppCard padding="sm" className="rounded-3xl bg-[#f8fbff] shadow-none">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>

      <p
        className={cn(
          "mt-2 font-black text-slate-950",
          large ? "truncate text-lg md:text-2xl" : "text-2xl"
        )}
      >
        {value}
      </p>
    </AppCard>
  );
}

function FilterCard({
  month,
  year,
  sort,
  monthLabel,
  isLoading,
  onMonthChange,
  onYearChange,
  onSortChange,
  onApply,
}: {
  month: number;
  year: number;
  sort: "desc" | "asc";
  monthLabel: string;
  isLoading: boolean;
  onMonthChange: (value: number) => void;
  onYearChange: (value: number) => void;
  onSortChange: (value: "desc" | "asc") => void;
  onApply: () => void;
}) {
  return (
    <AppCard padding="md" className="rounded-[1.8rem] shadow-none md:p-6">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          <CalendarDays size={24} strokeWidth={2.6} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
            Filter Riwayat
          </p>

          <h2 className="mt-1 text-base font-black text-slate-950 md:text-lg">
            {monthLabel} {year}
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
        <AppSelect
          value={month}
          onChange={(event) => onMonthChange(Number(event.target.value))}
          className="!mt-0 h-13 md:h-14"
        >
          {months.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </AppSelect>

        <AppSelect
          value={year}
          onChange={(event) => onYearChange(Number(event.target.value))}
          className="!mt-0 h-13 md:h-14"
        >
          {years.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </AppSelect>

        <AppSelect
          value={sort}
          onChange={(event) => onSortChange(event.target.value as "desc" | "asc")}
          className="!mt-0 h-13 md:h-14"
        >
          <option value="desc">Terbaru</option>
          <option value="asc">Terlama</option>
        </AppSelect>

        <AppButton
          type="button"
          onClick={onApply}
          disabled={isLoading}
          className="h-13 md:h-14"
          leftIcon={
            isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Search size={18} />
            )
          }
        >
          Terapkan
        </AppButton>
      </div>
    </AppCard>
  );
}

function AttendanceRecordCard({ item }: { item: AttendanceRecord }) {
  const shortDate = formatShortDate(item.date).split(" ");
  const note =
    item.lateMinutes > 0
      ? { text: `Terlambat ${item.lateMinutes} menit`, className: "text-orange-600" }
      : item.earlyLeaveMinutes > 0
        ? {
            text: `Pulang cepat ${item.earlyLeaveMinutes} menit`,
            className: "text-amber-600",
          }
        : { text: "Normal", className: "text-emerald-600" };

  return (
    <Link
      href={`/history/${item.id}`}
      className="block rounded-3xl border border-blue-100 bg-white p-5 transition hover:bg-[#f8fbff] active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <p className="text-lg font-black leading-none">{shortDate[0]}</p>
            <p className="mt-1 text-[10px] font-black uppercase leading-none">
              {shortDate[1]}
            </p>
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-base font-black capitalize text-slate-950 md:text-xl">
              {formatDateLabel(item.date)}
            </h2>

            <AppBadge variant={getStatusVariant(item.status)} className="mt-2">
              {item.status}
            </AppBadge>

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

              <span className={note.className}>{note.text}</span>
            </div>
          </div>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f8fbff] text-slate-400">
          <ChevronRight size={20} strokeWidth={2.6} />
        </div>
      </div>
    </Link>
  );
}

function HistoryContent({
  isLoading,
  records,
  monthLabel,
  year,
}: {
  isLoading: boolean;
  records: AttendanceRecord[];
  monthLabel: string;
  year: number;
}) {
  if (isLoading) {
    return <AppLoadingState text="Memuat riwayat absensi..." />;
  }

  if (!records.length) {
    return (
      <AppEmptyState
        icon={<CalendarDays size={28} strokeWidth={2.6} />}
        title="Belum ada data absensi"
        description={`Data absensi untuk periode ${monthLabel} ${year} belum tersedia.`}
      />
    );
  }

  return records.map((item) => (
    <AttendanceRecordCard key={item.id} item={item} />
  ));
}

export default function HistoryPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonthLabel = useMemo(
    () => months.find((item) => item.value === month)?.label || "",
    [month]
  );

  async function getHistory() {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/attendance/history?month=${month}&year=${year}&sort=${sort}`,
        { method: "GET", cache: "no-store" }
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
        <MobileHeader />

        <DesktopHero
          monthLabel={currentMonthLabel}
          year={year}
          total={records.length}
          sort={sort}
        />

        <section className="mx-auto max-w-7xl rounded-t-[2.5rem] bg-white px-5 pb-10 pt-8 md:mt-8 md:rounded-[2.5rem] md:px-8 lg:px-10">
          <FilterCard
            month={month}
            year={year}
            sort={sort}
            monthLabel={currentMonthLabel}
            isLoading={isLoading}
            onMonthChange={setMonth}
            onYearChange={setYear}
            onSortChange={setSort}
            onApply={getHistory}
          />

          <div className="mt-6 grid grid-cols-3 gap-3">
            <StatCard label="Total" value={records.length} />
            <StatCard label="Bulan" value={currentMonthLabel} large />
            <StatCard label="Tahun" value={year} />
          </div>

          <div className="mt-6 space-y-4">
            <HistoryContent
              isLoading={isLoading}
              records={records}
              monthLabel={currentMonthLabel}
              year={year}
            />
          </div>
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}