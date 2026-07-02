"use client";

import { useMemo } from "react";
import { AlertTriangle, Building2, Clock3, Users2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

export default function AdminCompanyMonitorPage() {
  const { state } = useAppData();
  const today = new Date().toISOString().slice(0, 10);

  const employees = useMemo(
    () => state.employees.filter((employee) => employee.role === "employee"),
    [state.employees],
  );

  const todayRecords = useMemo(
    () => state.attendance.filter((record) => record.date === today),
    [state.attendance, today],
  );

  const summary = useMemo(() => {
    const present = todayRecords.filter((record) => record.checkIn).length;
    const late = todayRecords.filter(
      (record) => record.status === "Late",
    ).length;
    const wfh = todayRecords.filter(
      (record) => record.workMode === "wfh",
    ).length;
    const cuti = todayRecords.filter(
      (record) => record.workMode === "cuti",
    ).length;
    const pending = Math.max(employees.length - present - cuti, 0);

    return { present, late, wfh, cuti, pending };
  }, [todayRecords, employees.length]);

  const departmentStats = useMemo(() => {
    const bucket = new Map<string, number>();

    for (const employee of employees) {
      const key = employee.department || "Tanpa Divisi";
      bucket.set(key, (bucket.get(key) || 0) + 1);
    }

    return Array.from(bucket.entries())
      .map(([department, total]) => ({ department, total }))
      .sort((a, b) => b.total - a.total);
  }, [employees]);

  const alerts = useMemo(() => {
    return todayRecords
      .filter(
        (record) =>
          record.checkIn && !record.checkOut && record.workMode !== "cuti",
      )
      .slice(0, 8)
      .map((record) => ({
        id: record.id,
        employeeName: record.employeeName,
        mode: record.workMode || "onsite",
        checkIn: record.checkIn || "-",
      }));
  }, [todayRecords]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Monitor Perusahaan"
        subtitle="Pantau kondisi operasional harian secara ringkas"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            Operasional Harian
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Snapshot Perusahaan Hari Ini
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Modul ini membantu admin melihat status hadir, WFH, cuti, serta
            potensi masalah check-out yang belum selesai.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            {
              label: "Present",
              value: summary.present,
            },
            {
              label: "Late",
              value: summary.late,
            },
            {
              label: "WFH",
              value: summary.wfh,
            },
            {
              label: "Cuti",
              value: summary.cuti,
            },
            {
              label: "Pending",
              value: summary.pending,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-blue-100 bg-white p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
                {item.label}
              </p>
              <p className="mt-2 text-3xl font-black text-slate-950">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center gap-2 text-[#123c8c]">
              <Building2 size={18} />
              <h3 className="text-lg font-black text-slate-950">
                Komposisi Divisi
              </h3>
            </div>
            <div className="mt-4 space-y-2">
              {departmentStats.map((item) => (
                <div
                  key={item.department}
                  className="flex items-center justify-between rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2"
                >
                  <p className="text-sm font-semibold text-slate-700">
                    {item.department}
                  </p>
                  <p className="text-sm font-black text-[#123c8c]">
                    {item.total} orang
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center gap-2 text-amber-700">
              <AlertTriangle size={18} />
              <h3 className="text-lg font-black text-slate-950">
                Perlu Tindak Lanjut
              </h3>
            </div>
            {alerts.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Tidak ada alert hari ini.
              </p>
            ) : (
              <div className="mt-4 space-y-2">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-xl border border-amber-100 bg-amber-50/70 px-3 py-2"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {alert.employeeName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      Check-in {alert.checkIn} • mode {alert.mode} • belum
                      check-out
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex items-center gap-2 text-[#123c8c]">
              <Users2 size={18} />
              <p className="text-sm font-black text-slate-900">
                Total Karyawan Aktif
              </p>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {employees.length}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <div className="flex items-center gap-2 text-[#123c8c]">
              <Clock3 size={18} />
              <p className="text-sm font-black text-slate-900">
                Rekaman Absensi Hari Ini
              </p>
            </div>
            <p className="mt-2 text-2xl font-black text-slate-950">
              {todayRecords.length}
            </p>
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
