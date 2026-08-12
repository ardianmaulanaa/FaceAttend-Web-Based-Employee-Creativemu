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
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import {
  getReadAnnouncementIds,
  getReadNotificationIds,
  markAnnouncementAsRead,
  markNotificationAsRead,
} from "@/lib/announcement-read";

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");

  const monthTitle = useMemo(() => getMonthTitle(), []);

  async function loadNotifications() {
    try {
      setIsLoading(true);
      setPageError("");

      const response = await fetch("/api/notifications", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await readJsonResponse(response)) as NotificationResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Gagal mengambil notifikasi.");
      }

      const readAnnIds = getReadAnnouncementIds();
      const readNotifIds = getReadNotificationIds();

      const list = (data.notifications || []).map((item) => {
        const cleanId = (item.rawId || item.id)
          .replace("announcement-", "")
          .replace("swap-", "");

        const isReadLocally =
          readAnnIds.includes(cleanId) ||
          readNotifIds.includes(cleanId) ||
          readNotifIds.includes(item.id);

        if (isReadLocally || item.isRead) {
          return {
            ...item,
            isRead: true,
            status: "read",
            statusText: "Dibaca",
          };
        }
        return item;
      });

      const unreadCount = list.filter((i) => !i.isRead).length;

      setNotifications(list);
      setStats({
        total: list.length,
        unread: unreadCount,
      });
    } catch (error) {
      setPageError(
        error instanceof Error ? error.message : "Gagal mengambil notifikasi.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(notification: NotificationItem) {
    const cleanId = (notification.rawId || notification.id)
      .replace("announcement-", "")
      .replace("swap-", "");

    markAnnouncementAsRead(cleanId);
    markNotificationAsRead(notification.id);
    markNotificationAsRead(cleanId);

    if (
      notification.type === "announcement" ||
      notification.type === "shift_swap" ||
      notification.id.startsWith("swap-")
    ) {
      window.dispatchEvent(new Event("notification-count-changed"));
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

      await readJsonResponse(response);
    } catch {
      // ignore
    } finally {
      setActiveId(null);
      window.dispatchEvent(new Event("notification-count-changed"));
      router.push(notification.href);
    }
  }

  useEffect(() => {
    void loadNotifications();
    const timer = setInterval(() => {
      void loadNotifications();
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <AppHeader title="Notifikasi" eyebrow="Presensi" hideMobileMenuButton />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-[calc(8rem+env(safe-area-inset-bottom))] text-slate-950 md:pb-28">
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
                <h3 className="text-2xl font-black tracking-tight text-slate-950">
                  Notifikasi Karyawan
                </h3>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Riwayat pemberitahuan cuti, pengumuman, dan tukar shift.
                </p>
              </div>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-[#f8fbff] p-8 text-sm font-black text-slate-500">
                  <Loader2 size={18} className="animate-spin text-[#123c8c]" />
                  Memuat notifikasi...
                </div>
              ) : pageError ? (
                <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-black text-red-700">
                  {pageError}
                </div>
              ) : notifications.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#123c8c] ring-1 ring-blue-100">
                    <Bell size={26} strokeWidth={2.6} />
                  </div>
                  <p className="mt-4 text-base font-black text-slate-700">
                    Tidak ada notifikasi
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    Belum ada pemberitahuan baru bulan ini.
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
                        onClick={() => void markAsRead(notification)}
                        disabled={isActive}
                        className={`group flex w-full items-start gap-4 rounded-3xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 md:p-5 ${
                          notification.isRead
                            ? "border-slate-100 bg-slate-50/70 opacity-80 hover:bg-slate-100/80"
                            : "border-2 border-blue-300 bg-[#f4f8ff] shadow-md shadow-blue-900/10 ring-2 ring-blue-400/30 hover:bg-white"
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.icon}`}
                        >
                          <Icon size={22} strokeWidth={2.6} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ring-1 ${style.badge}`}
                            >
                              {notification.typeLabel}
                            </span>

                            {notification.isRead ? (
                              <span className="rounded-full bg-slate-200/80 px-2.5 py-1 text-[10px] font-black text-slate-600">
                                ✓ Dibaca
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 rounded-full bg-orange-100 px-2.5 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse" />
                                Belum Dibaca
                              </span>
                            )}
                          </div>

                          <h4
                            className={`mt-2 text-base font-black leading-6 ${
                              notification.isRead ? "text-slate-800" : "text-[#123c8c]"
                            }`}
                          >
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

        <BottomNav />
      </main>
    </MobileShell>
  );
}
