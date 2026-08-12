"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Clock3,
  ClipboardList,
  FileImage,
  History,
  Home,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Network,
  Palette,
  PhoneCall,
  ArrowLeftRight,
  Settings,
  Trophy,
  UserPlus,
  UserRound,
  UserRoundCog,
  X,
} from "lucide-react";

import { useSiteLogo } from "@/hooks/useSiteLogo";
import {
  getReadAnnouncementIds,
  getReadNotificationIds,
} from "@/lib/announcement-read";

type AppHeaderProps = {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: "employee" | "admin";
  hideMobileMenuButton?: boolean;
};

type NotificationItem = {
  id: string;
  rawId?: string;
  isRead?: boolean;
};

type NotificationStats = {
  total?: number;
  unread?: number;
  pending?: number;
  actionable?: number;
  sick?: number;
  leave?: number;
  permission?: number;
  wfh?: number;
  visit?: number;
};

type NotificationResponse = {
  success?: boolean;
  stats?: NotificationStats;
  notifications?: NotificationItem[];
  message?: string;
};

type AdminContactNumberResponse = {
  success?: boolean;
  number?: {
    phone_number?: string | null;
  } | null;
  message?: string;
};

const employeeNav = [
  { href: "/beranda", label: "Beranda", icon: Home },
  { href: "/presensi", label: "Presensi", icon: CalendarCheck },
  { href: "/tukar-shift", label: "Tukar Shift", icon: ArrowLeftRight },
  { href: "/pengumuman", label: "Pengumuman", icon: Megaphone },
  { href: "/history", label: "Riwayat", icon: History },
  { href: "/cuti", label: "Cuti", icon: CalendarDays },
  { href: "/profil", label: "Profil", icon: UserRound },
];

const adminMenus = [
  {
    href: "/admin/dasbor",
    label: "Dasbor",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/monitor-perusahaan",
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
    href: "/admin/shift",
    label: "Shift",
    icon: Clock3,
  },
  {
    href: "/admin/jam-kerja",
    label: "Jam Kerja",
    icon: CalendarClock,
  },
  {
    href: "/admin/kantor",
    label: "Kantor",
    icon: Building2,
  },
  {
    href: "/admin/divisi",
    label: "Divisi",
    icon: Network,
  },
  {
    href: "/admin/jabatan",
    label: "Jabatan",
    icon: Building2,
  },
  {
    href: "/admin/posisi",
    label: "Posisi",
    icon: UserRoundCog,
  },
  {
    href: "/admin/status-kepegawaian",
    label: "Status Kepegawaian",
    icon: UserRound,
  },
];

const operationalMenus = [
  {
    href: "/admin/daftar-karyawan",
    label: "Daftar Karyawan",
    icon: UserPlus,
  },
  {
    href: "/admin/laporan-kehadiran",
    label: "Laporan Kehadiran",
    icon: FileImage,
  },
  {
    href: "/admin/laporan-cuti",
    label: "Laporan Cuti",
    icon: CalendarDays,
  },
  {
    href: "/admin/rekap-kehadiran-karyawan",
    label: "Rekap Kehadiran Karyawan",
    icon: ClipboardList,
  },
  {
    href: "/admin/rank-kehadiran-karyawan",
    label: "Rank Kehadiran Karyawan",
    icon: Trophy,
  },
  {
    href: "/admin/nomor-admin",
    label: "Nomor Admin",
    icon: PhoneCall,
  },
  {
    href: "/admin/logo-aplikasi",
    label: "Logo Aplikasi",
    icon: Settings,
  },
  {
    href: "/admin/warna-aplikasi",
    label: "Warna Aplikasi",
    icon: Palette,
  },
];

const WHATSAPP_LINK = "https://wa.me/6282123459565";

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

  const actionable = Number(stats.actionable);

  if (Number.isFinite(actionable)) {
    return Math.max(0, actionable);
  }

  return Math.max(0, Number(stats.unread || 0) + Number(stats.pending || 0));
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

function getWhatsappLink(phoneNumber?: string | null) {
  const digits = String(phoneNumber || "").replace(/\D/g, "");

  if (!digits) return WHATSAPP_LINK;

  return `https://wa.me/${digits}`;
}

export default function AppHeader({
  title,
  eyebrow,
  subtitle,
  rightLabel,
  variant = "employee",
  hideMobileMenuButton = false,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [whatsappLink, setWhatsappLink] = useState(WHATSAPP_LINK);
  const logoSrc = useSiteLogo();

  const resolvedVariant = useMemo(() => {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return "admin";
    }

    return variant;
  }, [pathname, variant]);

  const isAdmin = resolvedVariant === "admin";
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

        let count = 0;
        if (isAdmin) {
          count = getAdminNotificationCount(data.stats);
        } else {
          // Calculate employee unread count taking local read status into account
          const readAnnIds = getReadAnnouncementIds();
          const readNotifIds = getReadNotificationIds();
          const list = data.notifications || [];

          count = list.filter((item) => {
            const cleanId = (item.rawId || item.id)
              .replace("announcement-", "")
              .replace("swap-", "");

            const isReadLocally =
              readAnnIds.includes(cleanId) ||
              readNotifIds.includes(cleanId) ||
              readNotifIds.includes(item.id);

            return !isReadLocally && !item.isRead;
          }).length;
        }

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
    }, 3000);

    const handleCountChange = () => {
      void loadNotificationCount();
    };

    window.addEventListener("notification-count-changed", handleCountChange);
    window.addEventListener("focus", handleCountChange);
    window.addEventListener("storage", handleCountChange);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("notification-count-changed", handleCountChange);
      window.removeEventListener("focus", handleCountChange);
      window.removeEventListener("storage", handleCountChange);
    };
  }, [isAdmin, pathname]);

  useEffect(() => {
    let isMounted = true;

    async function loadAdminContactNumber() {
      try {
        const response = await fetch("/api/admin-contact-number", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          if (isMounted) setWhatsappLink(WHATSAPP_LINK);
          return;
        }

        const data =
          (await readJsonResponse(response)) as AdminContactNumberResponse;

        if (isMounted) {
          setWhatsappLink(getWhatsappLink(data.number?.phone_number));
        }
      } catch {
        if (isMounted) setWhatsappLink(WHATSAPP_LINK);
      }
    }

    void loadAdminContactNumber();

    function handleAdminContactNumberChange() {
      void loadAdminContactNumber();
    }

    window.addEventListener(
      "admin-contact-number-changed",
      handleAdminContactNumberChange,
    );

    return () => {
      isMounted = false;
      window.removeEventListener(
        "admin-contact-number-changed",
        handleAdminContactNumberChange,
      );
    };
  }, [pathname]);

  function handleNavigate(href: string) {
    setIsSidebarOpen(false);
    router.push(href);
  }

  async function handleLogout() {
    setIsSidebarOpen(false);

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        cache: "no-store",
      });
    } finally {
      window.localStorage.removeItem("presensi_read_announcement_id");
      window.sessionStorage.clear();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 overflow-hidden border-b px-5 py-4 backdrop-blur-2xl transition-all duration-300 md:px-10 lg:px-16 ${
          hasScrolled
            ? "border-blue-100/80 bg-white/95 shadow-lg shadow-slate-300/30"
            : "border-white/60 bg-white/90 shadow-sm shadow-slate-200/40"
        }`}
      >
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className={`${hideMobileMenuButton ? "hidden md:flex" : "flex"} h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] shadow-lg shadow-slate-200/70 ring-1 ring-blue-100 transition hover:bg-blue-50 active:scale-[0.96]`}
              aria-label="Buka menu"
            >
              <Menu size={25} strokeWidth={3} />
            </button>

            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                  {eyebrow}
                </p>
              ) : null}

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
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi via WhatsApp"
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ecfff5] text-[#00a884] shadow-sm ring-1 ring-[#baf7dc] transition hover:bg-[#dcfce7] active:scale-[0.96]"
            >
              <PhoneCall className="h-5 w-5" strokeWidth={2.7} />
            </a>

            <Link
              href={notificationHref}
              className={`relative hidden h-12 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black shadow-sm ring-1 transition active:scale-[0.96] sm:inline-flex ${
                isNotificationPage
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
            </Link>

            <Link
              href={notificationHref}
              aria-label="Buka notifikasi"
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 transition active:scale-[0.96] sm:hidden ${
                isNotificationPage
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

            {/* Full Creativemu Logo Badge Box on the far right next to Bell */}
            <div className="relative hidden h-12 shrink-0 items-center justify-center rounded-2xl bg-white px-4 py-2.5 shadow-sm ring-1 ring-blue-100/90 transition hover:bg-[#eaf1ff] active:scale-[0.96] sm:flex">
              <Image
                src={logoSrc}
                alt="Logo Creativemu"
                width={140}
                height={35}
                unoptimized
                className="h-full w-auto object-contain object-center"
              />
            </div>

            {rightLabel ? (
              <span className="hidden rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100 md:inline-flex">
                {rightLabel}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className={eyebrow || subtitle ? "h-[106px]" : "h-[88px]"} />

      {isSidebarOpen ? (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-50 bg-transparent"
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
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-slate-300/50 ring-1 ring-blue-100">
                <Image
                  src={logoSrc}
                  alt="Creativemu Logo"
                  width={64}
                  height={59}
                  unoptimized
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Creativemu
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  {isAdmin ? "Panel Admin" : "Menu Karyawan"}
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

          {isAdmin ? (
            <div className="border-t border-blue-50 p-4">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.98]"
              >
                <LogOut size={18} strokeWidth={2.5} />
                Keluar
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
