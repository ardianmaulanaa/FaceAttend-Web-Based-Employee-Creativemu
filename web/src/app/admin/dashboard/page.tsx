"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Clock3,
  LayoutDashboard,
  Loader2,
  LogIn,
  LogOut,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type DashboardStats = {
  totalEmployees: number;
  checkInToday: number;
  checkOutToday: number;
  lateToday: number;
  absentToday: number;
};

type RecentAttendance = {
  id: string;
  attendanceId: string;
  name: string;
  employeeCode?: string | null;
  position: string | null;
  department: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  lateMinutes: number;
  workMinutes: number;
};

type DashboardResponse = {
  stats: DashboardStats;
  recentAttendance: RecentAttendance[];
};

function getShortId(id: string | null | undefined) {
  if (!id) return "-";

  return id.slice(0, 8).toUpperCase();
}

function getDisplayEmployeeCode(item: RecentAttendance) {
  return getShortId(item.employeeCode || item.id);
}

function getStatusClass(item: RecentAttendance) {
  if (item.checkOutTime) {
    return "bg-[#eaf1ff] text-[#123c8c]";
  }

  if (item.lateMinutes > 0 || item.status?.toUpperCase() === "LATE") {
    return "bg-amber-50 text-amber-700";
  }

  if (item.checkInTime) {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-slate-100 text-slate-600";
}

function getStatusLabel(item: RecentAttendance) {
  if (item.checkOutTime) return "Selesai";

  if (item.lateMinutes > 0 || item.status?.toUpperCase() === "LATE") {
    return "Terlambat";
  }

  if (item.checkInTime) return "Check-in";

  return "Belum Absen";
}

function formatTime(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMinutes(minutes: number, hasCheckOut = false) {
  if (!hasCheckOut) return "-";

  const safeMinutes = Math.max(0, Number(minutes || 0));

  if (safeMinutes <= 0) return "0m";

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours}j ${remainingMinutes}m`;
  }

  if (hours > 0) {
    return `${hours}j`;
  }

  return `${remainingMinutes}m`;
}

function getAttendanceKey(item: RecentAttendance, index: number) {
  return (
    item.attendanceId ||
    `${item.id || "attendance"}-${item.employeeCode || "employee"}-${index}`
  );
}

function getEmployeeSubtitle(item: RecentAttendance) {
  if (item.position) return item.position;
  if (item.department) return item.department;

  return "-";
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadDashboardData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/dashboard", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          result?.message || "Gagal mengambil data dashboard admin."
        );
      }

      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil data dashboard."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, []);

  const stats = useMemo(() => {
    const dashboardStats = data?.stats;

    return [
      {
        label: "Total Karyawan",
        value: String(dashboardStats?.totalEmployees ?? 0),
        description: "Karyawan aktif",
        icon: UsersRound,
      },
      {
        label: "Check-in",
        value: String(dashboardStats?.checkInToday ?? 0),
        description: "Sudah masuk hari ini",
        icon: LogIn,
      },
      {
        label: "Check-out",
        value: String(dashboardStats?.checkOutToday ?? 0),
        description: "Sudah keluar hari ini",
        icon: LogOut,
      },
      {
        label: "Terlambat",
        value: String(dashboardStats?.lateToday ?? 0),
        description: "Telat masuk",
        icon: Clock3,
      },
    ];
  }, [data]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Admin Dashboard"
        subtitle="Monitoring absensi karyawan Creativemu"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
          <div className="grid gap-0 lg:grid-cols-[1fr_1fr]">
            <div className="bg-[#123c8c] p-6 text-white md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <LayoutDashboard size={25} strokeWidth={2.6} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Admin Control Center
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                    Attendance Overview
                  </h2>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
                Pantau data check-in, check-out, keterlambatan, dan status
                absensi karyawan hari ini berdasarkan data presensi dari
                database.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 md:p-6">
              {stats.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={`${item.label}-${index}`}
                    className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-500">
                        {item.label}
                      </p>

                      <Icon
                        size={20}
                        strokeWidth={2.5}
                        className="text-[#123c8c]"
                      />
                    </div>

                    {isLoading ? (
                      <div className="mt-4 h-8 w-16 animate-pulse rounded-xl bg-blue-100" />
                    ) : (
                      <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                        {item.value}
                      </h3>
                    )}

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Today Report
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Recent Attendance
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              Data check-in dan check-out terbaru dari tabel attendance hari
              ini.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.9fr_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] bg-[#eaf1ff] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c] md:grid">
              <p>ID</p>
              <p>Employee</p>
              <p>Check-in</p>
              <p>Check-out</p>
              <p>Durasi</p>
              <p>Status</p>
            </div>

            <div className="divide-y divide-blue-100 bg-white">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 px-5 py-10 text-sm font-bold text-slate-500">
                  <Loader2 size={18} className="animate-spin" />
                  Mengambil data absensi...
                </div>
              ) : data?.recentAttendance.length ? (
                data.recentAttendance.map((item, index) => (
                  <div
                    key={getAttendanceKey(item, index)}
                    className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[0.9fr_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] md:items-center"
                  >
                    <div>
                      <p className="font-black text-[#123c8c]">
                        {getDisplayEmployeeCode(item)}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-400 md:hidden">
                        {getEmployeeSubtitle(item)}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold text-slate-950">{item.name}</p>

                      <p className="mt-1 hidden text-xs font-semibold text-slate-400 md:block">
                        {getEmployeeSubtitle(item)}
                      </p>
                    </div>

                    <p className="text-slate-500">
                      <span className="font-bold text-slate-700 md:hidden">
                        Check-in:{" "}
                      </span>
                      {formatTime(item.checkInTime)}
                    </p>

                    <p className="text-slate-500">
                      <span className="font-bold text-slate-700 md:hidden">
                        Check-out:{" "}
                      </span>
                      {formatTime(item.checkOutTime)}
                    </p>

                    <p className="font-semibold text-slate-500">
                      <span className="font-bold text-slate-700 md:hidden">
                        Durasi:{" "}
                      </span>
                      {formatMinutes(
                        item.workMinutes,
                        Boolean(item.checkOutTime)
                      )}
                    </p>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                        item
                      )}`}
                    >
                      {getStatusLabel(item)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
                  Belum ada data check-in atau check-out hari ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}