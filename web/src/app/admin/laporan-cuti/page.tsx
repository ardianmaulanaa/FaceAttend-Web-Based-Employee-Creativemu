"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Eye,
  Search,
  UserRound,
  XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import { AppLoadingState } from "@/components/ui/AppUI";

type AdminLeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
  employeeEmail: string | null;
  employeePhone: string | null;
  employeeStatus: string | null;
  employeeEmploymentStatus: string | null;
  employeeEmploymentStartDate: string | null;
  employeeEmploymentEndDate: string | null;
  employeeBirthPlace: string | null;
  employeeBirthDate: string | null;
  employeeBankAccountNumber: string | null;
  employeeNik: string | null;
  employeeProfilePhoto: string | null;
  employeeJabatan: string | null;
  employeePosition: string | null;
  employeeDepartment: string | null;
  employeeShift: string | null;
  employeeOffice: string | null;
  leaveType: string;
  leaveTypeLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  statusLabel: string;
  adminNote: string | null;
  createdAt: string;
};

type AdminLeaveResponse = {
  success: boolean;
  message?: string;
  error?: string;
  requests: AdminLeaveRequest[];
};

type Employee = {
  id: string;
  name: string;
  email: string;
  employee_code?: string | null;
  phone?: string | null;
  status?: string | null;
  employment_status?: string | null;
  employment_start_date?: string | null;
  employment_end_date?: string | null;
  nik?: string | null;
  profile_photo?: string | null;
  registered_office?: {
    name?: string | null;
  } | null;
  department?: {
    name?: string | null;
  } | null;
  jabatan?: {
    name?: string | null;
  } | null;
  position?: {
    name?: string | null;
  } | null;
  shift?: {
    name?: string | null;
  } | null;
};

type EmployeesResponse = {
  success: boolean;
  message?: string;
  error?: string;
  employees?: Employee[];
  data?: Employee[];
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

type EmployeeLeaveRow = Employee & {
  requests: AdminLeaveRequest[];
  latestRequest: AdminLeaveRequest | null;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  leaveStatus: "none" | "pending" | "approved" | "rejected";
  leaveStatusLabel: string;
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    console.error("API_BUKAN_JSON:", text);

    return {
      success: false,
      message: "API mengembalikan response bukan JSON.",
      requests: [],
    };
  }
}

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (normalized === "rejected") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (normalized === "none") {
    return "bg-slate-50 text-slate-500 ring-slate-200";
  }

  return "bg-orange-50 text-orange-700 ring-orange-100";
}

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") return CheckCircle2;
  if (normalized === "rejected") return XCircle;
  if (normalized === "none") return CalendarDays;

  return Clock3;
}

function getStatusLabel(status: StatusFilter) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";

  return "Semua Status";
}

function getEmployeeProfilePhoto(employee: Employee) {
  return employee.profile_photo || null;
}

function getEmployeeLeaveStatus(requests: AdminLeaveRequest[]) {
  if (requests.some((item) => item.status.toLowerCase() === "pending")) {
    return {
      status: "pending" as const,
      label: "Ada Request",
    };
  }

  const latestRequest = requests[0] || null;

  if (latestRequest?.status.toLowerCase() === "approved") {
    return {
      status: "approved" as const,
      label: "Disetujui",
    };
  }

  if (latestRequest?.status.toLowerCase() === "rejected") {
    return {
      status: "rejected" as const,
      label: "Ditolak",
    };
  }

  return {
    status: "none" as const,
    label: "Belum Ada",
  };
}

function LeaveReportMotionStyles() {
  return (
    <style>{`
      @keyframes leaveReportEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes leaveReportRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes leaveReportModalBackdrop {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }

      @keyframes leaveReportModalPanel {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .leave-report-enter {
        animation: leaveReportEnter 320ms ease-out both;
      }

      .leave-report-row-enter {
        opacity: 0;
        animation: leaveReportRowEnter 300ms ease-out both;
      }

      .leave-report-modal-backdrop {
        animation: leaveReportModalBackdrop 180ms ease-out both;
      }

      .leave-report-modal-panel {
        animation: leaveReportModalPanel 260ms ease-out both;
        transform-origin: center bottom;
      }

      .leave-report-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .leave-report-enter,
        .leave-report-row-enter,
        .leave-report-modal-backdrop,
        .leave-report-modal-panel {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminLeaveReportPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [requests, setRequests] = useState<AdminLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  async function getLeaveReportData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [employeesResponse, leaveResponse] = await Promise.all([
        fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        }),
        fetch("/api/admin/leave-requests", {
          method: "GET",
          cache: "no-store",
        }),
      ]);

      const employeesData: EmployeesResponse =
        await readJsonResponse(employeesResponse);
      const leaveData: AdminLeaveResponse = await readJsonResponse(leaveResponse);

      if (!employeesResponse.ok || !employeesData.success) {
        setEmployees([]);
        setRequests([]);
        setErrorMessage(
          employeesData.message ||
            employeesData.error ||
            "Gagal mengambil data karyawan.",
        );
        return;
      }

      if (!leaveResponse.ok || !leaveData.success) {
        setEmployees(employeesData.employees || employeesData.data || []);
        setRequests([]);
        setErrorMessage(
          leaveData.message || leaveData.error || "Gagal mengambil laporan cuti.",
        );
        return;
      }

      setEmployees(employeesData.employees || employeesData.data || []);
      setRequests(leaveData.requests || []);
    } catch (error) {
      console.error("GET_ADMIN_LEAVE_REPORT_DATA_ERROR:", error);
      setEmployees([]);
      setRequests([]);
      setErrorMessage("Gagal mengambil laporan cuti.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void getLeaveReportData();
  }, []);

  const employeeRows = useMemo<EmployeeLeaveRow[]>(() => {
    const requestsByEmployeeId = new Map<string, AdminLeaveRequest[]>();

    requests.forEach((item) => {
      const employeeRequests = requestsByEmployeeId.get(item.employeeId) || [];
      employeeRequests.push(item);
      requestsByEmployeeId.set(item.employeeId, employeeRequests);
    });

    return employees.map((employee) => {
      const employeeRequests = requestsByEmployeeId.get(employee.id) || [];
      const leaveStatus = getEmployeeLeaveStatus(employeeRequests);

      return {
        ...employee,
        requests: employeeRequests,
        latestRequest: employeeRequests[0] || null,
        pendingCount: employeeRequests.filter(
          (item) => item.status.toLowerCase() === "pending",
        ).length,
        approvedCount: employeeRequests.filter(
          (item) => item.status.toLowerCase() === "approved",
        ).length,
        rejectedCount: employeeRequests.filter(
          (item) => item.status.toLowerCase() === "rejected",
        ).length,
        leaveStatus: leaveStatus.status,
        leaveStatusLabel: leaveStatus.label,
      };
    });
  }, [employees, requests]);

  const stats = useMemo(() => {
    const total = employeeRows.length;
    const pending = employeeRows.filter(
      (item) => item.leaveStatus === "pending",
    ).length;
    const approved = employeeRows.filter(
      (item) => item.leaveStatus === "approved",
    ).length;
    const rejected = employeeRows.filter(
      (item) => item.leaveStatus === "rejected",
    ).length;

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }, [employeeRows]);

  const filteredEmployees = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return employeeRows.filter((item) => {
      const matchStatus =
        statusFilter === "all" || item.leaveStatus === statusFilter;

      const searchableText = [
        item.name,
        item.employee_code,
        item.email,
        item.phone,
        item.registered_office?.name,
        item.department?.name,
        item.jabatan?.name,
        item.position?.name,
        item.shift?.name,
        item.employment_status,
        item.nik,
        item.leaveStatusLabel,
        item.latestRequest?.leaveTypeLabel,
        item.latestRequest?.reason,
        item.latestRequest?.statusLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = !keyword || searchableText.includes(keyword);

      return matchStatus && matchKeyword;
    });
  }, [employeeRows, searchKeyword, statusFilter]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <LeaveReportMotionStyles />

      <AppHeader title="Laporan Cuti" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <div className="leave-report-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-6 text-white md:p-8">
                <div className="flex flex-col items-center text-center gap-3 md:flex-row md:items-center md:text-left">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                    <FileText size={25} strokeWidth={2.6} />
                  </div>

                  <div>
                    <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                      Laporan Pengajuan Cuti
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4 md:p-6">
                <div
                  className="leave-report-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                  style={{ animationDelay: "60ms" }}
                >
	                  <p className="text-xs font-bold text-slate-500">Total</p>
	                  <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
	                    {stats.total}
	                  </h3>
	                  <p className="mt-1 text-xs font-semibold text-slate-500">
	                    Semua karyawan
	                  </p>
                </div>

                <div
                  className="leave-report-row-enter rounded-2xl border border-orange-100 bg-orange-50 p-4"
                  style={{ animationDelay: "100ms" }}
                >
                  <p className="text-xs font-bold text-orange-700">Menunggu</p>
                  <h3 className="mt-3 text-3xl font-black text-orange-700">
                    {stats.pending}
                  </h3>
	                  <p className="mt-1 text-xs font-semibold text-orange-700/70">
	                    Ada request
	                  </p>
                </div>

                <div
                  className="leave-report-row-enter rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                  style={{ animationDelay: "140ms" }}
                >
                  <p className="text-xs font-bold text-emerald-700">
                    Disetujui
                  </p>
                  <h3 className="mt-3 text-3xl font-black text-emerald-700">
                    {stats.approved}
                  </h3>
	                  <p className="mt-1 text-xs font-semibold text-emerald-700/70">
	                    Status terakhir
	                  </p>
                </div>

                <div
                  className="leave-report-row-enter rounded-2xl border border-red-100 bg-red-50 p-4"
                  style={{ animationDelay: "180ms" }}
                >
                  <p className="text-xs font-bold text-red-700">Ditolak</p>
                  <h3 className="mt-3 text-3xl font-black text-red-700">
                    {stats.rejected}
                  </h3>
	                  <p className="mt-1 text-xs font-semibold text-red-700/70">
	                    Status terakhir
	                  </p>
                </div>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="leave-report-row-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div
            className="leave-report-enter rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Data Laporan
                </p>

	                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
	                  Daftar Karyawan
	                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_220px] md:items-end">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Cari Karyawan
                </label>
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
	                  value={searchKeyword}
	                  onChange={(event) => setSearchKeyword(event.target.value)}
	                  placeholder="Cari nama, kode, divisi, atau status cuti..."
                    className="leave-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Status Cuti
                </label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as StatusFilter)
                    }
                    className="leave-report-field h-12 w-full appearance-none rounded-2xl border border-blue-100 bg-[#f8fbff] pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                  >
                    <option value="all">Semua Status</option>
                    <option value="pending">Menunggu</option>
                    <option value="approved">Disetujui</option>
                    <option value="rejected">Ditolak</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="leave-report-row-enter">
                  <AppLoadingState text="Memuat laporan cuti..." />
                </div>
	              ) : filteredEmployees.length === 0 ? (
	                <div className="leave-report-row-enter rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                    <CalendarDays size={26} strokeWidth={2.6} />
                  </div>

	                  <p className="mt-4 text-sm font-black text-slate-500">
	                    Tidak ada karyawan untuk filter{" "}
	                    {getStatusLabel(statusFilter)}.
	                  </p>
                </div>
              ) : (
	                <div className="grid gap-3">
	                  {filteredEmployees.map((item, index) => {
	                    const StatusIcon = getStatusIcon(item.leaveStatus);
	                    const profilePhoto = getEmployeeProfilePhoto(item);

	                    return (
	                      <Link
	                        key={item.id}
	                        href={`/admin/laporan-cuti/karyawan/${item.id}`}
	                        className="leave-report-row-enter group relative overflow-hidden rounded-3xl border border-blue-100 bg-white p-4 shadow-md shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:border-[#123c8c]/30 hover:shadow-lg hover:shadow-slate-300/30 active:scale-[0.99] md:p-5"
                        style={{
                          animationDelay: `${index * 55}ms`,
                        }}
                      >
	                        {item.leaveStatus === "pending" ? (
	                          <span className="absolute right-4 top-4 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                          </span>
                        ) : null}

                        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                          <div className="flex min-w-0 items-center gap-3 pr-6">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-base font-black text-[#123c8c]">
                              {index + 1}
                            </div>

	                            {profilePhoto ? (
	                              <img
	                                src={profilePhoto}
	                                alt={`Foto profil ${item.name}`}
	                                className="h-12 w-12 shrink-0 rounded-2xl border border-blue-100 object-cover"
	                              />
                            ) : (
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-100 bg-[#f8fbff] text-[#123c8c]">
                                <UserRound size={24} strokeWidth={2.6} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
	                                <h3 className="truncate text-lg font-black text-slate-950 md:text-xl">
	                                  {item.name}
	                                </h3>

	                                <span
	                                  className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
	                                    item.leaveStatus,
	                                  )}`}
	                                >
	                                  <StatusIcon size={14} strokeWidth={2.6} />
	                                  {item.leaveStatusLabel}
	                                </span>
	                              </div>
                            </div>
                          </div>

                          <span className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition group-hover:bg-[#0f3274] md:min-w-44">
	                            Detail Karyawan
	                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
