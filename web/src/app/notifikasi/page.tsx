"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
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
  if (type === "shift_swap") return ArrowLeftRight;

  return CalendarDays;
}

function getNotificationStyle(type: string) {
  if (type === "announcement") {
    return {
      badge: "bg-violet-50 text-violet-700 ring-violet-200",
      icon: "bg-violet-50 text-violet-700 ring-violet-200",
    };
  }

  if (type === "shift_swap") {
    return {
      badge: "bg-amber-50 text-amber-800 ring-amber-200",
      icon: "bg-amber-50 text-amber-700 ring-amber-200",
    };
  }

  return {
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    icon: "bg-blue-50 text-blue-700 ring-blue-200",
  };
}

function NotificationMotionStyles() {
  return (
    <style jsx global>{`
      @keyframes notificationPageEnter {
        from {
          opacity: 0;
          transform: translateY(14px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes notificationCardEnter {
        from {
          opacity: 0;
          transform: translateY(16px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes notificationItemEnter {
        from {
          opacity: 0;
          transform: translateX(10px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .notification-page-enter {
        animation: notificationPageEnter 320ms ease-out both;
      }

      .notification-card-enter {
        animation: notificationCardEnter 340ms cubic-bezier(0.16, 1, 0.3, 1)
          both;
      }

      .notification-item-enter {
        animation: notificationItemEnter 280ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .notification-page-enter,
        .notification-card-enter,
        .notification-item-enter {
          animation: none !important;
        }
      }
    `}</style>
  );
}

export default function EmployeeNotificationPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "announcement" | "shift_swap" | "leave">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");

  const monthTitle = useMemo(() => getMonthTitle(), []);

  async function loadNotifications(options: { showLoading?: boolean } = {}) {
    try {
      if (options.showLoading ?? false) {
        setIsLoading(true);
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

    try {
      setActiveId(notification.id);

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
      void loadNotifications();
      router.push(notification.href);
    }
  }

  async function markAllAsRead() {
    try {
      setIsLoading(true);

      notifications.forEach((item) => {
        const cleanId = (item.rawId || item.id)
          .replace("announcement-", "")
          .replace("swap-", "");
        markAnnouncementAsRead(cleanId);
        markNotificationAsRead(item.id);
        markNotificationAsRead(cleanId);
      });

      await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          markAll: true,
        }),
      });
    } catch {
      // ignore
    } finally {
      window.dispatchEvent(new Event("notification-count-changed"));
      await loadNotifications();
    }
  }

  useEffect(() => {
    void loadNotifications({ showLoading: true });
    const timer = setInterval(() => {
      void loadNotifications();
    }, 8000);

    return () => clearInterval(timer);
  }, []);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <NotificationMotionStyles />
      <AppHeader title="Notifikasi" eyebrow="Presensi" hideMobileMenuButton />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-[calc(8rem+env(safe-area-inset-bottom))] text-slate-950 md:pb-28">
        <section className="notification-page-enter mx-auto max-w-5xl px-5 pb-10 pt-6 md:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="notification-card-enter rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100">
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

            <div
              className="notification-card-enter rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-orange-100"
              style={{ animationDelay: "60ms" }}
            >
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

            <div
              className="notification-card-enter rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-emerald-100"
              style={{ animationDelay: "120ms" }}
            >
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

          <div
            className="notification-card-enter mt-6 rounded-[2rem] bg-white p-5 shadow-sm ring-1 ring-blue-100 md:p-6"
            style={{ animationDelay: "160ms" }}
          >
            <div className="flex flex-col items-center justify-center gap-3 border-b border-slate-100 pb-5 text-center">
              <div>
                <h3 className="text-2xl font-black tracking-tight text-slate-950">
                  Notifikasi Karyawan
                </h3>
              </div>

              {/* Category Filter Tabs with Unread Count (Center Aligned) */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 rounded-2xl bg-slate-100/80 p-1.5 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("all")}
                  className={`rounded-xl px-3 py-2 transition ${selectedCategory === "all"
                      ? "bg-white text-[#123c8c] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Semua ({notifications.filter((n) => !n.isRead).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("announcement")}
                  className={`rounded-xl px-3 py-2 transition ${selectedCategory === "announcement"
                      ? "bg-white text-violet-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Pengumuman ({notifications.filter((n) => n.type === "announcement" && !n.isRead).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("shift_swap")}
                  className={`rounded-xl px-3 py-2 transition ${selectedCategory === "shift_swap"
                      ? "bg-white text-amber-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Tukar Shift ({notifications.filter((n) => n.type === "shift_swap" && !n.isRead).length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCategory("leave")}
                  className={`rounded-xl px-3 py-2 transition ${selectedCategory === "leave"
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                    }`}
                >
                  Konfirmasi Cuti ({notifications.filter((n) => n.type !== "announcement" && n.type !== "shift_swap" && !n.isRead).length})
                </button>

                <button
                  type="button"
                  onClick={() => void markAllAsRead()}
                  className="flex items-center gap-1 rounded-xl bg-blue-50 px-3 py-2 text-[#123c8c] transition hover:bg-blue-100 active:scale-95"
                >
                  <CheckCircle2 size={14} strokeWidth={2.6} />
                  Tandai Semua Dibaca
                </button>
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
              ) : notifications.filter((item) => {
                if (selectedCategory === "announcement") return item.type === "announcement";
                if (selectedCategory === "shift_swap") return item.type === "shift_swap";
                if (selectedCategory === "leave") return item.type !== "announcement" && item.type !== "shift_swap";
                return true;
              }).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#123c8c] ring-1 ring-blue-100">
                    <Bell size={26} strokeWidth={2.6} />
                  </div>
                  <p className="mt-4 text-base font-black text-slate-700">
                    Tidak ada notifikasi {selectedCategory !== "all" ? "untuk kategori ini" : ""}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-400">
                    Belum ada pemberitahuan pada kategori yang dipilih.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications
                    .filter((item) => {
                      if (selectedCategory === "announcement") return item.type === "announcement";
                      if (selectedCategory === "shift_swap") return item.type === "shift_swap";
                      if (selectedCategory === "leave") return item.type !== "announcement" && item.type !== "shift_swap";
                      return true;
                    })
                    .map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      const style = getNotificationStyle(notification.type);
                      const isActive = activeId === notification.id;

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => void markAsRead(notification)}
                          disabled={isActive}
                          className={`notification-item-enter group flex w-full items-start gap-4 rounded-3xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 md:p-5 ${notification.isRead
                            ? "border-slate-100 bg-slate-50/70 opacity-80 hover:bg-slate-100/80"
                            : "border-2 border-blue-300 bg-[#f4f8ff] shadow-md shadow-blue-900/10 ring-2 ring-blue-400/30 hover:bg-white"
                            }`}
                          style={{ animationDelay: "220ms" }}
                        >
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1 ${style.icon}`}
                          >
                            <Icon size={22} strokeWidth={2.6} />
                          </div>

                          <div className="min-w-0 flex-1">
                            {/* Card Top Row: Badges Left (Type & Status) + Badges Right (Date & Reason) */}
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ring-1 ${style.badge}`}
                                >
                                  {notification.typeLabel}
                                </span>

                                {notification.isRead ? (
                                  <span className="rounded-full bg-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    ✓ Dibaca
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-black text-orange-700 ring-1 ring-orange-200">
                                    <span className="h-1.5 w-1.5 rounded-full bg-orange-600 animate-pulse" />
                                    Baru
                                  </span>
                                )}
                              </div>

                              {/* Right aligned date & timestamp info */}
                              <span className="text-[11px] font-bold text-slate-400">
                                {notification.dateText}
                              </span>
                            </div>

                            <h4 className={`mt-2 text-sm font-black tracking-tight ${notification.isRead ? "text-slate-800" : "text-[#123c8c]"}`}>
                              {notification.title}
                            </h4>

                            {/* Message Body with Clean Right-Aligned Details */}
                            {(() => {
                              const msg = notification.message;
                              const shiftMatch = msg.match(/\(([^)]+)\)/);

                              const reasonIndex = msg.indexOf("Alasan:");
                              const reasonText = reasonIndex !== -1 ? msg.substring(reasonIndex + 7).trim().replace(/^[\s"]+|[\s"]+$/g, "") : null;

                              let actionText = reasonIndex !== -1 ? msg.substring(0, reasonIndex).trim() : msg;

                              const dateMatches = Array.from(actionText.matchAll(/([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})/gi)).map(m => m[1]);
                              const targetDateText = dateMatches.length > 0 ? dateMatches.join(" s/d ") : null;

                              // Clean action text by removing parenthesized shift string and extra words
                              if (shiftMatch) actionText = actionText.replace(shiftMatch[0], "").trim();
                              actionText = actionText.replace(/untuk tanggal/gi, "").replace(/pada tanggal/gi, "").replace(/tanggal/gi, "").replace(/\s+/g, " ").replace(/[\s\.]+$|untuk$|pada$|periode$/i, "").trim();

                              return (
                                <div className="mt-2 space-y-2">
                                  {/* Main Text Content */}
                                  <p className="text-xs font-bold leading-relaxed text-slate-800 md:text-sm">
                                    {actionText || msg}
                                  </p>

                                  {/* Right Aligned Badges Container (Shift & Alasan) */}
                                  {(shiftMatch || reasonText) ? (
                                    <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1 text-xs">
                                      {shiftMatch ? (
                                        <span className="inline-flex items-center gap-1 rounded-xl bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-[#123c8c] ring-1 ring-blue-200">
                                          🔄 {shiftMatch[1]}
                                        </span>
                                      ) : null}

                                      {reasonText ? (
                                        <span className="inline-flex max-w-full items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-900 ring-1 ring-amber-200">
                                          <span className="font-bold text-amber-800">Alasan:</span>
                                          <span className="italic">{reasonText}</span>
                                        </span>
                                      ) : null}
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })()}
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
