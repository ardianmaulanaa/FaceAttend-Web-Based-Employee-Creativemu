"use client";

<<<<<<< HEAD
import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Boxes,
  Bell,
  Briefcase,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  FileText,
  Layers3,
  LogOut,
  Megaphone,
  Monitor,
  Search,
  UserCircle2,
  UserCog,
=======
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CalendarClock,
  Clock3,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  ScanFace,
  Settings,
  UserPlus,
  UserRound,
  UserRoundCog,
  X,
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
} from "lucide-react";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: "employee" | "admin";
};

const employeeNav = [
<<<<<<< HEAD
  { href: "/home", label: "Home" },
  { href: "/attendance", label: "Attendance" },
  { href: "/announcements", label: "Pengumuman" },
  { href: "/salary", label: "Salary" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

const adminMainNav = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: Monitor,
  },
  {
    href: "/admin/company-monitor",
    label: "Monitor Perusahaan",
    icon: ClipboardList,
  },
  {
    href: "/admin/announcements",
    label: "Pengumuman",
    icon: Megaphone,
  },
  {
    href: "/admin/master-data",
    label: "Master Data",
    icon: Layers3,
  },
  {
    href: "/admin/inventory",
    label: "Inventaris",
    icon: Boxes,
  },
  {
    href: "/admin/employee-requests",
    label: "Pengajuan Karyawan",
    icon: Briefcase,
  },
];

const adminMasterDataSubNav = [
  { href: "/admin/master-data?tab=shift", label: "Shift", tab: "shift" },
  {
    href: "/admin/master-data?tab=jam-kerja",
    label: "Jam Kerja",
    tab: "jam-kerja",
  },
  { href: "/admin/master-data?tab=divisi", label: "Divisi", tab: "divisi" },
  {
    href: "/admin/master-data?tab=jabatan",
    label: "Jabatan",
    tab: "jabatan",
  },
  {
    href: "/admin/master-data?tab=lokasi-kunjungan",
    label: "Lokasi Kunjungan",
    tab: "lokasi-kunjungan",
  },
  {
    href: "/admin/master-data?tab=lokasi-presensi",
    label: "Lokasi Presensi",
    tab: "lokasi-presensi",
  },
  {
    href: "/admin/master-data?tab=istilah",
    label: "Daftar Istilah",
    tab: "istilah",
  },
];

type AdminSessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  phone?: string | null;
  profile_photo_url?: string | null;
};

type AttendanceNotification = {
  id: string;
  type: "check-in" | "check-out" | "absent";
  employeeName: string;
  happenedAt: string;
  message: string;
};
=======
  { href: "/home", label: "Home", icon: Home },
  { href: "/attendance", label: "Attendance", icon: ScanFace },
  { href: "/history", label: "History", icon: History },
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
    href: "/admin/departments",
    label: "Divisi",
    icon: Building2,
  },
  {
    href: "/admin/jabatan",
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
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6

export default function AppHeader({
  title,
  subtitle,
  variant = "employee",
}: AppHeaderProps) {
  const pathname = usePathname();
<<<<<<< HEAD
  const searchParams = useSearchParams();
  const router = useRouter();
  const menus = variant === "admin" ? adminMainNav : employeeNav;
  const activeMasterTab = searchParams.get("tab") || "shift";

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isBellMenuOpen, setIsBellMenuOpen] = useState(false);
  const [attendanceNotifications, setAttendanceNotifications] = useState<
    AttendanceNotification[]
  >([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [sessionUser, setSessionUser] = useState<AdminSessionUser | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const bellMenuRef = useRef<HTMLDivElement | null>(null);

  const activeAdminMenu = useMemo(() => {
    const masterDataActive = pathname.startsWith("/admin/master-data");
    if (masterDataActive) {
      return { label: "Master Data" };
    }

    return adminMainNav.find((menu) => pathname.startsWith(menu.href));
  }, [pathname]);

  useEffect(() => {
    if (variant !== "admin") return;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();
        if (!response.ok || !result.user) return;

        const user = result.user as AdminSessionUser;
        setSessionUser(user);
      } catch {
        // Ignore session read errors in header.
      }
    }

    void loadSession();
  }, [variant]);

  useEffect(() => {
    if (variant !== "admin") return;

    async function loadNotifications() {
      try {
        setIsLoadingNotifications(true);
        const response = await fetch("/api/attendance/notifications", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();
        if (!response.ok || !Array.isArray(result.data)) {
          setAttendanceNotifications([]);
          return;
        }

        setAttendanceNotifications(result.data as AttendanceNotification[]);
      } catch {
        setAttendanceNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    }

    void loadNotifications();
  }, [pathname, variant]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }

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

  function handleSwitchAccount() {
    setIsProfileMenuOpen(false);
    router.push("/login?switch=1");
  }

  function goToProfilePage() {
    setIsProfileMenuOpen(false);
    router.push("/admin/profile");
  }

  if (variant === "admin") {
    return (
      <>
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-blue-100 bg-white md:block">
          <div className="flex h-full flex-col p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white">
                <Image
                  src="/images/creativemu-logo/creativemu.png"
                  alt="Creativemu Logo"
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#123c8c]">
                  FaceAttend
                </p>
                <p className="text-sm font-black text-slate-900">Admin Panel</p>
              </div>
            </div>

            <nav className="mt-6 space-y-2">
              {adminMainNav.map((menu) => {
                const Icon = menu.icon;
                const isMasterData = menu.href === "/admin/master-data";
                const active = isMasterData
                  ? pathname.startsWith("/admin/master-data")
                  : pathname.startsWith(menu.href);

                return (
                  <div key={menu.href} className="space-y-1">
                    <Link
                      href={menu.href}
                      className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 ${
                        active
                          ? "bg-[#123c8c] text-white"
                          : "text-slate-500 hover:bg-[#f2f6ff] hover:text-[#123c8c]"
                      }`}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon size={15} />
                        {menu.label}
                      </span>
                      <ChevronRight size={16} />
                    </Link>

                    {isMasterData && (
                      <div className="space-y-1 pl-5">
                        {adminMasterDataSubNav.map((subMenu) => {
                          const subActive =
                            pathname.startsWith("/admin/master-data") &&
                            activeMasterTab === subMenu.tab;

                          return (
                            <Link
                              key={subMenu.href}
                              href={subMenu.href}
                              className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                                subActive
                                  ? "bg-[#eaf1ff] text-[#123c8c]"
                                  : "text-slate-500 hover:bg-[#f6f8ff]"
                              }`}
                            >
                              <FileText size={12} />
                              {subMenu.label}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            <div className="mt-auto pt-4">
              <Link
                href="/login?switch=1"
                className="flex items-center justify-between rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-black text-[#123c8c] transition hover:bg-[#eaf1ff]"
              >
                <span>Logout</span>
                <UserCircle2 size={16} />
              </Link>
            </div>
          </div>
        </aside>

        <header className="sticky top-0 z-30 border-b border-white/60 bg-white/90 px-4 py-3 shadow-sm shadow-slate-200/50 backdrop-blur-2xl md:px-6">
          <div className="mx-auto flex max-w-7xl items-center gap-3">
            <div className="hidden flex-1 items-center gap-2 rounded-2xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 md:flex">
              <Search size={16} className="text-slate-400" />
              <input
                aria-label="Cari data admin"
                placeholder="Search karyawan, laporan, atau status..."
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              />
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div ref={bellMenuRef} className="relative hidden md:block">
                <button
                  type="button"
                  aria-label="Notifikasi presensi admin"
                  onClick={() => setIsBellMenuOpen((prev) => !prev)}
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-100 bg-[#f6f8ff] text-[#123c8c] transition hover:bg-[#eaf1ff]"
                >
                  <Bell size={17} />
                  {attendanceNotifications.length > 0 && (
                    <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>

                {isBellMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl shadow-slate-300/40">
                    <div className="px-2 pb-2 pt-1">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                        Notifikasi Presensi Karyawan
                      </p>
                    </div>

                    <div className="max-h-80 space-y-1 overflow-y-auto px-1 pb-1">
                      {isLoadingNotifications && (
                        <p className="px-2 py-2 text-xs font-semibold text-slate-500">
                          Memuat notifikasi...
                        </p>
                      )}

                      {!isLoadingNotifications &&
                        attendanceNotifications.length === 0 && (
                          <p className="px-2 py-2 text-xs font-semibold text-slate-500">
                            Belum ada notifikasi presensi.
                          </p>
                        )}

                      {!isLoadingNotifications &&
                        attendanceNotifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="rounded-xl border border-blue-100 bg-[#f8faff] px-3 py-2"
                          >
                            <p className="text-xs font-black text-slate-800">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              {new Date(notification.happenedAt).toLocaleString(
                                "id-ID",
                              )}
                            </p>
                            <p
                              className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                                notification.type === "check-in"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : notification.type === "check-out"
                                    ? "bg-cyan-50 text-cyan-700"
                                    : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {notification.type === "check-in"
                                ? "Check-in"
                                : notification.type === "check-out"
                                  ? "Check-out"
                                  : "Absen"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div ref={profileMenuRef} className="relative hidden md:block">
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-left transition hover:bg-[#eaf1ff]"
                >
                  <UserCircle2 size={18} className="text-[#123c8c]" />
                  <div>
                    <p className="text-xs font-black text-slate-800">
                      {sessionUser?.name || "Admin Creativemu"}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-500">
                      {activeAdminMenu?.label || "Dashboard"}
                    </p>
                  </div>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 rounded-2xl border border-blue-100 bg-white p-2 shadow-xl shadow-slate-300/40">
                    <button
                      type="button"
                      onClick={goToProfilePage}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#f5f8ff]"
                    >
                      <UserCog size={15} className="text-[#123c8c]" />
                      Update Profil Admin
                    </button>

                    <button
                      type="button"
                      onClick={handleSwitchAccount}
                      className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-[#f5f8ff]"
                    >
                      <UserCircle2 size={15} className="text-[#123c8c]" />
                      Ganti Akun
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-2 md:hidden">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
              FaceAttend
            </p>
            <h1 className="text-xl font-black text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs font-semibold text-slate-500">{subtitle}</p>
            )}
          </div>
        </header>
      </>
    );
  }

  return (
    <header className="sticky top-0 z-30 overflow-hidden border-b border-white/60 bg-white/85 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-2xl md:px-10 lg:px-16">
      <Image
        src="/images/creativemu-logo/creativemu.png"
        alt="Creativemu Background Logo"
        width={190}
        height={190}
        className="pointer-events-none absolute right-10 top-1/2 hidden h-auto -translate-y-1/2 opacity-[0.04] md:block"
        priority
      />
=======
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = variant === "admin";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/90 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-2xl md:px-10 lg:px-16">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] shadow-sm transition active:scale-[0.96]"
              aria-label="Open menu"
            >
              <Menu size={24} strokeWidth={2.8} />
            </button>
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6

            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#123c8c] md:text-[10px]">
                FaceAttend
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-2xl lg:text-3xl">
                {title}
              </h1>

              {subtitle && (
                <p className="mt-1 max-w-xl text-sm font-semibold leading-5 text-slate-500 md:text-sm">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

<<<<<<< HEAD
        <nav className="hidden items-center justify-center gap-2 md:flex">
          {menus.map((menu) => {
            const active = pathname === menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition-all duration-300 ${
                  active
                    ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#123c8c]"
                }`}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center justify-end md:flex">
          <Link
            href="/login"
            className="rounded-2xl bg-[#eaf1ff] px-5 py-2.5 text-xs font-black text-[#123c8c] transition hover:bg-[#dceaff] active:scale-[0.98]"
          >
            Logout
          </Link>
=======
          {!isAdmin && (
            <nav className="hidden items-center justify-center gap-2 lg:flex">
              {employeeNav.map((menu) => {
                const active = isActivePath(pathname, menu.href);

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={`rounded-2xl px-4 py-2 text-sm font-black transition-all duration-300 ${
                      active
                        ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                        : "text-slate-500 hover:bg-slate-100 hover:text-[#123c8c]"
                    }`}
                  >
                    {menu.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {!isAdmin && rightLabel && (
            <div className="hidden items-center justify-end gap-3 md:flex">
              <span className="rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100">
                {rightLabel}
              </span>
            </div>
          )}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
        </div>
      </header>

      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm"
        />
      )}

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
              aria-label="Close menu"
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
                      <Link
                        key={menu.href}
                        href={menu.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                          active
                            ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                        }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {menu.label}
                      </Link>
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
                        <Link
                          key={menu.href}
                          href={menu.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold transition ${
                            active
                              ? "bg-[#eaf1ff] text-[#123c8c]"
                              : "text-slate-500 hover:bg-slate-50 hover:text-[#123c8c]"
                          }`}
                        >
                          <Icon size={15} strokeWidth={2.5} />
                          {menu.label}
                        </Link>
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
                        <Link
                          key={menu.href}
                          href={menu.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                            active
                              ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                              : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                          }`}
                        >
                          <Icon size={18} strokeWidth={2.5} />
                          {menu.label}
                        </Link>
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
                      <Link
                        key={menu.href}
                        href={menu.href}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black transition ${
                          active
                            ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                            : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                        }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {menu.label}
                      </Link>
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
