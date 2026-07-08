"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  CalendarDays,
  Clock3,
  FileImage,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Network,
  PhoneCall,
  ScanFace,
  Settings,
  UserPlus,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: "employee" | "admin";
};

type NotificationStats = {
  total?: number;
  unread?: number;
  pending?: number;
  sick?: number;
  leave?: number;
  permission?: number;
  wfh?: number;
  wfc?: number;
  visit?: number;
};

type NotificationResponse = {
  success?: boolean;
  stats?: NotificationStats;
  message?: string;
};

const employeeNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/attendance", label: "Attendance", icon: ScanFace },
  { href: "/history", label: "History", icon: History },
  { href: "/cuti", label: "Cuti", icon: CalendarDays },
  { href: "/pengumuman", label: "Info", icon: Megaphone },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminMenus = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/monitor_perusahaan",
    label: "Monitor Perusahaan",
    icon: BarChart3,
  },
  {
    href: "/admin/pengumuman",
    label: "Pengumuman",
    icon: Megaphone,
  },
];

const masterDataMenus = [
  {
    href: "/admin/shifts",
    label: "Shift",
    icon: Clock3,
  },
  {
    href: "/admin/work-schedules",
    label: "Jam Kerja",
    icon: CalendarClock,
  },
  {
    href: "/admin/kantor",
    label: "Kantor",
    icon: Building2,
  },
  {
    href: "/admin/departments",
    label: "Divisi",
    icon: Network,
  },
  {
    href: "/admin/units",
    label: "Unit",
    icon: Building2,
  },
  {
    href: "/admin/positions",
    label: "Jabatan",
    icon: UserRoundCog,
  },
];

const operationalMenus = [
  {
    href: "/admin/employees",
    label: "Register Employee",
    icon: UserPlus,
  },
  {
    href: "/admin/laporan-kehadiran",
    label: "Laporan Kehadiran",
    icon: FileImage,
  },
  {
    href: "/admin/cuti",
    label: "Laporan Cuti",
    icon: CalendarDays,
  },
  {
    href: "/admin/profil-karyawan",
    label: "Profil Karyawan",
    icon: UserRound,
  },
];


function isActivePath(pathname: string, href: string) {
  if (href === "/history") {
    return pathname === "/history" || pathname.startsWith("/history/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function getAdminNotificationCount(stats?: NotificationStats) {
  if (!stats) return 0;

  const unread = Number(stats.unread || 0);
  const pending = Number(stats.pending || 0);

  return unread + pending;
}

function getEmployeeNotificationCount(stats?: NotificationStats) {
  if (!stats) return 0;

  return Number(stats.unread || 0);
}

function formatNotificationCount(count: number) {
  if (count <= 0) return "";
  if (count > 99) return "99+";

  return String(count);
}

const WHATSAPP_LINK = "https://wa.me/6289618472759";

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={className}
      fill="currentColor"
    >
      <path d="M16.01 3.2A12.7 12.7 0 0 0 5.02 22.25L3.2 28.8l6.72-1.76A12.74 12.74 0 1 0 16.01 3.2Zm0 2.34a10.38 10.38 0 1 1-5.28 19.31l-.38-.22-3.99 1.04 1.07-3.86-.25-.4A10.37 10.37 0 0 1 16.01 5.54Zm-5.15 5.68c-.23 0-.6.08-.92.43-.32.35-1.21 1.18-1.21 2.88s1.24 3.34 1.41 3.57c.17.23 2.4 3.84 5.92 5.23 2.93 1.16 3.53.93 4.17.87.64-.06 2.05-.84 2.34-1.65.29-.81.29-1.5.2-1.65-.08-.15-.32-.23-.67-.4-.35-.17-2.05-1.01-2.37-1.12-.32-.12-.55-.17-.78.17-.23.35-.9 1.12-1.1 1.35-.2.23-.4.26-.75.09-.35-.17-1.47-.54-2.8-1.72-1.03-.92-1.73-2.06-1.93-2.4-.2-.35-.02-.54.15-.71.15-.15.35-.4.52-.6.17-.2.23-.35.35-.58.12-.23.06-.43-.03-.6-.09-.17-.78-1.88-1.07-2.57-.28-.68-.57-.58-.78-.59h-.65Z" />
    </svg>
  );
}
export default function AppHeader({
  title,
  subtitle,
  rightLabel,
  variant = "employee",
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isBellMenuOpen, setIsBellMenuOpen] = useState(false);
  const [attendanceNotifications, setAttendanceNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const bellMenuRef = useRef<HTMLDivElement | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const resolvedVariant = useMemo(() => {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return "admin";
    }
    return variant;
  }, [pathname, variant]);

  const isAdmin = resolvedVariant === "admin";

  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("read_notification_ids");
      if (stored) {
        setReadNotifIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const unreadNotifications = useMemo(() => {
    return attendanceNotifications.filter((notif) => !readNotifIds.includes(notif.id));
  }, [attendanceNotifications, readNotifIds]);

  useEffect(() => {
    if (!isAdmin) return;

    async function loadNotifications() {
      try {
        setIsLoadingNotifications(true);
        const response = await fetch("/api/attendance/notifications", {
          method: "GET",
          cache: "no-store",
        });
        const result = await response.json();
        if (response.ok && Array.isArray(result.data)) {
          setAttendanceNotifications(result.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingNotifications(false);
      }
    }

    void loadNotifications();
  }, [isAdmin, pathname]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        bellMenuRef.current &&
        !bellMenuRef.current.contains(event.target as Node)
      ) {
        setIsBellMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const notificationHref = isAdmin ? "/admin/notifikasi" : "/notifikasi";
  const isNotificationPage = isActivePath(pathname, notificationHref);
  const hasNewNotification = notificationCount > 0;

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleScroll() {
      setHasScrolled(window.scrollY > 8);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadNotificationCount() {
      try {
        const endpoint = isAdmin
          ? "/api/admin/notifications"
          : "/api/notifications";

        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) setNotificationCount(0);
          return;
        }

        const data = (await readJsonResponse(response)) as NotificationResponse;

        const count = isAdmin
          ? getAdminNotificationCount(data.stats)
          : getEmployeeNotificationCount(data.stats);

        if (isMounted) {
          setNotificationCount(count);
        }
      } catch {
        if (isMounted) {
          setNotificationCount(0);
        }
      }
    }

    void loadNotificationCount();

    const intervalId = window.setInterval(() => {
      void loadNotificationCount();
    }, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [isAdmin, pathname]);

  function handleNavigate(href: string) {
    setIsSidebarOpen(false);
    router.push(href);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 overflow-hidden border-b px-5 py-4 backdrop-blur-2xl transition-all duration-300 md:px-10 lg:px-16 ${hasScrolled
            ? "border-blue-100/80 bg-white/95 shadow-lg shadow-slate-300/30"
            : "border-white/60 bg-white/90 shadow-sm shadow-slate-200/40"
          }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-16 top-1/2 hidden h-64 w-64 -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.11] blur-[0.5px] md:block"
          style={{
            backgroundImage: "url('/images/creativemu-logo/creativemu.png')",
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] shadow-lg shadow-slate-200/70 ring-1 ring-blue-100 transition hover:bg-blue-50 active:scale-[0.96]"
              aria-label="Buka menu"
            >
              <Menu size={25} strokeWidth={3} />
            </button>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#123c8c]">
                FaceAttend
              </p>

              <h1 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-950 md:text-2xl lg:text-3xl">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-1 line-clamp-1 max-w-xl text-sm font-semibold leading-5 text-slate-500">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3">
            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi via WhatsApp"
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecfff5] text-[#00a884] shadow-sm ring-1 ring-[#baf7dc] transition hover:bg-[#dcfce7] active:scale-[0.96]"
            >
              <PhoneCall className="h-5 w-5" strokeWidth={2.7} />
            </a>

            {isAdmin ? (
              <div ref={bellMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsBellMenuOpen(!isBellMenuOpen)}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] shadow-lg shadow-slate-200/70 ring-1 ring-blue-100 transition hover:bg-blue-50 active:scale-[0.96]"
                  aria-label="Notifications"
                >
                  <Bell size={22} strokeWidth={2.5} />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {isBellMenuOpen && (
                  <div className="absolute right-0 top-14 z-50 w-80 rounded-2xl border border-blue-100 bg-white p-4 shadow-2xl shadow-slate-300/40">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                      Pemberitahuan Admin
                    </p>

                    {isLoadingNotifications ? (
                      <p className="mt-3 text-sm font-semibold text-slate-400">Memuat...</p>
                    ) : attendanceNotifications.length === 0 ? (
                      <p className="mt-3 text-sm font-semibold text-slate-400">Tidak ada notifikasi baru.</p>
                    ) : (
                      <>
                        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
                          {attendanceNotifications.map((notif) => {
                            const isRead = readNotifIds.includes(notif.id);
                            return (
                              <div
                                key={notif.id}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  if (!isRead) {
                                    const nextIds = [...readNotifIds, notif.id];
                                    setReadNotifIds(nextIds);
                                    localStorage.setItem("read_notification_ids", JSON.stringify(nextIds));
                                  }

                                  if (notif.type === "leave-request") {
                                    setIsBellMenuOpen(false);
                                    router.push("/admin/cuti");
                                  }
                                }}
                                className={`relative rounded-xl p-3 transition text-left ${notif.type === "leave-request"
                                  ? "bg-red-50 hover:bg-red-100/70 cursor-pointer border border-red-100"
                                  : "bg-[#f6f8ff]"
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-black text-[#123c8c]">{notif.employeeName}</p>
                                  <div className="flex items-center gap-1.5">
                                    {!isRead && (
                                      <span className="h-2 w-2 rounded-full bg-red-500" />
                                    )}
                                    {notif.type === "leave-request" && (
                                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-black text-red-600 uppercase">
                                        Pengajuan
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p className="mt-1 text-xs font-semibold text-slate-600 leading-snug">{notif.message}</p>
                                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                  {new Date(notif.happenedAt).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 border-t pt-2 text-center">
                          <Link
                            href="/admin/notifikasi"
                            onClick={() => setIsBellMenuOpen(false)}
                            className="text-xs font-bold text-[#123c8c] hover:underline"
                          >
                            Lihat Semua Notifikasi
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                <a
                  href={WHATSAPP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Hubungi Customer Service"
                  className="relative inline-flex h-12 w-12 lg:w-auto items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-white shadow-lg shadow-green-900/10 hover:bg-[#20ba56] transition active:scale-[0.96] lg:px-4"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.33 4.982L2 22l5.164-1.354a9.959 9.959 0 004.845 1.252h.004c5.507 0 9.99-4.478 9.99-9.985 0-2.67-1.037-5.18-2.92-7.065A9.925 9.925 0 0012.012 2zm5.727 14.047c-.245.69-1.22 1.262-1.688 1.348-.46.085-.92.146-2.96-.677-2.607-1.05-4.27-3.705-4.4-3.88-.13-.176-1.052-1.4-1.052-2.67 0-1.27.665-1.894.902-2.147.237-.253.52-.317.693-.317.172 0 .345.002.495.01.155.007.363-.058.57.443.208.508.71 1.73.772 1.857.063.128.105.277.02.447-.085.17-.127.277-.255.426-.127.15-.268.334-.383.45-.128.127-.26.265-.11.52.15.255.666 1.1 1.43 1.78.983.876 1.81 1.147 2.07 1.276.26.13.413.11.566-.064.153-.176.666-.777.844-1.04.177-.264.356-.22.597-.13.24.09 1.527.72 1.79.85.263.13.438.196.502.307.064.11.064.646-.18 1.336z" />
                  </svg>
                  <span className="hidden lg:inline font-bold text-xs">CS Creativemu</span>
                </a>

                <Link
                  href={notificationHref}
                  className={`relative hidden h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black shadow-sm ring-1 transition active:scale-[0.96] sm:inline-flex ${isNotificationPage
                    ? "bg-[#123c8c] text-white ring-[#123c8c] shadow-lg shadow-blue-900/20"
                    : "bg-white text-[#123c8c] ring-blue-100 hover:bg-[#eaf1ff]"
                    }`}
                >
                  <span className="relative">
                    <Bell size={20} strokeWidth={2.7} />

                    {hasNewNotification ? (
                      <span className="absolute -right-2 -top-2 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                        {formatNotificationCount(notificationCount)}
                      </span>
                    ) : null}
                  </span>

                  <span className="hidden lg:inline">Notifikasi</span>
                </Link>

                <Link
                  href={notificationHref}
                  aria-label="Buka notifikasi"
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 transition active:scale-[0.96] sm:hidden ${isNotificationPage
                    ? "bg-[#123c8c] text-white ring-[#123c8c]"
                    : "bg-white text-[#123c8c] ring-blue-100 hover:bg-[#eaf1ff]"
                    }`}
                >
                  <Bell size={21} strokeWidth={2.7} />

                  {hasNewNotification ? (
                    <span className="absolute right-1.5 top-1.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white">
                      {formatNotificationCount(notificationCount)}
                    </span>
                  ) : null}
                </Link>
              </>
            )}

            {rightLabel ? (
              <span className="hidden rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100 md:inline-flex">
                {rightLabel}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className={subtitle ? "h-[106px]" : "h-[88px]"} />

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
        />
      ) : null}

      <aside
        className={`fixed left-0 top-0 z-[60] h-dvh w-[82vw] max-w-80 border-r border-blue-100 bg-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-blue-50 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-slate-300/50 ring-1 ring-blue-100">
                <Image
                  src="/images/creativemu-logo/creativemu.png"
                  alt="Creativemu Logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  FaceAttend
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  {isAdmin ? "Admin Panel" : "Employee Menu"}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-[0.96]"
              aria-label="Tutup menu"
            >
              <X size={20} strokeWidth={2.8} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5">
            {isAdmin ? (
              <>
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Menu Utama
                </p>

                <nav className="mt-3 space-y-2">
                  {adminMenus.map((menu) => {
                    const Icon = menu.icon;
                    const active = isActivePath(pathname, menu.href);

                    return (
                      <button
                        key={menu.href}
                        type="button"
                        onClick={() => handleNavigate(menu.href)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active
                          ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                          }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {menu.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-6">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8ff] px-4 py-3 text-sm font-black text-[#123c8c]">
                    <Settings size={18} strokeWidth={2.5} />
                    Master Data
                  </div>

                  <div className="mt-2 space-y-1 border-l-2 border-blue-100 pl-4">
                    {masterDataMenus.map((menu) => {
                      const Icon = menu.icon;
                      const active = isActivePath(pathname, menu.href);

                      return (
                        <button
                          key={menu.href}
                          type="button"
                          onClick={() => handleNavigate(menu.href)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${active
                            ? "bg-[#eaf1ff] text-[#123c8c]"
                            : "text-slate-500 hover:bg-slate-50 hover:text-[#123c8c]"
                            }`}
                        >
                          <Icon size={15} strokeWidth={2.5} />
                          {menu.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6">
                  <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                    Operasional
                  </p>

                  <nav className="mt-3 space-y-2">
                    {operationalMenus.map((menu) => {
                      const Icon = menu.icon;
                      const active = isActivePath(pathname, menu.href);

                      return (
                        <button
                          key={menu.href}
                          type="button"
                          onClick={() => handleNavigate(menu.href)}
                          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active
                            ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                            }`}
                        >
                          <Icon size={18} strokeWidth={2.5} />
                          {menu.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </>
            ) : (
              <>
                <p className="px-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                  Menu Karyawan
                </p>

                <nav className="mt-3 space-y-2">
                  {employeeNav.map((menu) => {
                    const Icon = menu.icon;
                    const active = isActivePath(pathname, menu.href);

                    return (
                      <button
                        key={menu.href}
                        type="button"
                        onClick={() => handleNavigate(menu.href)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${active
                          ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                          }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {menu.label}
                      </button>
                    );
                  })}
                </nav>
              </>
            )}
          </div>

          <div className="border-t border-blue-50 p-4">
            <Link
              href="/login"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.98]"
            >
              <LogOut size={18} strokeWidth={2.5} />
              Logout
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
