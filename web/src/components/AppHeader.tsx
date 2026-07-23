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
  UserCheck,
  UserRoundCog,
  X,
  Moon,
  Sun,
  Search,
  TrendingUp,
  Coins,
  Award,
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
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/attendance", label: "Presensi", icon: ScanFace },
  { href: "/history", label: "Laporan Kehadiran", icon: FileImage },
  { href: "/cuti", label: "Cuti", icon: CalendarDays },
  { href: "/pengumuman", label: "Info", icon: Megaphone },
  { href: "/profile", label: "Profil", icon: UserRound },
  {
    href: "/salary",
    label: "Gaji & Slip Payroll",
    icon: Coins,
  },
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
  {
    href: "/admin/audit-logs",
    label: "Log Audit",
    icon: History,
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
    href: "/admin/positions",
    label: "Jabatan",
    icon: UserRoundCog,
  },
  {
    href: "/admin/units",
    label: "Posisi",
    icon: Building2,
  },
];

const operationalMenus = [
  {
    href: "/admin/employees",
    label: "Registrasi Karyawan",
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
  {
    href: "/admin/profile",
    label: "Profil Saya",
    icon: UserCheck,
  },
  {
    href: "/admin/salary",
    label: "Gaji & Slip Payroll",
    icon: Coins,
  },
  {
    href: "#",
    label: "Penghargaan Karyawan (Segera Hadir)",
    icon: Award,
    isComingSoon: true,
  },
  {
    href: "/admin/hr-analytics",
    label: "Analitik HR",
    icon: TrendingUp,
  },
];

const employeeSuggestions = [
  {
    href: "/home",
    label: "Home",
    icon: Home,
    category: "Menu Utama",
    keywords: ["home", "beranda", "dashboard", "utama"],
  },
  {
    href: "/attendance",
    label: "Attendance / Absen",
    icon: ScanFace,
    category: "Menu Utama",
    keywords: [
      "attendance",
      "absen",
      "kehadiran",
      "scan wajah",
      "face recognition",
      "masuk",
      "pulang",
    ],
  },
  {
    href: "/history",
    label: "History Kehadiran",
    icon: History,
    category: "Menu Utama",
    keywords: ["history", "riwayat", "kehadiran", "presensi", "log", "daftar"],
  },
  {
    href: "/cuti",
    label: "Pengajuan Cuti / Izin",
    icon: CalendarDays,
    category: "Menu Utama",
    keywords: [
      "cuti",
      "izin",
      "sakit",
      "pengajuan",
      "leave",
      "sakit",
      "permohonan",
    ],
  },
  {
    href: "/salary",
    label: "Payroll & Kinerja",
    icon: Coins,
    category: "Menu Utama",
    keywords: [
      "salary",
      "gaji",
      "payroll",
      "slip",
      "kinerja",
      "poin",
      "rewards",
      "riwayat",
      "pemasukan",
      "bonus",
    ],
  },
  {
    href: "/pengumuman",
    label: "Info Pengumuman",
    icon: Megaphone,
    category: "Menu Utama",
    keywords: [
      "pengumuman",
      "info",
      "informasi",
      "megafon",
      "announcement",
      "kabar",
    ],
  },
  {
    href: "/profile",
    label: "Profile Saya",
    icon: UserRound,
    category: "Menu Utama",
    keywords: [
      "profile",
      "profil",
      "akun",
      "saya",
      "user",
      "pengaturan",
      "data diri",
    ],
  },
];

const adminSuggestions = [
  // Menu Utama
  {
    href: "/admin/dashboard",
    label: "Dashboard Admin",
    icon: LayoutDashboard,
    category: "Menu Utama",
    keywords: ["dashboard", "beranda", "ringkasan", "summary", "admin"],
  },
  {
    href: "/admin/monitor_perusahaan",
    label: "Monitor Perusahaan",
    icon: BarChart3,
    category: "Menu Utama",
    keywords: [
      "monitor perusahaan",
      "pemantauan",
      "kehadiran real-time",
      "karyawan",
      "live",
      "pantau",
    ],
  },
  {
    href: "/admin/hr-analytics",
    label: "Analitik HR",
    icon: TrendingUp,
    category: "Menu Utama",
    keywords: [
      "analitik hr",
      "hr analytics",
      "grafik",
      "prediksi",
      "kedisiplinan",
      "rekap kontrak",
      "kontrak",
      "magang",
      "pkl",
    ],
  },
  {
    href: "/admin/pengumuman",
    label: "Pengumuman Admin",
    icon: Megaphone,
    category: "Menu Utama",
    keywords: [
      "pengumuman",
      "info",
      "buat pengumuman",
      "broadcast",
      "pengumuman baru",
    ],
  },

  // Master Data
  {
    href: "/admin/shifts",
    label: "Shift Kerja",
    icon: Clock3,
    category: "Master Data",
    keywords: [
      "shift",
      "jadwal",
      "piket",
      "jam kerja",
      "waktu",
      "pagi",
      "siang",
      "malam",
    ],
  },
  {
    href: "/admin/work-schedules",
    label: "Jam Kerja Schedule",
    icon: CalendarClock,
    category: "Master Data",
    keywords: [
      "jam kerja",
      "jadwal kerja",
      "schedule",
      "work schedule",
      "hari kerja",
    ],
  },
  {
    href: "/admin/kantor",
    label: "Kantor & Lokasi",
    icon: Building2,
    category: "Master Data",
    keywords: [
      "kantor",
      "lokasi",
      "gps",
      "koordinat",
      "cabang",
      "alamat",
      "radius",
    ],
  },
  {
    href: "/admin/departments",
    label: "Divisi / Department",
    icon: Network,
    category: "Master Data",
    keywords: ["divisi", "department", "departemen", "bagian", "struktur"],
  },
  {
    href: "/admin/positions",
    label: "Jabatan Pekerjaan",
    icon: UserRoundCog,
    category: "Master Data",
    keywords: ["jabatan", "role", "pangkat", "job", "title"],
  },
  {
    href: "/admin/units",
    label: "Posisi Kerja",
    icon: Building2,
    category: "Master Data",
    keywords: ["posisi", "posisi kerja", "unit", "unit kerja", "bagian", "kelompok", "cabang"],
  },

  // Operasional
  {
    href: "/admin/employees",
    label: "Register Employee",
    icon: UserPlus,
    category: "Operasional",
    keywords: [
      "register employee",
      "tambah karyawan",
      "daftar karyawan baru",
      "pendaftaran",
      "buat akun",
    ],
  },
  {
    href: "/admin/laporan-kehadiran",
    label: "Laporan Kehadiran",
    icon: FileImage,
    category: "Operasional",
    keywords: [
      "laporan kehadiran",
      "rekap",
      "excel",
      "kehadiran",
      "presensi",
      "export",
    ],
  },
  {
    href: "/admin/cuti",
    label: "Laporan & Approval Cuti",
    icon: CalendarDays,
    category: "Operasional",
    keywords: [
      "laporan cuti",
      "persetujuan cuti",
      "approval cuti",
      "pengajuan",
      "izin",
    ],
  },
  {
    href: "/admin/salary",
    label: "Gaji & Payroll Admin",
    icon: Coins,
    category: "Operasional",
    keywords: [
      "salary",
      "gaji",
      "payroll",
      "slip",
      "potongan",
      "pph",
      "slip gaji",
      "massal",
      "kalkulasi",
    ],
  },
  {
    href: "/admin/rewards",
    label: "Rewards Karyawan",
    icon: Award,
    category: "Operasional",
    keywords: [
      "reward",
      "rewards",
      "poin",
      "leaderboard",
      "eom",
      "employee of the month",
      "ranking",
      "penghargaan",
      "apresiasi",
    ],
  },
  {
    href: "/admin/profil-karyawan",
    label: "Profil Karyawan",
    icon: UserRound,
    category: "Operasional",
    keywords: [
      "profil karyawan",
      "daftar karyawan",
      "data karyawan",
      "edit karyawan",
      "list user",
    ],
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
  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [isBellMenuOpen, setIsBellMenuOpen] = useState(false);
  const [companyLogo, setCompanyLogo] = useState<string>("/images/creativemu-logo/creativemu.png");
  const [companyName, setCompanyName] = useState<string>("Creativemu");

  useEffect(() => {
    function updateLogo() {
      const cachedLogo = localStorage.getItem("faceattend_company_logo");
      if (cachedLogo) {
        setCompanyLogo(cachedLogo);
      }
      const cachedName = localStorage.getItem("faceattend_company_name");
      if (cachedName) {
        setCompanyName(cachedName);
      }
    }
    updateLogo();

    async function fetchCompanyProfile() {
      try {
        const res = await fetch("/api/offices/active", { cache: "no-store" });
        const data = await res.json();
        if (data.success && data.offices && data.offices.length > 0) {
          const office = data.offices[0];
          const logo = office.logo_url || office.logoUrl;
          const name = office.name;
          if (logo) {
            setCompanyLogo(logo);
            localStorage.setItem("faceattend_company_logo", logo);
          }
          if (name) {
            setCompanyName(name);
            localStorage.setItem("faceattend_company_name", name);
          }
        }
      } catch {
        // ignore
      }
    }

    void fetchCompanyProfile();

    const handleCustomEvent = () => {
      updateLogo();
      void fetchCompanyProfile();
    };

    window.addEventListener("company_profile_updated", handleCustomEvent);
    return () => {
      window.removeEventListener("company_profile_updated", handleCustomEvent);
    };
  }, []);

  // Draggable menu ordering states
  const [adminMenuOrder, setAdminMenuOrder] = useState<number[]>([0, 1, 2, 3]);
  const [masterDataMenuOrder, setMasterDataMenuOrder] = useState<number[]>([
    0, 1, 2, 3, 4, 5,
  ]);
  const [operationalMenuOrder, setOperationalMenuOrder] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);
  const [employeeNavOrder, setEmployeeNavOrder] = useState<number[]>([
    0, 1, 2, 3, 4, 5, 6,
  ]);

  const [draggedMenuId, setDraggedMenuId] = useState<{
    type: string;
    index: number;
  } | null>(null);

  // Load menu orders from localStorage on mount
  useEffect(() => {
    try {
      const storedAdmin = localStorage.getItem(
        "faceattend_sidebar_admin_order",
      );
      if (storedAdmin) {
        const parsed = JSON.parse(storedAdmin);
        if (Array.isArray(parsed) && parsed.length === adminMenus.length) {
          setAdminMenuOrder(parsed);
        } else {
          const defaults = adminMenus.map((_, i) => i);
          setAdminMenuOrder(defaults);
          localStorage.setItem(
            "faceattend_sidebar_admin_order",
            JSON.stringify(defaults),
          );
        }
      } else {
        const defaults = adminMenus.map((_, i) => i);
        localStorage.setItem(
          "faceattend_sidebar_admin_order",
          JSON.stringify(defaults),
        );
      }

      const storedMaster = localStorage.getItem(
        "faceattend_sidebar_master_order",
      );
      if (storedMaster) {
        const parsed = JSON.parse(storedMaster);
        if (Array.isArray(parsed) && parsed.length === masterDataMenus.length) {
          setMasterDataMenuOrder(parsed);
        } else {
          const defaults = masterDataMenus.map((_, i) => i);
          setMasterDataMenuOrder(defaults);
          localStorage.setItem(
            "faceattend_sidebar_master_order",
            JSON.stringify(defaults),
          );
        }
      } else {
        const defaults = masterDataMenus.map((_, i) => i);
        localStorage.setItem(
          "faceattend_sidebar_master_order",
          JSON.stringify(defaults),
        );
      }

      const storedOp = localStorage.getItem("faceattend_sidebar_op_order");
      if (storedOp) {
        const parsed = JSON.parse(storedOp);
        if (
          Array.isArray(parsed) &&
          parsed.length === operationalMenus.length
        ) {
          setOperationalMenuOrder(parsed);
        } else {
          const defaults = operationalMenus.map((_, i) => i);
          setOperationalMenuOrder(defaults);
          localStorage.setItem(
            "faceattend_sidebar_op_order",
            JSON.stringify(defaults),
          );
        }
      } else {
        const defaults = operationalMenus.map((_, i) => i);
        localStorage.setItem(
          "faceattend_sidebar_op_order",
          JSON.stringify(defaults),
        );
      }

      const storedEmp = localStorage.getItem("faceattend_sidebar_emp_order");
      if (storedEmp) {
        const parsed = JSON.parse(storedEmp);
        if (Array.isArray(parsed) && parsed.length === employeeNav.length) {
          setEmployeeNavOrder(parsed);
        } else {
          const defaults = employeeNav.map((_, i) => i);
          setEmployeeNavOrder(defaults);
          localStorage.setItem(
            "faceattend_sidebar_emp_order",
            JSON.stringify(defaults),
          );
        }
      } else {
        const defaults = employeeNav.map((_, i) => i);
        localStorage.setItem(
          "faceattend_sidebar_emp_order",
          JSON.stringify(defaults),
        );
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleMenuDragStart = (type: string, index: number) => {
    setDraggedMenuId({ type, index });
  };

  const handleMenuDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMenuDrop = (type: string, targetIndex: number) => {
    if (!draggedMenuId || draggedMenuId.type !== type) return;
    const sourceIndex = draggedMenuId.index;
    if (sourceIndex === targetIndex) return;

    let orderList: number[] = [];
    let setOrderList: React.Dispatch<React.SetStateAction<number[]>>;

    if (type === "admin") {
      orderList = [...adminMenuOrder];
      setOrderList = setAdminMenuOrder;
    } else if (type === "masterData") {
      orderList = [...masterDataMenuOrder];
      setOrderList = setMasterDataMenuOrder;
    } else if (type === "operational") {
      orderList = [...operationalMenuOrder];
      setOrderList = setOperationalMenuOrder;
    } else if (type === "employee") {
      orderList = [...employeeNavOrder];
      setOrderList = setEmployeeNavOrder;
    } else {
      return;
    }

    const sourcePos = orderList.indexOf(sourceIndex);
    const targetPos = orderList.indexOf(targetIndex);
    orderList[sourcePos] = targetIndex;
    orderList[targetPos] = sourceIndex;
    setOrderList(orderList);

    // Save to localStorage
    try {
      if (type === "admin") {
        localStorage.setItem(
          "faceattend_sidebar_admin_order",
          JSON.stringify(orderList),
        );
      } else if (type === "masterData") {
        localStorage.setItem(
          "faceattend_sidebar_master_order",
          JSON.stringify(orderList),
        );
      } else if (type === "operational") {
        localStorage.setItem(
          "faceattend_sidebar_op_order",
          JSON.stringify(orderList),
        );
      } else if (type === "employee") {
        localStorage.setItem(
          "faceattend_sidebar_emp_order",
          JSON.stringify(orderList),
        );
      }
    } catch (e) {
      console.error(e);
    }

    setDraggedMenuId(null);
  };
  const [attendanceNotifications, setAttendanceNotifications] = useState<any[]>(
    [],
  );
  const [employeeNotifications, setEmployeeNotifications] = useState<any[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [employeeNotifAuthBlocked, setEmployeeNotifAuthBlocked] =
    useState(false);
  const bellMenuRef = useRef<HTMLDivElement | null>(null);
  const employeeBellMenuRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    setEmployeeNotifAuthBlocked(false);
  }, [isAdmin]);

  useEffect(() => {
    if (!employeeNotifAuthBlocked) return;

    const retryTimer = window.setTimeout(() => {
      setEmployeeNotifAuthBlocked(false);
    }, 10000);

    return () => {
      window.clearTimeout(retryTimer);
    };
  }, [employeeNotifAuthBlocked]);

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
    const updated = [
      trimmed,
      ...searchHistory.filter((q) => q !== trimmed),
    ].slice(0, 8);
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

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    isMobile = false,
  ) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev < filteredHistory.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredHistory.length - 1,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      let targetQuery = searchQuery;
      if (
        activeSuggestionIndex >= 0 &&
        activeSuggestionIndex < filteredHistory.length
      ) {
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
    return attendanceNotifications.filter(
      (notif) => !readNotifIds.includes(notif.id),
    );
  }, [attendanceNotifications, readNotifIds]);

  useEffect(() => {
    async function loadAdminNotifications() {
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

    async function loadEmployeeNotifications() {
      try {
        const response = await fetch("/api/notifications", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          setEmployeeNotifAuthBlocked(true);
          setEmployeeNotifications([]);
          setNotificationCount(0);
          return;
        }

        const result = await response.json();
        if (response.ok && Array.isArray(result.notifications)) {
          setEmployeeNotifications(result.notifications);

          const unreadCount = Number(result?.stats?.unread || 0);

          setNotificationCount(
            Number.isFinite(unreadCount)
              ? unreadCount
              : result.notifications.filter(
                (notif: { isRead?: boolean; status?: string }) =>
                  !(notif?.isRead || notif?.status === "read"),
              ).length,
          );

          setEmployeeNotifAuthBlocked(false);
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (isAdmin) {
      void loadAdminNotifications();
    } else {
      void loadEmployeeNotifications();
    }
  }, [isAdmin, isBellMenuOpen]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (
        bellMenuRef.current &&
        !bellMenuRef.current.contains(event.target as Node)
      ) {
        setIsBellMenuOpen(false);
      }
      if (
        employeeBellMenuRef.current &&
        !employeeBellMenuRef.current.contains(event.target as Node)
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
        if (!isAdmin && employeeNotifAuthBlocked) {
          if (isMounted) setNotificationCount(0);
          return;
        }

        const endpoint = isAdmin
          ? "/api/admin/notifications"
          : "/api/notifications";

        const response = await fetch(endpoint, {
          method: "GET",
          cache: "no-store",
        });

        if (!isAdmin && (response.status === 401 || response.status === 403)) {
          if (isMounted) {
            setEmployeeNotifAuthBlocked(true);
            setNotificationCount(0);
          }
          return;
        }

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
  }, [isAdmin, employeeNotifAuthBlocked]);

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
      window.localStorage.removeItem("faceattend_read_announcement_id");
      window.sessionStorage.clear();
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b px-3.5 py-2.5 md:px-10 md:py-4 backdrop-blur-2xl transition-all duration-300 lg:px-16 ${hasScrolled
          ? "border-blue-100/80 bg-white/95 dark:border-[#21262d] dark:bg-[#161b22]/95 shadow-lg shadow-slate-300/30 dark:shadow-black/20"
          : "border-white/60 bg-white/90 dark:border-[#21262d]/60 dark:bg-[#161b22]/90 shadow-sm shadow-slate-200/40 dark:shadow-none"
          }`}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div
            aria-hidden="true"
            className="absolute right-2 sm:right-16 top-1/2 h-48 w-48 sm:h-64 sm:w-64 -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.10] sm:opacity-[0.12] blur-[0.5px] pointer-events-none"
            style={{
              backgroundImage: `url('${companyLogo}')`,
            }}
          />
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-2 md:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="flex h-10 w-10 md:h-12 md:w-12 shrink-0 items-center justify-center rounded-xl md:rounded-2xl bg-[#eaf1ff] text-[#123c8c] shadow-lg shadow-slate-200/70 ring-1 ring-blue-100 transition hover:bg-blue-50 active:scale-[0.96]"
              aria-label="Buka menu"
            >
              <Menu
                size={20}
                className="md:w-[25px] md:h-[25px]"
                strokeWidth={3}
              />
            </button>

            <div className="min-w-0">
              <h1 className="mt-0.5 text-sm sm:text-base md:text-2xl lg:text-3xl font-black tracking-tight text-slate-950 leading-tight truncate max-w-[56vw] sm:max-w-[62vw] md:max-w-[400px] lg:max-w-none">
                {title}
              </h1>

            </div>
          </div>

          {/* Quick Search Bar (Desktop) */}
          <div
            ref={searchContainerRef}
            className="relative hidden lg:block flex-1 min-w-[120px] max-w-xs lg:max-w-md xl:max-w-xl mx-4 z-50"
          >
            <div className="relative flex items-center">
              <Search
                className={`absolute left-4 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => handleSearchKeyDown(e, false)}
                placeholder="Cari data..."
                className={`w-full rounded-2xl py-2.5 pl-11 pr-12 text-sm font-semibold border outline-none transition-all duration-200 ${theme === "dark"
                  ? "bg-[#21262d]/50 border-[#30363d] text-slate-100 placeholder-slate-500 focus:bg-[#161b22] focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                  : "bg-[#f6f8ff] border-blue-100 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#123c8c] focus:ring-1 focus:ring-[#123c8c]"
                  }`}
              />
              <button
                type="button"
                onClick={() => triggerSearch(searchQuery)}
                className={`absolute right-3 p-1.5 rounded-xl transition ${theme === "dark"
                  ? "text-slate-400 hover:text-[#58a6ff] hover:bg-[#30363d]"
                  : "text-slate-500 hover:text-[#123c8c] hover:bg-blue-50"
                  }`}
                aria-label="Cari"
              >
                <Search size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Suggestions Dropdown */}
            {isSearchFocused && (
              <div
                className={`absolute left-0 right-0 mt-2 max-h-[300px] overflow-y-auto rounded-2xl border p-2 shadow-2xl transition-all duration-200 ${theme === "dark"
                  ? "border-[#30363d] bg-[#161b22] shadow-black/40"
                  : "border-blue-100 bg-white shadow-slate-300/40"
                  }`}
              >
                <div
                  className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-400"
                    }`}
                >
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
                            ? theme === "dark"
                              ? "bg-[#1f6feb] text-white"
                              : "bg-[#123c8c] text-white shadow-md shadow-blue-900/10"
                            : theme === "dark"
                              ? "text-slate-300 hover:bg-[#21262d] hover:text-[#58a6ff]"
                              : "text-slate-600 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
                            }`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setSearchQuery(item);
                            triggerSearch(item);
                            setIsSearchFocused(false);
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Clock3
                              size={16}
                              strokeWidth={2.5}
                              className="shrink-0 opacity-60"
                            />
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
                              ? "text-white/80 hover:text-white hover:bg-white/10"
                              : theme === "dark"
                                ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                : "text-slate-400 hover:text-red-600 hover:bg-red-50"
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

          <div className="flex shrink-0 items-center justify-end gap-1.5 md:gap-3">
            {/* Mobile Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsMobileSearchOpen(true)}
              className={`flex lg:hidden h-10 w-10 items-center justify-center rounded-xl shadow-lg ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark"
                ? "bg-[#21262d] text-[#58a6ff] ring-[#30363d] shadow-black/20"
                : "bg-[#eaf1ff] text-[#123c8c] ring-blue-100 shadow-slate-200/70 hover:bg-blue-50"
                }`}
              aria-label="Cari menu"
            >
              <Search size={16} strokeWidth={2.5} />
            </button>

            {/* Header Theme Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl shadow-lg ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark" ? "bg-[#21262d] text-[#58a6ff] ring-[#30363d] shadow-black/20" : "bg-[#eaf1ff] text-[#123c8c] ring-blue-100 shadow-slate-200/70 hover:bg-blue-50"}`}
              title={
                theme === "light"
                  ? "Aktifkan Mode Gelap"
                  : "Aktifkan Mode Terang"
              }
            >
              {theme === "light" ? (
                <Moon
                  size={16}
                  className="md:w-[20px] md:h-[20px]"
                  strokeWidth={2.5}
                />
              ) : (
                <Sun
                  size={16}
                  className="md:w-[20px] md:h-[20px]"
                  strokeWidth={2.5}
                />
              )}
            </button>

            <a
              href={WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi via WhatsApp"
              className={`relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl shadow-sm ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark" ? "bg-[#21262d] text-[#3fb950] ring-[#30363d] shadow-black/20" : "bg-[#ecfff5] text-[#00a884] ring-[#baf7dc] hover:bg-[#dcfce7]"}`}
            >
              <PhoneCall className="h-4 w-4 md:h-5 md:w-5" strokeWidth={2.7} />
            </a>

            {isAdmin ? (
              <div ref={bellMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsBellMenuOpen(!isBellMenuOpen)}
                  className={`relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl md:rounded-2xl shadow-lg ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark" ? "bg-[#21262d] text-[#58a6ff] ring-[#30363d] shadow-black/20" : "bg-[#eaf1ff] text-[#123c8c] ring-blue-100 shadow-slate-200/70 hover:bg-blue-50"}`}
                  aria-label="Notifications"
                >
                  <Bell
                    size={18}
                    className="md:w-[22px] md:h-[22px]"
                    strokeWidth={2.5}
                  />
                  {unreadNotifications.length > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 md:h-5 md:min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] md:text-[10px] font-black text-white">
                      {unreadNotifications.length}
                    </span>
                  )}
                </button>

                {isBellMenuOpen && (
                  <div
                    className={`absolute right-0 top-12 md:top-14 z-50 w-[calc(100vw-2rem)] max-w-sm sm:w-84 md:w-90 rounded-2xl border p-4 shadow-2xl ${theme === "dark" ? "border-[#30363d] bg-[#161b22] shadow-black/40" : "border-blue-100 bg-white shadow-slate-300/40"}`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c] dark:text-[#58a6ff]">
                      Pemberitahuan Admin
                    </p>

                    {attendanceNotifications.length === 0 ? (
                      <p className="mt-3 text-sm font-semibold text-slate-400">
                        Tidak ada notifikasi baru.
                      </p>
                    ) : (
                      <>
                        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
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
                                    localStorage.setItem(
                                      "read_notification_ids",
                                      JSON.stringify(nextIds),
                                    );
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
                                  <p className="text-xs font-black text-[#123c8c]">
                                    {notif.employeeName}
                                  </p>
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
                                <p className="mt-1 text-xs font-semibold text-slate-600 leading-snug">
                                  {notif.message}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                                  {new Date(
                                    notif.happenedAt,
                                  ).toLocaleTimeString("id-ID", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-[#30363d] pt-2.5 px-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsBellMenuOpen(false);
                              router.push("/admin/notifikasi");
                            }}
                            className="shrink-0 text-[11px] font-black text-[#123c8c] dark:text-[#58a6ff] hover:opacity-80 cursor-pointer"
                          >
                            Lihat semua notifikasi
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const allIds = attendanceNotifications.map((n) => n.id);
                              setReadNotifIds(allIds);
                              localStorage.setItem("read_notification_ids", JSON.stringify(allIds));
                            }}
                            className="shrink-0 text-[11px] font-black text-[#123c8c] dark:text-[#58a6ff] hover:opacity-80 cursor-pointer"
                          >
                            Tandai semua dibaca
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div ref={employeeBellMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsBellMenuOpen(!isBellMenuOpen)}
                  className={`relative flex h-10 w-10 md:h-12 md:w-auto md:px-4 items-center justify-center gap-2 rounded-xl md:rounded-2xl shadow-lg ring-1 transition hover:scale-[1.05] active:scale-[0.96] ${theme === "dark" ? "bg-[#21262d] text-[#58a6ff] ring-[#30363d] shadow-black/20" : "bg-[#eaf1ff] text-[#123c8c] ring-blue-100 shadow-slate-200/70 hover:bg-blue-50"}`}
                  aria-label="Notifications"
                >
                  <Bell
                    size={16}
                    className="md:w-[20px] md:h-[20px]"
                    strokeWidth={2.7}
                  />
                  {notificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-4 min-w-4 md:h-5 md:min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[8px] md:text-[10px] font-black text-white">
                      {notificationCount}
                    </span>
                  )}
                  <span className="hidden lg:inline font-black text-sm">
                    Notifikasi
                  </span>
                </button>

                {isBellMenuOpen && (
                  <div
                    className={`absolute right-0 top-14 z-50 w-[calc(100vw-2rem)] max-w-sm sm:w-84 md:w-90 rounded-2xl border p-4 shadow-2xl ${theme === "dark" ? "border-[#30363d] bg-[#161b22] shadow-black/40" : "border-blue-100 bg-white shadow-slate-300/40"}`}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c] dark:text-[#58a6ff]">
                      Notifikasi Karyawan
                    </p>

                    {employeeNotifications.length === 0 ? (
                      <p className="mt-3 text-sm font-semibold text-slate-400">
                        Tidak ada notifikasi baru.
                      </p>
                    ) : (
                      <>
                        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto pr-1">
                          {employeeNotifications.slice(0, 5).map((notif) => {
                            const isRead =
                              notif.status === "read" || notif.isRead;
                            return (
                              <div
                                key={notif.id}
                                onClick={async (e) => {
                                  e.preventDefault();
                                  e.stopPropagation();

                                  if (!isRead) {
                                    await fetch(`/api/notifications`, {
                                      method: "PATCH",
                                      headers: {
                                        "Content-Type": "application/json",
                                      },
                                      body: JSON.stringify({ id: notif.id }),
                                    }).catch(console.error);

                                    setEmployeeNotifications((prev) =>
                                      prev.map((n) =>
                                        n.id === notif.id
                                          ? {
                                            ...n,
                                            isRead: true,
                                            status: "read",
                                          }
                                          : n,
                                      ),
                                    );
                                    setNotificationCount((c) =>
                                      Math.max(0, c - 1),
                                    );
                                  }

                                  setIsBellMenuOpen(false);
                                  router.push(notif.href || "/notifikasi");
                                }}
                                className={`rounded-xl p-3 border transition text-left cursor-pointer ${!isRead
                                  ? "bg-blue-50/50 hover:bg-blue-50 border-blue-100/50 text-slate-900 dark:text-white"
                                  : "bg-slate-50/50 hover:bg-slate-50 border-slate-100/50 text-slate-700 dark:text-slate-300"
                                  }`}
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <p className="text-xs font-black text-[#123c8c] dark:text-blue-400">
                                    {notif.title}
                                  </p>
                                  {!isRead && (
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                  )}
                                </div>
                                <p className="mt-1 text-[11px] font-semibold text-slate-500 leading-snug">
                                  {notif.message}
                                </p>
                                <p className="mt-1 text-[9px] text-slate-400">
                                  {notif.dateText || "Baru saja"}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-[#30363d] pt-2.5 px-0.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setIsBellMenuOpen(false);
                              router.push("/notifikasi");
                            }}
                            className="shrink-0 text-[11px] font-black text-[#123c8c] dark:text-[#58a6ff] hover:opacity-80 cursor-pointer"
                          >
                            Lihat semua notifikasi
                          </button>

                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setEmployeeNotifications((prev) =>
                                prev.map((n) => ({ ...n, status: "read", isRead: true }))
                              );
                              setNotificationCount(0);
                              await fetch(`/api/notifications`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ markAll: true }),
                              }).catch(console.error);
                            }}
                            className="shrink-0 text-[11px] font-black text-[#123c8c] dark:text-[#58a6ff] hover:opacity-80 cursor-pointer"
                          >
                            Tandai semua dibaca
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {rightLabel ? (
              <span className="hidden rounded-2xl bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm ring-1 ring-blue-100 md:inline-flex">
                {rightLabel}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <div className="h-[70px] md:h-[88px]" />

      {/* Backdrop: always rendered, animated via opacity */}
      <button
        type="button"
        aria-label="Tutup menu"
        onClick={() => setIsSidebarOpen(false)}
        className={`sidebar-backdrop ${isSidebarOpen ? "open" : ""}`}
      />

      <aside
        className={`sidebar-drawer ${isSidebarOpen ? "open" : ""} fixed left-0 top-0 z-[1001] h-dvh w-[82vw] max-w-80 border-r border-indigo-100/70 dark:border-[#21262d] bg-[#f4f2ff] dark:bg-[#161b22] shadow-2xl shadow-slate-950/20`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-blue-50 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white keep-white p-2 shadow-lg shadow-slate-300/50 ring-1 ring-blue-100 dark:ring-transparent">
                <Image
                  src={companyLogo}
                  alt="Creativemu Logo"
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#123c8c] dark:text-blue-400">
                  {companyName}
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950 dark:text-white">
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
                  {adminMenuOrder.map((menuIdx) => {
                    const menu = adminMenus[menuIdx];
                    if (!menu) return null;
                    const Icon = menu.icon;
                    const active = isActivePath(pathname, menu.href);

                    return (
                      <button
                        key={menu.href}
                        type="button"
                        draggable
                        onDragStart={() =>
                          handleMenuDragStart("admin", menuIdx)
                        }
                        onDragOver={handleMenuDragOver}
                        onDrop={() => handleMenuDrop("admin", menuIdx)}
                        onClick={() => handleNavigate(menu.href)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition cursor-grab active:cursor-grabbing ${active
                          ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-[#eaf1ff] dark:hover:bg-slate-800 hover:text-[#123c8c] dark:hover:text-blue-400"
                          }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {menu.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="mt-6">
                  <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8ff] dark:bg-slate-900/40 px-4 py-3 text-sm font-black text-[#123c8c] dark:text-blue-400">
                    <Settings size={18} strokeWidth={2.5} />
                    Master Data
                  </div>

                  <div className="mt-2 space-y-1 border-l-2 border-blue-100 dark:border-slate-800 pl-4">
                    {masterDataMenus.map((menu) => {
                      const Icon = menu.icon;
                      const active = isActivePath(pathname, menu.href);

                      return (
                        <button
                          key={menu.href}
                          type="button"
                          onClick={() => handleNavigate(menu.href)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-bold transition ${active
                            ? "bg-[#eaf1ff] dark:bg-blue-950/40 text-[#123c8c] dark:text-blue-400"
                            : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-[#123c8c] dark:hover:text-blue-400"
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
                    {operationalMenuOrder.map((menuIdx) => {
                      const menu = operationalMenus[menuIdx];
                      if (!menu) return null;
                      const Icon = menu.icon;
                      const active = isActivePath(pathname, menu.href);
                      const isComingSoon = (menu as any).isComingSoon;

                      return (
                        <button
                          key={menu.label}
                          type="button"
                          draggable={!isComingSoon}
                          onDragStart={() =>
                            handleMenuDragStart("operational", menuIdx)
                          }
                          onDragOver={handleMenuDragOver}
                          onDrop={() => handleMenuDrop("operational", menuIdx)}
                          disabled={isComingSoon}
                          onClick={() => handleNavigate(menu.href)}
                          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition cursor-grab active:cursor-grabbing ${active
                            ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                            : isComingSoon
                              ? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50"
                              : "text-slate-600 dark:text-slate-400 hover:bg-[#eaf1ff] dark:hover:bg-slate-800 hover:text-[#123c8c] dark:hover:text-blue-400"
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
                  {employeeNavOrder.map((menuIdx) => {
                    const menu = employeeNav[menuIdx];
                    if (!menu) return null;
                    const Icon = menu.icon;
                    const active = isActivePath(pathname, menu.href);
                    const isComingSoon = (menu as any).isComingSoon;

                    return (
                      <button
                        key={menu.label}
                        type="button"
                        draggable={!isComingSoon}
                        onDragStart={() =>
                          handleMenuDragStart("employee", menuIdx)
                        }
                        onDragOver={handleMenuDragOver}
                        onDrop={() => handleMenuDrop("employee", menuIdx)}
                        disabled={isComingSoon}
                        onClick={() => handleNavigate(menu.href)}
                        className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-black transition cursor-grab active:cursor-grabbing ${active
                          ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                          : isComingSoon
                            ? "text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-50"
                            : "text-slate-600 dark:text-slate-400 hover:bg-[#eaf1ff] dark:hover:bg-slate-800 hover:text-[#123c8c] dark:hover:text-blue-400"
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

          <div className="border-t border-blue-50 dark:border-slate-800/80 p-4 space-y-2">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.98] dark:bg-rose-950/20 dark:text-rose-400"
            >
              <LogOut size={18} strokeWidth={2.5} />
              Keluar
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Search Modal/Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-[1100] flex flex-col bg-slate-900/40 dark:bg-black/60 backdrop-blur-md">
          <div
            className={`flex flex-col h-full max-h-[85vh] w-full rounded-b-3xl border-b p-5 shadow-2xl transition-all duration-300 ${theme === "dark"
              ? "border-[#30363d] bg-[#161b22]"
              : "border-blue-100 bg-white"
              }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1 flex items-center">
                <Search
                  className={`absolute left-4 h-4 w-4 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}
                />
                <input
                  ref={mobileSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => handleSearchKeyDown(e, true)}
                  placeholder="Cari data..."
                  className={`w-full rounded-2xl py-2.5 pl-11 pr-12 text-sm font-semibold border outline-none transition-all duration-200 ${theme === "dark"
                    ? "bg-[#21262d] border-[#30363d] text-slate-100 placeholder-slate-500 focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff]"
                    : "bg-[#f6f8ff] border-blue-100 text-slate-900 placeholder-slate-400 focus:bg-white focus:border-[#123c8c] focus:ring-1 focus:ring-[#123c8c]"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    triggerSearch(searchQuery);
                    setIsMobileSearchOpen(false);
                  }}
                  className={`absolute right-3 p-1.5 rounded-xl transition ${theme === "dark"
                    ? "text-slate-400 hover:text-[#58a6ff] hover:bg-[#30363d]"
                    : "text-slate-500 hover:text-[#123c8c] hover:bg-blue-50"
                    }`}
                  aria-label="Cari"
                >
                  <Search size={16} strokeWidth={2.5} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition active:scale-[0.96] ${theme === "dark"
                  ? "bg-[#21262d] text-slate-300 hover:bg-[#30363d]"
                  : "bg-[#eaf1ff] text-[#123c8c] hover:bg-blue-100"
                  }`}
                aria-label="Tutup pencarian"
              >
                <X size={20} strokeWidth={2.8} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              <div
                className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider ${theme === "dark" ? "text-slate-500" : "text-slate-400"
                  }`}
              >
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
                          ? theme === "dark"
                            ? "bg-[#1f6feb] text-white"
                            : "bg-[#123c8c] text-white shadow-md shadow-blue-900/10"
                          : theme === "dark"
                            ? "bg-[#21262d]/40 text-slate-300 hover:bg-[#21262d]"
                            : "bg-[#f6f8ff] text-slate-600 hover:bg-[#eaf1ff]"
                          }`}
                        onClick={() => {
                          setSearchQuery(item);
                          triggerSearch(item);
                          setIsMobileSearchOpen(false);
                        }}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <Clock3
                            size={18}
                            strokeWidth={2.5}
                            className="shrink-0 opacity-60"
                          />
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
                            ? "text-white/80 hover:text-white hover:bg-white/10"
                            : theme === "dark"
                              ? "text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                              : "text-slate-400 hover:text-red-600 hover:bg-red-50"
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
          <div
            className="flex-1"
            onClick={() => setIsMobileSearchOpen(false)}
          />
        </div>
      )}
    </>
  );
}
