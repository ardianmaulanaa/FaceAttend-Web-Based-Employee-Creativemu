"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  CreditCard,
  FileImage,
  History,
  MapPin,
  Megaphone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
};

const todayStats = [
  {
    label: "Check-in",
    value: "--:--",
    description: "Belum tercatat",
    icon: Clock3,
  },
  {
    label: "Check-out",
    value: "--:--",
    description: "Belum tercatat",
    icon: CalendarCheck,
  },
  {
    label: "Status",
    value: "Pending",
    description: "Menunggu absensi",
    icon: ShieldCheck,
  },
];

const quickActions = [
  {
    href: "/attendance",
    title: "Attendance Form",
    description:
      "Lakukan check-in atau check-out dengan formulir dan bukti foto.",
    icon: FileImage,
  },
  {
    href: "/history",
    title: "Attendance History",
    description: "Lihat riwayat kehadiran dan status absensi.",
    icon: History,
  },
  {
    href: "/profile",
    title: "Employee Profile",
    description: "Lihat informasi akun dan status registrasi wajah.",
    icon: UserRound,
  },
  {
    href: "/attendance?mode=cuti",
    title: "Surat Cuti / Sakit",
    description: "Ajukan cuti/sakit dengan lampiran surat langsung dari form.",
    icon: FileImage,
  },
  {
    href: "/announcements",
    title: "Pengumuman",
    description: "Baca info lokasi WFA/WFH, kebijakan, dan template surat.",
    icon: Megaphone,
  },
];

const workModeLabel: Record<string, string> = {
  onsite: "WFA / Onsite",
  wfh: "WFH",
  cuti: "Cuti / Sakit",
};

function getLateReasonStorageKey(userId: string, dateKey: string) {
  return `late-reason-${userId}-${dateKey}`;
}

export default function HomePage() {
  const router = useRouter();
  const { authUser, state } = useAppData();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [showLateReasonPopup, setShowLateReasonPopup] = useState(false);
  const [lateReason, setLateReason] = useState("");
  const [isSubmittingLateReason, setIsSubmittingLateReason] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadSessionUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!active) return;

        if (response.ok && result.user && result.user.role === "employee") {
          setSessionUser(result.user as SessionUser);
        } else {
          setSessionUser(null);
        }
      } catch {
        if (active) {
          setSessionUser(null);
        }
      } finally {
        if (active) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSessionUser();

    return () => {
      active = false;
    };
  }, []);

  const effectiveUser = useMemo(() => {
    if (authUser?.role === "employee") {
      return authUser;
    }

    if (!sessionUser) {
      return null;
    }

    const localEmployee = state.employees.find(
      (employee) =>
        employee.role === "employee" &&
        employee.email.toLowerCase() === sessionUser.email.toLowerCase(),
    );

    return localEmployee || null;
  }, [authUser, sessionUser, state.employees]);

  useEffect(() => {
    if (!isLoadingSession && !effectiveUser) {
      router.replace("/login");
    }
  }, [effectiveUser, isLoadingSession, router]);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayAttendance = state.attendance.find(
    (record) =>
      record.employeeId === effectiveUser?.id &&
      record.date === new Date().toISOString().slice(0, 10),
  );

  const isLateToday =
    (todayAttendance?.status || "").toLowerCase() === "late" ||
    Number(todayAttendance?.lateMinutes || 0) > 0;

  useEffect(() => {
    if (!effectiveUser || !isLateToday) {
      setShowLateReasonPopup(false);
      return;
    }

    const savedReason = window.localStorage.getItem(
      getLateReasonStorageKey(effectiveUser.id, todayKey),
    );

    if (savedReason) {
      setLateReason(savedReason);
      setShowLateReasonPopup(false);
      return;
    }

    setShowLateReasonPopup(true);
  }, [effectiveUser, isLateToday, todayKey]);

  if (isLoadingSession) {
    return (
      <MobileShell variant="employee">
        <AppHeader
          title="Good Morning"
          subtitle="Memuat data user..."
          rightLabel="..."
        />
        <section className="mx-auto max-w-7xl px-5 py-6 md:px-10 lg:px-16">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm font-semibold text-slate-600">
            Memuat data user...
          </div>
        </section>
        <BottomNav />
      </MobileShell>
    );
  }

  if (!effectiveUser) return null;

  const payoutProfile = effectiveUser.paymentProfile;

  async function submitLateReason() {
    if (!effectiveUser) return;

    const reason = lateReason.trim();
    if (!reason) {
      alert("Alasan keterlambatan wajib diisi.");
      return;
    }

    try {
      setIsSubmittingLateReason(true);

      const response = await fetch("/api/attendance/late-reason", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      const result = await response.json();
      if (!response.ok) {
        alert(result.message || "Gagal mengirim alasan telat.");
        return;
      }

      window.localStorage.setItem(
        getLateReasonStorageKey(effectiveUser.id, todayKey),
        reason,
      );
      setShowLateReasonPopup(false);
      alert(result.message || "Alasan telat berhasil dikirim.");
    } catch {
      alert("Terjadi kesalahan saat mengirim alasan telat.");
    } finally {
      setIsSubmittingLateReason(false);
    }
  }
  const assignedCity = state.cities.find(
    (city) => city.id === effectiveUser.cityId,
  );
  const assignedVillage = state.villages.find(
    (village) => village.id === effectiveUser.villageId,
  );
  const todayMode = todayAttendance?.workMode || "onsite";
  const todayLocationLabel =
    todayAttendance?.workLocationName ||
    (assignedVillage && assignedCity
      ? `${assignedVillage.name}, ${assignedCity.name}`
      : "Lokasi belum diset");
  const payoutReady = Boolean(
    payoutProfile?.accountHolderName &&
    payoutProfile?.accountNumber &&
    payoutProfile?.payoutLabel,
  );

  const rewardTargetByCategory = {
    tetap: 250,
    freelance: 200,
    pengajar: 220,
  } as const;

  const rewardTarget =
    rewardTargetByCategory[effectiveUser.employeeCategory] ?? 250;
  const rewardProgressPercent = Math.min(
    100,
    Math.round((effectiveUser.rewardPoints / rewardTarget) * 100),
  );

  const todayStats = [
    {
      label: "Check-in",
      value: todayAttendance?.checkIn ?? "--:--",
      description: todayAttendance?.checkIn
        ? "Sudah tercatat"
        : "Belum tercatat",
      icon: Clock3,
    },
    {
      label: "Check-out",
      value: todayAttendance?.checkOut ?? "--:--",
      description: todayAttendance?.checkOut
        ? "Sudah tercatat"
        : "Belum tercatat",
      icon: CalendarCheck,
    },
    {
      label: "Status",
      value: todayAttendance?.status ?? "Pending",
      description:
        todayAttendance?.status === "Present"
          ? "Hadir"
          : todayAttendance?.status === "Late"
            ? "Terlambat"
            : "Menunggu absensi",
      icon: ShieldCheck,
    },
  ];

  return (
    <MobileShell variant="employee">
      {showLateReasonPopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-amber-200 bg-white p-6 shadow-2xl shadow-slate-950/30 md:p-7">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
              Wajib Isi Alasan Telat
            </p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              Anda terdeteksi terlambat hari ini
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Isi alasan bebas langsung dari halaman home. Aturan operasional:
              kantor dulu baru kunjungan, dan jika ada kunjungan jam kerja tetap
              mengikuti jam karyawan tetap.
            </p>

            <textarea
              value={lateReason}
              onChange={(event) => setLateReason(event.target.value)}
              placeholder="Contoh: Terlambat karena antrean transportasi, sudah izin ke atasan."
              className="mt-4 min-h-32 w-full rounded-2xl border border-amber-100 bg-amber-50/30 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-amber-400 focus:bg-white"
            />

            <button
              type="button"
              onClick={submitLateReason}
              disabled={isSubmittingLateReason}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-200 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmittingLateReason ? "Mengirim..." : "Kirim Alasan Telat"}
            </button>
          </div>
        </div>
      )}

      <AppHeader
        title="Good Morning"
        subtitle={effectiveUser.name}
        rightLabel={effectiveUser.id}
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden rounded-3xl bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/20 md:p-8">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <FileImage size={26} strokeWidth={2.6} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                    Today Attendance
                  </p>
                  <h2 className="mt-1 text-4xl font-black tracking-tight md:text-5xl">
                    {todayAttendance?.checkIn
                      ? "Sudah Check-in"
                      : "Belum Check-in"}
                  </h2>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 md:text-base md:leading-8">
                Silakan isi formulir absensi untuk mencatat kehadiran hari ini.
                Sistem akan menyimpan waktu absensi, bukti foto, dan status
                kehadiran secara otomatis.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/attendance"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-900/20 transition active:scale-[0.98]"
                >
                  Mulai Absensi
                  <ArrowRight size={18} strokeWidth={2.7} />
                </Link>

                <Link
                  href="/history"
                  className="inline-flex items-center justify-center rounded-2xl bg-white/10 px-5 py-4 text-sm font-black text-white ring-1 ring-white/20 transition hover:bg-white/15 active:scale-[0.98]"
                >
                  Lihat Riwayat
                </Link>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
              Employee Summary
            </p>

            <h3 className="mt-2 text-2xl font-black text-slate-950">
              Ringkasan Hari Ini
            </h3>

            <div className="mt-5 grid gap-3">
              {todayStats.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                      <Icon size={22} strokeWidth={2.6} />
                    </div>

                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-950">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {item.description}
                      </p>
                    </div>

                    <p className="text-lg font-black text-[#123c8c]">
                      {item.value}
                    </p>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <div className="mb-2 flex items-center gap-2 text-[#123c8c]">
                  <MapPin size={18} strokeWidth={2.4} />
                  <p className="text-xs font-black uppercase tracking-[0.18em]">
                    Lokasi & Mode
                  </p>
                </div>

                <p className="text-sm font-black text-slate-950">
                  {todayLocationLabel}
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-500">
                  Mode hari ini: {workModeLabel[todayMode] || "WFA / Onsite"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                <CreditCard size={24} strokeWidth={2.5} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-700">
                  Reward Payout
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Rekening Reward
                </h2>
              </div>
            </div>

            <Link
              href="/profile"
              className="inline-flex items-center justify-center rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-amber-200 transition active:scale-[0.98]"
            >
              Atur Data Rekening
            </Link>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Atas Nama
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {payoutProfile?.accountHolderName || "Belum diisi"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Email / No HP
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {payoutProfile?.contactEmail || effectiveUser.email}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {payoutProfile?.phoneNumber || "No HP belum diisi"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                Rekening Poin / Bulan
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {payoutProfile?.payoutLabel || "Rekening poin belum diisi"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {payoutProfile?.expiryMonth
                  ? `Bulan ${payoutProfile.expiryMonth}`
                  : "Bulan belum diisi"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                Bank: {payoutProfile?.bankName || "Belum diisi"}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                No Rek / Poin Reward
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {payoutProfile?.accountNumber || "No rek belum diisi"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {effectiveUser.rewardPoints} poin •{" "}
                {payoutReady ? "Siap" : "Belum lengkap"}
              </p>

              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-[11px] font-bold text-amber-700">
                  <span>Progress Poin</span>
                  <span>{rewardProgressPercent}%</span>
                </div>

                <div className="h-2 w-full rounded-full bg-amber-100">
                  <div
                    className="h-2 rounded-full bg-amber-600 transition-all"
                    style={{ width: `${rewardProgressPercent}%` }}
                  />
                </div>

                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  Target bidang {effectiveUser.department}: {rewardTarget} poin
                </p>

                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  Kartu tambahan: {payoutProfile?.cards?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Quick Actions
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Akses Cepat
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              Gunakan fitur utama untuk absensi, melihat riwayat, dan mengecek
              data profil karyawan.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {quickActions.map((menu) => {
              const Icon = menu.icon;

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50 active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                      <Icon size={24} strokeWidth={2.6} />
                    </div>

                    <ArrowRight
                      size={20}
                      className="text-[#123c8c] transition group-hover:translate-x-1"
                    />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-950">
                    {menu.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {menu.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
    </div>

                <div className="h-2 w-full rounded-full bg-amber-100">
                  <div
                    className="h-2 rounded-full bg-amber-600 transition-all"
                    style={{ width: `${rewardProgressPercent}%` }}
                  />
                </div>

                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  Target bidang {effectiveUser.department}: {rewardTarget} poin
                </p>

                <p className="mt-1 text-[11px] font-semibold text-slate-500">
                  Kartu tambahan: {payoutProfile?.cards?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Quick Actions
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Akses Cepat
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              Gunakan fitur utama untuk absensi, melihat riwayat, dan mengecek
              data profil karyawan.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {quickActions.map((menu) => {
              const Icon = menu.icon;

              return (
                <Link
                  key={menu.href}
                  href={menu.href}
                  className="group rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300/50 active:scale-[0.98]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                      <Icon size={24} strokeWidth={2.6} />
                    </div>

                    <ArrowRight
                      size={20}
                      className="text-[#123c8c] transition group-hover:translate-x-1"
                    />
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-950">
                    {menu.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {menu.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
