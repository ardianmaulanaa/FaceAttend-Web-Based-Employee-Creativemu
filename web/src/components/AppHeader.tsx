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
];

function isActivePath(pathname: string, href: string) {
  if (href === "/history") {
    return pathname === "/history" || pathname.startsWith("/history/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
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

  function handleNavigate(href: string) {
    setIsSidebarOpen(false);
    router.push(href);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b px-5 py-4 backdrop-blur-2xl transition-all duration-300 md:px-10 lg:px-16 ${
          hasScrolled
            ? "border-blue-100/80 bg-white/95 shadow-lg shadow-slate-300/30"
            : "border-white/60 bg-white/90 shadow-sm shadow-slate-200/40"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
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

          <div className="flex items-center gap-3">
            {isAdmin && (
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
                              className={`relative rounded-xl p-3 transition text-left ${
                                notif.type === "leave-request"
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
                    )}
                  </div>
                )}
              </div>
            )}

            {rightLabel ? (
              <div className="hidden items-center justify-end gap-3 md:flex">
                <span className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100">
                  {rightLabel}
                </span>
              </div>
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
        className={`fixed left-0 top-0 z-[60] h-dvh w-[82vw] max-w-80 border-r border-blue-100 bg-white shadow-2xl shadow-slate-950/20 transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
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
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                          active
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
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${
                            active
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
                          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                            active
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
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition ${
                          active
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