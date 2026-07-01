"use client";

import { useEffect, useMemo, useState } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

function buildAvatarDataUri(name: string) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() || "")
    .join("");

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='88' height='88' viewBox='0 0 88 88'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#123c8c'/><stop offset='100%' stop-color='#2b6de6'/></linearGradient></defs><rect width='88' height='88' rx='44' fill='url(#g)'/><text x='50%' y='53%' dominant-baseline='middle' text-anchor='middle' fill='#ffffff' font-family='Arial, sans-serif' font-size='28' font-weight='700'>${initials}</text></svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function parseTimeToMinutes(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function getWorkDuration(checkIn: string, checkOut: string) {
  if (checkIn === "-" || checkOut === "-") return "-";

  const checkInMinutes = parseTimeToMinutes(checkIn);
  const checkOutMinutes = parseTimeToMinutes(checkOut);

  if (checkInMinutes === null || checkOutMinutes === null) return "-";
  if (checkOutMinutes <= checkInMinutes) return "-";

  const diff = checkOutMinutes - checkInMinutes;
  const hours = Math.floor(diff / 60);
  const minutes = diff % 60;

  return `${hours}j ${minutes}m`;
}

type AttendanceStatusOption = "Present" | "Late" | "Absent";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  department: string | null;
  position: string | null;
  phone: string | null;
  status: "active" | "inactive";
};

type SalaryRecord = {
  id: string;
  employeeId: string;
};

export default function ReportsPage() {
  const { state } = useAppData();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [salaryRecords, setSalaryRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusSelection, setStatusSelection] = useState<
    Record<string, AttendanceStatusOption>
  >({});

  const todayKey = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    async function loadData() {
      try {
        const [employeeResponse, salaryResponse] = await Promise.all([
          fetch("/api/employees", { method: "GET", cache: "no-store" }),
          fetch("/api/salary", { method: "GET", cache: "no-store" }),
        ]);

        const employeeResult = await employeeResponse.json();
        const salaryResult = await salaryResponse.json();

        if (employeeResponse.ok) {
          setEmployees(employeeResult.data || []);
        }

        if (salaryResponse.ok) {
          setSalaryRecords(salaryResult.records || []);
        }
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const reportItems = useMemo(() => {
    const salaryEmployeeIds = new Set(
      salaryRecords.map((record) => record.employeeId),
    );
    const employeeOnly = employees.filter(
      (employee) => employee.role === "employee",
    );

    return employeeOnly.map((employee) => {
      const todayAttendance = state.attendance.find(
        (record) =>
          record.employeeId === employee.id && record.date === todayKey,
      );

      const rewardHistory = state.rewards
        .filter((reward) => reward.employeeId === employee.id)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const totalRewardPoints = rewardHistory.reduce(
        (sum, reward) => sum + reward.amount,
        0,
      );

      const attendanceStatus: AttendanceStatusOption = todayAttendance?.status
        ? (todayAttendance.status as AttendanceStatusOption)
        : "Absent";

      const checkInTime = todayAttendance?.checkIn || "-";
      const checkOutTime = todayAttendance?.checkOut || "-";

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department || "-",
        position: employee.position || "-",
        phone: employee.phone || "-",
        avatar: buildAvatarDataUri(employee.name),
        checkInTime,
        checkOutTime,
        workDuration: getWorkDuration(checkInTime, checkOutTime),
        salaryStatus: salaryEmployeeIds.has(employee.id)
          ? "Telah Digaji"
          : "Belum Digaji",
        rewardPoints: totalRewardPoints,
        latestRewardTitle: rewardHistory[0]?.title || "Belum ada reward",
        employeeStatus: employee.status,
        attendanceStatus,
      };
    });
  }, [employees, salaryRecords, state.attendance, state.rewards, todayKey]);

  useEffect(() => {
    if (reportItems.length === 0) return;

    setStatusSelection((prev) => {
      const next = { ...prev };

      for (const item of reportItems) {
        if (!next[item.id]) {
          next[item.id] = item.attendanceStatus;
        }
      }

      return next;
    });
  }, [reportItems]);

  const summary = useMemo(() => {
    const total = reportItems.length;

    const present = reportItems.filter(
      (item) =>
        (statusSelection[item.id] || item.attendanceStatus) === "Present",
    ).length;

    const late = reportItems.filter(
      (item) => (statusSelection[item.id] || item.attendanceStatus) === "Late",
    ).length;

    const absent = reportItems.filter(
      (item) =>
        (statusSelection[item.id] || item.attendanceStatus) === "Absent",
    ).length;

    return { total, present, late, absent };
  }, [reportItems, statusSelection]);

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Reports"
        subtitle="Status harian, durasi kerja, dan reward"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-sm font-black text-[#123c8c]">Admin Monitoring</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Laporan Harian Karyawan
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Status absensi bisa dipantau cepat dan diubah melalui dropdown
            Present/Late/Absent. Durasi kerja dihitung otomatis dari jam masuk
            dan pulang di form absensi.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-blue-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
              Total Karyawan
            </p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {summary.total}
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
              Present
            </p>
            <p className="mt-2 text-3xl font-black text-emerald-700">
              {summary.present}
            </p>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
              Late
            </p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              {summary.late}
            </p>
          </div>

          <div className="rounded-2xl border border-rose-100 bg-white p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
              Absent
            </p>
            <p className="mt-2 text-3xl font-black text-rose-700">
              {summary.absent}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-950">
            Data Karyawan & Status
          </h3>

          {loading ? (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Memuat data...
            </p>
          ) : reportItems.length === 0 ? (
            <p className="mt-4 text-sm font-semibold text-slate-500">
              Belum ada data karyawan.
            </p>
          ) : (
            <div className="mt-4 overflow-hidden rounded-2xl border border-blue-100">
              <div className="hidden grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_0.8fr_1fr] bg-[#eaf1ff] px-4 py-3 text-xs font-black uppercase tracking-wide text-[#123c8c] md:grid">
                <p>Karyawan</p>
                <p>Dept / Posisi</p>
                <p>Jam Kerja</p>
                <p>Durasi</p>
                <p>Status</p>
                <p>Gaji</p>
                <p>Reward</p>
              </div>

              <div className="divide-y divide-blue-100 bg-white">
                {reportItems.map((item) => (
                  <div
                    key={`employee-${item.id}`}
                    className="grid gap-3 px-4 py-4 text-sm md:grid-cols-[1.2fr_1fr_1fr_0.9fr_0.9fr_0.8fr_1fr] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.avatar}
                        alt={`Foto ${item.name}`}
                        className="h-10 w-10 rounded-full border border-blue-100 object-cover"
                      />
                      <div>
                        <p className="font-black text-slate-950">{item.name}</p>
                        <p className="text-xs font-semibold text-slate-500">
                          {item.id}
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold text-slate-600">
                      {item.department} / {item.position}
                    </p>

                    <p className="font-semibold text-slate-600">
                      {item.checkInTime} - {item.checkOutTime}
                    </p>

                    <p className="font-black text-slate-800">
                      {item.workDuration}
                    </p>

                    <select
                      value={statusSelection[item.id] || item.attendanceStatus}
                      onChange={(event) =>
                        setStatusSelection((prev) => ({
                          ...prev,
                          [item.id]: event.target
                            .value as AttendanceStatusOption,
                        }))
                      }
                      className="rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-xs font-black text-slate-700 outline-none"
                    >
                      <option value="Present">Present</option>
                      <option value="Late">Late</option>
                      <option value="Absent">Absent</option>
                    </select>

                    <p className="font-semibold text-slate-600">
                      {item.salaryStatus}
                    </p>

                    <div>
                      <p className="font-black text-[#123c8c]">
                        {item.rewardPoints} poin
                      </p>
                      <p className="text-xs font-semibold text-slate-500">
                        {item.latestRewardTitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
