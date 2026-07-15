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
  Moon,
  Sun,
  Search,
  TrendingUp,
  Coins,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";


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
    href: "/admin/analytics",
    label: "HR Analytics",
    icon: TrendingUp,
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
    href: "/admin/salary",
    label: "Gaji & Payroll",
    icon: Coins,
  },
  {
    href: "/admin/profil-karyawan",
    label: "Profil Karyawan",
    icon: UserRound,
  },
];

const employeeSuggestions = [
  { href: "/home", label: "Home", icon: Home, category: "Menu Utama", keywords: ["home", "beranda", "dashboard", "utama"] },
  { href: "/attendance", label: "Attendance / Absen", icon: ScanFace, category: "Menu Utama", keywords: ["attendance", "absen", "kehadiran", "scan wajah", "face recognition", "masuk", "pulang"] },
  { href: "/history", label: "History Kehadiran", icon: History, category: "Menu Utama", keywords: ["history", "riwayat", "kehadiran", "presensi", "log", "daftar"] },
  { href: "/cuti", label: "Pengajuan Cuti / Izin", icon: CalendarDays, category: "Menu Utama", keywords: ["cuti", "izin", "sakit", "pengajuan", "leave", "sakit", "permohonan"] },
  { href: "/pengumuman", label: "Info Pengumuman", icon: Megaphone, category: "Menu Utama", keywords: ["pengumuman", "info", "informasi", "megafon", "announcement", "kabar"] },
  { href: "/profile", label: "Profile Saya", icon: UserRound, category: "Menu Utama", keywords: ["profile", "profil", "akun", "saya", "user", "pengaturan", "data diri"] },
];

const adminSuggestions = [
  // Menu Utama
  { href: "/admin/dashboard", label: "Dashboard Admin", icon: LayoutDashboard, category: "Menu Utama", keywords: ["dashboard", "beranda", "ringkasan", "summary", "admin"] },
  { href: "/admin/monitor_perusahaan", label: "Monitor Perusahaan", icon: BarChart3, category: "Menu Utama", keywords: ["monitor perusahaan", "pemantauan", "kehadiran real-time", "karyawan", "live", "pantau"] },
  { href: "/admin/analytics", label: "HR Analytics Dashboard", icon: TrendingUp, category: "Menu Utama", keywords: ["hr analytics", "analitik", "grafik", "prediksi", "kedisiplinan", "reward", "sanksi", "promosi"] },
  { href: "/admin/pengumuman", label: "Pengumuman Admin", icon: Megaphone, category: "Menu Utama", keywords: ["pengumuman", "info", "buat pengumuman", "broadcast", "pengumuman baru"] },

  // Master Data
  { href: "/admin/shifts", label: "Shift Kerja", icon: Clock3, category: "Master Data", keywords: ["shift", "jadwal", "piket", "jam kerja", "waktu", "pagi", "siang", "malam"] },
  { href: "/admin/work-schedules", label: "Jam Kerja Schedule", icon: CalendarClock, category: "Master Data", keywords: ["jam kerja", "jadwal kerja", "schedule", "work schedule", "hari kerja"] },
  { href: "/admin/kantor", label: "Kantor & Lokasi", icon: Building2, category: "Master Data", keywords: ["kantor", "lokasi", "gps", "koordinat", "cabang", "alamat", "radius"] },
  { href: "/admin/departments", label: "Divisi / Department", icon: Network, category: "Master Data", keywords: ["divisi", "department", "departemen", "bagian", "struktur"] },
  { href: "/admin/units", label: "Unit Kerja", icon: Building2, category: "Master Data", keywords: ["unit", "unit kerja", "bagian", "kelompok", "cabang"] },
  { href: "/admin/positions", label: "Jabatan Pekerjaan", icon: UserRoundCog, category: "Master Data", keywords: ["jabatan", "posisi", "role", "pangkat", "job", "title"] },

  // Operasional
  { href: "/admin/employees", label: "Register Employee", icon: UserPlus, category: "Operasional", keywords: ["register employee", "tambah karyawan", "daftar karyawan baru", "pendaftaran", "buat akun"] },
  { href: "/admin/laporan-kehadiran", label: "Laporan Kehadiran", icon: FileImage, category: "Operasional", keywords: ["laporan kehadiran", "rekap", "excel", "kehadiran", "presensi", "export"] },
  { href: "/admin/cuti", label: "Laporan & Approval Cuti", icon: CalendarDays, category: "Operasional", keywords: ["laporan cuti", "persetujuan cuti", "approval cuti", "pengajuan", "izin"] },
  { href: "/admin/salary", label: "Gaji & Payroll Admin", icon: Coins, category: "Operasional", keywords: ["salary", "gaji", "payroll", "slip", "potongan", "pph", "slip gaji", "massal", "kalkulasi"] },
  { href: "/admin/profil-karyawan", label: "Profil Karyawan", icon: UserRound, category: "Operasional", keywords: ["profil karyawan", "daftar karyawan", "data karyawan", "edit karyawan", "list user"] },
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
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isBellMenuOpen, setIsBellMenuOpen] = useState(false);
  const [attendanceNotifications, setAttendanceNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const bellMenuRef = useRef<HTMLDivElement | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  // Search State & Refs
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedVariant = useMemo(() => {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return "admin";
    }
    return variant;
  }, [pathname, variant]);

  const isAdmin = resolvedVariant === "admin";

  // Load search history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("faceattend_search_history");
      if (stored) {
        setSearchHistory(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sync search input with the URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const searchVal = params.get("search") || "";
    setSearchQuery(searchVal);
  }, [pathname]);

  // Save query to search history
  const saveSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...searchHistory.filter((q) => q !== trimmed)].slice(0, 8);
    setSearchHistory(updated);
    localStorage.setItem("faceattend_search_history", JSON.stringify(updated));
  };

  // Delete item from search history
  const deleteHistoryItem = (e: React.MouseEvent, item: string) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = searchHistory.filter((q) => q !== item);
    setSearchHistory(updated);
    localStorage.setItem("faceattend_search_history", JSON.stringify(updated));
  };

  // Trigger search action by updating URL query param and redirecting to search page
  const triggerSearch = (query: string) => {
    saveSearchQuery(query);
    const targetPath = isAdmin ? "/admin/search" : "/search";
    router.push(`${targetPath}?search=${encodeURIComponent(query.trim())}`);
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return searchHistory;
    const query = searchQuery.toLowerCase();
    return searchHistory.filter((item) => item.toLowerCase().includes(query));
  }, [searchHistory, searchQuery]);

  // Focus search with Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          searchInputRef.current?.focus();
        } else {
          setIsMobileSearchOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [searchQuery]);

  useEffect(() => {
    if (isMobileSearchOpen) {
      setTimeout(() => {
        mobileSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isMobileSearchOpen]);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, isMobile = false) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < filteredHistory.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredHistory.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      let targetQuery = searchQuery;
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < filteredHistory.length) {
        targetQuery = filteredHistory[activeSuggestionIndex];
      }
      triggerSearch(targetQuery);
      setIsSearchFocused(false);
      if (isMobile) setIsMobileSearchOpen(false);
      searchInputRef.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsSearchFocused(false);
      if (isMobile) setIsMobileSearchOpen(false);
      searchInputRef.current?.blur();
    }
  };

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
        className={`fixed inset-x-0 top-0 z-40 border-b px-5 py-4 backdrop-blur-2xl transition-all duration-300 md:px-10 lg:px-16 ${hasScrolled
          ? "border-blue-100/80 bg-white/95 dark:border-[#21262d] dark:bg-[#161b22]/95 shadow-lg shadow-slate-300/30 dark:shadow-black/20"
          : "border-white/60 bg-white/90 dark:border-[#21262d]/60 dark:bg-[#161b22]/90 shadow-sm shadow-slate-200/40 dark:shadow-none"
          }`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            aria-hidden="true"
            className="absolute right-16 top-1/2 hidden h-64 w-64 -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.11] blur-[0.5px] md:block"
            style={{
              backgroundImage: "url('/images/creativemu-logo/creativemu.png')",
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] shadow-lg shadow-slate-200/70 ring-1 ring-blue-100 transition hover:bg-blue-50 active:scale-[0.96]"
              aria-label="Buka menu"
            >
              <Menu size={25} strokeWidth={3} />
            </button>

            <div className="min-w-0">
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

          {/* Quick Search Bar (Desktop) */}
          <div ref={searchContainerRef} className="relative hidden md:block w-full max-w-xs lg:max-w-md xl:max-w-xl mx-4 z-50">
            <div className="relative flex items-center">
              <Search className={`absolute left-4 h-4 w-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => handleSearchKeyDown(e, false)}
                placeholder="Cari data..."
                className={`w-full rounded-2xl py-2.5 pl-11 pr-12 text-sm font-semibold border outline-none transition-all duration-200 ${theme === 'dark'
                  ? 'bg-[#21262d]/50 border-[#30363d] text-slate-100 placeholder-slate-500 focus:bg-[#161b22] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]'
                  : 'bg-[#f6f8ff] border-blue-100 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#123c8c] focus:ring-1 focus:ring-[#123c8c]'
                  }`}
              />
              <button
                type="button"
                onClick={() => triggerSearch(searchQuery)}
                className={`absolute right-3 p-1.5 rounded-xl transition ${theme === 'dark'
                  ? 'text-slate-400 hover:text-[#58a6ff] hover:bg-[#30363d]'
                  : 'text-slate-500 hover:text-[#123c8c] hover:bg-blue-50'
                  }`}
                aria-label="Cari"
              >
                <Search size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {isSearchFocused && (
              <div className={`absolute left-0 right-0 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border p-2 shadow-2xl transition-all duration-200 ${theme === 'dark'
                ? 'border-[#30363d] bg-[#161b22] shadow-black/40'
                : 'border-blue-100 bg-white shadow-slate-300/40'
                }`}>
                <div className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                  Riwayat Pencarian
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="p-4 text-center text-sm font-semibold text-slate-400">
                    Tidak ada riwayat pencarian
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredHistory.map((item, index) => {
                      const isActive = index === activeSuggestionIndex;
                      return (
                        <div
                          key={item}
                          onMouseEnter={() => setActiveSuggestionIndex(index)}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 cursor-pointer ${isActive
                            ? theme === 'dark'
                              ? 'bg-[#1f6feb] text-white'
                              : 'bg-[#123c8c] text-white shadow-md shadow-blue-900/10'
                            : theme === 'dark'
                              ? 'text-slate-300 hover:bg-[#21262d] hover:text-[#58a6ff]'
                              : 'text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]'
                            }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(item);
                            triggerSearch(item);
                            setIsSearchFocused(false);
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Clock3 size={16} strokeWidth={2.5} className="shrink-0 opacity-60" />
                            <span className="truncate">{item}</span>
                          </div>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              // Prevent closing dropdown when clicking delete icon
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onClick={(e) => deleteHistoryItem(e, item)}
                            className={`p-1 rounded-lg transition-all ${isActive
                              ? 'text-white/80 hover:text-white hover:bg-white/10'
                              : theme === 'dark'
                                ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              }`}
                            title="Hapus dari riwayat"
                          >
                            <X size={14} strokeWidth={3} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3">
            {/* Mobile Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className={`flex md:hidden h-12 w-12 items-center justify-center rounded-2xl shadow-lg ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark"
                ? "bg-[#21262d] text-[#58a6ff] ring-[#30363d] shadow-black/20"
                : "bg-[#eaf1ff] text-[#123c8c] ring-blue-100 shadow-slate-200/70 hover:bg-blue-50"
                }`}
              aria-label="Cari menu"
            >
              <Search size={20} strokeWidth={2.5} />
            </button>

            {/* Header Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark" ? "bg-[#21262d] text-[#58a6ff] ring-[#30363d] shadow-black/20" : "bg-[#eaf1ff] text-[#123c8c] ring-blue-100 shadow-slate-200/70 hover:bg-blue-50"}`}
              title={theme === "light" ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"}
            >
              {theme === "light" ? (
                <Moon size={20} strokeWidth={2.5} />
              ) : (
                <Sun size={20} strokeWidth={2.5} />
              )}
            </button>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi via WhatsApp"
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark" ? "bg-[#21262d] text-[#3fb950] ring-[#30363d] shadow-black/20" : "bg-[#ecfff5] text-[#00a884] ring-[#baf7dc] hover:bg-[#dcfce7]"}`}
            >
              <PhoneCall className="h-5 w-5" strokeWidth={2.7} />
            </a>

            {isAdmin ? (
              <div ref={bellMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsBellMenuOpen(!isBellMenuOpen)}
                  className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark" ? "bg-[#21262d] text-[#58a6ff] ring-[#30363d] shadow-black/20" : "bg-[#eaf1ff] text-[#123c8c] ring-blue-100 shadow-slate-200/70 hover:bg-blue-50"}`}
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
                  <div className={`absolute right-0 top-14 z-50 w-80 rounded-2xl border p-4 shadow-2xl ${theme === "dark" ? "border-[#30363d] bg-[#161b22] shadow-black/40" : "border-blue-100 bg-white shadow-slate-300/40"}`}>
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
                      <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff8a00] text-[10px] font-black leading-none text-white">
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
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#ff8a00] text-[10px] font-black leading-none text-white">
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

      {/* Backdrop: always rendered, animated via opacity */}
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={() => setIsSidebarOpen(false)}
        className={`sidebar-backdrop ${isSidebarOpen ? "open" : ""}`}
      />

      <aside className={`sidebar-drawer ${isSidebarOpen ? "open" : ""} fixed left-0 top-0 z-[1001] h-dvh w-[82vw] max-w-80 border-r border-indigo-100/70 dark:border-[#21262d] bg-[#f4f2ff] dark:bg-[#161b22] shadow-2xl shadow-slate-950/20`}>


        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-blue-50 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white keep-white p-2 shadow-lg shadow-slate-300/50 ring-1 ring-blue-100 dark:ring-transparent">
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

          <div className="border-t border-blue-50 p-4 space-y-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#eaf1ff] px-4 py-3 text-sm font-black text-[#123c8c] transition hover:bg-blue-50 active:scale-[0.98] dark:bg-[#162238] dark:text-[#3b82f6]"
            >
              {theme === "light" ? (
                <>
                  <Moon size={18} strokeWidth={2.5} />
                  Mode Gelap
                </>
              ) : (
                <>
                  <Sun size={18} strokeWidth={2.5} />
                  Mode Terang
                </>
              )}
            </button>

            <Link
              href="/login"
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.98] dark:bg-rose-950/20 dark:text-rose-400"
            >
              <LogOut size={18} strokeWidth={2.5} />
              Logout
            </Link>
          </div>

        </div>
      </aside>

      {/* Mobile Search Modal/Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[1100] flex flex-col bg-slate-900/40 dark:bg-black/60 backdrop-blur-md">
          <div className={`flex flex-col h-full max-h-[85vh] w-full rounded-b-3xl border-b p-5 shadow-2xl transition-all duration-300 ${theme === 'dark'
            ? 'border-[#30363d] bg-[#161b22]'
            : 'border-blue-100 bg-white'
            }`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 flex items-center">
                <Search className={`absolute left-4 h-4 w-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => handleSearchKeyDown(e, true)}
                  placeholder="Cari data..."
                  className={`w-full rounded-2xl py-2.5 pl-11 pr-12 text-sm font-semibold border outline-none transition-all duration-200 ${theme === 'dark'
                    ? 'bg-[#21262d] border-[#30363d] text-slate-100 placeholder-slate-500 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]'
                    : 'bg-[#f6f8ff] border-blue-100 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#123c8c] focus:ring-1 focus:ring-[#123c8c]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerSearch(searchQuery);
                    setIsMobileSearchOpen(false);
                  }}
                  className={`absolute right-3 p-1.5 rounded-xl transition ${theme === 'dark'
                    ? 'text-slate-400 hover:text-[#58a6ff] hover:bg-[#30363d]'
                    : 'text-slate-500 hover:text-[#123c8c] hover:bg-blue-50'
                    }`}
                  aria-label="Cari"
                >
                  <Search size={16} strokeWidth={2.5} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition active:scale-[0.96] ${theme === 'dark'
                  ? 'bg-[#21262d] text-slate-300 hover:bg-[#30363d]'
                  : 'bg-[#eaf1ff] text-[#123c8c] hover:bg-blue-100'
                  }`}
                aria-label="Tutup pencarian"
              >
                <X size={20} strokeWidth={2.8} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                Riwayat Pencarian
              </div>

              {filteredHistory.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-slate-400">
                  Tidak ada riwayat pencarian
                </div>
              ) : (
                <div className="space-y-1 pb-4">
                  {filteredHistory.map((item, index) => {
                    const isActive = index === activeSuggestionIndex;
                    return (
                      <div
                        key={item}
                        className={`flex items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all duration-150 cursor-pointer ${isActive
                          ? theme === 'dark'
                            ? 'bg-[#1f6feb] text-white'
                            : 'bg-[#123c8c] text-white shadow-md shadow-blue-900/10'
                          : theme === 'dark'
                            ? 'bg-[#21262d]/40 text-slate-300 hover:bg-[#21262d]'
                            : 'bg-[#f6f8ff] text-slate-600 hover:bg-[#eaf1ff]'
                          }`}
                        onClick={() => {
                          setSearchQuery(item);
                          triggerSearch(item);
                          setIsMobileSearchOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Clock3 size={18} strokeWidth={2.5} className="shrink-0 opacity-60" />
                          <span className="truncate">{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            deleteHistoryItem(e, item);
                          }}
                          className={`p-1.5 rounded-xl transition-all ${isActive
                            ? 'text-white/80 hover:text-white hover:bg-white/10'
                            : theme === 'dark'
                              ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                              : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                          title="Hapus dari riwayat"
                        >
                          <X size={16} strokeWidth={3} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1" onClick={() => setIsMobileSearchOpen(false)} />
        </div>
      )}
    </>
  );
}
