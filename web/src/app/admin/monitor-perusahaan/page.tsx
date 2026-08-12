"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ChevronDown, Clock3, Loader2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

const histogramSegments = [
  { key: "present", label: "Hadir", color: "#1d9bf0" },
  { key: "late", label: "Terlambat", color: "#1d9bf0" },
  { key: "wfh", label: "WFH", color: "#1d9bf0" },
  { key: "visit", label: "Kunjungan", color: "#1d9bf0" },
  { key: "cuti", label: "Cuti", color: "#1d9bf0" },
] as const;

const displayModeOptions = [
  { value: "chart", label: "Grafik Bar" },
  { value: "numbers", label: "Angka Ringkas" },
] as const;

type SegmentKey = (typeof histogramSegments)[number]["key"];
type DisplayMode = (typeof displayModeOptions)[number]["value"];

type Summary = {
  activeEmployees: number;
  todayRecords: number;

  monthPresent?: number;
  monthOffice?: number;
  monthLate?: number;
  monthWfh?: number;
  monthVisit?: number;
  monthCuti?: number;
  monthPending?: number;

  monthPresentPercentage?: number;
  monthLatePercentage?: number;
  monthWfhPercentage?: number;
  monthVisitPercentage?: number;
  monthCutiPercentage?: number;
  monthPendingPercentage?: number;

  present: number;
  office?: number;
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
  office?: number;
  late: number;
  wfh: number;
  visit: number;
  cuti: number;
  pending: number;
  active: number;
  todayRecords: number;
  employees?: Partial<Record<SegmentKey, ChartEmployee[]>>;
};

type ChartEmployee = {
  id: string;
  name: string;
  employeeCode?: string | null;
  profilePhoto?: string | null;
  profile_photo?: string | null;
  leaveType?: string | null;
  leaveTypeLabel?: string | null;
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

function formatMinutes(minutes: number) {
  if (!minutes || minutes <= 0) return "0 menit";

  if (minutes < 60) return `${minutes} menit`;

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (restMinutes === 0) return `${hours} jam`;

  return `${hours} jam ${restMinutes} menit`;
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

function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describePieSlice(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngle);
  const end = polarToCartesian(centerX, centerY, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${centerX} ${centerY}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function MonitorMotionStyles() {
  return (
    <style>{`
      @keyframes monitorEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes monitorRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes monitorBarEnter {
        0% {
          opacity: 0;
          transform: translateY(16px) scaleY(0);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scaleY(1);
        }
      }

      .monitor-enter {
        animation: monitorEnter 320ms ease-out both;
      }

      .monitor-row-enter {
        opacity: 0;
        animation: monitorRowEnter 300ms ease-out both;
      }

      .monitor-bar-enter {
        transform-origin: bottom;
        animation: monitorBarEnter 420ms ease-out both;
      }

      .monitor-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .monitor-enter,
        .monitor-row-enter,
        .monitor-bar-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

function AnimatedHistogram({
  points,
  maxValue,
  selectedSegment,
  onSelectedSegmentChange,
  month,
  year,
}: {
  points: DailyChartPoint[];
  maxValue: number;
  selectedSegment: SegmentKey;
  onSelectedSegmentChange: (segment: SegmentKey) => void;
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const safeMaxValue = Math.max(maxValue, 1);
  const activePoint =
    activeIndex !== null && points[activeIndex] ? points[activeIndex] : null;
  const selectedSegmentConfig =
    histogramSegments.find((segment) => segment.key === selectedSegment) ||
    histogramSegments[0];
  const chartWidth = Math.max(points.length * 44 + 84, 640);

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
      `}</style>

      <div className="monitor-row-enter mt-6 rounded-[1.65rem] border border-slate-200 bg-white p-3 text-slate-900 shadow-xl shadow-slate-200/70 md:rounded-[2rem] md:p-5">
        <div className="w-full">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <h4 className="truncate text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                Kehadiran Karyawan per Tanggal
              </h4>
            </div>

            <div className="relative w-full md:w-auto">
              <button
                type="button"
                onClick={() => setIsFilterOpen((current) => !current)}
                className="inline-flex h-11 w-full items-center justify-between gap-3 rounded-full border border-[#1d9bf0] bg-[#1d9bf0] px-4 text-sm font-black text-white shadow-sm transition active:scale-[0.98] md:w-[190px]"
                aria-expanded={isFilterOpen}
              >
                <span className="inline-flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-white" />
                  {selectedSegmentConfig.label}
                </span>
                <ChevronDown
                  size={17}
                  strokeWidth={3}
                  className={`transition ${isFilterOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isFilterOpen ? (
                <div className="absolute right-0 z-40 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-300/40 md:w-[190px]">
                  {histogramSegments.map((segment) => {
                    const isSelected = selectedSegment === segment.key;

                    return (
                      <button
                        key={segment.key}
                        type="button"
                        onClick={() => {
                          onSelectedSegmentChange(segment.key);
                          setActiveIndex(null);
                          setIsFilterOpen(false);
                        }}
                        className={`flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm font-black transition ${
                          isSelected
                            ? "bg-[#eef7ff] text-[#1d9bf0]"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        {segment.label}
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-5 overflow-x-auto overflow-y-hidden rounded-[1.35rem] border border-slate-200 bg-white md:rounded-[1.6rem]">
            <div
              className="relative h-[300px] px-3 pb-12 pt-7 md:h-[330px] md:px-5 md:pb-14 md:pt-9"
              style={{ minWidth: chartWidth }}
            >
              {Array.from({ length: 5 }).map((_, index) => {
                const percent = index * 25;
                const value = Math.round((safeMaxValue * percent) / 100);

                return (
                  <div
                    key={percent}
                    className="pointer-events-none absolute left-10 right-3 border-t border-slate-200 md:left-14 md:right-5"
                    style={{ bottom: `calc(3rem + ${percent * 0.78}%)` }}
                  >
                    <span className="absolute -left-9 -top-2 w-7 text-right text-[10px] font-black text-slate-400 md:-left-12 md:w-10 md:text-xs">
                      {value}
                    </span>
                  </div>
                );
              })}

              <div className="relative z-10 ml-8 flex h-[235px] items-end justify-start gap-3 md:ml-11 md:h-[255px] md:gap-4">
                {points.map((point, index) => {
                  const total = toSafeNumber(point[selectedSegment]);
                  const rawHeight = (total / safeMaxValue) * 215;
                  const height = Math.max(rawHeight, total > 0 ? 12 : 3);
                  const isActive = activeIndex === index;

                  return (
                    <div
                      key={`histogram-${selectedSegment}-${point.date || point.label}`}
                      className="relative flex w-8 shrink-0 flex-col items-center md:w-10"
                    >
                      {total > 0 ? (
                        <p className="mb-2 text-xs font-black text-slate-500">
                          {total}
                        </p>
                      ) : null}

                      <button
                        type="button"
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        onFocus={() => setActiveIndex(index)}
                        onBlur={() => setActiveIndex(null)}
                        onClick={() => {
                          setActiveIndex(index);
                          const params = new URLSearchParams({
                            month: String(month),
                            year: String(year),
                            date: point.date,
                            filter: selectedSegment,
                          });

                          router.push(
                            `/admin/monitor-perusahaan/histogram?${params.toString()}`,
                          );
                        }}
                        className={`monitor-bar-enter relative flex w-6 overflow-visible rounded-none bg-[#1d9bf0] outline-none transition duration-300 ease-out md:w-7 ${
                          isActive
                            ? "scale-x-110 bg-[#0d8ee5]"
                            : "hover:bg-[#0d8ee5]"
                        }`}
                        style={{
                          height,
                          animationDelay: `${index * 18}ms`,
                        }}
                        aria-label={`${selectedSegmentConfig.label} tanggal ${point.label}: ${total} karyawan`}
                      >
                        {isActive ? (
                          <div
                            className="absolute left-1/2 z-30 w-24 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/90 px-2 py-1.5 text-center shadow-lg shadow-slate-300/50"
                            style={{
                              bottom: height + 10,
                              animation:
                                "histogramTooltipIn 160ms ease-out forwards",
                            }}
                          >
                            <p className="text-base font-black leading-none text-slate-950">
                              {total}
                            </p>
                            <p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-slate-500">
                              karyawan
                            </p>
                          </div>
                        ) : null}
                      </button>

                      <p className="mt-2 text-[9px] font-black text-slate-500 md:text-[10px]">
                        {point.label}
                      </p>
                    </div>
                  );
                })}
              </div>

              {activePoint ? (
                <div className="absolute bottom-3 left-4 max-w-[calc(100%-2rem)] rounded-full bg-slate-50 px-3 py-1.5 text-[10px] font-black text-slate-600 ring-1 ring-slate-200 md:bottom-4 md:left-5 md:text-xs">
                  Tanggal {activePoint.label}:{" "}
                  {toSafeNumber(activePoint[selectedSegment])}{" "}
                  {selectedSegmentConfig.label.toLowerCase()}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function AttendancePieChart({
  summary,
  month,
  year,
}: {
  summary: Summary;
  month: number;
  year: number;
}) {
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const totalEmployees = Math.max(toSafeNumber(summary.activeEmployees), 0);

  const wfh = toSafeNumber(summary.monthWfh ?? summary.wfh);
  const visit = toSafeNumber(summary.monthVisit ?? summary.visit);
  const cuti = toSafeNumber(summary.monthCuti ?? summary.cuti);
  const office = Math.max(
    toSafeNumber(summary.monthOffice ?? summary.office) ||
      toSafeNumber(summary.monthPresent ?? summary.present),
    0,
  );
  const pending = toSafeNumber(summary.monthPending ?? summary.pending);
  const base = Math.max(office + wfh + visit + cuti + pending, 1);

  const items = [
    { label: "Hadir", value: office, color: "#8b5cf6" },
    { label: "WFH", value: wfh, color: "#f59e0b" },
    { label: "Kunjungan", value: visit, color: "#ef4444" },
    { label: "Cuti", value: cuti, color: "#14b8a6" },
  ];
  const chartItems = [
    ...items,
    { label: "Belum Hadir", value: pending, color: "#e2e8f0" },
  ];
  const selectedMonthOption = monthOptions.find((opt) => opt.value === month);
  const monthLabel = selectedMonthOption ? selectedMonthOption.label : `Bulan ${month}`;
  const hasAttendanceData = office + wfh + visit + cuti > 0;
  const chartSlices = chartItems.reduce<
    Array<
      (typeof chartItems)[number] & {
        startAngle: number;
        endAngle: number;
        percentage: number;
      }
    >
  >((slices, item) => {
    const previousAngle = slices[slices.length - 1]?.endAngle || 0;
    const percentage = base > 0 ? (item.value / base) * 100 : 0;
    const size = (percentage / 100) * 360;

    if (item.value <= 0) return slices;

    return [
      ...slices,
      {
        ...item,
        startAngle: previousAngle,
        endAngle: previousAngle + size,
        percentage,
      },
    ];
  }, []);
  const activePieItem =
    activePieIndex !== null ? chartSlices[activePieIndex] : null;

  return (
    <div className="monitor-row-enter mt-6 grid gap-5 rounded-[1.65rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/70 sm:grid-cols-[220px_1fr] sm:items-center md:rounded-[2rem] md:p-6">
      <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-full border border-slate-100 bg-slate-50 sm:h-52 sm:w-52 md:h-56 md:w-56">
        <div className="relative h-44 w-44 rounded-full sm:h-48 sm:w-48 md:h-52 md:w-52">
          <svg
            viewBox="0 0 100 100"
            className="h-full w-full overflow-visible rounded-full outline-none"
            aria-label="Pie chart komposisi kehadiran karyawan"
          >
            {chartSlices.length > 0 ? (
              chartSlices.map((item, index) => {
                const isFullCircle = item.percentage >= 99.99;
                const isActive = activePieIndex === index;

                return isFullCircle ? (
                  <circle
                    key={item.label}
                    cx="50"
                    cy="50"
                    r="49"
                    fill={item.color}
                    className="cursor-pointer outline-none transition duration-200"
                    opacity={isActive ? 0.9 : 1}
                    onMouseEnter={() => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                    onFocus={() => setActivePieIndex(index)}
                    onBlur={() => setActivePieIndex(null)}
                    style={{ outline: "none" }}
                    tabIndex={0}
                  />
                ) : (
                  <path
                    key={item.label}
                    d={describePieSlice(
                      50,
                      50,
                      isActive ? 50 : 49,
                      item.startAngle,
                      item.endAngle,
                    )}
                    fill={item.color}
                    className="cursor-pointer outline-none transition duration-200"
                    opacity={isActive ? 0.9 : 1}
                    onMouseEnter={() => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                    onFocus={() => setActivePieIndex(index)}
                    onBlur={() => setActivePieIndex(null)}
                    style={{ outline: "none" }}
                    tabIndex={0}
                  />
                );
              })
            ) : (
              <circle cx="50" cy="50" r="49" fill="#e2e8f0" />
            )}
          </svg>

          {activePieItem ? (
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-20 w-28 -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 text-center shadow-lg shadow-slate-300/50">
              <p className="text-lg font-black leading-none text-slate-950">
                {activePieItem.value}
              </p>
              <p className="mt-1 text-[10px] font-black text-slate-500">
                {activePieItem.percentage.toFixed(1)}%
              </p>
              <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.08em] text-slate-600">
                {activePieItem.label}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          Komposisi Kehadiran
        </p>
        <h4 className="mt-2 text-2xl font-black text-slate-950">
          Persentase dari {totalEmployees} karyawan
        </h4>
        <p className="mt-1 text-xs font-black text-[#123c8c]">
          Data rekap {monthLabel} {year}
        </p>
        {!hasAttendanceData ? (
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Belum ada presensi kantor, WFH, kunjungan, atau cuti hari ini.
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {chartItems.map((item) => {
            const percentage =
              base > 0 ? Number(((item.value / base) * 100).toFixed(1)) : 0;
            const sliceIndex = chartSlices.findIndex(
              (slice) => slice.label === item.label,
            );

            return (
              <div
                key={item.label}
                onMouseEnter={() =>
                  setActivePieIndex(sliceIndex >= 0 ? sliceIndex : null)
                }
                onMouseLeave={() => setActivePieIndex(null)}
                className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <p className="truncate text-sm font-black text-slate-800">
                    {item.label}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-black text-slate-950">
                  {percentage}% ({item.value})
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AdminCompanyMonitorPage() {
  const now = new Date();

  const [displayMode, setDisplayMode] = useState<DisplayMode>("chart");
  const [selectedHistogramSegment, setSelectedHistogramSegment] =
    useState<SegmentKey>("present");

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [data, setData] = useState<MonitorResponse | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadMonitorData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const monitorResponse = await fetch(
        `/api/admin/monitor-perusahaan?month=${month}&year=${year}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const monitorResult = await readJsonResponse(monitorResponse);

      if (!monitorResponse.ok) {
        throw new Error(
          monitorResult?.message || "Gagal mengambil data monitor perusahaan.",
        );
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
          office: toSafeNumber(monitorResult?.summary?.office),
          late: toSafeNumber(monitorResult?.summary?.late),
          wfh: toSafeNumber(monitorResult?.summary?.wfh),
          visit: toSafeNumber(monitorResult?.summary?.visit),
          cuti: toSafeNumber(monitorResult?.summary?.cuti),
          pending: toSafeNumber(monitorResult?.summary?.pending),
          presentPercentage: toSafeNumber(
            monitorResult?.summary?.presentPercentage,
          ),
          latePercentage: toSafeNumber(monitorResult?.summary?.latePercentage),
          wfhPercentage: toSafeNumber(monitorResult?.summary?.wfhPercentage),
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
              office: toSafeNumber(item?.office),
              late: toSafeNumber(item?.late),
              wfh: toSafeNumber(item?.wfh),
              visit: toSafeNumber(item?.visit),
              cuti: toSafeNumber(item?.cuti),
              pending: toSafeNumber(item?.pending),
              active: toSafeNumber(item?.active),
              todayRecords: toSafeNumber(item?.todayRecords),
              employees: item?.employees || {},
            }))
          : [],
        alerts: Array.isArray(monitorResult?.alerts)
          ? monitorResult.alerts
          : [],
        lateReasons: Array.isArray(monitorResult?.lateReasons)
          ? monitorResult.lateReasons
          : [],
      });
    } catch (error) {
      setData(null);
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
    void loadMonitorData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const histogramMaxValue = useMemo(() => {
    if (!data) return 1;

    return Math.max(
      ...data.dailyChart.map((point) =>
        toSafeNumber(point[selectedHistogramSegment]),
      ),
      1,
    );
  }, [data, selectedHistogramSegment]);

  const summaryCards = useMemo(() => {
    if (!data) return [];

    return [
      {
        label: "Hadir",
        value: data.summary.present,
        note: `${data.summary.presentPercentage}% rekap hari ini`,
      },
      {
        label: "Terlambat",
        value: data.summary.late,
        note: `${data.summary.latePercentage}% rekap hari ini`,
      },
      {
        label: "WFH",
        value: data.summary.wfh,
        note: `${data.summary.wfhPercentage}% rekap hari ini`,
      },
      {
        label: "Kunjungan",
        value: data.summary.visit,
        note: `${data.summary.visitPercentage}% rekap hari ini`,
      },
      {
        label: "Cuti",
        value: data.summary.cuti,
        note: "karyawan cuti hari ini",
      },
    ];
  }, [data]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <MonitorMotionStyles />

      <AppHeader title="Monitor Perusahaan" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <div className="monitor-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-6 text-white text-center md:text-left md:p-8">
                <div className="flex flex-col items-center gap-3 md:flex-row md:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <BarChart3 size={25} strokeWidth={2.6} />
                  </div>

                  <div>
                    <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                      Snapshot Perusahaan
                    </h2>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5 md:p-6">
                <div
                  className="monitor-row-enter"
                  style={{ animationDelay: "60ms" }}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Mode Tampilan
                  </p>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {displayModeOptions.map((option) => {
                      const active = displayMode === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setDisplayMode(option.value)}
                          className={`monitor-field flex h-12 items-center justify-center rounded-2xl border px-4 text-sm font-black outline-none transition active:scale-[0.98] ${
                            active
                              ? "border-[#123c8c] bg-[#123c8c] text-white shadow-sm"
                              : "border-blue-100 bg-[#f6f8ff] text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div
                  className="monitor-row-enter grid gap-3 md:grid-cols-2"
                  style={{ animationDelay: "100ms" }}
                >
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                      Bulan
                    </p>

                    <select
                      value={month}
                      onChange={(event) => setMonth(Number(event.target.value))}
                      className="monitor-field mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
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
                      className="monitor-field mt-2 h-12 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                    />
                  </div>
                </div>

                <div
                  className="monitor-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                  style={{ animationDelay: "140ms" }}
                >
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                    Grafik Aktif
                  </p>

                  <p className="mt-2 text-2xl font-black text-slate-950">
                    Kehadiran Karyawan
                  </p>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="monitor-enter flex min-h-[320px] items-center justify-center rounded-3xl border border-blue-100 bg-white">
              <div className="text-center">
                <Loader2 className="mx-auto animate-spin text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-600">
                  Mengambil data monitor perusahaan...
                </p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="monitor-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : data ? (
            <>
              <div
                className="monitor-enter rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30"
                style={{ animationDelay: "140ms" }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black text-slate-950">
                      Grafik Kehadiran per Tanggal
                    </h3>

                    <p className="mt-2 text-sm font-semibold text-slate-500 md:text-base">
                      Total waktu terlambat bulan ini:{" "}
                      <span className="font-black text-slate-700">
                        {formatMinutes(data.summary.totalLateMinutesMonth)}
                      </span>
                    </p>
                  </div>

                  <div className="shrink-0 rounded-2xl bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900 ring-1 ring-amber-200/70 sm:text-right">
                    Cuti hari ini:{" "}
                    <span className="rounded-lg bg-amber-400/30 px-2 py-0.5 font-black text-amber-950">
                      {data.summary.cuti}
                    </span>{" "}
                    karyawan
                  </div>
                </div>

                {displayMode === "chart" ? (
                  <>
                    <AnimatedHistogram
                      points={data.dailyChart}
                      maxValue={histogramMaxValue}
                      selectedSegment={selectedHistogramSegment}
                      onSelectedSegmentChange={setSelectedHistogramSegment}
                      month={month}
                      year={year}
                    />

                    <AttendancePieChart
                      summary={data.summary}
                      month={month}
                      year={year}
                    />
                  </>
                ) : (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {summaryCards.map((item, index) => (
                        <div
                          key={item.label}
                          className="monitor-row-enter rounded-2xl border border-blue-100 bg-white p-4 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40"
                          style={{
                            animationDelay: `${index * 55}ms`,
                          }}
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
                  </div>
                )}
              </div>

              <div
                className="monitor-enter rounded-3xl border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30"
                style={{ animationDelay: "220ms" }}
              >
                <div className="flex items-center gap-2 text-amber-700">
                  <Clock3 size={18} />

                  <h3 className="text-lg font-black text-slate-950">
                    Rekap Karyawan Terlambat
                  </h3>
                </div>

                {data.lateReasons.length === 0 ? (
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Belum ada karyawan terlambat hari ini.
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
                        {data.lateReasons.map((item, index) => (
                          <tr
                            key={item.id}
                            className="monitor-row-enter border-b border-slate-100 last:border-0"
                            style={{
                              animationDelay: `${index * 45}ms`,
                            }}
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
