"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Clock3,
  CreditCard,
  FileImage,
  History,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

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
];

export default function HomePage() {
  const router = useRouter();
  const { authUser, state } = useAppData();

  useEffect(() => {
    if (!authUser) {
      router.replace("/login");
    }
  }, [authUser, router]);

  if (!authUser) return null;

  const todayAttendance = state.attendance.find(
    (record) =>
      record.employeeId === authUser.id &&
      record.date === new Date().toISOString().slice(0, 10),
  );

  const payoutProfile = authUser.paymentProfile;
  const payoutReady = Boolean(
    payoutProfile?.accountHolderName &&
    payoutProfile?.accountNumber &&
    payoutProfile?.payoutLabel,
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
      <AppHeader
        title="Good Morning"
        subtitle={authUser.name}
        rightLabel={authUser.id}
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
                {payoutProfile?.contactEmail || authUser.email}
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
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                No Rek / Poin Reward
              </p>
              <p className="mt-2 text-sm font-black text-slate-950">
                {payoutProfile?.accountNumber || "No rek belum diisi"}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-500">
                {authUser.rewardPoints} poin •{" "}
                {payoutReady ? "Siap" : "Belum lengkap"}
              </p>
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

          <div className="mt-6 grid gap-4 md:grid-cols-3">
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
