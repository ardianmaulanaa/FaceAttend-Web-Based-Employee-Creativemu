"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  Power,
  RefreshCw,
  Save,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type DayKey =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type WorkSchedule = {
  id: string;
  shift_id: string;
  day_of_week: DayKey;
  is_work_day: boolean;
  check_in_time: string | null;
  check_out_time: string | null;
};

type Shift = {
  id: string;
  name: string;
  tolerance_minutes: number;
  status: string;
  work_schedules: WorkSchedule[];
};

type DayForm = {
  label: string;
  is_work_day: boolean;
  check_in_time: string;
  check_out_time: string;
};

type ScheduleRow = {
  shift_id: string;
  shift_name: string;
  shift_status: string;
  tolerance_minutes: number;
  days: Record<DayKey, DayForm>;
};

const dayOrder: DayKey[] = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

const dayLabels: Record<DayKey, string> = {
  MONDAY: "Senin",
  TUESDAY: "Selasa",
  WEDNESDAY: "Rabu",
  THURSDAY: "Kamis",
  FRIDAY: "Jumat",
  SATURDAY: "Sabtu",
  SUNDAY: "Minggu",
};

function normalizeTime(value: string | null | undefined, fallback: string) {
  const raw = String(value || "")
    .replace(".", ":")
    .trim();

  if (/^\d{2}:\d{2}$/.test(raw)) {
    return raw;
  }

  return fallback;
}

function formatStatus(status: string) {
  if (status === "active") return "Aktif";
  if (status === "inactive") return "Nonaktif";
  return status;
}

function getDefaultTimeByShift(shiftName: string) {
  const name = shiftName.toUpperCase();

  if (name.includes("MAGANG")) {
    return {
      checkIn: "09:00",
      checkOut: "16:00",
    };
  }

  if (name.includes("PAGI")) {
    return {
      checkIn: "07:00",
      checkOut: "15:00",
    };
  }

  if (name.includes("SIANG")) {
    return {
      checkIn: "13:00",
      checkOut: "21:00",
    };
  }

  return {
    checkIn: "08:00",
    checkOut: "17:00",
  };
}

function sortSchedules(rows: ScheduleRow[]) {
  const order = ["UTAMA", "MAGANG", "SHIFT PAGI", "SHIFT SIANG"];

  return [...rows].sort((a, b) => {
    const aIndex = order.indexOf(a.shift_name.toUpperCase());
    const bIndex = order.indexOf(b.shift_name.toUpperCase());

    if (aIndex === -1 && bIndex === -1) {
      return a.shift_name.localeCompare(b.shift_name);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}

function createDefaultDays(shiftName: string): Record<DayKey, DayForm> {
  const defaultTime = getDefaultTimeByShift(shiftName);

  return {
    MONDAY: {
      label: "Senin",
      is_work_day: true,
      check_in_time: defaultTime.checkIn,
      check_out_time: defaultTime.checkOut,
    },
    TUESDAY: {
      label: "Selasa",
      is_work_day: true,
      check_in_time: defaultTime.checkIn,
      check_out_time: defaultTime.checkOut,
    },
    WEDNESDAY: {
      label: "Rabu",
      is_work_day: true,
      check_in_time: defaultTime.checkIn,
      check_out_time: defaultTime.checkOut,
    },
    THURSDAY: {
      label: "Kamis",
      is_work_day: true,
      check_in_time: defaultTime.checkIn,
      check_out_time: defaultTime.checkOut,
    },
    FRIDAY: {
      label: "Jumat",
      is_work_day: true,
      check_in_time: defaultTime.checkIn,
      check_out_time: defaultTime.checkOut,
    },
    SATURDAY: {
      label: "Sabtu",
      is_work_day: false,
      check_in_time: defaultTime.checkIn,
      check_out_time: defaultTime.checkOut,
    },
    SUNDAY: {
      label: "Minggu",
      is_work_day: false,
      check_in_time: defaultTime.checkIn,
      check_out_time: defaultTime.checkOut,
    },
  };
}

function createRowsFromShifts(shifts: Shift[]): ScheduleRow[] {
  const rows = shifts.map((shift) => {
    const days = createDefaultDays(shift.name);

    for (const schedule of shift.work_schedules || []) {
      const dayKey = schedule.day_of_week;

      if (!days[dayKey]) continue;

      const defaultTime = getDefaultTimeByShift(shift.name);

      days[dayKey] = {
        label: dayLabels[dayKey],
        is_work_day: schedule.is_work_day,
        check_in_time: normalizeTime(
          schedule.check_in_time,
          defaultTime.checkIn,
        ),
        check_out_time: normalizeTime(
          schedule.check_out_time,
          defaultTime.checkOut,
        ),
      };
    }

    return {
      shift_id: shift.id,
      shift_name: shift.name,
      shift_status: shift.status,
      tolerance_minutes: shift.tolerance_minutes,
      days,
    };
  });

  return sortSchedules(rows);
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function WorkSchedulesPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedRow = useMemo(() => {
    return rows.find((row) => row.shift_id === selectedShiftId) || null;
  }, [rows, selectedShiftId]);

  const activeWorkDays = useMemo(() => {
    if (!selectedRow) return 0;

    return dayOrder.filter((dayKey) => selectedRow.days[dayKey].is_work_day)
      .length;
  }, [selectedRow]);

  async function loadWorkSchedules() {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const response = await fetch("/api/admin/work-schedules", {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal mengambil jadwal kerja.",
        );
      }

      const shiftData: Shift[] = data.shifts || data.data || [];
      const scheduleRows = createRowsFromShifts(shiftData);

      setShifts(shiftData);
      setRows(scheduleRows);

      if (!selectedShiftId && scheduleRows.length > 0) {
        const firstActiveShift =
          scheduleRows.find((row) => row.shift_status === "active") ||
          scheduleRows[0];

        setSelectedShiftId(firstActiveShift.shift_id);
      }

      if (
        selectedShiftId &&
        !scheduleRows.some((row) => row.shift_id === selectedShiftId) &&
        scheduleRows.length > 0
      ) {
        const firstActiveShift =
          scheduleRows.find((row) => row.shift_status === "active") ||
          scheduleRows[0];

        setSelectedShiftId(firstActiveShift.shift_id);
      }
    } catch (error) {
      console.error("LOAD_WORK_SCHEDULES_ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil jadwal kerja.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadWorkSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateDayValue(
    shiftId: string,
    dayKey: DayKey,
    field: "is_work_day" | "check_in_time" | "check_out_time",
    value: boolean | string,
  ) {
    setSuccessMessage("");

    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.shift_id !== shiftId) return row;

        return {
          ...row,
          days: {
            ...row.days,
            [dayKey]: {
              ...row.days[dayKey],
              [field]: value,
            },
          },
        };
      }),
    );
  }

  function setWeekdayOnly() {
    if (!selectedRow) return;

    setSuccessMessage("");

    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.shift_id !== selectedRow.shift_id) return row;

        const updatedDays = { ...row.days };

        for (const dayKey of dayOrder) {
          updatedDays[dayKey] = {
            ...updatedDays[dayKey],
            is_work_day: dayKey !== "SATURDAY" && dayKey !== "SUNDAY",
          };
        }

        return {
          ...row,
          days: updatedDays,
        };
      }),
    );
  }

  async function saveSelectedSchedule() {
    if (!selectedRow) {
      alert("Pilih shift terlebih dahulu.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");
      setSuccessMessage("");

      const payload = [
        {
          shift_id: selectedRow.shift_id,
          days: dayOrder.map((dayKey) => ({
            day_of_week: dayKey,
            is_work_day: selectedRow.days[dayKey].is_work_day,
            check_in_time: selectedRow.days[dayKey].check_in_time,
            check_out_time: selectedRow.days[dayKey].check_out_time,
          })),
        },
      ];

      const response = await fetch("/api/admin/work-schedules", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schedules: payload,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal menyimpan jadwal kerja.",
        );
      }

      await loadWorkSchedules();

      setSuccessMessage(
        selectedRow.shift_status === "inactive"
          ? "Jadwal kerja berhasil disimpan. Catatan: shift ini sedang nonaktif."
          : "Jadwal kerja berhasil disimpan ke database.",
      );
    } catch (error) {
      console.error("SAVE_WORK_SCHEDULES_ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal menyimpan jadwal kerja.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Jam Kerja"
        subtitle="Kelola jadwal masuk dan pulang setiap shift"
        variant="admin"
      />

      <section className="mx-auto max-w-6xl space-y-5 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl shadow-slate-300/30">
          <div className="bg-[#123c8c] p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Presensi Admin Panel
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  Daftar Jam Kerja
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                  Atur hari kerja, jam masuk, dan jam pulang berdasarkan shift.
                  Status aktif atau nonaktif mengikuti data dari halaman Daftar
                  Shift.
                </p>
              </div>

              <div className="grid w-full gap-3 rounded-3xl bg-white/10 p-3 backdrop-blur md:grid-cols-[1fr_auto_auto] lg:max-w-2xl">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-[0.15em] text-blue-100">
                    Pilih Shift
                  </label>

                  <select
                    value={selectedShiftId}
                    onChange={(event) => {
                      setSelectedShiftId(event.target.value);
                      setSuccessMessage("");
                    }}
                    className="h-[52px] w-full rounded-2xl border border-white/20 bg-white px-4 text-sm font-black text-slate-700 outline-none"
                  >
                    {shifts.length === 0 ? (
                      <option value="">Belum ada shift</option>
                    ) : (
                      rows.map((row) => (
                        <option key={row.shift_id} value={row.shift_id}>
                          {row.shift_name} - {formatStatus(row.shift_status)}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={loadWorkSchedules}
                    disabled={loading || saving}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#123c8c] transition hover:bg-blue-50 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60 md:w-[52px]"
                    title="Refresh"
                  >
                    <RefreshCw size={20} strokeWidth={2.6} />
                  </button>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={saveSelectedSchedule}
                    disabled={loading || saving || !selectedRow}
                    className="inline-flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-blue-950/30 transition hover:bg-slate-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}
                    {saving ? "Menyimpan..." : "Simpan"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-7">
            {errorMessage ? (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-black text-emerald-700">
                <CheckCircle2 size={18} />
                {successMessage}
              </div>
            ) : null}

            {selectedRow?.shift_status === "inactive" ? (
              <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-black leading-6 text-amber-700">
                Shift ini sedang nonaktif. Jadwal tetap bisa disimpan, tetapi
                sebaiknya tidak digunakan untuk karyawan aktif sampai status
                shift diubah kembali menjadi aktif.
              </div>
            ) : null}

            {loading ? (
              <div className="mt-8 flex min-h-[320px] items-center justify-center rounded-3xl border border-blue-100 bg-[#f8fbff]">
                <div className="text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
                  <p className="mt-3 text-sm font-black text-slate-600">
                    Mengambil jadwal kerja...
                  </p>
                </div>
              </div>
            ) : !selectedRow ? (
              <div className="mt-8 rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                <p className="font-black text-slate-700">
                  Data jadwal kerja belum tersedia.
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Pastikan data shift sudah ada di database.
                </p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 md:grid-cols-4">
                  <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <CalendarDays size={18} />
                      <p className="text-sm font-bold text-slate-500">Shift</p>
                    </div>
                    <p className="mt-2 text-2xl font-black uppercase text-slate-950">
                      {selectedRow.shift_name}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <Power size={18} />
                      <p className="text-sm font-bold text-slate-500">
                        Status
                      </p>
                    </div>
                    <p
                      className={`mt-2 text-2xl font-black ${
                        selectedRow.shift_status === "active"
                          ? "text-[#123c8c]"
                          : "text-slate-500"
                      }`}
                    >
                      {formatStatus(selectedRow.shift_status)}
                    </p>
                  </div>

                  <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <CalendarDays size={18} />
                      <p className="text-sm font-bold text-slate-500">
                        Hari Kerja
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-black text-[#123c8c]">
                      {activeWorkDays} Hari
                    </p>
                  </div>

                  <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
                    <div className="flex items-center gap-2 text-[#123c8c]">
                      <Clock3 size={18} />
                      <p className="text-sm font-bold text-slate-500">
                        Toleransi
                      </p>
                    </div>
                    <p className="mt-2 text-2xl font-black text-slate-950">
                      {selectedRow.tolerance_minutes || 0} Menit
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-col gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Pengaturan Cepat
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Gunakan tombol ini untuk membuat Senin sampai Jumat
                      sebagai hari kerja.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={setWeekdayOnly}
                    className="rounded-2xl bg-[#123c8c] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
                  >
                    Set Senin-Jumat Kerja
                  </button>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {dayOrder.map((dayKey) => {
                    const day = selectedRow.days[dayKey];

                    return (
                      <div
                        key={dayKey}
                        className={`rounded-3xl border p-4 transition ${
                          day.is_work_day
                            ? "border-blue-100 bg-white shadow-lg shadow-slate-200/50"
                            : "border-slate-100 bg-slate-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h3 className="text-lg font-black text-slate-950">
                              {day.label}
                            </h3>
                            <p
                              className={`mt-1 text-xs font-black ${
                                day.is_work_day
                                  ? "text-[#123c8c]"
                                  : "text-slate-400"
                              }`}
                            >
                              {day.is_work_day ? "Hari kerja" : "Libur"}
                            </p>
                          </div>

                          <label className="relative inline-flex cursor-pointer items-center">
                            <input
                              type="checkbox"
                              checked={day.is_work_day}
                              onChange={(event) =>
                                updateDayValue(
                                  selectedRow.shift_id,
                                  dayKey,
                                  "is_work_day",
                                  event.target.checked,
                                )
                              }
                              className="peer sr-only"
                            />
                            <div className="h-7 w-12 rounded-full bg-slate-200 transition peer-checked:bg-[#123c8c]" />
                            <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                          </label>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <label>
                            <span className="mb-1 block text-xs font-black text-slate-400">
                              Masuk
                            </span>

                            <input
                              type="time"
                              value={day.check_in_time}
                              disabled={!day.is_work_day}
                              onChange={(event) =>
                                updateDayValue(
                                  selectedRow.shift_id,
                                  dayKey,
                                  "check_in_time",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-3 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </label>

                          <label>
                            <span className="mb-1 block text-xs font-black text-slate-400">
                              Pulang
                            </span>

                            <input
                              type="time"
                              value={day.check_out_time}
                              disabled={!day.is_work_day}
                              onChange={(event) =>
                                updateDayValue(
                                  selectedRow.shift_id,
                                  dayKey,
                                  "check_out_time",
                                  event.target.value,
                                )
                              }
                              className="w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-3 py-3 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-400"
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}