"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileClock,
  HeartPulse,
  Home,
  Loader2,
  MapPin,
  RefreshCw,
  Search,
  ShieldAlert,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type NotificationType = "sick" | "leave" | "permission" | "wfh" | "wfc" | "visit";

type NotificationItem = {
  id: string;
  rawId: string;
  source: "LeaveRequest" | "AdminNotification";
  type: NotificationType;
  title: string;
  message: string;
  employeeName: string;
  employeeEmail: string;
  status: string;
  statusText: string;
  isRead: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  dateText: string;
  href: string;
};

type NotificationStats = {
  total: number;
  unread: number;
  pending: number;
  sick: number;
  leave: number;
  permission: number;
  wfh: number;
  wfc: number;
  visit: number;
};

type NotificationResponse = {
  success: boolean;
  stats: NotificationStats;
  notifications: NotificationItem[];
  message?: string;
};

const emptyStats: NotificationStats = {
  total: 0,
  unread: 0,
  pending: 0,
  sick: 0,
  leave: 0,
  permission: 0,
  wfh: 0,
  wfc: 0,
  visit: 0,
};

const typeOptions = [
  { value: "all", label: "Semua Jenis" },
  { value: "sick", label: "Sakit" },
  { value: "leave", label: "Cuti" },
  { value: "permission", label: "Izin" },
  { value: "wfh", label: "WFH" },
  { value: "wfc", label: "WFC" },
  { value: "visit", label: "Kunjungan" },
];

const statusOptions = [
  { value: "all", label: "Semua Status" },
  { value: "unread", label: "Belum Dibaca" },
  { value: "read", label: "Dibaca" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Disetujui" },
  { value: "rejected", label: "Ditolak" },
];

function getTypeLabel(type: NotificationType) {
  if (type === "sick") return "Sakit";
  if (type === "leave") return "Cuti";
  if (type === "permission") return "Izin";
  if (type === "wfh") return "WFH";
  if (type === "wfc") return "WFC";
  if (type === "visit") return "Kunjungan";

  return type;
}

function getTypeIcon(type: NotificationType) {
  if (type === "sick") return HeartPulse;
  if (type === "leave") return CalendarClock;
  if (type === "permission") return FileClock;
  if (type === "wfh") return Home;
  if (type === "wfc") return BriefcaseBusiness;
  if (type === "visit") return MapPin;

  return Bell;
}

function getTypeClass(type: NotificationType) {
  if (type === "sick") return "bg-red-50 text-red-600 border-red-100";
  if (type === "leave") return "bg-blue-50 text-[#123c8c] border-blue-100";
  if (type === "permission") return "bg-amber-50 text-amber-700 border-amber-100";
  if (type === "wfh") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (type === "wfc") return "bg-purple-50 text-purple-700 border-purple-100";
  if (type === "visit") return "bg-orange-50 text-orange-700 border-orange-100";

  return "bg-slate-50 text-slate-600 border-slate-100";
}

function getStatusClass(status: string) {
  const value = status.toLowerCase();

  if (value === "unread") return "bg-orange-50 text-orange-700";
  if (value === "read") return "bg-slate-100 text-slate-600";
  if (value === "pending") return "bg-amber-50 text-amber-700";
  if (value === "approved") return "bg-emerald-50 text-emerald-700";
  if (value === "rejected") return "bg-red-50 text-red-600";

  return "bg-slate-100 text-slate-600";
}

function formatCreatedAt(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>(emptyStats);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [isMarking, setIsMarking] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function loadNotifications() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/notifications", {
        cache: "no-store",
      });

      const data = (await readJsonResponse(response)) as NotificationResponse;

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil notifikasi.");
      }

      setNotifications(data.notifications || []);
      setStats(data.stats || emptyStats);
    } catch (error) {
      console.error("LOAD_NOTIFICATIONS_ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengambil notifikasi."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(item: NotificationItem) {
    if (item.source !== "AdminNotification") return;

    try {
      setIsMarking(item.rawId);

      const response = await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: item.rawId,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.message || "Gagal menandai notifikasi.");
      }

      await loadNotifications();
    } catch (error) {
      console.error("MARK_NOTIFICATION_ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Gagal menandai notifikasi sudah dibaca."
      );
    } finally {
      setIsMarking("");
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return notifications.filter((item) => {
      const text = `
        ${item.title}
        ${item.message}
        ${item.employeeName}
        ${item.employeeEmail}
        ${item.status}
        ${item.statusText}
        ${getTypeLabel(item.type)}
        ${item.dateText}
      `.toLowerCase();

      const matchSearch = !keyword || text.includes(keyword);
      const matchType = typeFilter === "all" || item.type === typeFilter;
      const matchStatus = statusFilter === "all" || item.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [notifications, search, typeFilter, statusFilter]);

  const statCards = [
    {
      label: "Total Notifikasi",
      value: stats.total,
      icon: Bell,
      description: "Semua laporan masuk",
    },
    {
      label: "Belum Dibaca",
      value: stats.unread,
      icon: Clock3,
      description: "Dari AdminNotification",
    },
    {
      label: "Cuti / Sakit / Izin",
      value: stats.leave + stats.sick + stats.permission,
      icon: FileClock,
      description: "Dari LeaveRequest",
    },
    {
      label: "WFH / WFC / Kunjungan",
      value: stats.wfh + stats.wfc + stats.visit,
      icon: MapPin,
      description: "Dari AdminNotification",
    },
  ];

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Notifikasi"
        subtitle="Laporan sakit, cuti, izin, WFH, WFC, dan kunjungan"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                <ShieldAlert size={15} />
                Notification Center
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                Pusat Notifikasi
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                Cuti, sakit, dan izin diambil dari tabel LeaveRequest. WFH,
                WFC, dan kunjungan diambil dari tabel AdminNotification.
              </p>
            </div>

            <button
              type="button"
              onClick={loadNotifications}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 active:scale-[0.98]"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[1.7rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-500">
                      {item.label}
                    </p>

                    <h3 className="mt-2 text-3xl font-black text-slate-950">
                      {isLoading ? "-" : item.value}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-slate-400">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                    <Icon size={24} strokeWidth={2.7} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
            <div>
              <label className="text-sm font-black text-slate-500">
                Cari Notifikasi
              </label>

              <div className="relative mt-3">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama, laporan, status, atau keterangan..."
                  className="h-[58px] w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-black text-slate-500">
                Jenis Laporan
              </label>

              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="mt-3 h-[58px] w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
              >
                {typeOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-black text-slate-500">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-3 h-[58px] w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
              >
                {statusOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="flex h-[58px] w-full items-center justify-center rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#123c8c] shadow-sm transition hover:bg-blue-50 active:scale-[0.96] lg:w-auto"
              >
                Reset
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-10 text-sm font-black text-slate-600">
                <Loader2 className="animate-spin text-[#123c8c]" size={22} />
                Mengambil data notifikasi...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-10 text-center">
                <Bell className="mx-auto text-slate-300" size={42} />
                <p className="mt-3 text-lg font-black text-slate-700">
                  Tidak ada notifikasi
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Belum ada laporan yang sesuai dengan filter.
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const Icon = getTypeIcon(item.type);
                const canMarkRead =
                  item.source === "AdminNotification" && item.status === "unread";

                return (
                  <div
                    key={item.id}
                    className="rounded-[1.7rem] border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-200/70"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex gap-4">
                        <div
                          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${getTypeClass(
                            item.type
                          )}`}
                        >
                          <Icon size={25} strokeWidth={2.8} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${getTypeClass(
                                item.type
                              )}`}
                            >
                              {getTypeLabel(item.type)}
                            </span>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-black ${getStatusClass(
                                item.status
                              )}`}
                            >
                              {item.statusText}
                            </span>

                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                              {item.source}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-black text-slate-950">
                            {item.title}
                          </h3>

                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            {item.message}
                          </p>

                          <div className="mt-4 grid gap-2 text-sm md:grid-cols-3">
                            <div className="rounded-2xl bg-[#f6f8ff] p-3">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                Karyawan
                              </p>
                              <p className="mt-1 font-black text-slate-700">
                                {item.employeeName}
                              </p>
                              <p className="mt-1 truncate text-xs font-semibold text-slate-400">
                                {item.employeeEmail}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-[#f6f8ff] p-3">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                Tanggal
                              </p>
                              <p className="mt-1 font-black text-slate-700">
                                {item.dateText}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-[#f6f8ff] p-3">
                              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                                Dibuat
                              </p>
                              <p className="mt-1 font-black text-slate-700">
                                {formatCreatedAt(item.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-2 md:w-fit">
                        {canMarkRead ? (
                          <button
                            type="button"
                            onClick={() => markAsRead(item)}
                            disabled={isMarking === item.rawId}
                            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#123c8c] shadow-sm transition hover:bg-[#eaf1ff] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isMarking === item.rawId ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={17} />
                            )}
                            Tandai Dibaca
                          </button>
                        ) : null}

                        <Link
                          href={item.href}
                          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.97]"
                        >
                          <UserRound size={17} />
                          Lihat Detail
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}