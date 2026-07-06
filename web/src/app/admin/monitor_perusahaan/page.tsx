"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  Loader2,
  RefreshCcw,
  TrendingUp,
  Users2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

const metricOptions = [
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "wfh", label: "WFH" },
  { value: "visit", label: "Kunjungan" },
  { value: "cuti", label: "Cuti" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Karyawan Aktif" },
  { value: "todayRecords", label: "Rekaman Absensi" },
  { value: "department", label: "Komposisi Divisi" },
] as const;

type MetricValue = (typeof metricOptions)[number]["value"];
type DisplayMode = "chart" | "numbers";

type Summary = {
  activeEmployees: number;
  todayRecords: number;

  present: number;
  late: number;
  wfh: number;
  visit: number;
  cuti: number;
  pending: number;

  presentPercentage: number;
  latePercentage: number;
  wfhPercentage: number;
  visitPercentage: number;
  cutiPercentage: number;
  pendingPercentage: number;

  totalLateMinutesMonth: number;
  totalWorkMinutesMonth: number;
};

type DepartmentStat = {
  department: string;
  total: number;
};

type DailyChartPoint = {
  label: string;
  date: string;
  present: number;
  late: number;
  wfh: number;
  visit: number;
  cuti: number;
  pending: number;
  active: number;
  todayRecords: number;
};

type AlertItem = {
  id: string;
  employeeName: string;
  mode: string;
  checkIn: string;
};

type LateReasonItem = {
  id: string;
  employeeName: string;
  date: string;
  checkIn: string;
  lateMinutes: number;
  reason: string;
};

type VisitItem = {
  id: string;
  date: string;
  employeeName: string;
  title: string;
  clientName: string | null;
  address: string | null;
  startTime: string;
  note: string | null;
  hasPhoto: boolean;
};

type MonitorResponse = {
  month: number;
  year: number;
  today: string;
  generatedAt: string;
  summary: Summary;
  departmentStats: DepartmentStat[];
  dailyChart: DailyChartPoint[];
  alerts: AlertItem[];
  lateReasons: LateReasonItem[];
  visits: VisitItem[];
};

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

function getMetricValue(point: DailyChartPoint, metric: MetricValue) {
  if (metric === "department") return 0;
  return point[metric];
}

function formatWorkMode(mode: string) {
  if (mode === "wfh") return "WFH";
  if (mode === "visit") return "Kunjungan";
  if (mode === "office") return "Kantor";

  return mode;
}

function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (restMinutes === 0) return `${hours} jam`;

  return `${hours} jam ${restMinutes} menit`;
}

export default function AdminCompanyMonitorPage() {
  const now = new Date();

  const [displayMode, setDisplayMode] = useState<DisplayMode>("chart");
  const [selectedMetric, setSelectedMetric] =
    useState<MetricValue>("present");

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState<MonitorResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadMonitorData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/admin/monitor-perusahaan?month=${month}&year=${year}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal mengambil data monitor perusahaan.",
        );
      }

      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMonitorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const metricChart = useMemo(() => {
    if (!data) {
      return {
        unit: "data",
        points: [],
        maxValue: 1,
      };
    }

    if (selectedMetric === "department") {
      const points = data.departmentStats.map((item) => ({
        label: item.department,
        value: item.total,
      }));

      return {
        unit: "orang",
        points,
        maxValue: Math.max(...points.map((item) => item.value), 1),
      };
    }

    const points = data.dailyChart.map((point) => ({
      label: point.label,
      value: getMetricValue(point, selectedMetric),
    }));

    return {
      unit: "data",
      points,
      maxValue: Math.max(...points.map((item) => item.value), 1),
    };
  }, [data, selectedMetric]);

  const summaryCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Hadir",
        value: data.summary.present,
        percentage: data.summary.presentPercentage,
      },
      {
        label: "Terlambat",
        value: data.summary.late,
        percentage: data.summary.latePercentage,
      },
      {
        label: "WFH",
        value: data.summary.wfh,
        percentage: data.summary.wfhPercentage,
      },
      {
        label: "Kunjungan",
        value: data.summary.visit,
        percentage: data.summary.visitPercentage,
      },
      {
        label: "Cuti",
        value: data.summary.cuti,
        percentage: data.summary.cutiPercentage,
      },
      {
        label: "Pending",
        value: data.summary.pending,
        percentage: data.summary.pendingPercentage,
      },
    ];
  }, [data]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Monitor Perusahaan"
        subtitle="Pantau kondisi operasional, absensi, WFH, cuti, dan keterlambatan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                Operasional Harian
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Snapshot Perusahaan Hari Ini
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                Halaman ini mengambil data langsung dari database untuk
                menampilkan kehadiran, keterlambatan, WFH, kunjungan, cuti,
                pending absensi, dan rekap durasi terlambat dalam satu periode.
              </p>
            </div>

            <button
              type="button"
              onClick={loadMonitorData}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3275]"
            >
              <RefreshCcw size={16} />
              Refresh Data
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Mode Tampilan
              </p>
              <select
                value={displayMode}
                onChange={(event) =>
                  setDisplayMode(event.target.value as DisplayMode)
                }
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-black text-slate-700 outline-none"
              >
                <option value="chart">Grafik Bar</option>
                <option value="numbers">Angka Ringkas</option>
              </select>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Bulan
              </p>
              <select
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-black text-slate-700 outline-none"
              >
                {monthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Tahun
              </p>
              <input
                type="number"
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-black text-slate-700 outline-none"
              />
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-blue-100 bg-white">
            <div className="text-center">
              <Loader2 className="mx-auto animate-spin text-[#123c8c]" />
              <p className="mt-3 text-sm font-black text-slate-600">
                Mengambil data monitor perusahaan...
              </p>
            </div>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : data ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-lg shadow-slate-200/60">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <Users2 size={18} />
                  <p className="text-sm font-black text-slate-900">
                    Karyawan Aktif
                  </p>
                </div>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {data.summary.activeEmployees}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-lg shadow-slate-200/60">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <CalendarDays size={18} />
                  <p className="text-sm font-black text-slate-900">
                    Absensi Hari Ini
                  </p>
                </div>
                <p className="mt-2 text-3xl font-black text-slate-950">
                  {data.summary.todayRecords}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-lg shadow-slate-200/60">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock3 size={18} />
                  <p className="text-sm font-black text-slate-900">
                    Telat Bulan Ini
                  </p>
                </div>
                <p className="mt-2 text-2xl font-black text-amber-700">
                  {formatMinutes(data.summary.totalLateMinutesMonth)}
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-lg shadow-slate-200/60">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <TrendingUp size={18} />
                  <p className="text-sm font-black text-slate-900">
                    Total Jam Kerja
                  </p>
                </div>
                <p className="mt-2 text-2xl font-black text-slate-950">
                  {formatMinutes(data.summary.totalWorkMinutesMonth)}
                </p>
              </div>
            </div>

            {displayMode === "chart" ? (
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <BarChart3 size={18} />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Analitik Monitor Perusahaan
                      </p>
                    </div>
                    <h3 className="mt-1 text-lg font-black text-slate-950">
                      Grafik Bar Berdasarkan Kategori
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      Total waktu terlambat bulan ini:{" "}
                      {formatMinutes(data.summary.totalLateMinutesMonth)}
                    </p>
                  </div>

                  <select
                    value={selectedMetric}
                    onChange={(event) =>
                      setSelectedMetric(event.target.value as MetricValue)
                    }
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-black text-slate-700 outline-none md:w-72"
                  >
                    {metricOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-5 overflow-x-auto">
                  <div className="flex min-w-[820px] items-end gap-2">
                    {metricChart.points.map((point) => {
                      const height = Math.max(
                        (point.value / metricChart.maxValue) * 220,
                        point.value > 0 ? 8 : 2,
                      );

                      return (
                        <div
                          key={`${selectedMetric}-${point.label}`}
                          className="w-7 text-center"
                        >
                          <div className="mx-auto flex h-[230px] items-end">
                            <div
                              className="w-full rounded-t-md bg-[#123c8c]"
                              style={{ height }}
                              title={`${point.label}: ${point.value} ${metricChart.unit}`}
                            />
                          </div>
                          <p className="mt-1 truncate text-[10px] font-bold text-slate-500">
                            {point.label}
                          </p>
                          <p className="text-[10px] font-black text-slate-700">
                            {point.value}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                {summaryCards.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-blue-100 bg-white p-4 shadow-lg shadow-slate-200/60"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs font-black text-[#123c8c]">
                      {item.percentage}% dari karyawan aktif
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
                <div className="flex items-center gap-2 text-[#123c8c]">
                  <Building2 size={18} />
                  <h3 className="text-lg font-black text-slate-950">
                    Komposisi Divisi
                  </h3>
                </div>

                {data.departmentStats.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Belum ada data divisi.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {data.departmentStats.map((item) => (
                      <div
                        key={item.department}
                        className="flex items-center justify-between rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2"
                      >
                        <p className="text-sm font-semibold text-slate-700">
                          {item.department}
                        </p>
                        <p className="text-sm font-black text-[#123c8c]">
                          {item.total} orang
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
                <div className="flex items-center gap-2 text-amber-700">
                  <AlertTriangle size={18} />
                  <h3 className="text-lg font-black text-slate-950">
                    Perlu Tindak Lanjut
                  </h3>
                </div>

                {data.alerts.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Tidak ada alert belum check-out hari ini.
                  </p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {data.alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2"
                      >
                        <p className="text-sm font-black text-slate-900">
                          {alert.employeeName}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">
                          Check-in {alert.checkIn} • mode{" "}
                          {formatWorkMode(alert.mode)} • belum check-out
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock3 size={18} />
                <h3 className="text-lg font-black text-slate-950">
                  Rekap Alasan Terlambat
                </h3>
              </div>

              {data.lateReasons.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Belum ada data keterlambatan pada periode ini.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[760px] w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                        <th className="py-3 pr-4">Tanggal</th>
                        <th className="py-3 pr-4">Karyawan</th>
                        <th className="py-3 pr-4">Check-in</th>
                        <th className="py-3 pr-4">Durasi Telat</th>
                        <th className="py-3 pr-4">Alasan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.lateReasons.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-3 pr-4 font-bold text-slate-700">
                            {item.date}
                          </td>
                          <td className="py-3 pr-4 font-black text-slate-900">
                            {item.employeeName}
                          </td>
                          <td className="py-3 pr-4 font-semibold text-slate-600">
                            {item.checkIn}
                          </td>
                          <td className="py-3 pr-4 font-black text-amber-700">
                            {formatMinutes(item.lateMinutes)}
                          </td>
                          <td className="py-3 pr-4 font-semibold text-slate-600">
                            {item.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
              <div className="flex items-center gap-2 text-[#123c8c]">
                <ClipboardList size={18} />
                <h3 className="text-lg font-black text-slate-950">
                  Bukti Kunjungan Kerja Lapangan
                </h3>
              </div>

              {!data.visits || data.visits.length === 0 ? (
                <p className="mt-4 text-sm font-semibold text-slate-500">
                  Belum ada data bukti kunjungan pada periode ini.
                </p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-[760px] w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                        <th className="py-3 pr-4">Tanggal</th>
                        <th className="py-3 pr-4">Karyawan</th>
                        <th className="py-3 pr-4">Nama/Kunjungan</th>
                        <th className="py-3 pr-4">Client / Alamat</th>
                        <th className="py-3 pr-4">Waktu</th>
                        <th className="py-3 pr-4">Catatan</th>
                        <th className="py-3 pr-4">Bukti Foto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.visits.map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="py-3 pr-4 font-bold text-slate-700">
                            {item.date}
                          </td>
                          <td className="py-3 pr-4 font-black text-slate-900">
                            {item.employeeName}
                          </td>
                          <td className="py-3 pr-4 font-semibold text-slate-800">
                            {item.title}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {item.clientName ? `${item.clientName} - ` : ""}{item.address || "-"}
                          </td>
                          <td className="py-3 pr-4 text-slate-600">
                            {item.startTime}
                          </td>
                          <td className="py-3 pr-4 text-slate-600 text-xs">
                            {item.note || "-"}
                          </td>
                          <td className="py-3 pr-4">
                            {item.hasPhoto ? (
                              <a
                                href={`/api/visits/${item.id}/photo`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-black text-[#123c8c] hover:bg-blue-100 transition active:scale-[0.97]"
                              >
                                Lihat Foto
                              </a>
                            ) : (
                              <span className="text-xs text-slate-400">Tidak ada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
