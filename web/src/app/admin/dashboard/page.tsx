import {
  CalendarCheck,
  Clock3,
  CreditCard,
  LayoutDashboard,
  UserCheck,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const stats = [
  {
    label: "Total Employees",
    value: "24",
    description: "Karyawan terdaftar",
    icon: UsersRound,
  },
  {
    label: "Present Today",
    value: "18",
    description: "Sudah melakukan absensi",
    icon: UserCheck,
  },
  {
    label: "Late Today",
    value: "3",
    description: "Terlambat masuk",
    icon: Clock3,
  },
  {
    label: "Absent Today",
    value: "3",
    description: "Belum hadir",
    icon: CalendarCheck,
  },
  {
    label: "Payout Patch",
    value: "Aktif",
    description: "No rek, label, bulan, CVC, dan poin",
    icon: CreditCard,
  },
];

const recentAttendance = [
  {
    id: "EMP001",
    name: "Muhammad Ardian Maulana",
    checkIn: "08:02",
    checkOut: "17:04",
    status: "Present",
  },
  {
    id: "EMP002",
    name: "Budi Santoso",
    checkIn: "08:21",
    checkOut: "17:10",
    status: "Late",
  },
  {
    id: "EMP003",
    name: "Siti Rahma",
    checkIn: "-",
    checkOut: "-",
    status: "Absent",
  },
];

export default function AdminDashboardPage() {
  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Admin Dashboard"
        subtitle="Monitoring absensi karyawan Creativemu"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
          <div className="grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="bg-[#123c8c] p-6 text-white md:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                  <LayoutDashboard size={25} strokeWidth={2.6} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Admin Control Center
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                    Attendance Overview
                  </h2>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
                Pantau status kehadiran karyawan, keterlambatan, dan absensi
                harian melalui dashboard admin yang terintegrasi.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 md:p-6">
              {stats.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-slate-500">
                        {item.label}
                      </p>

                      <Icon
                        size={20}
                        strokeWidth={2.5}
                        className="text-[#123c8c]"
                      />
                    </div>

                    <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                      {item.value}
                    </h3>

                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Today Report
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Recent Attendance
              </h2>
            </div>

            <p className="max-w-md text-sm leading-6 text-slate-500">
              Ringkasan absensi terbaru dari karyawan Creativemu hari ini.
            </p>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_0.8fr] bg-[#eaf1ff] px-5 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c] md:grid">
              <p>ID</p>
              <p>Employee</p>
              <p>Check-in</p>
              <p>Check-out</p>
              <p>Status</p>
            </div>

            <div className="divide-y divide-blue-100 bg-white">
              {recentAttendance.map((item) => (
                <div
                  key={item.id}
                  className="grid gap-3 px-5 py-4 text-sm md:grid-cols-[0.8fr_1.4fr_0.8fr_0.8fr_0.8fr] md:items-center"
                >
                  <p className="font-black text-[#123c8c]">{item.id}</p>
                  <p className="font-bold text-slate-950">{item.name}</p>
                  <p className="text-slate-500">{item.checkIn}</p>
                  <p className="text-slate-500">{item.checkOut}</p>

                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                      item.status === "Present"
                        ? "bg-[#eaf1ff] text-[#123c8c]"
                        : item.status === "Late"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
