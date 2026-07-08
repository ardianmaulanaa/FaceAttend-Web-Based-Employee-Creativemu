"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Home,
  Loader2,
  TrendingUp,
  Building2,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

const metricOptions = [
  { value: "present", label: "Hadir" },
  { value: "late", label: "Terlambat" },
  { value: "wfh", label: "WFH" },
  { value: "wfc", label: "WFC" },
  { value: "visit", label: "Kunjungan" },
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
  wfc?: number;
  visit: number;
  cuti: number;
  pending: number;

  presentPercentage: number;
  latePercentage: number;
  wfhPercentage: number;
  wfcPercentage?: number;
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
  wfc?: number;
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

type MonitorResponse = {
  month: number;
  year: number;
  today: string;
  generatedAt: string;
  summary: Summary;
  dailyChart: DailyChartPoint[];
  alerts: AlertItem[];
  lateReasons: LateReasonItem[];
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

type FlexibleModeKey = "wfh" | "wfc" | "visit";

type FlexibleModeTotals = Record<FlexibleModeKey, number>;

type FlexibleModeCardItem = {
  key: FlexibleModeKey;
  label: string;
  value: number;
  percentage: number;
  description: string;
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
  if (metric === "wfc") return Number(point.wfc || 0);

  return Number(point[metric] || 0);
}

function getMetricLabel(metric: MetricValue) {
  return (
    metricOptions.find((option) => option.value === metric)?.label || "Kategori"
  );
}

function formatWorkMode(mode: string) {
  if (mode === "wfh") return "WFH";
  if (mode === "wfc") return "WFC";
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
  year: number,
) {
  const fallbackPoints = monitorData?.dailyChart || [];

  const approvedRequests = leaveRequests.filter((item) =>
    isApprovedLeave(item.status),
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

function toSafeNumber(value: unknown) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getDailyChartModeTotals(
  dailyChart: DailyChartPoint[] = [],
): FlexibleModeTotals {
  return dailyChart.reduce<FlexibleModeTotals>(
    (total, point) => {
      total.wfh += toSafeNumber(point.wfh);
      total.wfc += toSafeNumber(point.wfc);
      total.visit += toSafeNumber(point.visit);

      return total;
    },
    {
      wfh: 0,
      wfc: 0,
      visit: 0,
    },
  );
}

function getSummaryModeValue(
  summary: Summary,
  key: FlexibleModeKey,
  dailyTotals?: FlexibleModeTotals,
) {
  const summaryValue =
    key === "wfh"
      ? toSafeNumber(summary.wfh)
      : key === "wfc"
        ? toSafeNumber(summary.wfc)
        : toSafeNumber(summary.visit);

  const dailyValue = dailyTotals ? toSafeNumber(dailyTotals[key]) : 0;

  return Math.max(summaryValue, dailyValue);
}

function getMonitoringBase(summary: Summary, dailyTotals?: FlexibleModeTotals) {
  const todayRecords = toSafeNumber(summary.todayRecords);
  const activeEmployees = toSafeNumber(summary.activeEmployees);
  const flexibleSummaryTotal =
    toSafeNumber(summary.wfh) +
    toSafeNumber(summary.wfc) +
    toSafeNumber(summary.visit);

  const flexibleDailyTotal = dailyTotals
    ? toSafeNumber(dailyTotals.wfh) +
      toSafeNumber(dailyTotals.wfc) +
      toSafeNumber(dailyTotals.visit)
    : 0;

  if (todayRecords > 0) return todayRecords;
  if (activeEmployees > 0) return activeEmployees;
  if (flexibleSummaryTotal > 0) return flexibleSummaryTotal;
  if (flexibleDailyTotal > 0) return flexibleDailyTotal;

  return 0;
}

function getSummaryModePercentage(
  summary: Summary,
  key: FlexibleModeKey,
  dailyTotals?: FlexibleModeTotals,
) {
  const value = getSummaryModeValue(summary, key, dailyTotals);
  const base = getMonitoringBase(summary, dailyTotals);

  if (base <= 0 || value <= 0) return 0;

  return Math.min(Number(((value / base) * 100).toFixed(1)), 100);
}

function AnimatedHistogram({
  metricLabel,
  unit,
  points,
  maxValue,
}: {
  metricLabel: string;
  unit: string;
  points: Array<{
    label: string;
    value: number;
  }>;
  maxValue: number;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const safeMaxValue = Math.max(maxValue, 1);
  const activePoint =
    activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;

  return (
    <>
      <style jsx global>{`
        @keyframes histogramTooltipIn {
          from {
            opacity: 0;
            transform: translate(-50%, 8px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes histogramBarGlow {
          0% {
            box-shadow: 0 0 0 rgba(18, 60, 140, 0);
          }
          100% {
            box-shadow: 0 14px 30px rgba(18, 60, 140, 0.22);
          }
        }
      `}</style>

      <div className="mt-6 overflow-x-auto overflow-y-visible rounded-[1.65rem] border border-blue-100 bg-[#123c8c] p-3 text-white shadow-xl shadow-blue-900/15 md:rounded-[2rem] md:p-5">
        <div className="min-w-[760px] md:min-w-[900px]">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100 md:text-xs">
                Histogram Monitor
              </p>

              <h4 className="mt-1 truncate text-xl font-black tracking-tight text-white md:text-2xl">
                {metricLabel} per Tanggal
              </h4>
            </div>

            <div className="w-fit rounded-2xl bg-white/10 px-3 py-2 text-xs font-black text-blue-50 ring-1 ring-white/10 md:px-4 md:py-3 md:text-sm">
              Maksimum: {safeMaxValue} {unit}
            </div>
          </div>

          <div className="relative mt-5 h-[255px] rounded-[1.35rem] border border-white/10 bg-[#0f3578] px-4 pb-9 pt-6 shadow-inner md:h-[300px] md:rounded-[1.6rem] md:px-5 md:pb-10 md:pt-8">
            {Array.from({ length: 5 }).map((_, index) => {
              const percent = index * 25;
              const value = Math.round((safeMaxValue * percent) / 100);

              return (
                <div
                  key={percent}
                  className="pointer-events-none absolute left-4 right-4 border-t border-white/14 md:left-5 md:right-5"
                  style={{ bottom: `${34 + percent * 1.92}px` }}
                >
                  <span className="absolute -top-2 right-0 rounded-full bg-[#0f3578] px-1.5 text-[9px] font-black text-blue-100/75 md:px-2 md:text-[10px]">
                    {value}
                  </span>
                </div>
              );
            })}

            <div className="relative z-10 flex h-[200px] items-end gap-1 md:h-[230px] md:gap-4">
              {points.map((point, index) => {
                const rawHeight = (point.value / safeMaxValue) * 190;
                const height = Math.max(rawHeight, point.value > 0 ? 10 : 3);
                const isActive = activeIndex === index;

                return (
                  <div
                    key={`${metricLabel}-${point.label}`}
                    className="relative flex w-3 shrink-0 flex-col items-center md:w-4"
                  >
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseLeave={() => setActiveIndex(null)}
                      onFocus={() => setActiveIndex(index)}
                      onBlur={() => setActiveIndex(null)}
                      onClick={() => setActiveIndex(index)}
                      className={`relative w-full rounded-t-md outline-none transition duration-300 ease-out ${
                        isActive
                          ? "scale-x-110 bg-blue-200"
                          : "bg-blue-300/95 hover:bg-blue-200"
                      }`}
                      style={{
                        height,
                        animation: isActive
                          ? "histogramBarGlow 160ms ease-out forwards"
                          : undefined,
                      }}
                      aria-label={`${metricLabel} tanggal ${point.label}: ${point.value} ${unit}`}
                    >
                      {isActive ? (
                        <div
                          className="absolute left-1/2 z-30 w-24 -translate-x-1/2 rounded-xl border border-white/40 bg-white/70 px-2 py-1.5 text-center shadow-lg shadow-blue-950/10 backdrop-blur-md"
                          style={{
                            bottom: height + 10,
                            animation:
                              "histogramTooltipIn 160ms ease-out forwards",
                          }}
                        >
                          <p className="text-base font-black leading-none text-[#123c8c]">
                            {point.value}
                          </p>
                          <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                            {unit}
                          </p>
                        </div>
                      ) : null}
                    </button>

                    <p className="mt-2 text-[8px] font-bold text-blue-50/80 md:text-[9px]">
                      {point.label}
                    </p>

                    <p className="text-[8px] font-black text-white md:text-[9px]">
                      {point.value}
                    </p>
                  </div>
                );
              })}
            </div>

            {activePoint ? (
              <div className="absolute bottom-2 left-4 max-w-[calc(100%-2rem)] rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black text-blue-50 ring-1 ring-white/10 md:bottom-3 md:left-5 md:text-xs">
                {metricLabel} tanggal {activePoint.label}: {activePoint.value}{" "}
                {unit}
              </div>
            ) : (
              <div className="absolute bottom-2 left-4 max-w-[calc(100%-2rem)] rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black text-blue-50/80 ring-1 ring-white/10 md:bottom-3 md:left-5 md:text-xs">
                Hover / tap batang untuk melihat info
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function PieProgressCard({
  label,
  value,
  percentage,
  description,
  icon,
}: {
  label: string;
  value: number;
  percentage: number;
  description: string;
  icon: ReactNode;
}) {
  const safePercentage = Math.max(0, Math.min(100, toSafeNumber(percentage)));
  const visualPercentage =
    value > 0 && safePercentage > 0
      ? Math.max(safePercentage, 1.5)
      : safePercentage;
  const rest = 100 - safePercentage;

  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/60">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">{description}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6f8ff] text-[#123c8c] ring-1 ring-blue-100">
          {icon}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <div
          className="relative h-24 w-24 rounded-full"
          style={{
            background: `conic-gradient(#123c8c 0% ${visualPercentage}%, #dbeafe ${visualPercentage}% 100%)`,
          }}
        >
          <div className="absolute inset-[10px] flex items-center justify-center rounded-full bg-white">
            <div className="text-center">
              <p className="text-lg font-black text-slate-950">
                {safePercentage.toFixed(1)}%
              </p>
              <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
                Proporsi
              </p>
            </div>
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center justify-between rounded-2xl bg-[#f8fbff] px-3 py-2 text-sm font-bold text-slate-600 ring-1 ring-blue-100">
            <span>Terpakai</span>
            <span className="font-black text-[#123c8c]">
              {safePercentage.toFixed(1)}%
            </span>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2 text-sm font-bold text-slate-500 ring-1 ring-slate-100">
            <span>Sisa</span>
            <span className="font-black text-slate-700">
              {rest.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCompanyMonitorPage() {
  const now = new Date();

  const [displayMode, setDisplayMode] = useState<DisplayMode>("chart");
  const [selectedMetric, setSelectedMetric] = useState<MetricValue>("present");

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
          monitorResult?.message || "Gagal mengambil data monitor perusahaan.",
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
        summary: {
          ...monitorResult.summary,
          activeEmployees: toSafeNumber(
            monitorResult?.summary?.activeEmployees,
          ),
          todayRecords: toSafeNumber(monitorResult?.summary?.todayRecords),
          present: toSafeNumber(monitorResult?.summary?.present),
          late: toSafeNumber(monitorResult?.summary?.late),
          wfh: toSafeNumber(monitorResult?.summary?.wfh),
          wfc: toSafeNumber(monitorResult?.summary?.wfc),
          visit: toSafeNumber(monitorResult?.summary?.visit),
          cuti: toSafeNumber(monitorResult?.summary?.cuti),
          pending: toSafeNumber(monitorResult?.summary?.pending),
          presentPercentage: toSafeNumber(
            monitorResult?.summary?.presentPercentage,
          ),
          latePercentage: toSafeNumber(monitorResult?.summary?.latePercentage),
          wfhPercentage: toSafeNumber(monitorResult?.summary?.wfhPercentage),
          wfcPercentage: toSafeNumber(monitorResult?.summary?.wfcPercentage),
          visitPercentage: toSafeNumber(
            monitorResult?.summary?.visitPercentage,
          ),
          cutiPercentage: toSafeNumber(monitorResult?.summary?.cutiPercentage),
          pendingPercentage: toSafeNumber(
            monitorResult?.summary?.pendingPercentage,
          ),
          totalLateMinutesMonth: toSafeNumber(
            monitorResult?.summary?.totalLateMinutesMonth,
          ),
          totalWorkMinutesMonth: toSafeNumber(
            monitorResult?.summary?.totalWorkMinutesMonth,
          ),
        },
        dailyChart: Array.isArray(monitorResult?.dailyChart)
          ? monitorResult.dailyChart.map((item: DailyChartPoint) => ({
              ...item,
              present: toSafeNumber(item?.present),
              late: toSafeNumber(item?.late),
              wfh: toSafeNumber(item?.wfh),
              wfc: toSafeNumber(item?.wfc),
              visit: toSafeNumber(item?.visit),
              cuti: toSafeNumber(item?.cuti),
              pending: toSafeNumber(item?.pending),
              active: toSafeNumber(item?.active),
              todayRecords: toSafeNumber(item?.todayRecords),
            }))
          : [],
        lateReasons: Array.isArray(monitorResult?.lateReasons)
          ? monitorResult.lateReasons
          : [],
      });

      setLeaveRequests(
        leaveResponse.ok &&
          leaveResult.success &&
          Array.isArray(leaveResult.requests)
          ? leaveResult.requests
          : [],
      );
    } catch (error) {
      setData(null);
      setLeaveRequests([]);
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

  const leaveChartData = useMemo(() => {
    return getLeaveChartData(data, leaveRequests, month, year);
  }, [data, leaveRequests, month, year]);

  const flexibleModeTotals = useMemo<FlexibleModeTotals>(() => {
    return getDailyChartModeTotals(data?.dailyChart || []);
  }, [data]);

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
        label: "WFH",
        value: getSummaryModeValue(data.summary, "wfh", flexibleModeTotals),
        note: `${getSummaryModePercentage(
          data.summary,
          "wfh",
          flexibleModeTotals,
        )}% dari total data`,
      },
      {
        label: "WFC",
        value: getSummaryModeValue(data.summary, "wfc", flexibleModeTotals),
        note: `${getSummaryModePercentage(
          data.summary,
          "wfc",
          flexibleModeTotals,
        )}% dari total data`,
      },
      {
        label: "Kunjungan",
        value: getSummaryModeValue(data.summary, "visit", flexibleModeTotals),
        note: `${getSummaryModePercentage(
          data.summary,
          "visit",
          flexibleModeTotals,
        )}% dari total data`,
      },
      {
        label: "Cuti",
        value: leaveChartData.totalApprovedRequests,
        note: "pengajuan cuti disetujui bulan ini",
      },
    ];
  }, [data, leaveChartData, flexibleModeTotals]);

  const flexibleModeCards = useMemo<FlexibleModeCardItem[]>(() => {
    if (!data) return [];

    return [
      {
        key: "wfh",
        label: "WFH",
        value: getSummaryModeValue(data.summary, "wfh", flexibleModeTotals),
        percentage: getSummaryModePercentage(
          data.summary,
          "wfh",
          flexibleModeTotals,
        ),
        description: "Monitoring absensi kerja dari rumah.",
      },
      {
        key: "wfc",
        label: "WFC",
        value: getSummaryModeValue(data.summary, "wfc", flexibleModeTotals),
        percentage: getSummaryModePercentage(
          data.summary,
          "wfc",
          flexibleModeTotals,
        ),
        description: "Monitoring absensi kerja dari luar kantor.",
      },
      {
        key: "visit",
        label: "Kunjungan",
        value: getSummaryModeValue(data.summary, "visit", flexibleModeTotals),
        percentage: getSummaryModePercentage(
          data.summary,
          "visit",
          flexibleModeTotals,
        ),
        description: "Monitoring absensi kunjungan lapangan / client.",
      },
    ];
  }, [data, flexibleModeTotals]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AppHeader title="Monitor Perusahaan" variant="admin" />

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

              <div className="rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <BriefcaseBusiness size={18} />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Monitoring Mode Kerja Fleksibel
                      </p>
                    </div>

                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Ringkasan WFH, WFC, dan Kunjungan
                    </h3>
                  </div>

                  <div className="rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#123c8c] ring-1 ring-blue-100">
                    Total data hari ini: {data.summary.todayRecords}
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  {flexibleModeCards.map((item) => {
                    const icon =
                      item.key === "wfh" ? (
                        <Home size={20} strokeWidth={2.5} />
                      ) : item.key === "wfc" ? (
                        <Building2 size={20} strokeWidth={2.5} />
                      ) : (
                        <BriefcaseBusiness size={20} strokeWidth={2.5} />
                      );

                    return (
                      <div
                        key={item.key}
                        className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                              {item.label}
                            </p>
                            <p className="mt-2 text-3xl font-black text-slate-950">
                              {item.value}
                            </p>
                          </div>

                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#123c8c] ring-1 ring-blue-100">
                            {icon}
                          </div>
                        </div>

                        <div className="mt-4 h-3 overflow-hidden rounded-full bg-blue-100">
                          <div
                            className="h-full rounded-full bg-[#123c8c]"
                            style={{
                              width: `${Math.min(item.percentage, 100)}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 text-sm font-black text-[#123c8c]">
                          {item.percentage.toFixed(1)}% dari total data
                        </p>

                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                          {item.description}
                        </p>
                      </div>
                    );
                  })}
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
                          Cuti bulan ini: {leaveChartData.totalApprovedRequests}{" "}
                          pengajuan disetujui.
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

                  <AnimatedHistogram
                    metricLabel={getMetricLabel(selectedMetric)}
                    unit={metricChart.unit}
                    points={metricChart.points}
                    maxValue={metricChart.maxValue}
                  />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <TrendingUp size={18} />
                      <p className="text-xs font-black uppercase tracking-[0.16em]">
                        Pie Chart Monitoring
                      </p>
                    </div>

                    <h3 className="mt-2 text-2xl font-black text-slate-950">
                      Pie Chart Terpisah per Kategori
                    </h3>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <PieProgressCard
                    label="WFH"
                    value={getSummaryModeValue(
                      data.summary,
                      "wfh",
                      flexibleModeTotals,
                    )}
                    percentage={getSummaryModePercentage(
                      data.summary,
                      "wfh",
                      flexibleModeTotals,
                    )}
                    description="Proporsi absensi WFH pada periode monitor."
                    icon={<Home size={20} strokeWidth={2.5} />}
                  />

                  <PieProgressCard
                    label="WFC"
                    value={getSummaryModeValue(
                      data.summary,
                      "wfc",
                      flexibleModeTotals,
                    )}
                    percentage={getSummaryModePercentage(
                      data.summary,
                      "wfc",
                      flexibleModeTotals,
                    )}
                    description="Proporsi absensi WFC pada periode monitor."
                    icon={<Building2 size={20} strokeWidth={2.5} />}
                  />

                  <PieProgressCard
                    label="Kunjungan"
                    value={getSummaryModeValue(
                      data.summary,
                      "visit",
                      flexibleModeTotals,
                    )}
                    percentage={getSummaryModePercentage(
                      data.summary,
                      "visit",
                      flexibleModeTotals,
                    )}
                    description="Proporsi absensi kunjungan pada periode monitor."
                    icon={<BriefcaseBusiness size={20} strokeWidth={2.5} />}
                  />
                </div>
              </div>

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
            </>
          ) : null}
        </section>
      </main>
    </MobileShell>
  );
}
