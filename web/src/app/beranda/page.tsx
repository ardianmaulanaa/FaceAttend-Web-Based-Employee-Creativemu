"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  Bell,
  CalendarDays,
  PhoneCall,
  FileText,
  History,
  Megaphone,
  ScanFace,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { AppCard } from "@/components/ui/AppUI";
import { useSiteLogo } from "@/hooks/useSiteLogo";

type AttendanceToday = {
  checkIn: string;
  checkOut: string;
  status: string;
  description: string;
  schedule?: string;
};

type UserRelation = {
  id?: string;
  name: string;
} | null;

type CurrentUser = {
  id?: string;
  name: string;
  email?: string;
  role?: string;
  profile_photo?: string | null;
  position?: UserRelation;
  department?: UserRelation;
  jabatan?: UserRelation;
  shift?: UserRelation;
};

type Announcement = {
  id: string;
  title: string;
  content?: string;
  document_url?: string | null;
  document_name?: string | null;
  documentUrl?: string | null;
  documentName?: string | null;
  status?: string;
  created_at?: string;
  createdAt?: string;
};

const READ_ANNOUNCEMENT_KEY = "presensi_read_announcement_id";
const WHATSAPP_LINK = "https://wa.me/6281234567890";

const defaultUser: CurrentUser = {
  name: "",
  role: "",
  profile_photo: null,
  position: null,
  department: null,
  jabatan: null,
  shift: null,
};

const defaultAttendance: AttendanceToday = {
  checkIn: "--:--",
  checkOut: "--:--",
  status: "Menunggu",
  description: "Menunggu presensi",
  schedule: "",
};

const quickMenus = [
  {
    href: "/presensi",
    label: "Presensi",
    icon: ScanFace,
  },
  {
    href: "/tukar-shift",
    label: "Tukar Shift",
    icon: ArrowLeftRight,
  },
  {
    href: "/cuti",
    label: "Pengajuan Cuti",
    icon: CalendarDays,
  },
  {
    href: "/history",
    label: "Riwayat Presensi",
    icon: History,
  },
  {
    href: "/pengumuman",
    label: "Pengumuman",
    icon: Megaphone,
  },
  {
    href: "/profil",
    label: "Profil",
    icon: UserRound,
  },
];

function getFirstName(name: string) {
  return name.split(" ").filter(Boolean)[0] || name;
}

function getInitialName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeTime(value?: string) {
  if (!value || value === "--:--") return "--:--";
  return value.replace(".", ":");
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

async function getJson(url: string) {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (response.status === 401 || response.status === 403) {
      if (typeof window !== "undefined") {
        window.location.replace("/login?reason=expired&redirect=/beranda");
      }
      return null;
    }

    if (!response.ok) return null;

    return await readJsonResponse(response);
  } catch {
    return null;
  }
}

function HomeMotionStyles() {
  return (
    <style>{`
      @keyframes homeEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes homeCardEnter {
        0% {
          opacity: 0;
          transform: translateY(12px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes homeIconPop {
        0% {
          opacity: 0;
          transform: translateY(8px) scale(0.92);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes homeTextReveal {
        0% {
          opacity: 0;
          transform: translateY(10px);
          filter: blur(4px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }

      @keyframes homePulseDot {
        0%,
        100% {
          transform: scale(1);
          opacity: 1;
        }

        50% {
          transform: scale(1.22);
          opacity: 0.72;
        }
      }

      .home-enter {
        animation: homeEnter 340ms ease-out both;
      }

      .home-card-enter {
        opacity: 0;
        animation: homeCardEnter 340ms ease-out both;
      }

      .home-icon-pop {
        animation: homeIconPop 300ms ease-out both;
      }

      .home-text-reveal {
        animation: homeTextReveal 380ms ease-out both;
      }

      .home-pulse-dot {
        animation: homePulseDot 1.45s ease-in-out infinite;
      }

      .creativemu-blue-home [class*="bg-red-500"],
      .creativemu-blue-home [class*="bg-red-600"],
      .creativemu-blue-home [class*="bg-[#e50000]"] {
        background-color: #123c8c !important;
      }

      .creativemu-blue-home [class*="hover:bg-red-600"]:hover,
      .creativemu-blue-home [class*="hover:bg-red-700"]:hover,
      .creativemu-blue-home [class*="hover:bg-[#c90000]"]:hover {
        background-color: #0f3274 !important;
      }

      .creativemu-blue-home [class*="text-red-600"],
      .creativemu-blue-home [class*="text-red-700"] {
        color: #123c8c !important;
      }

      .creativemu-blue-home [class*="border-red-100"],
      .creativemu-blue-home [class*="ring-red-100"],
      .creativemu-blue-home [class*="ring-red-200"] {
        border-color: #dbeafe !important;
        --tw-ring-color: #dbeafe !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .home-enter,
        .home-card-enter,
        .home-icon-pop,
        .home-text-reveal,
        .home-pulse-dot {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
        }
      }
    `}</style>
  );
}

function ProfileAvatar({
  user,
  size = "mobile",
  variant = "light",
}: {
  user: CurrentUser;
  size?: "mobile" | "desktop";
  variant?: "light" | "blue";
}) {
  const sizeClass =
    size === "desktop" ? "h-24 w-24 text-2xl" : "h-12 w-12 text-sm";

  if (user.profile_photo) {
    return (
      <img
        key={user.profile_photo}
        src={user.profile_photo}
        alt={user.name || "Profil"}
        className={`home-icon-pop ${sizeClass} shrink-0 rounded-full object-cover ${
          size === "desktop" ? "ring-4 ring-white/70" : "ring-4 ring-white"
        }`}
      />
    );
  }

  return (
    <div
      className={`home-icon-pop ${sizeClass} flex shrink-0 items-center justify-center rounded-full font-black ${
        variant === "blue"
          ? "bg-white/15 text-white ring-4 ring-white/20"
          : "bg-[#eaf1ff] text-[#123c8c] ring-4 ring-white"
      }`}
    >
      {user.name ? getInitialName(user.name) : ""}
    </div>
  );
}

function NotificationHeaderButton({
  href = "/notifikasi",
  unread,
  unreadCount = 0,
  desktop = false,
  onClick,
}: {
  href?: string;
  unread: boolean;
  unreadCount?: number;
  desktop?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`home-icon-pop relative flex shrink-0 items-center justify-center rounded-2xl ring-1 transition hover:-translate-y-0.5 active:scale-[0.96] ${
        desktop ? "h-16 w-16" : "h-12 w-12"
      } ${
        desktop
          ? "bg-white/10 text-white/90 ring-white/20"
          : "bg-white text-[#123c8c] ring-blue-100"
      }`}
      aria-label="Notifikasi"
    >
      <Bell
        size={desktop ? 26 : 22}
        strokeWidth={2.4}
      />

      {unread ? (
        <span
          className={`absolute flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white ring-2 ring-white shadow-md ${
            desktop ? "-right-1 -top-1" : "-right-1 -top-1"
          }`}
        >
          {unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : "!"}
        </span>
      ) : null}
    </Link>
  );
}

function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi WhatsApp"
      className="home-icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-sm ring-1 ring-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-100 active:scale-[0.96]"
    >
      <PhoneCall size={24} strokeWidth={2.7} />
    </a>
  );
}

function RoleBadges({ items }: { items: Array<string | undefined | null> }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.filter(Boolean).map((item, index) => (
        <span
          key={item}
          className="home-card-enter rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20"
          style={{
            animationDelay: `${index * 55}ms`,
          }}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function QuickMenuGrid() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3">
      {quickMenus.map(({ href, label, icon: Icon }, index) => (
        <Link
          key={href}
          href={href}
          className="home-card-enter group flex flex-col items-center rounded-2xl p-1.5 text-center transition hover:-translate-y-0.5 active:scale-[0.98] md:border md:border-blue-100 md:bg-[#f8fbff] md:p-3 md:hover:bg-white md:hover:shadow-md md:hover:shadow-slate-200/60"
          style={{
            animationDelay: `${index * 40}ms`,
          }}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf1ff] transition group-hover:scale-105 md:h-13 md:w-13">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#123c8c] text-white shadow-sm transition group-hover:rotate-[-2deg] md:h-9.5 md:w-9.5">
              <Icon size={17} strokeWidth={2.6} />
            </div>
          </div>

          <p className="mt-1.5 text-[11px] font-black leading-tight text-slate-800 md:text-xs">
            {label}
          </p>
        </Link>
      ))}
    </div>
  );
}

function AttendanceButton({
  label,
  href,
  disabled,
  variant,
}: {
  label: string;
  href: string;
  disabled: boolean;
  variant: "primary" | "secondary";
}) {
  return (
    <Link
      href={disabled ? "#" : href}
      onClick={(event) => {
        if (disabled) event.preventDefault();
      }}
      className={`flex min-h-[38px] w-full flex-1 items-center justify-center rounded-xl px-3 py-1.5 text-xs font-black transition md:h-11 md:min-h-0 md:px-5 md:py-0 md:text-sm ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300"
          : variant === "primary"
            ? "bg-[#123c8c] text-white shadow-sm shadow-blue-900/20 hover:bg-[#0f3274] active:scale-[0.98]"
            : "border border-blue-100 bg-white text-[#123c8c] hover:bg-[#eaf1ff] active:scale-[0.98]"
      }`}
    >
      {label}
    </Link>
  );
}

function AnnouncementList({
  announcements,
  hasAnnouncement,
  onRead,
}: {
  announcements: Announcement[];
  hasAnnouncement: boolean;
  onRead: () => void;
}) {
  if (!hasAnnouncement) {
    return (
      <div className="home-card-enter rounded-3xl border border-dashed border-blue-100 bg-white px-5 py-6 text-center shadow-sm md:py-14">
        <p className="text-sm font-bold text-slate-400 md:text-base">
          Pengumuman Kosong
        </p>
      </div>
    );
  }

  const topAnnouncement = announcements[0];

  return (
    <Link
      href="/pengumuman"
      onClick={onRead}
      className="home-card-enter block min-w-0 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:bg-[#f8fbff] hover:shadow-xl hover:shadow-slate-200/60 active:scale-[0.99] md:p-5"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-100 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-amber-900 shadow-sm">
        <Megaphone size={14} className="text-amber-700" />
        Pengumuman Terbaru
      </div>

      <p className="line-clamp-2 break-words text-base font-black leading-6 text-slate-950 [overflow-wrap:anywhere] md:text-base">
        {topAnnouncement.title}
      </p>

      {topAnnouncement.content ? (
        <p className="mt-2 line-clamp-3 break-words text-sm font-semibold leading-6 text-slate-500 [overflow-wrap:anywhere] md:line-clamp-2">
          {topAnnouncement.content}
        </p>
      ) : null}

      {topAnnouncement.document_url || topAnnouncement.documentUrl ? (
        <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-2xl bg-[#eaf1ff] px-3 py-2 text-xs font-black text-[#123c8c]">
          <FileText size={14} strokeWidth={2.6} />
          <span className="truncate">
            {topAnnouncement.document_name ||
              topAnnouncement.documentName ||
              "Dokumen PDF"}
          </span>
        </div>
      ) : null}
    </Link>
  );
}

export default function HomePage() {
  const logoSrc = useSiteLogo();
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState<CurrentUser>(defaultUser);
  const [attendanceToday, setAttendanceToday] =
    useState<AttendanceToday>(defaultAttendance);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncementId, setReadAnnouncementId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    function updateTime() {
      const now = new Date();

      setCurrentTime(
        `${new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
          .format(now)
          .replace(".", ":")} WIB`,
      );

      setCurrentDate(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(now),
      );
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReadAnnouncementId(window.localStorage.getItem(READ_ANNOUNCEMENT_KEY));
    }
  }, []);

  useEffect(() => {
    async function loadData() {
      const [profileData, todayData, announcementData] = await Promise.all([
        getJson("/api/auth/me"),
        getJson("/api/attendance/today"),
        getJson("/api/announcements?audience=employee"),
      ]);

      const profile =
        profileData?.user || profileData?.data || profileData || {};
      const today = todayData || {};
      const list =
        announcementData?.announcements || announcementData?.data || [];

      setUser({
        id: profile.id,
        name: profile.name || "",
        email: profile.email,
        role: profile.role || "",
        profile_photo: profile.profile_photo || null,
        position: profile.position || null,
        department: profile.department || null,
        jabatan: profile.jabatan || null,
        shift: profile.shift || null,
      });

      setAttendanceToday({
        checkIn: normalizeTime(today.checkIn || "--:--"),
        checkOut: normalizeTime(today.checkOut || "--:--"),
        status: today.status || "Menunggu",
        description: today.description || "Menunggu presensi",
        schedule:
          today.schedule || today.workSchedule || today.shiftSchedule || "",
      });

      setAnnouncements(Array.isArray(list) ? list : []);
    }

    void loadData();
  }, []);

  const firstName = user.name ? getFirstName(user.name) : "";
  const hasAnnouncement = announcements.length > 0;
  const latestAnnouncementId = announcements[0]?.id || "";
  const hasUnreadAnnouncement =
    Boolean(latestAnnouncementId) &&
    latestAnnouncementId !== readAnnouncementId;

  const employeeTitle = useMemo(
    () => user.position?.name || user.department?.name || "",
    [user.position?.name, user.department?.name],
  );

  const mainRoleLabel = useMemo(
    () =>
      user.shift?.name || user.position?.name || user.department?.name || "",
    [user.shift?.name, user.position?.name, user.department?.name],
  );

  const workScheduleText = useMemo(() => {
    if (attendanceToday.schedule) {
      return `Jam kerja kamu pukul ${attendanceToday.schedule}`;
    }

    if (user.shift?.name) return `Shift kamu: ${user.shift.name}`;

    return "Jam kerja mengikuti shift yang terdaftar";
  }, [attendanceToday.schedule, user.shift?.name]);

  const hasCheckedIn = attendanceToday.checkIn !== "--:--";
  const hasCheckedOut = attendanceToday.checkOut !== "--:--";

  function markAnnouncementsAsRead() {
    if (!latestAnnouncementId || typeof window === "undefined") return;
    window.localStorage.setItem(READ_ANNOUNCEMENT_KEY, latestAnnouncementId);
    setReadAnnouncementId(latestAnnouncementId);
  }

  return (
    <MobileShell
      variant="employee"
      withBottomPadding={false}
      className="bg-white md:bg-[#f6f8ff]"
    >
      <HomeMotionStyles />

      <div className="min-h-dvh bg-white">
        <div className="hidden md:block">
          <AppHeader
            title="Beranda"
            rightLabel={mainRoleLabel || undefined}
            variant="employee"
          />
        </div>

        <main className="creativemu-blue-home min-h-dvh overflow-x-hidden bg-white text-slate-950 md:bg-gradient-to-br md:from-[#f6f8ff] md:via-white md:to-[#eef4ff] md:pb-16">
          <section
            className="home-enter bg-white md:hidden"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
            }}
          >
            <div className="mx-auto w-full max-w-7xl px-4 pt-3.5 pb-2">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="home-icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white p-1.5 ring-1 ring-blue-100">
                    <Image
                      src={logoSrc}
                      alt="Creativemu Logo"
                      width={40}
                      height={36}
                      unoptimized
                      className="h-full w-full object-contain"
                      priority
                    />
                  </div>

                  <ProfileAvatar user={user} />

                  <div className="min-w-0">
                    <p className="home-text-reveal text-[9px] font-black uppercase tracking-[0.22em] text-[#123c8c]">
                      {firstName ? `Halo, ${firstName}` : "Presensi"}
                    </p>

                    <h1
                      className="home-text-reveal truncate text-sm font-black text-[#073456]"
                      style={{
                        animationDelay: "60ms",
                      }}
                    >
                      {user.name || "Memuat profil..."}
                    </h1>

                    {mainRoleLabel ? (
                      <p
                        className="home-text-reveal truncate text-[11px] font-bold text-slate-500"
                        style={{
                          animationDelay: "100ms",
                        }}
                      >
                        {mainRoleLabel}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <WhatsAppButton />

                  <NotificationHeaderButton
                    href="/notifikasi"
                    unread={hasUnreadAnnouncement}
                    unreadCount={announcements.length}
                    onClick={markAnnouncementsAsRead}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto hidden max-w-7xl px-6 pt-4 md:block lg:px-8">
            <div className="home-enter relative overflow-hidden rounded-2xl bg-[#123c8c] p-4 text-white shadow-lg shadow-blue-900/20">
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <ProfileAvatar user={user} size="desktop" variant="blue" />

                  <div>
                    <h1 className="home-text-reveal text-xl sm:text-2xl font-black tracking-tight">
                      {firstName ? `Halo, ${firstName}` : "Memuat profil..."}
                    </h1>

                    <RoleBadges
                      items={[
                        user.department?.name,
                        user.jabatan?.name,
                        employeeTitle,
                        user.shift?.name,
                      ]}
                    />
                  </div>
                </div>

                <NotificationHeaderButton
                  unread={hasUnreadAnnouncement}
                  unreadCount={announcements.length}
                  desktop
                  onClick={markAnnouncementsAsRead}
                />
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl bg-white px-4 pb-20 pt-1 md:mt-4 md:rounded-2xl md:px-6 md:pb-6 md:pt-4 lg:px-8">
            <div className="mb-3.5 md:mb-5">
              <QuickMenuGrid />
            </div>

            <AppCard
              padding="sm"
              className="home-card-enter rounded-2xl border-blue-100 bg-white p-3.5 shadow-sm transition hover:shadow-md hover:shadow-slate-200/60 md:p-5"
              style={{
                animationDelay: "140ms",
              }}
            >
              <div className="flex flex-row items-center justify-between gap-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl md:text-3xl">
                      {currentTime || "--:-- WIB"}
                    </p>

                    <div className="rounded-lg bg-gradient-to-r from-[#123c8c] to-[#1e56b8] px-2 py-0.5 text-[9px] font-black text-white shadow-sm sm:rounded-xl sm:px-3 sm:py-1 md:text-xs">
                      {currentDate || "Memuat tanggal..."}
                    </div>
                  </div>

                  <p className="mt-1 text-[10px] font-semibold text-slate-500 sm:text-xs md:mt-2 md:text-sm">
                    {workScheduleText}
                  </p>

                  <p className="mt-0.5 text-[10px] font-semibold text-slate-500 sm:text-xs md:text-sm">
                    Status hari ini:{" "}
                    <span className="font-black text-[#123c8c]">
                      {attendanceToday.status}
                    </span>
                  </p>
                </div>

                <div className="flex w-[125px] shrink-0 flex-col gap-1.5 sm:w-[150px] md:w-[260px] md:flex-row md:gap-3">
                  <AttendanceButton
                    label="Masuk"
                    href="/presensi"
                    disabled={hasCheckedIn}
                    variant="primary"
                  />

                  <AttendanceButton
                    label="Keluar"
                    href="/presensi"
                    disabled={!hasCheckedIn || hasCheckedOut}
                    variant="secondary"
                  />
                </div>
              </div>
            </AppCard>

            <div
              className="home-card-enter mt-4 flex items-center justify-between md:mt-6"
              style={{
                animationDelay: "180ms",
              }}
            >
              <div>
                <h2 className="text-base font-black text-slate-950 md:text-lg">
                  Pengumuman
                </h2>
              </div>

              <Link
                href="/pengumuman"
                onClick={markAnnouncementsAsRead}
                className="text-xs font-black text-[#123c8c] transition hover:text-[#0f3274] active:scale-[0.98]"
              >
                Lihat Semua
              </Link>
            </div>

            <div className="mt-2 md:mt-3">
              <AnnouncementList
                announcements={announcements}
                hasAnnouncement={hasAnnouncement}
                onRead={markAnnouncementsAsRead}
              />
            </div>
          </section>

          <BottomNav />
        </main>
      </div>
    </MobileShell>
  );
}
