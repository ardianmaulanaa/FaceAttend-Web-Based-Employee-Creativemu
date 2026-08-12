"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  Search,
  Trophy,
  UserRound,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import { AppLoadingState } from "@/components/ui/AppUI";

type SortKey =
  | "name"
  | "hadir"
  | "terlambat"
  | "izinSakit"
  | "cuti"
  | "sisaKontrak"
  | "statusPosisi";

type SortDirection = "asc" | "desc";

type EmployeeAttendanceSummary = {
  hadir: number;
  terlambat: number;
  terlambatHari?: number;
  izin: number;
  sakit: number;
  cuti: number;
  totalWorkMinutes: number;
};

type RankedEmployee = {
  id: string;
  name: string;
  employeeCode?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  employmentStartDate?: string | null;
  employmentEndDate?: string | null;
  employmentStatus?: string | null;
  summary: EmployeeAttendanceSummary;
};

type RecapResponse = {
  success?: boolean;
  message?: string;
  employees?: RankedEmployee[];
};

type RankedEmployeeRow = RankedEmployee & {
  rankScore: number;
  netWorkMinutes: number;
  izinSakit: number;
  lateMinutes: number;
  remainingContractDays: number | null;
  remainingContractLabel: string;
  positionStatusLabel: string;
};

const sortLabels: Record<SortKey, string> = {
  name: "Nama Karyawan",
  hadir: "Hadir",
  terlambat: "Telat (Menit)",
  izinSakit: "Izin/Sakit",
  cuti: "Cuti",
  sisaKontrak: "Sisa Kontrak",
  statusPosisi: "Status Posisi",
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function getDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultStartDate() {
  const date = new Date();

  date.setDate(1);

  return getDateInputValue(date);
}

function getDefaultEndDate() {
  return getDateInputValue(new Date());
}

function getRemainingContractDays(value?: string | null) {
  if (!value) return null;

  const today = new Date();
  const endDate = new Date(value);

  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  if (Number.isNaN(endDate.getTime())) return null;

  return Math.ceil((endDate.getTime() - today.getTime()) / 86_400_000);
}

function getRemainingContractLabel(days: number | null) {
  if (days === null) return "-";
  if (days < 0) return "Berakhir";

  return `Sisa ${days} hari`;
}

function getPositionStatusLabel(value?: string | null) {
  const text = String(value || "").trim();
  const normalized = text.toLowerCase();

  if (!text) return "-";
  if (normalized.includes("tetap") || normalized.includes("kartap")) {
    return "Karyawan Tetap";
  }
  if (normalized.includes("magang")) return "Magang";
  if (normalized.includes("kontrak")) return "Kontrak";

  return text;
}

function getContractBadgeClass(days: number | null) {
  if (days === null) return "bg-slate-100 text-slate-500 ring-slate-200";
  if (days <= 30) return "bg-red-50 text-red-600 ring-red-100";
  if (days <= 90) return "bg-orange-50 text-orange-600 ring-orange-100";

  return "bg-amber-50 text-amber-600 ring-amber-100";
}

function getNetWorkMinutes(summary: EmployeeAttendanceSummary) {
  return Math.max(
    Number(summary.totalWorkMinutes || 0) - Number(summary.terlambat || 0),
    0,
  );
}

function formatMinutes(minutes: number) {
  if (minutes <= 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}j ${remainingMinutes}m`;
  }

  if (hours > 0) return `${hours}j`;

  return `${remainingMinutes}m`;
}

function RankMotionStyles() {
  return (
    <style>{`
      @keyframes rankEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .rank-enter {
        animation: rankEnter 320ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .rank-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminAttendanceRankPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<RankedEmployee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const loadRank = useCallback(async () => {
    if (!startDate || !endDate) return;

    if (startDate > endDate) {
      setEmployees([]);
      setErrorMessage("Tanggal mulai tidak boleh melewati tanggal akhir.");
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage("");

      const queryParams = new URLSearchParams({
        startDate,
        endDate,
        from: "rank",
      });
      const response = await fetch(
        `/api/admin/employee-attendance-recap?${queryParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const data: RecapResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setEmployees([]);
        setErrorMessage(data.message || "Gagal mengambil rank kehadiran.");
        return;
      }

      setEmployees(data.employees || []);
    } catch (error) {
      setEmployees([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil rank kehadiran.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    void loadRank();
  }, [loadRank]);

  const rankedEmployees = useMemo<RankedEmployeeRow[]>(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const rows = employees
      .map((employee) => {
        const izinSakit = employee.summary.izin + employee.summary.sakit;
        const lateMinutes = Number(employee.summary.terlambat || 0);
        const netWorkMinutes = getNetWorkMinutes(employee.summary);
        const remainingContractDays = getRemainingContractDays(
          employee.employmentEndDate,
        );

        return {
          ...employee,
          rankScore: netWorkMinutes,
          netWorkMinutes,
          izinSakit,
          lateMinutes,
          remainingContractDays,
          remainingContractLabel: getRemainingContractLabel(
            remainingContractDays,
          ),
          positionStatusLabel: getPositionStatusLabel(
            employee.employmentStatus,
          ),
        };
      })
      .filter((employee) => {
        if (!keyword) return true;

        return [
          employee.name,
          employee.employeeCode,
          employee.positionStatusLabel,
          employee.remainingContractLabel,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(keyword);
      });

    rows.sort((first, second) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      const firstHasAttendance = first.summary.hadir > 0;
      const secondHasAttendance = second.summary.hadir > 0;

      if (firstHasAttendance !== secondHasAttendance) {
        return firstHasAttendance ? -1 : 1;
      }

      const netWorkDifference =
        (first.netWorkMinutes - second.netWorkMinutes) * direction;

      if (netWorkDifference !== 0) return netWorkDifference;

      const totalWorkDifference =
        (Number(first.summary.totalWorkMinutes || 0) -
          Number(second.summary.totalWorkMinutes || 0)) *
        direction;

      if (totalWorkDifference !== 0) return totalWorkDifference;

      const lateDifference = first.lateMinutes - second.lateMinutes;

      if (lateDifference !== 0) return lateDifference;

      const presentDifference = second.summary.hadir - first.summary.hadir;

      if (presentDifference !== 0) return presentDifference;

      return first.name.localeCompare(second.name);
    });

    return rows;
  }, [employees, searchKeyword, sortDirection]);

  const openEmployeeDetail = useCallback(
    (employeeId: string) => {
      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });

      router.push(
        `/admin/rekap-kehadiran-karyawan/${employeeId}?${queryParams.toString()}`,
      );
    },
    [endDate, router, startDate],
  );

  const topEmployee = rankedEmployees[0] || null;
  const averagePresent =
    rankedEmployees.length > 0
      ? Math.round(
          rankedEmployees.reduce(
            (total, employee) => total + employee.summary.hadir,
            0,
          ) / rankedEmployees.length,
        )
      : 0;

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <RankMotionStyles />

      <AppHeader title="Rank Kehadiran Karyawan" variant="admin" />

      <main className="min-h-dvh bg-[#f6f8fc] pb-10 text-slate-950">
        <section className="mx-auto max-w-7xl space-y-5 px-4 py-5 md:px-8 lg:px-12">
          <div className="rank-enter grid gap-3 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#123c8c] text-white">
                  <Trophy size={25} strokeWidth={2.7} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                    Ranking
                  </p>
                  <h2 className="mt-1 truncate text-2xl font-black text-[#123456] md:text-3xl">
                    Kehadiran Karyawan
                  </h2>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Peringkat Teratas
              </p>
              <p className="mt-3 truncate text-xl font-black text-[#123456]">
                {topEmployee?.name || "-"}
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Rata-rata Hadir
              </p>
              <p className="mt-3 text-3xl font-black text-emerald-600">
                {averagePresent}
              </p>
            </div>
          </div>

          <div
            className="rank-enter grid w-full max-w-full gap-3 overflow-hidden rounded-3xl border border-blue-100 bg-white p-4 shadow-xl shadow-slate-200/60 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)_auto]"
            style={{ animationDelay: "80ms" }}
          >
            <label className="block min-w-0">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                Tanggal Mulai
              </span>
              <div className="relative min-w-0">
                <CalendarDays
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-12 w-full min-w-0 max-w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-[#123456] outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                Tanggal Akhir
              </span>
              <div className="relative min-w-0">
                <CalendarDays
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-12 w-full min-w-0 max-w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-[#123456] outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                Cari Karyawan
              </span>
              <div className="relative min-w-0">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Cari nama atau status..."
                  className="h-12 w-full min-w-0 max-w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-[#123456] outline-none transition placeholder:text-slate-400 focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <label className="block min-w-0">
              <span className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                Urutan Kerja Bersih
              </span>
              <div className="relative">
                <select
                  value={sortDirection}
                  onChange={(event) =>
                    setSortDirection(event.target.value as SortDirection)
                  }
                  className="h-12 w-full appearance-none rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-4 pr-11 text-sm font-black text-[#123456] outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="desc">Menaik</option>
                  <option value="asc">Menurun</option>
                </select>
                <ChevronDown
                  size={18}
                  strokeWidth={2.8}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#123c8c]"
                />
              </div>
            </label>
          </div>

          {errorMessage ? (
            <div className="rank-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-600">
              {errorMessage}
            </div>
          ) : null}

          <div
            className="rank-enter overflow-hidden rounded-[1.8rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/60"
            style={{ animationDelay: "120ms" }}
          >
            {isLoading ? (
              <div className="p-5">
                <AppLoadingState text="Memuat rank kehadiran karyawan..." />
              </div>
            ) : rankedEmployees.length ? (
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-[#eef5ff] text-xs font-black uppercase tracking-[0.08em] text-slate-500">
                      <th className="w-20 px-5 py-4 text-center">Rank</th>
                      <th className="px-5 py-4">{sortLabels.name}</th>
                      <th className="px-5 py-4 text-center">{sortLabels.hadir}</th>
                      <th className="px-5 py-4 text-center">Total Kerja</th>
                      <th className="px-5 py-4 text-center text-[#123c8c]">
                        {sortLabels.terlambat}
                      </th>
                      <th className="px-5 py-4 text-center">Durasi Efektif</th>
                      <th className="px-5 py-4 text-center">{sortLabels.izinSakit}</th>
                      <th className="px-5 py-4 text-center">{sortLabels.cuti}</th>
                      <th className="px-5 py-4 text-center">{sortLabels.sisaKontrak}</th>
                      <th className="px-5 py-4 text-center">{sortLabels.statusPosisi}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {rankedEmployees.map((employee, index) => {
                      const employeePhoto =
                        employee.profile_photo || employee.profile_photo_url;

                      return (
                        <tr
                          key={employee.id}
                          onClick={() => openEmployeeDetail(employee.id)}
                          className="cursor-pointer transition hover:bg-[#f8fbff]"
                        >
                          <td className="px-5 py-4">
                            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef5ff] text-sm font-black text-[#123c8c] ring-1 ring-blue-100">
                              {index + 1}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#eef5ff] text-[#123c8c] ring-1 ring-blue-100">
                                {employeePhoto ? (
                                  <img
                                    src={employeePhoto}
                                    alt={employee.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserRound size={22} strokeWidth={2.7} />
                                )}
                              </div>

                              <div className="min-w-0">
                                <p className="text-xs font-black text-[#123456] leading-snug break-words sm:text-sm">
                                  {employee.name}
                                </p>
                                <p className="mt-0.5 text-[11px] font-bold text-slate-500 leading-snug break-words sm:text-xs">
                                  {employee.employeeCode || "Karyawan"}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center text-sm font-black text-emerald-600">
                            {employee.summary.hadir}
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-black text-[#123c8c]">
                            {formatMinutes(
                              Number(employee.summary.totalWorkMinutes || 0),
                            )}
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-black text-orange-600">
                            {employee.lateMinutes}
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-black text-emerald-700">
                            {formatMinutes(employee.netWorkMinutes)}
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-black text-orange-500">
                            {employee.izinSakit}
                          </td>
                          <td className="px-5 py-4 text-center text-sm font-black text-[#123c8c]">
                            {employee.summary.cuti}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-1.5 text-xs font-black ring-1 ${getContractBadgeClass(
                                employee.remainingContractDays,
                              )}`}
                            >
                              {employee.remainingContractLabel}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span className="inline-flex items-center gap-2 text-sm font-black text-[#123456]">
                              {employee.positionStatusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#123c8c] text-white">
                  <Clock3 size={26} strokeWidth={2.7} />
                </div>
                <h3 className="mt-4 text-lg font-black text-[#123456]">
                  Belum ada data rank
                </h3>
                <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-400">
                  Data akan muncul setelah karyawan memiliki rekap pada rentang
                  tanggal yang dipilih.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
