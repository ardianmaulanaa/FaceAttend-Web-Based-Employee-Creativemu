"use client";

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

export default function AppHeader({
  title,
  subtitle,
  rightLabel,
  variant = "employee",
}: AppHeaderProps) {
  const pathname = usePathname();
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