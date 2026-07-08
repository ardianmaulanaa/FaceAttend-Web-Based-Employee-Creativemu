"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Megaphone,
  RefreshCcw,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";

type NotificationItem = {
  id: string;
  rawId?: string;
  type: string;
  typeLabel: string;
  title: string;
  message: string;
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
};

type NotificationResponse = {
  success?: boolean;
  message?: string;
  stats?: NotificationStats;
  notifications?: NotificationItem[];
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function getMonthTitle() {
  const now = new Date();

  return now.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function getNotificationIcon(type: string) {
  if (type === "announcement") return Megaphone;

  return CalendarDays;
}

function getNotificationStyle(type: string) {
  if (type === "announcement") {
    return {
      badge: "bg-violet-50 text-violet-700 ring-violet-100",
      icon: "bg-violet-50 text-violet-700 ring-violet-100",
    };
  }

  return {
    badge: "bg-blue-50 text-blue-700 ring-blue-100",
    icon: "bg-blue-50 text-blue-700 ring-blue-100",
  };
}

export default function EmployeeNotificationPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");

  const monthTitle = useMemo(() => getMonthTitle(), []);

  async function loadNotifications(mode: "initial" | "refresh" = "initial") {
    try {
      if (mode === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setPageError("");

      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await readJsonResponse(response)) as NotificationResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal mengambil notifikasi.");
      }

      setNotifications(data.notifications || []);
      setStats(
        data.stats || {
          total: 0,
          unread: 0,
        }
      );
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Gagal mengambil notifikasi."
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  async function markAsRead(notification: NotificationItem) {
    if (notification.isRead) {
      router.push(notification.href);
      return;
    }

    try {
      setActiveId(notification.id);
      setPageError("");

      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: notification.rawId || notification.id,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal membaca notifikasi.");
      }

      setNotifications((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? {
                ...item,
                isRead: true,
                status: "read",
                statusText: "Dibaca",
              }
            : item
        )
      );

      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - 1),
      }));

      router.push(notification.href);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Gagal membaca notifikasi."
      );
    } finally {
      setActiveId(null);
    }
  }

  useEffect(() => {
    void loadNotifications("initial");
  }, []);

  return (
    <main className="min-h-screen bg-[#f6f8ff] text-slate-950">
      <AppHeader
        title="Notifikasi"
        subtitle="Pusat informasi cuti, izin, sakit, dan pengumuman terbaru."
      />

      <section className="mx-auto max-w-5xl px-5 pb-10 pt-6 md:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Total Bulan Ini
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {stats.total}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <Bell size={22} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Belum Dibaca
                </p>
                <h2 className="mt-2 text-3xl font-black text-orange-600">
                  {stats.unread}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                <Bell size={22} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-emerald-100">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">
                  Periode
                </p>
                <h2 className="mt-2 text-xl font-black text-slate-950">
                  {monthTitle}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
                <CheckCircle2 size={22} strokeWidth={2.7} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Notification Center
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Notifikasi Karyawan
              </h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Daftar ini otomatis menampilkan notifikasi pada bulan berjalan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadNotifications("refresh")}
              disabled={isRefreshing}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RefreshCcw size={18} />
              )}
              Refresh
            </button>
          </div>

          {pageError ? (
            <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700 ring-1 ring-rose-100">
              {pageError}
            </div>
          ) : null}

          <div className="mt-6">
            {isLoading ? (
              <div className="flex min-h-48 flex-col items-center justify-center rounded-[2rem] bg-slate-50 text-slate-500">
                <Loader2 size={32} className="animate-spin" />
                <p className="mt-3 text-sm font-black">
                  Mengambil notifikasi...
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center rounded-[2rem] bg-slate-50 px-5 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
                  <Bell size={28} strokeWidth={2.5} />
                </div>
                <h4 className="mt-4 text-lg font-black text-slate-900">
                  Belum ada notifikasi bulan ini
                </h4>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                  Notifikasi cuti, izin, sakit, dan pengumuman baru akan muncul
                  di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  const style = getNotificationStyle(notification.type);
                  const isActive = activeId === notification.id;

                  return (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => markAsRead(notification)}
                      disabled={isActive}
                      className={`group flex w-full items-start gap-4 rounded-[1.6rem] border p-4 text-left transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70 ${
                        notification.isRead
                          ? "border-slate-100 bg-white hover:bg-slate-50"
                          : "border-orange-100 bg-orange-50/60 hover:bg-orange-50"
                      }`}
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.icon}`}
                      >
                        <Icon size={22} strokeWidth={2.7} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-[11px] font-black ring-1 ${style.badge}`}
                          >
                            {notification.typeLabel}
                          </span>

                          {!notification.isRead ? (
                            <span className="rounded-full bg-orange-500 px-3 py-1 text-[11px] font-black text-white">
                              Baru
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
                              Dibaca
                            </span>
                          )}
                        </div>

                        <h4 className="mt-2 text-base font-black leading-6 text-slate-950">
                          {notification.title}
                        </h4>

                        <p className="mt-1 line-clamp-2 text-sm font-semibold leading-6 text-slate-600">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-xs font-black text-slate-400">
                          {notification.dateText}
                        </p>
                      </div>

                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-400 ring-1 ring-slate-100 transition group-hover:text-[#123c8c]">
                        {isActive ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <ChevronRight size={18} strokeWidth={2.7} />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}