"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  UserCircle2,
  UserCog,
} from "lucide-react";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: "employee" | "admin";
};

const employeeNav = [
  { href: "/home", label: "Home" },
  { href: "/attendance", label: "Attendance" },
  { href: "/announcements", label: "Pengumuman" },
  { href: "/salary", label: "Salary" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/master-data", label: "Master Data" },
  { href: "/admin/reports", label: "Reports" },
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

export default function AppHeader({
  title,
  subtitle,
  variant = "employee",
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menus = variant === "admin" ? adminNav : employeeNav;

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
    return adminNav.find((menu) => pathname.startsWith(menu.href));
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
              {adminNav.map((menu) => {
                const active = pathname === menu.href;

                return (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-black transition-all duration-200 ${
                      active
                        ? "bg-[#123c8c] text-white"
                        : "text-slate-500 hover:bg-[#f2f6ff] hover:text-[#123c8c]"
                    }`}
                  >
                    <span>{menu.label}</span>
                    <ChevronRight size={16} />
                  </Link>
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

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-slate-300/50">
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
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#123c8c]">
              FaceAttend
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-1 max-w-[320px] text-sm leading-5 text-slate-500 md:max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

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
        </div>
      </div>
    </header>
  );
}
