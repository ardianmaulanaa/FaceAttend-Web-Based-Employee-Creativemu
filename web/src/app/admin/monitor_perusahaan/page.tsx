"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Loader2,
  TrendingUp,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

const metricOptions = [
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "cuti", label: "Cuti" },
] as const;

const displayModeOptions = [
  { value: "chart", label: "Grafik Bar" },
  { value: "numbers", label: "Angka Ringkas" },
] as const;

type MetricValue = (typeof metricOptions)[number]["value"];
type DisplayMode = (typeof displayModeOptions)[number]["value"];

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
  reason?: string;
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
  dailyChart: DailyChartPoint[];
  alerts: AlertItem[];
  lateReasons: LateReasonItem[];
  visits: VisitItem[];
};

type AdminLeaveRequest = {
  id: string;
  employeeName?: string;
  employeeCode?: string | null;
  leaveType?: string;
  leaveTypeLabel?: string;
  startDate: string;
  endDate: string;
  startDateRaw?: string | null;
  endDateRaw?: string | null;
  totalDays?: number;
  reason?: string;
  status: string;
  statusLabel?: string;
  adminNote?: string | null;
  createdAt?: string | null;
};

type LeaveEndpointResponse = {
  success: boolean;
  message?: string;
  error?: string;
  requests?: AdminLeaveRequest[];
};

type LeaveChartPoint = {
  label: string;
  value: number;
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

const indonesianMonthMap: Record<string, number> = {
  januari: 0,
  februari: 1,
  maret: 2,
  april: 3,
  mei: 4,
  juni: 5,
  juli: 6,
  agustus: 7,
  september: 8,
  oktober: 9,
  november: 10,
  desember: 11,
};

function getMetricValue(point: DailyChartPoint, metric: MetricValue) {
  if (metric === "cuti") return 0;

  return point[metric];
}

function getMetricLabel(metric: MetricValue) {
  return (
    metricOptions.find((option) => option.value === metric)?.label || "Kategori"
  );
}

function formatWorkMode(mode: string) {
  if (mode === "wfh") return "WFH";
  if (mode === "visit") return "Kunjungan";
  if (mode === "office") return "Kantor";

  return mode;
}

function formatMinutes(minutes: number) {
  if (!minutes || minutes <= 0) return "0 menit";

  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (restMinutes === 0) return `${hours} jam`;

  return `${hours} jam ${restMinutes} menit`;
}

function normalizeDateOnly(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateValue(value?: string | null) {
  if (!value) return null;

  const cleanValue = String(value).trim();

  if (!cleanValue || cleanValue === "-") return null;

  const normalDate = new Date(cleanValue);

  if (!Number.isNaN(normalDate.getTime())) {
    return normalizeDateOnly(normalDate);
  }

  const parts = cleanValue
    .replace(",", "")
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    const day = Number(parts[0]);
    const monthName = parts[1].toLowerCase();
    const year = Number(parts[2]);
    const monthIndex = indonesianMonthMap[monthName];

    if (
      !Number.isNaN(day) &&
      !Number.isNaN(year) &&
      typeof monthIndex === "number"
    ) {
      return new Date(year, monthIndex, day);
    }
  }

  return null;
}

function isApprovedLeave(status: string) {
  return String(status || "").toLowerCase() === "approved";
}

function getLeaveChartData(
  monitorData: MonitorResponse | null,
  leaveRequests: AdminLeaveRequest[],
  month: number,
  year: number
) {
  const fallbackPoints = monitorData?.dailyChart || [];

  const approvedRequests = leaveRequests.filter((item) =>
    isApprovedLeave(item.status)
  );

  const approvedRequestsInMonth = approvedRequests.filter((request) => {
    const submittedDate = parseDateValue(request.createdAt);

    if (!submittedDate) return false;

    return (
      submittedDate.getFullYear() === year &&
      submittedDate.getMonth() === month - 1
    );
  });

  const dailyPoints: LeaveChartPoint[] = fallbackPoints.map((point) => {
    const labelDay = Number(point.label);

    const totalSubmissionOnDay = approvedRequestsInMonth.filter((request) => {
      const submittedDate = parseDateValue(request.createdAt);

      if (!submittedDate || Number.isNaN(labelDay)) return false;

      return submittedDate.getDate() === labelDay;
    }).length;

    return {
      label: point.label,
      value: totalSubmissionOnDay,
    };
  });

  return {
    dailyPoints,
    approvedRequestsInMonth,
    totalApprovedRequests: approvedRequestsInMonth.length,
  };
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function AdminCompanyMonitorPage() {
  const now = new Date();

  const [displayMode, setDisplayMode] = useState<DisplayMode>("chart");
  const [selectedMetric, setSelectedMetric] =
    useState<MetricValue>("present");

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState<MonitorResponse | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<AdminLeaveRequest[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadMonitorData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [monitorResponse, leaveResponse] = await Promise.all([
        fetch(`/api/admin/monitor-perusahaan?month=${month}&year=${year}`, {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/admin/leave-requests", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const monitorResult = await readJsonResponse(monitorResponse);

      if (!monitorResponse.ok) {
        throw new Error(
          monitorResult?.message || "Gagal mengambil data monitor perusahaan."
        );
      }

      let leaveResult: LeaveEndpointResponse = {
        success: false,
        requests: [],
      };

      try {
        leaveResult = await readJsonResponse(leaveResponse);
      } catch {
        leaveResult = {
          success: false,
          requests: [],
        };
      }

      setData({
        ...monitorResult,
        lateReasons: Array.isArray(monitorResult?.lateReasons)
          ? monitorResult.lateReasons
          : [],
      });

      setLeaveRequests(
        leaveResponse.ok &&
          leaveResult.success &&
          Array.isArray(leaveResult.requests)
          ? leaveResult.requests
          : []
      );
    } catch (error) {
      setData(null);
      setLeaveRequests([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadMonitorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const leaveChartData = useMemo(() => {
    return getLeaveChartData(data, leaveRequests, month, year);
  }, [data, leaveRequests, month, year]);

  const metricChart = useMemo(() => {
    if (!data) {
      return {
        unit: "data",
        points: [],
        maxValue: 1,
      };
    }

    if (selectedMetric === "cuti") {
      const values = leaveChartData.dailyPoints.map((point) => point.value);

      return {
        unit: "pengajuan",
        points: leaveChartData.dailyPoints,
        maxValue: Math.max(...values, 1),
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
  }, [data, selectedMetric, leaveChartData]);

  const summaryCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Hadir",
        value: data.summary.present,
        note: `${data.summary.presentPercentage}% dari total karyawan`,
      },
      {
        label: "Terlambat",
        value: data.summary.late,
        note: `${data.summary.latePercentage}% dari total karyawan`,
      },
      {
        label: "Cuti",
        value: leaveChartData.totalApprovedRequests,
        note: "pengajuan cuti disetujui bulan ini",
      },
    ];
  }, [data, leaveChartData]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AppHeader
        title="Monitor Perusahaan"
        subtitle="Pantau kehadiran, cuti, dan keterlambatan karyawan"
        variant="admin"
      />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-6 text-white md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <BarChart3 size={25} strokeWidth={2.6} />
                  </div>

                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                      Company Monitor
                    </p>

                    <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                      Snapshot Perusahaan
                    </h2>
                  </div>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
                  Pantau data hadir, cuti, total jam kerja, dan rekap
                  keterlambatan berdasarkan data database. Grafik cuti dihitung
                  dari tanggal karyawan mengajukan cuti.
                </p>

              
              </div>

              <div className="space-y-5 p-5 md:p-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Mode Tampilan
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-[#f6f8ff] p-1.5 ring-1 ring-blue-100">
                    {displayModeOptions.map((option) => {
                      const active = displayMode === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDisplayMode(option.value)}
                          className={`h-11 rounded-xl text-sm font-black transition active:scale-[0.98] ${
                            active
                              ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                              : "text-slate-500 hover:bg-white hover:text-[#123c8c]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Bulan
                    </p>

                    <select
                      value={month}
                      onChange={(event) => setMonth(Number(event.target.value))}
                      className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
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
                      className="mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                    Kategori Grafik Aktif
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {getMetricLabel(selectedMetric)}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    Untuk cuti, grafik menampilkan jumlah pengajuan yang dibuat
                    pada tanggal tersebut.
                  </p>
                </div>
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
              <div className="grid gap-4 md:grid-cols-2">
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
                <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-[#123c8c]">
                        <BarChart3 size={18} />

                        <p className="text-xs font-black uppercase tracking-[0.16em]">
                          Analitik Monitor Perusahaan
                        </p>
                      </div>

                      <h3 className="mt-2 text-2xl font-black text-slate-950">
                        Grafik Bar Berdasarkan Kategori
                      </h3>

                      <p className="mt-2 text-sm font-semibold text-slate-500 md:text-base">
                        Total waktu terlambat bulan ini:{" "}
                        <span className="font-black text-slate-700">
                          {formatMinutes(data.summary.totalLateMinutesMonth)}
                        </span>
                      </p>

                      {selectedMetric === "cuti" ? (
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          Cuti bulan ini:{" "}
                          {leaveChartData.totalApprovedRequests} pengajuan
                          disetujui.
                        </p>
                      ) : null}
                    </div>

                    <div className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#123c8c] ring-1 ring-blue-100">
                      {getMetricLabel(selectedMetric)}
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {metricOptions.map((option) => {
                      const active = selectedMetric === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedMetric(option.value)}
                          className={`inline-flex h-10 items-center justify-center rounded-full px-4 text-xs font-black transition active:scale-[0.98] ${
                            active
                              ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                              : "bg-[#f6f8ff] text-slate-500 ring-1 ring-blue-100 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                          }`}
                        >
                          {active ? (
                            <CheckCircle2
                              size={14}
                              strokeWidth={2.7}
                              className="mr-1.5"
                            />
                          ) : null}
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 overflow-x-auto rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
                    <div className="flex min-w-[820px] items-end gap-2">
                      {metricChart.points.map((point) => {
                        const height = Math.max(
                          (point.value / metricChart.maxValue) * 220,
                          point.value > 0 ? 8 : 2
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
                <div className="grid gap-4 md:grid-cols-3">
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
                        {item.note}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
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
                  <div className="mt-4 grid gap-2 md:grid-cols-2">
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

              <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock3 size={18} />

                  <h3 className="text-lg font-black text-slate-950">
                    Rekap Karyawan Terlambat
                  </h3>
                </div>


                {data.lateReasons.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Belum ada data keterlambatan pada periode ini.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[620px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-[0.14em] text-slate-500">
                          <th className="py-3 pr-4">Tanggal</th>
                          <th className="py-3 pr-4">Karyawan</th>
                          <th className="py-3 pr-4">Check-in</th>
                          <th className="py-3 pr-4">Durasi Telat</th>
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
                        {data.visits.map((item: any) => (
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
      </main>
    </MobileShell>
  );
}
