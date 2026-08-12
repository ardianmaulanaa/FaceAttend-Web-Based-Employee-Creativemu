"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Loader2,
  Search,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import { AppLoadingState } from "@/components/ui/AppUI";

type Employee = {
  id: string;
  name: string;
  email: string;
  employee_code?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  status?: string | null;
  employment_status?: string | null;
  remainingLeaveQuota?: number;
  department?: {
    name?: string | null;
  } | null;
  jabatan?: {
    name?: string | null;
  } | null;
  position?: {
    name?: string | null;
  } | null;
};

type EmployeesResponse = {
  success?: boolean;
  message?: string;
  employees?: Employee[];
};

type LeaveRequest = {
  id: string;
  employeeId: string;
  status: string;
};

type LeaveRequestsResponse = {
  success?: boolean;
  message?: string;
  requests?: LeaveRequest[];
  leaveRequests?: LeaveRequest[];
};

type EmployeeAttendanceSummary = {
  totalPresensi: number;
  hadir: number;
  terlambat: number;
  totalWorkMinutes: number;
  menunggu: number;
  izin: number;
  sakit: number;
  cuti: number;
  lainnya: number;
  wfh?: number;
  kunjungan?: number;
};

type EmployeeRecap = {
  id: string;
  name: string;
  employeeCode?: string | null;
  annualLeaveQuota?: number;
  approvedLeaveDays?: number;
  remainingLeaveQuota?: number;
  summary: EmployeeAttendanceSummary;
};

type EmployeeAttendanceRecapResponse = {
  success?: boolean;
  message?: string;
  employees?: EmployeeRecap[];
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function getStatusLabel(status?: string | null) {
  if (String(status || "").toLowerCase() === "active") return "Aktif";

  return "Nonaktif";
}

function getStatusStyle(status?: string | null) {
  if (String(status || "").toLowerCase() === "active") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function getEmployeePhoto(employee: Employee) {
  return employee.profile_photo || employee.profile_photo_url || "";
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

function formatDateRange(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "Rentang tanggal belum dipilih";
  }

  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
}

function formatWorkDuration(minutes?: number | null) {
  if (!minutes || minutes <= 0) return "0m";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}j ${remainingMinutes}m`;
  }

  if (hours > 0) return `${hours}j`;

  return `${remainingMinutes}m`;
}

function getNetWorkMinutes(summary?: EmployeeAttendanceSummary | null) {
  if (!summary) return 0;

  return Math.max(
    Number(summary.totalWorkMinutes || 0) - Number(summary.terlambat || 0),
    0,
  );
}

function getDisplayErrorMessage(message: string | undefined, fallback: string) {
  const text = String(message || "").trim();

  if (!text) return fallback;

  return text;
}

function AttendanceRecapMotionStyles() {
  return (
    <style>{`
      @keyframes attendanceRecapEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes attendanceRecapRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .attendance-recap-enter {
        animation: attendanceRecapEnter 320ms ease-out both;
      }

      .attendance-recap-row-enter {
        opacity: 0;
        animation: attendanceRecapRowEnter 300ms ease-out both;
      }

      .attendance-recap-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .attendance-recap-enter,
        .attendance-recap-row-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminEmployeeAttendanceRecapPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [recaps, setRecaps] = useState<EmployeeRecap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecapLoading, setIsRecapLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [recapErrorMessage, setRecapErrorMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [startDate, setStartDate] = useState(getDefaultStartDate);
  const [endDate, setEndDate] = useState(getDefaultEndDate);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

  async function getEmployees() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      const data: EmployeesResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setEmployees([]);
        setErrorMessage(
          getDisplayErrorMessage(
            data.message,
            "Gagal mengambil data karyawan.",
          ),
        );
        return;
      }

      setEmployees(data.employees || []);
    } catch (error) {
      setEmployees([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data karyawan.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function getLeaveRequests() {
    try {
      const response = await fetch("/api/admin/leave-requests", {
        method: "GET",
        cache: "no-store",
      });

      const data: LeaveRequestsResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setLeaveRequests([]);
        return;
      }

      setLeaveRequests(data.requests || data.leaveRequests || []);
    } catch {
      setLeaveRequests([]);
    }
  }

  const getEmployeeRecaps = useCallback(async () => {
    if (!startDate || !endDate) {
      setRecaps([]);
      setRecapErrorMessage("Pilih tanggal mulai dan tanggal akhir.");
      return;
    }

    if (startDate > endDate) {
      setRecaps([]);
      setRecapErrorMessage("Tanggal mulai tidak boleh melewati tanggal akhir.");
      return;
    }

    try {
      setIsRecapLoading(true);
      setRecapErrorMessage("");

      const queryParams = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(
        `/api/admin/employee-attendance-recap?${queryParams.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data: EmployeeAttendanceRecapResponse =
        await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setRecaps([]);
        setRecapErrorMessage(
          getDisplayErrorMessage(
            data.message,
            "Gagal mengambil rekap kehadiran karyawan.",
          ),
        );
        return;
      }

      setRecaps(data.employees || []);
    } catch (error) {
      setRecaps([]);
      setRecapErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil rekap kehadiran karyawan.",
      );
    } finally {
      setIsRecapLoading(false);
    }
  }, [endDate, startDate]);

  useEffect(() => {
    void Promise.all([getEmployees(), getLeaveRequests()]);
  }, []);

  useEffect(() => {
    void getEmployeeRecaps();
  }, [getEmployeeRecaps]);

  const filteredEmployees = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    if (!keyword) return employees;

    return employees.filter((employee) => {
      const searchableText = [
        employee.name,
        employee.email,
        employee.employee_code,
        employee.employment_status,
        employee.department?.name,
        employee.jabatan?.name,
        employee.position?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(keyword);
    });
  }, [employees, searchKeyword]);

  const activeEmployees = employees.filter(
    (employee) => String(employee.status || "").toLowerCase() === "active",
  ).length;

  const recapByEmployeeId = useMemo(() => {
    return new Map(recaps.map((recap) => [recap.id, recap]));
  }, [recaps]);

  const pendingLeaveCountByEmployeeId = useMemo(() => {
    const leaveCounts = new Map<string, number>();

    for (const request of leaveRequests) {
      if (request.status.toLowerCase() !== "pending") continue;

      leaveCounts.set(
        request.employeeId,
        (leaveCounts.get(request.employeeId) || 0) + 1,
      );
    }

    return leaveCounts;
  }, [leaveRequests]);

  const selectedEmployee = useMemo(() => {
    return (
      employees.find((employee) => employee.id === selectedEmployeeId) || null
    );
  }, [employees, selectedEmployeeId]);

  const selectedEmployeeRecap = selectedEmployeeId
    ? recapByEmployeeId.get(selectedEmployeeId) || null
    : null;
  const rankedEmployees = useMemo(() => {
    return [...filteredEmployees].sort((firstEmployee, secondEmployee) => {
      const firstSummary = recapByEmployeeId.get(firstEmployee.id)?.summary;
      const secondSummary = recapByEmployeeId.get(secondEmployee.id)?.summary;
      const netWorkDifference =
        getNetWorkMinutes(secondSummary) - getNetWorkMinutes(firstSummary);

      if (netWorkDifference !== 0) return netWorkDifference;

      const totalWorkDifference =
        Number(secondSummary?.totalWorkMinutes || 0) -
        Number(firstSummary?.totalWorkMinutes || 0);

      if (totalWorkDifference !== 0) return totalWorkDifference;

      const presentDifference =
        Number(secondSummary?.hadir || 0) - Number(firstSummary?.hadir || 0);

      if (presentDifference !== 0) return presentDifference;

      return firstEmployee.name.localeCompare(secondEmployee.name, "id");
    });
  }, [filteredEmployees, recapByEmployeeId]);

  const selectedSummary =
    selectedEmployeeRecap?.summary ||
    ({
      totalPresensi: 0,
      hadir: 0,
      terlambat: 0,
      totalWorkMinutes: 0,
      menunggu: 0,
      izin: 0,
      sakit: 0,
      cuti: 0,
      lainnya: 0,
      wfh: 0,
      kunjungan: 0,
    } satisfies EmployeeAttendanceSummary);

  const summaryItems = [
    {
      label: "Hadir",
      value: selectedSummary.hadir,
      className: "border-emerald-100 bg-emerald-50 text-emerald-700",
    },
    {
      label: "Terlambat (Menit)",
      value: selectedSummary.terlambat,
      className: "border-amber-100 bg-amber-50 text-amber-700",
    },
    {
      label: "WFH",
      value: selectedSummary.wfh || 0,
      className: "border-sky-100 bg-sky-50 text-sky-700",
    },
    {
      label: "Kunjungan",
      value: selectedSummary.kunjungan || 0,
      className: "border-teal-100 bg-teal-50 text-teal-700",
    },
    {
      label: "Sakit",
      value: selectedSummary.sakit,
      className: "border-red-100 bg-red-50 text-red-700",
    },
    {
      label: "Cuti",
      value: selectedSummary.cuti,
      className: "border-sky-100 bg-sky-50 text-sky-700",
    },
  ];

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AttendanceRecapMotionStyles />

      <AppHeader title="Rekap Kehadiran Karyawan" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <div className="attendance-recap-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-6 text-white md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <ClipboardList size={25} strokeWidth={2.6} />
                  </div>

                  <div>
                    <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                      Rekap Kehadiran Karyawan
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 md:p-6">
                <div
                  className="attendance-recap-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                  style={{ animationDelay: "60ms" }}
                >
                  <p className="text-xs font-bold text-slate-500">
                    Total Karyawan
                  </p>
                  <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                    {employees.length}
                  </h3>
                </div>

                <div
                  className="attendance-recap-row-enter rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                  style={{ animationDelay: "100ms" }}
                >
                  <p className="text-xs font-bold text-emerald-700">Aktif</p>
                  <h3 className="mt-3 text-3xl font-black text-emerald-700">
                    {activeEmployees}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div
            className="attendance-recap-enter w-full max-w-full overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 px-5 py-8 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:px-8 md:py-10"
            style={{ animationDelay: "100ms" }}
          >
            <div className="grid w-full max-w-full gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.4fr)]">
              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    className="attendance-recap-field h-12 w-full min-w-0 max-w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    className="attendance-recap-field h-12 w-full min-w-0 max-w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>

              <label className="block min-w-0">
                <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-500">
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
                    placeholder="Cari nama karyawan..."
                    className="attendance-recap-field h-12 w-full min-w-0 max-w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </label>
            </div>
          </div>

          {errorMessage ? (
            <div className="attendance-recap-row-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {recapErrorMessage ? (
            <div className="attendance-recap-row-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {recapErrorMessage}
            </div>
          ) : null}

          {selectedEmployee ? (
            <div
              className="attendance-recap-enter rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30 md:p-6"
              style={{ animationDelay: "120ms" }}
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#123c8c]">
                    Rekap Terpilih
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-slate-950">
                    {selectedEmployee.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {formatDateRange(startDate, endDate)}
                  </p>
                </div>

                {isRecapLoading ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#123c8c] ring-1 ring-blue-100">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuat rekap
                  </div>
                ) : null}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-7">
                {summaryItems.map((item) => (
                  <div
                    key={item.label}
                    className={`rounded-2xl border p-4 ${item.className}`}
                  >
                    <p className="text-xs font-black">{item.label}</p>
                    <p className="mt-3 text-3xl font-black">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="attendance-recap-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            {isLoading ? (
              <div className="p-5">
                <AppLoadingState text="Memuat rekap karyawan..." />
              </div>
            ) : rankedEmployees.length ? (
              <div className="divide-y divide-blue-50">
                {rankedEmployees.map((employee, index) => {
                  const pendingLeaveCount =
                    pendingLeaveCountByEmployeeId.get(employee.id) || 0;
                  const hasPendingLeave = pendingLeaveCount > 0;
                  const employeePhoto = getEmployeePhoto(employee);
                  const summary = recapByEmployeeId.get(employee.id)?.summary;
                  const netWorkMinutes = getNetWorkMinutes(summary);
                  const detailParams = new URLSearchParams({
                    startDate,
                    endDate,
                  });

                  return (
                    <Link
                      key={employee.id}
                      href={`/admin/rekap-kehadiran-karyawan/${employee.id}?${detailParams.toString()}`}
                      onClick={() => setSelectedEmployeeId(employee.id)}
                      className={`group attendance-recap-row-enter flex w-full items-center gap-4 border-l-4 p-4 text-left transition hover:bg-[#f8fbff] md:p-5 ${
                        hasPendingLeave
                          ? "border-l-orange-400 bg-orange-50/35"
                          : "border-l-transparent"
                      } ${
                        selectedEmployeeId === employee.id ? "bg-[#f8fbff]" : ""
                      }`}
                      style={{
                        animationDelay: `${Math.min(index, 12) * 35}ms`,
                      }}
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${
                          hasPendingLeave
                            ? "bg-orange-100 text-orange-700"
                            : "bg-[#eaf1ff] text-[#123c8c]"
                        }`}
                      >
                        {index + 1}
                      </div>

                      <div
                        className={`relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-[#123c8c] ring-1 ${
                          hasPendingLeave
                            ? "bg-orange-50 ring-orange-100"
                            : "bg-[#f1f5ff] ring-blue-100"
                        }`}
                      >
                        {employeePhoto ? (
                          <img
                            src={employeePhoto}
                            alt={employee.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserRound size={23} strokeWidth={2.6} />
                        )}

                        {hasPendingLeave ? (
                          <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black text-white ring-2 ring-white">
                            {pendingLeaveCount}
                          </span>
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-black text-slate-950 leading-snug break-words sm:text-base">
                          {employee.name}
                        </h3>

                        <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500 break-words sm:text-xs">
                          {[
                            employee.employee_code,
                            employee.department?.name,
                            employee.jabatan?.name || employee.position?.name,
                          ]
                            .filter(Boolean)
                            .join(" / ")}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-2 ml-auto">
                        <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center">
                          {hasPendingLeave ? (
                            <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700 ring-1 ring-orange-200 sm:px-2.5 sm:py-1 sm:text-[11px]">
                              {pendingLeaveCount} cuti baru
                            </span>
                          ) : null}

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-black ring-1 sm:px-2.5 sm:py-1 sm:text-[11px] ${getStatusStyle(
                              employee.status,
                            )}`}
                          >
                            {getStatusLabel(employee.status)}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-black text-slate-950 leading-snug break-words sm:text-base">
                            {employee.name}
                          </h3>

                          <p className="mt-0.5 text-[11px] font-semibold leading-snug text-slate-500 break-words sm:text-xs">
                            {[
                              employee.employee_code,
                              employee.department?.name,
                              employee.jabatan?.name || employee.position?.name,
                            ]
                              .filter(Boolean)
                              .join(" / ")}
                          </p>
                          {netWorkMinutes > 0 ? (
                            <p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#123c8c] sm:text-xs">
                              Kerja bersih {formatWorkDuration(netWorkMinutes)}
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2 ml-auto">
                          <div className="flex flex-col items-end gap-1.5 sm:flex-row sm:items-center">
                            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700 ring-1 ring-purple-200/80 sm:text-[11px]">
                              Sisa Cuti: {employee.remainingLeaveQuota ?? 12} Hari
                            </span>

                            {hasPendingLeave ? (
                              <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700 ring-1 ring-orange-200 sm:px-2.5 sm:py-1 sm:text-[11px]">
                                {pendingLeaveCount} cuti baru
                              </span>
                            ) : null}

                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-black ring-1 sm:px-2.5 sm:py-1 sm:text-[11px] ${getStatusStyle(
                                employee.status,
                              )}`}
                            >
                              {getStatusLabel(employee.status)}
                            </span>
                          </div>

                          <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] ring-1 ring-blue-100 transition group-hover:bg-[#123c8c] group-hover:text-white sm:h-10 sm:w-10">
                            <ChevronRight size={18} strokeWidth={2.8} className="transition-transform group-hover:translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                  <ClipboardList size={26} strokeWidth={2.6} />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  Belum ada karyawan
                </h3>

                <p className="mt-2 max-w-sm text-sm font-semibold leading-6 text-slate-500">
                  Data karyawan akan muncul di sini setelah ditambahkan.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
