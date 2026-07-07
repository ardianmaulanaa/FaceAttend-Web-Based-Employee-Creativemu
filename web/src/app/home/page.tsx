"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Bell,
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
  unit?: UserRelation;
  shift?: UserRelation;
};

type Announcement = {
  id: string;
  title: string;
  content?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
};

const READ_ANNOUNCEMENT_KEY = "faceattend_read_announcement_id";

const defaultUser: CurrentUser = {
  name: "",
  role: "",
  profile_photo: null,
  position: null,
  department: null,
  unit: null,
  shift: null,
};

const defaultAttendance: AttendanceToday = {
  checkIn: "--:--",
  checkOut: "--:--",
  status: "Pending",
  description: "Menunggu absensi",
  schedule: "",
};

const quickMenus = [
  {
    href: "/history",
    label: "Laporan\nPresensi",
    description: "Lihat riwayat absensi dan detail kehadiran.",
    icon: History,
  },
  {
    href: "/attendance",
    label: "Presensi",
    description: "Lakukan check-in atau check-out dengan verifikasi wajah.",
    icon: ScanFace,
  },
  {
    href: "/profile",
    label: "Profil",
    description: "Lihat data akun, unit, divisi, jabatan, dan shift.",
    icon: UserRound,
  },
  {
    href: "/cuti",
    label: "Izin/Cuti",
    description: "Ajukan cuti, izin, sakit, atau keperluan lainnya.",
    icon: FileText,
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

    if (!response.ok) return null;

    return await readJsonResponse(response);
  } catch (error) {
    console.error(`Gagal mengambil data ${url}:`, error);
    return null;
  }
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
        src={user.profile_photo}
        alt={user.name || "Profile"}
        className={`${sizeClass} shrink-0 rounded-full object-cover ${
          size === "desktop" ? "ring-4 ring-white/70" : "ring-4 ring-white"
        }`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full font-black ${
        variant === "blue"
          ? "bg-white/15 text-white ring-4 ring-white/20"
          : "bg-[#eaf1ff] text-[#123c8c] ring-4 ring-white"
      }`}
    >
      {user.name ? getInitialName(user.name) : ""}
    </div>
  );
}

function AnnouncementButton({
  href = "/pengumuman",
  unread,
  desktop = false,
  onClick,
}: {
  href?: string;
  unread: boolean;
  desktop?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex shrink-0 items-center justify-center rounded-2xl ring-1 transition active:scale-[0.96] ${
        desktop ? "h-16 w-16" : "h-12 w-12"
      } ${
        unread
          ? desktop
            ? "bg-white text-[#123c8c] ring-white"
            : "bg-[#123c8c] text-white ring-[#123c8c]"
          : desktop
            ? "bg-white/10 text-white/70 ring-white/20"
            : "bg-white text-slate-400 ring-blue-100"
      }`}
      aria-label="Pengumuman"
    >
      <Bell
        size={desktop ? 28 : 24}
        fill={unread ? (desktop ? "#123c8c" : "white") : "transparent"}
        strokeWidth={2.2}
      />

      {unread ? (
        <span
          className={`absolute rounded-full bg-red-500 ring-2 ring-white ${
            desktop ? "right-3 top-3 h-4 w-4" : "right-2 top-2 h-3 w-3"
          }`}
        />
      ) : null}
    </Link>
  );
}

function RoleBadges({ items }: { items: Array<string | undefined | null> }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.filter(Boolean).map((item) => (
        <span
          key={item}
          className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function QuickMenuGrid() {
  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-3 md:grid-cols-4 md:gap-5">
      {quickMenus.map(({ href, label, description, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="group flex flex-col items-center rounded-3xl text-center transition md:border md:border-blue-100 md:bg-[#f8fbff] md:p-6 md:hover:-translate-y-1"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf1ff] md:h-20 md:w-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#123c8c] text-white md:h-14 md:w-14">
              <Icon size={22} strokeWidth={2.6} />
            </div>
          </div>

          <p className="mt-2 whitespace-pre-line text-[12px] font-bold leading-tight text-slate-600 md:mt-3 md:text-base">
            {label}
          </p>

          <p className="mt-2 hidden text-sm leading-6 text-slate-400 md:block">
            {description}
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
      className={`flex h-14 items-center justify-center rounded-2xl text-sm font-black transition active:scale-[0.98] md:h-20 md:text-lg ${
        disabled
          ? "cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300"
          : variant === "primary"
            ? "bg-[#123c8c] text-white"
            : "border border-blue-100 bg-white text-[#123c8c]"
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
      <div className="rounded-3xl border border-dashed border-blue-100 bg-white px-5 py-6 text-center shadow-sm md:py-14">
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
      className="block min-w-0 rounded-3xl border border-blue-100 bg-white p-5 shadow-sm transition hover:bg-[#f8fbff] md:p-5"
    >
      <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
        <Megaphone size={14} />
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
    </Link>
  );
}

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [user, setUser] = useState<CurrentUser>(defaultUser);
  const [attendanceToday, setAttendanceToday] =
    useState<AttendanceToday>(defaultAttendance);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [readAnnouncementId, setReadAnnouncementId] = useState<string | null>(
    null
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
          .replace(".", ":")} WIB`
      );

      setCurrentDate(
        new Intl.DateTimeFormat("id-ID", {
          timeZone: "Asia/Jakarta",
          weekday: "long",
          day: "2-digit",
          month: "long",
          year: "numeric",
        }).format(now)
      );
    }

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setReadAnnouncementId(
        window.localStorage.getItem(READ_ANNOUNCEMENT_KEY)
      );
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
        unit: profile.unit || null,
        shift: profile.shift || null,
      });

      setAttendanceToday({
        checkIn: normalizeTime(today.checkIn || "--:--"),
        checkOut: normalizeTime(today.checkOut || "--:--"),
        status: today.status || "Pending",
        description: today.description || "Menunggu absensi",
        schedule:
          today.schedule || today.workSchedule || today.shiftSchedule || "",
      });

      setAnnouncements(Array.isArray(list) ? list : []);
    }

    loadData();
  }, []);

  const firstName = user.name ? getFirstName(user.name) : "";
  const hasAnnouncement = announcements.length > 0;
  const latestAnnouncementId = announcements[0]?.id || "";
  const hasUnreadAnnouncement =
    Boolean(latestAnnouncementId) && latestAnnouncementId !== readAnnouncementId;

  const employeeTitle = useMemo(
    () => user.position?.name || user.department?.name || "",
    [user.position?.name, user.department?.name]
  );

  const mainRoleLabel = useMemo(
    () => user.shift?.name || user.position?.name || user.department?.name || "",
    [user.shift?.name, user.position?.name, user.department?.name]
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
      <div className="min-h-dvh bg-white">
        <div className="hidden md:block">
          <AppHeader
            title="Home"
            subtitle="Dashboard Absensi"
            rightLabel={mainRoleLabel || undefined}
            variant="employee"
          />
        </div>

        <main className="min-h-dvh overflow-x-hidden bg-white text-slate-950 md:bg-gradient-to-br md:from-[#f6f8ff] md:via-white md:to-[#eef4ff] md:pb-28">
          <section
            className="bg-white md:hidden"
            style={{
              paddingTop: "env(safe-area-inset-top, 0px)",
            }}
          >
            <div className="mx-auto w-full max-w-7xl px-5 pt-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white p-2 ring-1 ring-blue-100">
                    <Image
                      src="/images/creativemu-logo/creativemu.png"
                      alt="Creativemu Logo"
                      width={56}
                      height={56}
                      className="h-full w-full object-contain"
                      priority
                    />
                  </div>

                  <ProfileAvatar user={user} />

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#123c8c]">
                      FaceAttend
                    </p>

                    <h1 className="mt-1 truncate text-base font-black text-[#073456]">
                      {user.name || "Memuat profil..."}
                    </h1>

                    {mainRoleLabel ? (
                      <p className="truncate text-xs font-bold text-slate-500">
                        {mainRoleLabel}
                      </p>
                    ) : null}
                  </div>
                </div>

                <AnnouncementButton
                  unread={hasUnreadAnnouncement}
                  onClick={markAnnouncementsAsRead}
                />
              </div>

              <div className="py-7 text-center">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Selamat Datang
                </p>

                <h2 className="mt-3 text-4xl font-black tracking-tight text-[#073456]">
                  {firstName ? `Halo, ${firstName}` : "Memuat profil..."}
                </h2>

                <p className="mt-3 text-lg font-bold text-slate-500">
                  Semoga harimu produktif.
                </p>
              </div>
            </div>
          </section>

          <section className="mx-auto hidden max-w-7xl px-10 pt-8 md:block lg:px-16">
            <div className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-8 text-white">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
              <div className="absolute bottom-[-7rem] right-24 h-60 w-60 rounded-full bg-blue-300/10" />

              <div className="relative z-10 flex items-center justify-between gap-8">
                <div className="flex items-center gap-5">
                  <ProfileAvatar user={user} size="desktop" variant="blue" />

                  <div>
                    <h1 className="text-4xl font-black tracking-tight">
                      {firstName ? `Halo, ${firstName}` : "Memuat profil..."}
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                      Kelola kehadiran, riwayat presensi, profil, dan pengajuan
                      izin dalam satu dashboard karyawan.
                    </p>

                    <RoleBadges
                      items={[
                        user.shift?.name,
                        employeeTitle,
                        user.unit?.name,
                        user.department?.name,
                      ]}
                    />
                  </div>
                </div>

                <AnnouncementButton
                  unread={hasUnreadAnnouncement}
                  desktop
                  onClick={markAnnouncementsAsRead}
                />
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-7xl bg-white px-5 pb-[8.5rem] pt-2 md:mt-8 md:rounded-[2.5rem] md:px-8 md:pb-10 md:pt-8 lg:px-10">
            <div className="mb-6 md:mb-8">
              <QuickMenuGrid />
            </div>

            <AppCard
              padding="md"
              className="rounded-[1.8rem] border-blue-100 bg-white p-5 shadow-sm md:p-8"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                      {currentTime || "--:-- WIB"}
                    </p>

                    <div className="rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-black text-[#123c8c] md:px-3 md:py-1.5">
                      WIB
                    </div>
                  </div>

                  <p className="mt-3 text-sm font-bold text-slate-500 md:text-base">
                    {currentDate || "Memuat tanggal..."}
                  </p>

                  <p className="mt-3 text-sm font-semibold text-slate-500 md:mt-5 md:text-lg">
                    {workScheduleText}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500 md:mt-3 md:text-lg">
                    Status hari ini:{" "}
                    <span className="font-black text-[#123c8c]">
                      {attendanceToday.status}
                    </span>
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 lg:w-[460px]">
                  <AttendanceButton
                    label="Masuk"
                    href="/attendance"
                    disabled={hasCheckedIn}
                    variant="primary"
                  />

                  <AttendanceButton
                    label="Keluar"
                    href="/attendance"
                    disabled={!hasCheckedIn || hasCheckedOut}
                    variant="secondary"
                  />
                </div>
              </div>
            </AppCard>

            <div className="mt-7 flex items-center justify-between md:mt-14">
              <div>
                <h2 className="text-2xl font-black text-slate-950 md:text-2xl">
                  Pengumuman
                </h2>

                <p className="mt-1 hidden text-sm font-semibold text-slate-500 md:block">
                  Informasi terbaru dari perusahaan.
                </p>
              </div>

              <Link
                href="/pengumuman"
                onClick={markAnnouncementsAsRead}
                className="text-lg font-black text-[#123c8c] md:text-base"
              >
                Lihat Lainnya
              </Link>
            </div>

            <div className="mt-4 md:mt-6">
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