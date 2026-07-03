"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, Loader2, RefreshCw, Search, X } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Shift = {
  id: string;
  name: string;
  tolerance_minutes: number;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type ShiftForm = {
  tolerance_minutes: string;
  status: string;
};

const initialForm: ShiftForm = {
  tolerance_minutes: "0",
  status: "active",
};

const presetShifts: Shift[] = [
  {
    id: "preset-utama",
    name: "UTAMA",
    tolerance_minutes: 3,
    status: "active",
  },
  {
    id: "preset-magang",
    name: "MAGANG",
    tolerance_minutes: 0,
    status: "active",
  },
  {
    id: "preset-shift-pagi",
    name: "SHIFT PAGI",
    tolerance_minutes: 5,
    status: "active",
  },
  {
    id: "preset-shift-siang",
    name: "SHIFT SIANG",
    tolerance_minutes: 5,
    status: "active",
  },
];

const shiftFilterOptions = [
  {
    value: "all",
    label: "Semua Shift",
  },
  {
    value: "UTAMA",
    label: "Utama",
  },
  {
    value: "MAGANG",
    label: "Magang",
  },
  {
    value: "SHIFT PAGI",
    label: "Shift Pagi",
  },
  {
    value: "SHIFT SIANG",
    label: "Shift Siang",
  },
  {
    value: "active",
    label: "Status Aktif",
  },
  {
    value: "inactive",
    label: "Status Nonaktif",
  },
];

function sortShifts(shifts: Shift[]) {
  const order = ["UTAMA", "MAGANG", "SHIFT PAGI", "SHIFT SIANG"];

  return [...shifts].sort((a, b) => {
    const aIndex = order.indexOf(a.name.toUpperCase());
    const bIndex = order.indexOf(b.name.toUpperCase());

    if (aIndex === -1 && bIndex === -1) {
      return a.name.localeCompare(b.name);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}

function mergePresetShifts(apiShifts: Shift[]) {
  const merged = [...apiShifts];

  for (const preset of presetShifts) {
    const exists = merged.some(
      (shift) => shift.name.toLowerCase() === preset.name.toLowerCase(),
    );

    if (!exists) {
      merged.push(preset);
    }
  }

  return sortShifts(merged);
}

function formatStatus(status: string) {
  if (status === "active") return "Aktif";
  if (status === "inactive") return "Nonaktif";

  return status;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>(presetShifts);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState("all");
  const [form, setForm] = useState<ShiftForm>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);

  async function loadShifts() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/shifts", {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal mengambil shift.");
      }

      const apiShifts = data.shifts || data.data || [];
      setShifts(mergePresetShifts(apiShifts));
    } catch (error) {
      console.error("LOAD_SHIFTS_ERROR:", error);

      setShifts(presetShifts);
      setErrorMessage("Data API shift belum terbaca. Menampilkan data default.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadShifts();
  }, []);

  const filteredShifts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return shifts.filter((shift) => {
      const shiftName = shift.name.toLowerCase();
      const shiftStatus = shift.status.toLowerCase();

      if (keyword && !shiftName.includes(keyword)) {
        return false;
      }

      if (shiftFilter === "active" || shiftFilter === "inactive") {
        return shiftStatus === shiftFilter;
      }

      if (shiftFilter !== "all" && shiftName !== shiftFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [search, shiftFilter, shifts]);

  function openEditModal(shift: Shift) {
    setEditingShift(shift);
    setForm({
      tolerance_minutes: String(shift.tolerance_minutes || 0),
      status: shift.status || "active",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingShift(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function resetFilter() {
    setSearch("");
    setShiftFilter("all");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingShift) {
      alert("Pilih shift yang ingin diedit.");
      return;
    }

    const toleranceMinutes = Number(form.tolerance_minutes || 0);

    if (Number.isNaN(toleranceMinutes) || toleranceMinutes < 0) {
      alert("Toleransi telat tidak valid.");
      return;
    }

    if (!["active", "inactive"].includes(form.status)) {
      alert("Status shift tidak valid.");
      return;
    }

    if (editingShift.id.startsWith("preset-")) {
      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === editingShift.id
            ? {
                ...shift,
                tolerance_minutes: toleranceMinutes,
                status: form.status,
              }
            : shift,
        ),
      );

      closeModal();
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/admin/shifts", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingShift.id,
          tolerance_minutes: toleranceMinutes,
          status: form.status,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menyimpan shift.");
      }

      await loadShifts();
      closeModal();
    } catch (error) {
      console.error("SAVE_SHIFT_ERROR:", error);

      alert(error instanceof Error ? error.message : "Gagal menyimpan shift.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Shift"
        subtitle="Kelola master data shift karyawan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Presensi Admin Panel
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                DAFTAR SHIFT
              </h1>

              <p className="mt-3 text-sm font-black text-slate-500">
                Beranda / Manajemen Shift / Daftar Shift
              </p>
            </div>

            <div className="w-full md:w-72">
              <label className="mb-2 block text-sm font-black text-slate-500">
                Filter Shift
              </label>

              <select
                value={shiftFilter}
                onChange={(event) => setShiftFilter(event.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
              >
                {shiftFilterOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-8 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5">
            <p className="text-sm font-black text-[#123c8c]">Catatan Shift</p>

            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              Nama shift dibuat tetap agar tidak merusak relasi jadwal kerja.
              Yang bisa diubah hanya toleransi telat dan status aktif/nonaktif.
              Jika status dibuat nonaktif, shift tersebut sebaiknya tidak
              digunakan untuk karyawan baru.
            </p>
          </div>

          <div className="mt-8">
            <label className="text-sm font-black text-slate-500">
              Nama Shift
            </label>

            <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search
                  size={20}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari nama shift..."
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={resetFilter}
                className="flex h-[54px] items-center justify-center rounded-2xl border border-blue-100 bg-white px-5 text-[#123c8c] shadow-sm transition hover:bg-blue-50 active:scale-[0.96]"
                title="Reset Filter"
              >
                <RefreshCw size={22} strokeWidth={2.6} />
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-black text-amber-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.3fr_1.4fr_1fr_1fr_1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c] md:grid">
              <p>#</p>
              <p>Shift</p>
              <p>Toleransi Telat</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50 bg-white">
              {isLoading ? (
                <div className="px-5 py-10 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
                  <p className="mt-3 text-sm font-black text-slate-600">
                    Mengambil data shift...
                  </p>
                </div>
              ) : filteredShifts.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Data shift tidak ditemukan.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba ubah filter pencarian.
                  </p>
                </div>
              ) : (
                filteredShifts.map((shift, index) => (
                  <div
                    key={shift.id}
                    className="grid gap-4 px-4 py-4 text-sm transition hover:bg-[#f8fbff] md:grid-cols-[0.3fr_1.4fr_1fr_1fr_1fr] md:items-center md:px-5 md:py-6"
                  >
                    <div className="flex items-start justify-between gap-3 md:block">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-xs font-black text-[#123c8c] md:h-auto md:w-auto md:bg-transparent md:text-sm md:text-slate-500">
                          {index + 1}
                        </div>

                        <div className="md:hidden">
                          <p className="font-black uppercase text-slate-950">
                            {shift.name}
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Toleransi {shift.tolerance_minutes || 0} menit
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black md:hidden ${
                          shift.status === "active"
                            ? "bg-blue-50 text-[#123c8c]"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {formatStatus(shift.status)}
                      </span>
                    </div>

                    <div className="hidden md:block">
                      <p className="font-black uppercase text-slate-950">
                        {shift.name}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 md:contents">
                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 md:border-0 md:bg-transparent md:p-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 md:hidden">
                          Toleransi
                        </p>
                        <p className="mt-1 font-black text-slate-600 md:mt-0">
                          {shift.tolerance_minutes || 0} Menit
                        </p>
                      </div>

                      <div className="hidden md:block">
                        <span
                          className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
                            shift.status === "active"
                              ? "bg-blue-50 text-[#123c8c]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(shift.status)}
                        </span>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 md:hidden">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
                          Status
                        </p>
                        <p
                          className={`mt-1 font-black ${
                            shift.status === "active"
                              ? "text-[#123c8c]"
                              : "text-slate-600"
                          }`}
                        >
                          {formatStatus(shift.status)}
                        </p>
                      </div>
                    </div>

                    <div className="md:flex md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(shift)}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.97] md:h-auto md:w-fit md:rounded-xl md:border md:border-blue-100 md:bg-white md:px-4 md:py-2 md:text-xs md:text-[#123c8c] md:shadow-none md:hover:bg-[#eaf1ff]"
                      >
                        <Edit size={16} className="md:h-3.5 md:w-3.5" />
                        Edit Shift
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {isModalOpen && editingShift ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Edit Shift
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Edit Status & Toleransi
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Nama shift tidak dapat diubah.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Nama Shift
                </label>

                <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-black uppercase text-slate-700">
                  {editingShift.name}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Toleransi Telat
                </label>

                <input
                  type="number"
                  min={0}
                  value={form.tolerance_minutes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tolerance_minutes: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Status Shift
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Pilih Nonaktif jika shift tidak ingin digunakan sementara.
                </p>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Menyimpan..." : "Update Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <BottomNav variant="admin" />
    </MobileShell>
  );
}