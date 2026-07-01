"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCcw, Search } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

const monthOptions = [
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

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function inferGender(
  name: string,
  rawGender?: string | null,
): "male" | "female" {
  const normalized = (rawGender || "").toLowerCase();

  if (
    normalized === "male" ||
    normalized === "laki-laki" ||
    normalized === "pria" ||
    normalized === "l"
  ) {
    return "male";
  }

  if (
    normalized === "female" ||
    normalized === "perempuan" ||
    normalized === "wanita" ||
    normalized === "p"
  ) {
    return "female";
  }

  const lowerName = name.toLowerCase();
  const femaleHints = [
    "siti",
    "nur",
    "fitri",
    "putri",
    "dewi",
    "anisa",
    "rahma",
    "nisa",
    "ayu",
    "widya",
  ];

  if (femaleHints.some((hint) => lowerName.includes(hint))) {
    return "female";
  }

  return "male";
}

function resolveAttendanceKind(record: {
  status: string;
  checkIn: string | null;
}): "on-time" | "late" | "leave" {
  if (!record.checkIn) {
    return "leave";
  }

  const normalizedStatus = record.status.toLowerCase();
  if (normalizedStatus === "late") return "late";
  if (normalizedStatus === "absent") return "leave";

  const minute = parseTimeToMinutes(record.checkIn);
  if (minute !== null && minute > 8 * 60) return "late";

  return "on-time";
}

type Employee = {
  id: string;
  name: string;
  role: "admin" | "employee";
  employee_category?: "magang" | "tetap";
  department: string | null;
  position: string | null;
  gender?: string | null;
};

type EmployeeMonthlyStat = {
  id: string;
  name: string;
  gender: "male" | "female";
  onTime: number;
  late: number;
  leave: number;
  totalPresence: number;
  score: number;
  category: "magang" | "tetap";
};

export default function ReportsPage() {
  const { state } = useAppData();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [nameFilter, setNameFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">(
    "all",
  );
  const [scopeFilter, setScopeFilter] = useState<"all" | "best3" | "worst3">(
    "all",
  );

  const yearOptions = useMemo(() => {
    const base = now.getFullYear();
    return [base - 2, base - 1, base, base + 1];
  }, [now]);

  useEffect(() => {
    async function loadData() {
      try {
        const employeeResponse = await fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        });

        const employeeResult = await employeeResponse.json();

        if (employeeResponse.ok) {
          setEmployees(employeeResult.data || []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const monthAttendance = useMemo(() => {
    return state.attendance.filter((record) => {
      const date = parseDateKey(record.date);
      return (
        date.getFullYear() === selectedYear &&
        date.getMonth() + 1 === selectedMonth
      );
    });
  }, [selectedMonth, selectedYear, state.attendance]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      if (employee.role !== "employee") return false;

      if (
        nameFilter &&
        !employee.name.toLowerCase().includes(nameFilter.toLowerCase())
      ) {
        return false;
      }

      if (genderFilter !== "all") {
        const gender = inferGender(employee.name, employee.gender);
        if (gender !== genderFilter) return false;
      }

      return true;
    });
  }, [employees, genderFilter, nameFilter]);

  const allEmployeeStats = useMemo<EmployeeMonthlyStat[]>(() => {
    return filteredEmployees.map((employee) => {
      const records = monthAttendance.filter(
        (record) => record.employeeId === employee.id,
      );

      let onTime = 0;
      let late = 0;
      let leave = 0;

      for (const record of records) {
        const kind = resolveAttendanceKind(record);
        if (kind === "on-time") onTime += 1;
        if (kind === "late") late += 1;
        if (kind === "leave") leave += 1;
      }

      const totalPresence = onTime + late;
      const score = onTime * 3 + late - leave * 2;

      return {
        id: employee.id,
        name: employee.name,
        gender: inferGender(employee.name, employee.gender),
        onTime,
        late,
        leave,
        totalPresence,
        score,
        category: employee.employee_category === "magang" ? "magang" : "tetap",
      };
    });
  }, [filteredEmployees, monthAttendance]);

  const sortedBest = useMemo(() => {
    return [...allEmployeeStats]
      .sort((a, b) => b.score - a.score || b.totalPresence - a.totalPresence)
      .slice(0, 3);
  }, [allEmployeeStats]);

  const sortedWorst = useMemo(() => {
    return [...allEmployeeStats]
      .sort((a, b) => a.score - b.score || a.totalPresence - b.totalPresence)
      .slice(0, 3);
  }, [allEmployeeStats]);

  const scopedEmployeeStats = useMemo(() => {
    if (scopeFilter === "best3") return sortedBest;
    if (scopeFilter === "worst3") return sortedWorst;
    return allEmployeeStats;
  }, [allEmployeeStats, scopeFilter, sortedBest, sortedWorst]);

  const scopedEmployeeIds = useMemo(() => {
    return new Set(scopedEmployeeStats.map((item) => item.id));
  }, [scopedEmployeeStats]);

  const dailyAttendanceChart = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    const points = Array.from({ length: totalDays }, (_, idx) => {
      const day = idx + 1;
      const dayLabel = String(day);
      const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dayRecords = monthAttendance.filter(
        (record) =>
          record.date === prefix && scopedEmployeeIds.has(record.employeeId),
      );

      let onTime = 0;
      let late = 0;
      let leave = 0;

      for (const record of dayRecords) {
        const kind = resolveAttendanceKind(record);
        if (kind === "on-time") onTime += 1;
        if (kind === "late") late += 1;
        if (kind === "leave") leave += 1;
      }

      return { day: dayLabel, onTime, late, leave };
    });

    const maxValue = Math.max(
      ...points.map((item) => item.onTime + item.late + item.leave),
      1,
    );

    return { points, maxValue };
  }, [monthAttendance, scopedEmployeeIds, selectedMonth, selectedYear]);

  const dailyGenderComparison = useMemo(() => {
    const totalDays = new Date(selectedYear, selectedMonth, 0).getDate();

    const employeeGenderMap = new Map(
      filteredEmployees.map((employee) => [
        employee.id,
        inferGender(employee.name, employee.gender),
      ]),
    );

    const points = Array.from({ length: totalDays }, (_, idx) => {
      const day = idx + 1;
      const prefix = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      const dayRecords = monthAttendance.filter(
        (record) =>
          record.date === prefix &&
          scopedEmployeeIds.has(record.employeeId) &&
          Boolean(record.checkIn),
      );

      let male = 0;
      let female = 0;

      for (const record of dayRecords) {
        const gender = employeeGenderMap.get(record.employeeId) || "male";
        if (gender === "female") {
          female += 1;
        } else {
          male += 1;
        }
      }

      return { day: String(day), male, female };
    });

    const maxValue = Math.max(
      ...points.map((item) => Math.max(item.male, item.female)),
      1,
    );

    return { points, maxValue };
  }, [
    filteredEmployees,
    monthAttendance,
    scopedEmployeeIds,
    selectedMonth,
    selectedYear,
  ]);

  const summary = useMemo(() => {
    const totalEmployees = scopedEmployeeStats.length;
    const totalOnTime = scopedEmployeeStats.reduce(
      (sum, item) => sum + item.onTime,
      0,
    );
    const totalLate = scopedEmployeeStats.reduce(
      (sum, item) => sum + item.late,
      0,
    );
    const totalLeave = scopedEmployeeStats.reduce(
      (sum, item) => sum + item.leave,
      0,
    );

    const totalMale = scopedEmployeeStats.filter(
      (item) => item.gender === "male",
    ).length;
    const totalFemale = scopedEmployeeStats.filter(
      (item) => item.gender === "female",
    ).length;

    const allEmployeeCount = employees.filter(
      (employee) => employee.role === "employee",
    ).length;

    return {
      totalEmployees,
      totalOnTime,
      totalLate,
      totalLeave,
      totalMale,
      totalFemale,
      allEmployeeCount,
    };
  }, [employees, scopedEmployeeStats]);

  const limitPercent =
    summary.allEmployeeCount === 0
      ? 0
      : Math.round((summary.totalEmployees / summary.allEmployeeCount) * 100);

  function resetFilters() {
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
    setNameFilter("");
    setGenderFilter("all");
    setScopeFilter("all");
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Reports"
        subtitle="Laporan absensi karyawan dengan filter lengkap"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-[2.2rem] border border-blue-100 bg-gradient-to-br from-white to-[#f7faff] p-5 shadow-xl shadow-slate-300/30 md:p-6">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
            Admin Panel
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Monitor Perusahaan
          </h2>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.6fr_0.8fr]">
            <div className="rounded-2xl border border-blue-100 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <p className="text-lg font-black leading-6 text-slate-900">
                  Laporan Absen Semua Karyawan
                </p>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs font-black text-slate-600">
                      Filter Tahun
                    </p>
                    <select
                      value={selectedYear}
                      onChange={(event) =>
                        setSelectedYear(Number(event.target.value))
                      }
                      className="mt-1 w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                    >
                      {yearOptions.map((year) => (
                        <option key={`year-${year}`} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-600">
                      Filter Bulan
                    </p>
                    <select
                      value={selectedMonth}
                      onChange={(event) =>
                        setSelectedMonth(Number(event.target.value))
                      }
                      className="mt-1 w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                    >
                      {monthOptions.map((month) => (
                        <option
                          key={`month-${month.value}`}
                          value={month.value}
                        >
                          {month.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-600">Gender</p>
                    <select
                      value={genderFilter}
                      onChange={(event) =>
                        setGenderFilter(
                          event.target.value as "all" | "male" | "female",
                        )
                      }
                      className="mt-1 w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
                    >
                      <option value="all">Semua</option>
                      <option value="male">Laki-laki</option>
                      <option value="female">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-xs font-black text-slate-600">
                      Reset Filter
                    </p>
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-1 inline-flex h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-blue-100 bg-[#f6f8ff] text-sm font-black text-[#123c8c]"
                    >
                      <RefreshCcw size={15} />
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-[1.1fr_0.9fr]">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={nameFilter}
                    onChange={(event) => setNameFilter(event.target.value)}
                    placeholder="Filter nama karyawan"
                    className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] py-2.5 pl-9 pr-3 text-sm font-semibold text-slate-700 outline-none"
                  />
                </div>

                <select
                  value={scopeFilter}
                  onChange={(event) =>
                    setScopeFilter(
                      event.target.value as "all" | "best3" | "worst3",
                    )
                  }
                  className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none"
                >
                  <option value="all">Semua Karyawan</option>
                  <option value="best3">3 Karyawan Terbaik</option>
                  <option value="worst3">3 Karyawan Terburuk</option>
                </select>
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-4 text-xs font-black">
                  <span className="inline-flex items-center gap-2 text-emerald-700">
                    <span className="h-2.5 w-5 rounded-full bg-emerald-500" />
                    Tepat Waktu
                  </span>
                  <span className="inline-flex items-center gap-2 text-rose-700">
                    <span className="h-2.5 w-5 rounded-full bg-rose-500" />
                    Terlambat
                  </span>
                  <span className="inline-flex items-center gap-2 text-amber-700">
                    <span className="h-2.5 w-5 rounded-full bg-amber-400" />
                    Izin / Absen
                  </span>
                </div>

                {loading ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Memuat data...
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto pb-1">
                    <div className="flex min-w-[860px] items-end gap-2">
                      {dailyAttendanceChart.points.map((point) => {
                        const total = point.onTime + point.late + point.leave;
                        const normalized =
                          total === 0
                            ? { onTime: 0, late: 0, leave: 0 }
                            : {
                                onTime: (point.onTime / total) * 100,
                                late: (point.late / total) * 100,
                                leave: (point.leave / total) * 100,
                              };

                        const height = Math.max(
                          (total / dailyAttendanceChart.maxValue) * 220,
                          8,
                        );

                        return (
                          <div
                            key={`day-chart-${point.day}`}
                            className="flex flex-col items-center"
                          >
                            <div
                              className="relative w-4 overflow-hidden rounded-sm bg-slate-200"
                              style={{ height }}
                            >
                              <div
                                className="absolute bottom-0 w-full bg-amber-400"
                                style={{ height: `${normalized.leave}%` }}
                              />
                              <div
                                className="absolute w-full bg-rose-500"
                                style={{
                                  bottom: `${normalized.leave}%`,
                                  height: `${normalized.late}%`,
                                }}
                              />
                              <div
                                className="absolute w-full bg-emerald-500"
                                style={{
                                  bottom: `${normalized.leave + normalized.late}%`,
                                  height: `${normalized.onTime}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1 text-[10px] font-bold text-slate-500">
                              {point.day}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-white p-4">
              <p className="text-xl font-black text-slate-900">
                Laporan Limit Karyawan
              </p>
              <p className="mt-3 text-2xl font-black text-[#123c8c]">
                {summary.totalEmployees} / {summary.allEmployeeCount || 0}
              </p>

              <div className="mt-5 flex justify-center">
                <div
                  className="relative h-36 w-36 rounded-full"
                  style={{
                    background: `conic-gradient(#1d4ed8 ${limitPercent}%, #dbeafe ${limitPercent}% 100%)`,
                  }}
                >
                  <div className="absolute inset-[20px] rounded-full bg-white" />
                  <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-[#123c8c]">
                    {limitPercent}%
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-blue-50 p-3 text-center">
                  <p className="text-xs font-black text-slate-500">Laki-laki</p>
                  <p className="mt-1 text-xl font-black text-blue-700">
                    {summary.totalMale}
                  </p>
                </div>

                <div className="rounded-xl bg-pink-50 p-3 text-center">
                  <p className="text-xs font-black text-slate-500">Perempuan</p>
                  <p className="mt-1 text-xl font-black text-pink-700">
                    {summary.totalFemale}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
              Karyawan Dipantau
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {summary.totalEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Tepat Waktu
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {summary.totalOnTime}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Terlambat
            </p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              {summary.totalLate}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
              Izin / Absen
            </p>
            <p className="mt-2 text-3xl font-black text-rose-700">
              {summary.totalLeave}
            </p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Perbandingan Harian Laki-laki vs Perempuan
              </h3>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                {selectedYear} / {String(selectedMonth).padStart(2, "0")}
              </p>
            </div>

            {loading ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Memuat data...
              </p>
            ) : (
              <div className="mt-5 overflow-x-auto pb-1">
                <div className="flex min-w-[860px] items-end gap-2">
                  {dailyGenderComparison.points.map((item) => (
                    <div key={`gender-day-${item.day}`} className="text-center">
                      <div className="mx-auto flex h-32 w-8 items-end gap-1 rounded-md bg-slate-100/80 px-1 py-1">
                        <div
                          className="w-2 rounded-sm bg-blue-600"
                          style={{
                            height: `${Math.max(
                              (item.male / dailyGenderComparison.maxValue) *
                                100,
                              item.male > 0 ? 7 : 0,
                            )}%`,
                          }}
                        />
                        <div
                          className="w-2 rounded-sm bg-pink-500"
                          style={{
                            height: `${Math.max(
                              (item.female / dailyGenderComparison.maxValue) *
                                100,
                              item.female > 0 ? 7 : 0,
                            )}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1 text-[10px] font-bold text-slate-500">
                        {item.day}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs font-black">
                  <span className="inline-flex items-center gap-2 text-blue-700">
                    <span className="h-2.5 w-5 rounded-full bg-blue-600" />
                    Laki-laki
                  </span>
                  <span className="inline-flex items-center gap-2 text-pink-700">
                    <span className="h-2.5 w-5 rounded-full bg-pink-500" />
                    Perempuan
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Top 3 Terbaik & Terburuk
              </h3>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Skor Bulanan
              </p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
                <p className="text-sm font-black text-emerald-700">3 Terbaik</p>
                <div className="mt-2 space-y-2">
                  {sortedBest.map((item, index) => (
                    <div
                      key={`best-${item.id}`}
                      className="rounded-xl bg-white px-3 py-2"
                    >
                      <p className="text-sm font-black text-slate-900">
                        {index + 1}. {item.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        Skor {item.score} • Hadir {item.totalPresence} hari
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50/60 p-3">
                <p className="text-sm font-black text-rose-700">3 Terburuk</p>
                <div className="mt-2 space-y-2">
                  {sortedWorst.map((item, index) => (
                    <div
                      key={`worst-${item.id}`}
                      className="rounded-xl bg-white px-3 py-2"
                    >
                      <p className="text-sm font-black text-slate-900">
                        {index + 1}. {item.name}
                      </p>
                      <p className="text-xs font-bold text-slate-500">
                        Skor {item.score} • Hadir {item.totalPresence} hari
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-black text-slate-950">
              Data Karyawan & Performa Harian
            </h3>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              {scopeFilter === "all"
                ? "Semua"
                : scopeFilter === "best3"
                  ? "Top 3 Terbaik"
                  : "Top 3 Terburuk"}
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr] bg-[#f6f8ff] px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>Nama Karyawan</p>
              <p>Gender</p>
              <p>Tepat Waktu</p>
              <p>Terlambat</p>
              <p>Izin/Absen</p>
              <p>Skor</p>
            </div>

            <div className="divide-y divide-blue-50">
              {scopedEmployeeStats.length === 0 && (
                <p className="px-4 py-8 text-center text-sm font-semibold text-slate-500">
                  Data karyawan tidak ditemukan untuk filter saat ini.
                </p>
              )}

              {scopedEmployeeStats.map((item) => (
                <div
                  key={`report-employee-${item.id}`}
                  className="grid gap-2 px-4 py-3 text-sm font-semibold text-slate-700 md:grid-cols-[1.6fr_0.8fr_0.9fr_0.9fr_0.9fr_0.8fr] md:items-center"
                >
                  <div>
                    <p className="font-black text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.category === "magang" ? "Magang" : "Karyawan Tetap"}
                    </p>
                  </div>

                  <p>{item.gender === "female" ? "Perempuan" : "Laki-laki"}</p>
                  <p className="font-black text-emerald-700">{item.onTime}</p>
                  <p className="font-black text-amber-700">{item.late}</p>
                  <p className="font-black text-rose-700">{item.leave}</p>
                  <p className="font-black text-[#123c8c]">{item.score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
