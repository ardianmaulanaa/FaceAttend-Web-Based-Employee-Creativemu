"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { MoreVertical, RefreshCw, Save } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Shift = {
  id: string;
  name: string;
  toleranceMinutes: number;
  status: "active" | "inactive";
};

type DayKey =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

type WorkTime = {
  in: string;
  out: string;
};

type WorkSchedule = {
  shiftId: string;
  shiftName: string;
  days: Record<DayKey, WorkTime>;
};

const defaultShifts: Shift[] = [
  {
    id: "shift-magang",
    name: "MAGANG",
    toleranceMinutes: 0,
    status: "active",
  },
  {
    id: "shift-utama",
    name: "UTAMA",
    toleranceMinutes: 0,
    status: "active",
  },
];

const dayColumns: { key: DayKey; label: string }[] = [
  { key: "monday", label: "Senin" },
  { key: "tuesday", label: "Selasa" },
  { key: "wednesday", label: "Rabu" },
  { key: "thursday", label: "Kamis" },
  { key: "friday", label: "Jumat" },
  { key: "saturday", label: "Sabtu" },
  { key: "sunday", label: "Minggu" },
];

function createDefaultDays(checkIn = "", checkOut = ""): Record<DayKey, WorkTime> {
  return {
    monday: { in: checkIn, out: checkOut },
    tuesday: { in: checkIn, out: checkOut },
    wednesday: { in: checkIn, out: checkOut },
    thursday: { in: checkIn, out: checkOut },
    friday: { in: checkIn, out: checkOut },
    saturday: { in: "", out: "" },
    sunday: { in: "", out: "" },
  };
}

function createDefaultSchedules(shifts: Shift[]): WorkSchedule[] {
  return shifts.map((shift) => ({
    shiftId: shift.id,
    shiftName: shift.name,
    days:
      shift.name.toUpperCase() === "MAGANG"
        ? createDefaultDays("09:00", "17:00")
        : createDefaultDays("08:00", "17:00"),
  }));
}

export default function AdminWorkSchedulesPage() {
  const [shifts, setShifts] = useState<Shift[]>(defaultShifts);
  const [selectedShiftId, setSelectedShiftId] = useState("all");
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);

  useEffect(() => {
    const savedShifts = localStorage.getItem("faceattend_shifts");

    if (savedShifts) {
      try {
        const parsedShifts = JSON.parse(savedShifts) as Shift[];
        setShifts(parsedShifts.length > 0 ? parsedShifts : defaultShifts);
      } catch {
        setShifts(defaultShifts);
      }
    }
  }, []);

  useEffect(() => {
    const savedSchedules = localStorage.getItem("faceattend_work_schedules");

    if (savedSchedules) {
      try {
        setSchedules(JSON.parse(savedSchedules));
        return;
      } catch {
        setSchedules(createDefaultSchedules(shifts));
        return;
      }
    }

    setSchedules(createDefaultSchedules(shifts));
  }, [shifts]);

  const normalizedSchedules = useMemo(() => {
    return shifts.map((shift) => {
      const existing = schedules.find((item) => item.shiftId === shift.id);

      if (existing) {
        return {
          ...existing,
          shiftName: shift.name,
        };
      }

      return {
        shiftId: shift.id,
        shiftName: shift.name,
        days:
          shift.name.toUpperCase() === "MAGANG"
            ? createDefaultDays("09:00", "17:00")
            : createDefaultDays("08:00", "17:00"),
      };
    });
  }, [schedules, shifts]);

  const filteredSchedules = useMemo(() => {
    if (selectedShiftId === "all") {
      return normalizedSchedules;
    }

    return normalizedSchedules.filter((item) => item.shiftId === selectedShiftId);
  }, [normalizedSchedules, selectedShiftId]);

  function resetFilter() {
    setSelectedShiftId("all");
  }

  function updateTime(
    shiftId: string,
    dayKey: DayKey,
    type: "in" | "out",
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const value = event.target.value;

    setSchedules((prev) => {
      const currentSchedules =
        prev.length > 0 ? prev : createDefaultSchedules(shifts);

      return currentSchedules.map((schedule) => {
        if (schedule.shiftId !== shiftId) {
          return schedule;
        }

        return {
          ...schedule,
          days: {
            ...schedule.days,
            [dayKey]: {
              ...schedule.days[dayKey],
              [type]: value,
            },
          },
        };
      });
    });
  }

  function saveSchedules() {
    const finalSchedules = normalizedSchedules;
    localStorage.setItem("faceattend_work_schedules", JSON.stringify(finalSchedules));
    setSchedules(finalSchedules);
    alert("Jam kerja berhasil disimpan.");
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Jam Kerja"
        subtitle="Kelola jadwal masuk dan pulang setiap shift"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
              Presensi Admin Panel
            </p>

            <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950">
              Daftar Jam Kerja
            </h1>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              Beranda / Manajemen Jam Kerja / Daftar Jam Kerja
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:max-w-md">
              <label className="mb-2 block text-xs font-black text-slate-500">
                Filter Shift
              </label>

              <select
                value={selectedShiftId}
                onChange={(event) => setSelectedShiftId(event.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
              >
                <option value="all">Pilih Shift Kerja</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={resetFilter}
              className="inline-flex h-[46px] w-[46px] items-center justify-center rounded-xl border border-blue-100 bg-white text-[#123c8c] shadow-sm transition active:scale-[0.96]"
              title="Reset Filter"
            >
              <RefreshCw size={20} strokeWidth={2.6} />
            </button>
          </div>

          <div className="mt-8 overflow-x-auto rounded-2xl border border-blue-100">
            <div className="min-w-[1100px]">
              <div className="grid grid-cols-[0.25fr_0.8fr_repeat(7,1fr)_0.35fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                <p>#</p>
                <p>Shift</p>
                {dayColumns.map((day) => (
                  <p key={day.key} className="text-center">
                    {day.label}
                  </p>
                ))}
                <p className="text-center">Aksi</p>
              </div>

              <div className="divide-y divide-blue-50 bg-white">
                {filteredSchedules.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <p className="font-black text-slate-700">
                      Data jam kerja tidak ditemukan.
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Coba ubah filter shift.
                    </p>
                  </div>
                ) : (
                  filteredSchedules.map((schedule, index) => (
                    <div
                      key={schedule.shiftId}
                      className="grid grid-cols-[0.25fr_0.8fr_repeat(7,1fr)_0.35fr] gap-3 px-5 py-5 text-sm"
                    >
                      <p className="pt-9 font-black text-slate-500">
                        {index + 1}
                      </p>

                      <p className="pt-9 font-black text-slate-800">
                        {schedule.shiftName}
                      </p>

                      {dayColumns.map((day) => (
                        <div key={day.key} className="space-y-2">
                          <div>
                            <label className="mb-1 block text-[11px] font-black text-slate-500">
                              Masuk
                            </label>
                            <input
                              type="time"
                              value={schedule.days[day.key]?.in || ""}
                              onChange={(event) =>
                                updateTime(schedule.shiftId, day.key, "in", event)
                              }
                              className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-[11px] font-black text-slate-500">
                              Pulang
                            </label>
                            <input
                              type="time"
                              value={schedule.days[day.key]?.out || ""}
                              onChange={(event) =>
                                updateTime(schedule.shiftId, day.key, "out", event)
                              }
                              className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                            />
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-center pt-9">
                        <button
                          type="button"
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100"
                        >
                          <MoreVertical size={20} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={saveSchedules}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition active:scale-[0.98]"
          >
            <Save size={18} strokeWidth={2.7} />
            Simpan
          </button>
        </section>
      </main>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}