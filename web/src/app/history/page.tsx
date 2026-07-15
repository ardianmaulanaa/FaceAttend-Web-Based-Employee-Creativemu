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
  Coins,
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

type ReimbursementClaim = {
  id: string;
  attendanceId: string;
  date: string;
  amount: number;
  note: string;
  status: "pending" | "approved" | "rejected";
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
    parsedDate,
  );
  const day = new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(
    parsedDate,
  );
  const month = new Intl.DateTimeFormat("id-ID", { month: "long" }).format(
    parsedDate,
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

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}j ${remainingMinutes}m`;
  }

  if (hours > 0) return `${hours}j`;

  return `${remainingMinutes}m`;
}

function getStatusVariant(
  status: string,
): "green" | "yellow" | "red" | "gray" | "blue" {
  const value = status.toLowerCase();

  if (
    value.includes("terlambat") ||
    value.includes("cuti") ||
    value.includes("sakit") ||
    value.includes("izin") ||
    value.includes("tidak") ||
    value.includes("mangkir")
  ) {
    return "red";
  }

  if (value.includes("pulang cepat")) return "yellow";

  return "green";
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function HistoryMotionStyles() {
  return (
    <style>{`
      @keyframes historyEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes historyRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes historyIconPop {
        0% {
          opacity: 0;
          transform: scale(0.92) translateY(8px);
        }

        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes historyFloatGlow {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }

        50% {
          transform: translate3d(12px, -10px, 0) scale(1.04);
        }
      }

      .history-enter {
        animation: historyEnter 340ms ease-out both;
      }

      .history-row-enter {
        opacity: 0;
        animation: historyRowEnter 300ms ease-out both;
      }

      .history-icon-pop {
        animation: historyIconPop 280ms ease-out both;
      }

      .history-float-glow {
        animation: historyFloatGlow 6s ease-in-out infinite;
      }

      .history-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease,
          transform 180ms ease;
      }

      .history-field:focus-within {
        transform: translateY(-1px);
      }

      @media (prefers-reduced-motion: reduce) {
        .history-enter,
        .history-row-enter,
        .history-icon-pop,
        .history-float-glow {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }

        .history-field:focus-within {
          transform: none !important;
        }
      }
    `}</style>
  );
}

function HeroBadge({
  children,
  delay = "0ms",
}: {
  children: ReactNode;
  delay?: string;
}) {
  return (
    <span
      className="history-row-enter rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20"
      style={{ animationDelay: delay }}
    >
      {children}
    </span>
  );
}

function MobileHeader() {
  return (
    <section className="history-enter mx-auto max-w-7xl px-5 pt-7 md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
            FaceAttend
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073456]">
            Laporan Presensi
          </h1>
        </div>

        <div className="history-icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white ring-1 ring-[#123c8c]">
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
      <div className="history-enter relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-8 text-white shadow-2xl shadow-blue-900/25">
        <div className="history-float-glow absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
        <div className="history-float-glow absolute bottom-[-7rem] right-24 h-60 w-60 rounded-full bg-blue-300/10" />

        <div className="relative z-10 flex items-center justify-between gap-8">
          <div className="flex items-center gap-5">
            <div className="history-icon-pop flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-white/15 text-white ring-1 ring-white/20">
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
                <HeroBadge delay="80ms">
                  {monthLabel} {year}
                </HeroBadge>
                <HeroBadge delay="120ms">{total} Data</HeroBadge>
                <HeroBadge delay="160ms">
                  {sort === "desc" ? "Terbaru" : "Terlama"}
                </HeroBadge>
              </div>
            </div>
          </div>

          <div className="history-icon-pop flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/20">
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
  delay = "0ms",
}: {
  label: string;
  value: ReactNode;
  large?: boolean;
  delay?: string;
}) {
  return (
    <div className="history-row-enter" style={{ animationDelay: delay }}>
      <AppCard
        padding="sm"
        className="rounded-3xl bg-[#f8fbff] shadow-none transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-lg hover:shadow-slate-200/60"
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>

        <p
          className={cn(
            "mt-2 font-black text-slate-950",
            large ? "truncate text-lg md:text-2xl" : "text-2xl",
          )}
        >
          {value}
        </p>
      </AppCard>
    </div>
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
    <AppCard
      padding="md"
      className="history-enter rounded-[1.8rem] shadow-none md:p-6"
    >
      <div className="flex items-center gap-4">
        <div className="history-icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
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
        <div className="history-field">
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
        </div>

        <div className="history-field">
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
        </div>

        <div className="history-field">
          <AppSelect
            value={sort}
            onChange={(event) =>
              onSortChange(event.target.value as "desc" | "asc")
            }
            className="!mt-0 h-13 md:h-14"
          >
            <option value="desc">Terbaru</option>
            <option value="asc">Terlama</option>
          </AppSelect>
        </div>

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

function AttendanceRecordCard({
  item,
  delay = "0ms",
  profile,
}: {
  item: AttendanceRecord;
  delay?: string;
  profile?: any;
}) {
  const shortDate = formatShortDate(item.date).split(" ");
  const [claim, setClaim] = useState<ReimbursementClaim | null>(null);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("faceattend_reimbursements");
    if (raw) {
      const claims: any[] = JSON.parse(raw);
      const found = claims.find((c) => c.attendanceId === item.id);
      if (found) setClaim(found);
    }
  }, [item.id]);

  function handleClaimSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) return;

    const newClaim = {
      id: `CLM-${Date.now()}`,
      attendanceId: item.id,
      date: item.date,
      amount: numAmount,
      note,
      status: "pending",
      employeeName: profile?.name || "Karyawan",
      employeeCode: profile?.email || "EMP-01",
    };

    const raw = localStorage.getItem("faceattend_reimbursements");
    const claims = raw ? JSON.parse(raw) : [];
    claims.push(newClaim);
    localStorage.setItem("faceattend_reimbursements", JSON.stringify(claims));

    setClaim(newClaim as any);
    setShowClaimForm(false);
    setAmount("");
    setNote("");
  }

  const noteDetails =
    item.lateMinutes > 0
      ? {
          text: `Terlambat ${item.lateMinutes} menit`,
          className: "text-orange-600",
        }
      : item.earlyLeaveMinutes > 0
        ? {
            text: `Pulang cepat ${item.earlyLeaveMinutes} menit`,
            className: "text-amber-600",
          }
        : { text: "Normal", className: "text-emerald-600" };

  return (
    <div
      className="history-row-enter block rounded-3xl border border-blue-100 bg-white p-5 transition duration-200 hover:shadow-xl hover:shadow-slate-200/60"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 gap-4 flex-1">
          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <p className="text-lg font-black leading-none">{shortDate[0]}</p>
            <p className="mt-1 text-[10px] font-black uppercase leading-none">
              {shortDate[1]}
            </p>
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black capitalize text-slate-950 md:text-xl">
              {formatDateLabel(item.date)}
            </h2>

            <div className="flex flex-wrap gap-2 mt-2">
              <AppBadge variant={getStatusVariant(item.status)}>
                {item.status}
              </AppBadge>

              {claim && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase shadow-sm ${
                    claim.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : claim.status === "rejected"
                      ? "bg-red-100 text-red-700"
                      : "bg-orange-100 text-orange-700 animate-pulse"
                  }`}
                >
                  Reimbursement: Rp {claim.amount.toLocaleString("id-ID")} ({claim.status === "approved" ? "Disetujui" : claim.status === "rejected" ? "Ditolak" : "Pending"})
                </span>
              )}
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

              <span className={noteDetails.className}>{noteDetails.text}</span>
            </div>

            {/* REIMBURSEMENT ACTION */}
            {!claim && !showClaimForm && (
              <button
                type="button"
                onClick={() => setShowClaimForm(true)}
                className="mt-4 flex items-center gap-1.5 text-xs font-black text-blue-600 hover:text-blue-800"
              >
                <Coins size={14} /> Klaim Reimbursement Perjalanan
              </button>
            )}

            {showClaimForm && (
              <form onSubmit={handleClaimSubmit} className="mt-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
                <p className="text-xs font-black text-slate-700">Form Klaim Bensin / Makan</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="number"
                    placeholder="Nominal Klaim (Rp)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Keterangan (contoh: Struk bensin visit)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 placeholder:text-slate-400"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowClaimForm(false)}
                    className="rounded-lg bg-slate-200 px-3 py-1.5 text-[10px] font-black text-slate-600"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-[10px] font-black text-white hover:bg-blue-700"
                  >
                    Kirim Klaim
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistoryContent({
  isLoading,
  records,
  monthLabel,
  year,
  profile,
}: {
  isLoading: boolean;
  records: AttendanceRecord[];
  monthLabel: string;
  year: number;
  profile?: any;
}) {
  if (isLoading) {
    return (
      <div className="history-row-enter">
        <AppLoadingState text="Memuat riwayat absensi..." />
      </div>
    );
  }

  if (!records.length) {
    return (
      <div className="history-row-enter">
        <AppEmptyState
          icon={<CalendarDays size={28} strokeWidth={2.6} />}
          title="Belum ada data absensi"
          description={`Data absensi untuk periode ${monthLabel} ${year} belum tersedia.`}
        />
      </div>
    );
  }

  return records.map((item, index) => (
    <AttendanceRecordCard key={item.id} item={item} delay={`${index * 55}ms`} profile={profile} />
  ));
}

export default function HistoryPage() {
  const today = new Date();

  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const currentMonthLabel = useMemo(
    () => months.find((item) => item.value === month)?.label || "",
    [month],
  );

  async function getHistory() {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/attendance/history?month=${month}&year=${year}&sort=${sort}`,
        { method: "GET", cache: "no-store" },
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
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.user);
        }
      } catch (err) {
        console.error(err);
      }
    }
    void loadProfile();
  }, []);

  useEffect(() => {
    void getHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year, sort]);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <HistoryMotionStyles />

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

        <section className="history-enter mx-auto max-w-7xl rounded-t-[2.5rem] bg-white px-5 pb-10 pt-8 md:mt-8 md:rounded-[2.5rem] md:px-8 lg:px-10">
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
            <StatCard label="Total" value={records.length} delay="60ms" />
            <StatCard
              label="Bulan"
              value={currentMonthLabel}
              large
              delay="100ms"
            />
            <StatCard label="Tahun" value={year} delay="140ms" />
          </div>

          <div className="mt-6 space-y-4">
            <HistoryContent
              isLoading={isLoading}
              records={records}
              monthLabel={currentMonthLabel}
              year={year}
              profile={profile}
            />
          </div>
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}
