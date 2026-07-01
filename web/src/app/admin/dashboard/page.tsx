"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Clock3,
  MapPin,
  TrendingUp,
  UserCheck,
  UsersRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

type Employee = {
  id: string;
  role: "admin" | "employee";
};

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export default function AdminDashboardPage() {
  const { state } = useAppData();
  const [employees, setEmployees] = useState<Employee[]>([]);

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const response = await fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();
        setEmployees(result.data || []);
      } catch {
        // Keep UI functional with context-only data.
      }
    }

    void loadEmployees();
  }, []);

  const totalEmployees = useMemo(() => {
    return employees.filter((item) => item.role === "employee").length;
  }, [employees]);

  const todayAttendance = useMemo(() => {
    return state.attendance.filter((item) => item.date === todayKey);
  }, [state.attendance, todayKey]);

  const presentToday = useMemo(() => {
    return todayAttendance.filter((item) => Boolean(item.checkIn)).length;
  }, [todayAttendance]);

  const lateToday = useMemo(() => {
    return todayAttendance.filter((item) => item.status === "Late").length;
  }, [todayAttendance]);

  const absentToday = useMemo(() => {
    return Math.max(totalEmployees - presentToday, 0);
  }, [totalEmployees, presentToday]);

  const dailyPresenceChart = useMemo(() => {
    const points = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const count = state.attendance.filter(
        (item) => item.date === key && item.checkIn,
      ).length;

      return {
        label: date.toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "2-digit",
        }),
        value: count,
      };
    });

    const maxValue = Math.max(...points.map((item) => item.value), 1);

    return { points, maxValue };
  }, [state.attendance]);

  const monthlyPresenceChart = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const points = monthLabels.map((label, monthIndex) => {
      const count = state.attendance.filter((item) => {
        if (!item.checkIn) return false;
        const date = parseDateKey(item.date);
        return (
          date.getFullYear() === thisYear && date.getMonth() === monthIndex
        );
      }).length;

      return { label, value: count };
    });

    const maxValue = Math.max(...points.map((item) => item.value), 1);

    return { points, maxValue };
  }, [state.attendance]);

  const monthlyProductivity = useMemo(() => {
    const thisYear = new Date().getFullYear();
    const points = monthLabels.map((label, monthIndex) => {
      const creativityPoints = state.creativity
        .filter((item) => {
          const date = new Date(item.createdAt);
          return (
            date.getFullYear() === thisYear && date.getMonth() === monthIndex
          );
        })
        .reduce((sum, item) => sum + item.points, 0);

      return {
        label,
        value: creativityPoints,
      };
    });

    const maxValue = Math.max(...points.map((item) => item.value), 1);

    return { points, maxValue };
  }, [state.creativity]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Admin Dashboard"
        subtitle="Monitoring absensi, lokasi, dan produktivitas"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            Admin Control Center
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Selamat pagi C . Mulya Kreatif Cipta
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
            Ringkasan harian dibuat cepat dipahami untuk operasional absen hari
            ini: total karyawan, lokasi absensi Bantul, telat, presensi, dan
            absen.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
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

          <div className="rounded-2xl border border-cyan-100 bg-white p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">
                Lokasi Absen
              </p>
              <MapPin size={18} className="text-cyan-700" />
            </div>
            <p className="mt-3 text-xl font-black text-cyan-700">Bantul</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              Pusat monitoring admin
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

        <div className="grid gap-4 xl:grid-cols-3">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-slate-950">
                Masuk Per Hari (7 Hari)
              </h3>
              <TrendingUp size={18} className="text-[#123c8c]" />
            </div>
            <div className="mt-5 space-y-3">
              {dailyPresenceChart.points.map((item) => (
                <div key={`daily-${item.label}`}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                    <p>{item.label}</p>
                    <p>{item.value} org</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[#123c8c]"
                      style={{
                        width: `${Math.max(
                          (item.value / dailyPresenceChart.maxValue) * 100,
                          8,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <h3 className="text-lg font-black text-slate-950">
              Masuk Per Bulan
            </h3>
            <div className="mt-5 space-y-3">
              {monthlyPresenceChart.points.map((item) => (
                <div key={`monthly-presence-${item.label}`}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                    <p>{item.label}</p>
                    <p>{item.value}</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600"
                      style={{
                        width: `${Math.max(
                          (item.value / monthlyPresenceChart.maxValue) * 100,
                          6,
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
            <h3 className="text-lg font-black text-slate-950">
              Produktivitas Per Bulan
            </h3>
            <div className="mt-5 space-y-3">
              {monthlyProductivity.points.map((item) => (
                <div key={`monthly-productivity-${item.label}`}>
                  <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-500">
                    <p>{item.label}</p>
                    <p>{item.value} poin</p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-amber-600"
                      style={{
                        width: `${Math.max(
                          (item.value / monthlyProductivity.maxValue) * 100,
                          6,
                        )}%`,
                      }}
                    />
                  </div>
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
