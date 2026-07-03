import {
  CalendarCheck,
  Clock3,
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
        title={dashboardTitle}
        subtitle={dashboardSubtitle}
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            {getAdminRoleLabel(sessionRole)} Control Center
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Selamat datang di dashboard {getAdminRoleLabel(sessionRole)}
            Creativemu
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            Halaman ini menyesuaikan fokus kerja{" "}
            {getAdminRoleLabel(sessionRole)}
            supaya perpindahan page lebih relevan dengan bidang tugas.
          </p>

          <div className="mt-4 grid gap-2 rounded-2xl bg-[#f6f8ff] p-4 md:grid-cols-3">
            {roleFocusItems.map((item) => (
              <p key={item} className="text-xs font-bold text-slate-600">
                {item}
              </p>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Total Karyawan
              </p>
              <UsersRound size={18} className="text-[#123c8c]" />
            </div>
            <p className="mt-3 text-3xl font-black text-slate-950">
              {totalEmployees}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Presensi Hari Ini
              </p>
              <UserCheck size={18} className="text-emerald-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-700">
              {presentToday}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Telat Hari Ini
              </p>
              <Clock3 size={18} className="text-amber-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-amber-700">
              {lateToday}
            </p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {lateAnalytics
                ? `${lateAnalytics.latePercentage.toFixed(2)}% dari total karyawan`
                : "Persentase telat dimuat otomatis"}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Absen Hari Ini
              </p>
              <CalendarCheck size={18} className="text-rose-700" />
            </div>
            <p className="mt-3 text-3xl font-black text-rose-700">
              {absentToday}
            </p>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-amber-100 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
            <h3 className="text-xl font-black text-slate-950">
              Karyawan Terlambat Hari Ini
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Menampilkan nama, alasan telat, jam check-in, dan durasi
              keterlambatan.
            </p>

            {!lateAnalytics || lateAnalytics.rows.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Tidak ada data keterlambatan hari ini.
              </p>
            ) : (
              <div className="mt-4 overflow-hidden rounded-2xl border border-amber-100">
                <div className="hidden grid-cols-[1.1fr_1.5fr_0.8fr_0.9fr] bg-amber-50/70 px-4 py-3 text-xs font-black uppercase tracking-wide text-amber-800 md:grid">
                  <p>Nama</p>
                  <p>Alasan</p>
                  <p>Check-in</p>
                  <p>Keterlambatan</p>
                </div>
                <div className="divide-y divide-amber-100 bg-white">
                  {lateAnalytics.rows.map((row) => (
                    <div
                      key={`late-row-${row.id}`}
                      className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.1fr_1.5fr_0.8fr_0.9fr] md:items-center"
                    >
                      <div>
                        <p className="font-black text-slate-950">
                          {row.employeeName}
                        </p>
                        <p className="text-xs font-semibold text-slate-500">
                          {row.employeeId}
                        </p>
                      </div>
                      <p className="font-semibold text-slate-600">
                        {row.lateReason}
                      </p>
                      <p className="font-black text-amber-700">
                        {row.checkInTime}
                      </p>
                      <p className="font-black text-amber-700">
                        {row.lateMinutes}m {row.lateSeconds}s
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
                Pantau status kehadiran karyawan, keterlambatan, dan absensi
                harian melalui dashboard admin yang terintegrasi.
              </p>
            </div>

          <div className="rounded-3xl border border-blue-100 bg-white/95 p-5 shadow-xl shadow-slate-300/30">
            <h3 className="text-xl font-black text-slate-950">
              Histogram Keterlambatan
            </h3>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Distribusi jumlah karyawan telat berdasarkan rentang menit.
            </p>

            <div className="mt-5 space-y-3">
              {(lateAnalytics?.histogram || []).map((bucket) => {
                const widthPercent = Math.max(
                  8,
                  Math.round((bucket.count / histogramMax) * 100),
                );

                return (
                  <div key={`hist-${bucket.bucket}`}>
                    <div className="mb-1 flex items-center justify-between text-xs font-black text-slate-600">
                      <span>{bucket.bucket}</span>
                      <span>{bucket.count}</span>
                    </div>
                    <div className="h-3 w-full rounded-full bg-blue-100">
                      <div
                        className="h-3 rounded-full bg-[#123c8c] transition-all"
                        style={{ width: `${widthPercent}%` }}
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
              {(!lateAnalytics || lateAnalytics.histogram.length === 0) && (
                <p className="text-sm font-semibold text-slate-500">
                  Histogram belum tersedia.
                </p>
              )}
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-950">
            Data Karyawan & Status
          </h3>

          {dashboardRows.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Belum ada data karyawan.
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
