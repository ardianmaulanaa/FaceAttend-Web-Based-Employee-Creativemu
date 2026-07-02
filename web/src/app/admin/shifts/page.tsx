"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Edit,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Shift = {
  id: string;
  name: string;
  toleranceMinutes: number;
  status: "active" | "inactive";
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

type ShiftForm = {
  name: string;
  toleranceMinutes: string;
  status: "active" | "inactive";
};

const initialForm: ShiftForm = {
  name: "",
  toleranceMinutes: "0",
  status: "active",
};

export default function AdminShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>(defaultShifts);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
  const [form, setForm] = useState<ShiftForm>(initialForm);

  useEffect(() => {
    const savedShifts = localStorage.getItem("faceattend_shifts");

    if (savedShifts) {
      try {
        setShifts(JSON.parse(savedShifts));
      } catch {
        setShifts(defaultShifts);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("faceattend_shifts", JSON.stringify(shifts));
  }, [shifts]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) =>
      shift.name.toLowerCase().includes(search.toLowerCase()),
    );
  }, [shifts, search]);

  function resetFilter() {
    setSearch("");
  }

  function openAddModal() {
    setEditingShiftId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(shift: Shift) {
    setEditingShiftId(shift.id);
    setForm({
      name: shift.name,
      toleranceMinutes: String(shift.toleranceMinutes),
      status: shift.status,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingShiftId(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim().toUpperCase();
    const toleranceMinutes = Number(form.toleranceMinutes || 0);

    if (!name) {
      alert("Nama shift wajib diisi.");
      return;
    }

    if (!Number.isFinite(toleranceMinutes) || toleranceMinutes < 0) {
      alert("Toleransi telat tidak valid.");
      return;
    }

    const isDuplicate = shifts.some(
      (shift) =>
        shift.name.toLowerCase() === name.toLowerCase() &&
        shift.id !== editingShiftId,
    );

    if (isDuplicate) {
      alert("Nama shift sudah ada.");
      return;
    }

    if (editingShiftId) {
      setShifts((prev) =>
        prev.map((shift) =>
          shift.id === editingShiftId
            ? {
                ...shift,
                name,
                toleranceMinutes,
                status: form.status,
              }
            : shift,
        ),
      );
    } else {
      setShifts((prev) => [
        ...prev,
        {
          id: `shift-${Date.now()}`,
          name,
          toleranceMinutes,
          status: form.status,
        },
      ]);
    }

    closeModal();
  }

  function toggleShiftStatus(id: string) {
    setShifts((prev) =>
      prev.map((shift) =>
        shift.id === id
          ? {
              ...shift,
              status: shift.status === "active" ? "inactive" : "active",
            }
          : shift,
      ),
    );
  }

  function deleteShift(id: string) {
    const confirmed = confirm("Yakin ingin menghapus shift ini?");

    if (!confirmed) return;

    setShifts((prev) => prev.filter((shift) => shift.id !== id));
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Shift"
        subtitle="Kelola master data shift karyawan"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="rounded-[2rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Presensi Admin Panel
              </p>

              <h1 className="mt-2 text-3xl font-black uppercase tracking-tight text-slate-950">
                Daftar Shift
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Beranda / Manajemen Shift / Daftar Shift
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} />
              Tambah Shift
            </button>
          </div>

          <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-full md:max-w-md">
              <label className="mb-2 block text-xs font-black text-slate-500">
                Nama Shift
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nama Shift..."
                  className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>
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

          <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.25fr_1.3fr_1.2fr_1fr_1.1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>#</p>
              <p>Shift</p>
              <p>Toleransi Telat</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50 bg-white">
              {filteredShifts.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Data shift tidak ditemukan.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba ubah kata kunci pencarian.
                  </p>
                </div>
              ) : (
                filteredShifts.map((shift, index) => (
                  <div
                    key={shift.id}
                    className="grid gap-4 px-5 py-5 text-sm transition hover:bg-[#f8fbff] md:grid-cols-[0.25fr_1.3fr_1.2fr_1fr_1.1fr] md:items-center"
                  >
                    <p className="font-black text-slate-500">{index + 1}</p>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] md:hidden">
                        <Clock3 size={18} strokeWidth={2.7} />
                      </div>

                      <p className="font-black text-slate-800">{shift.name}</p>
                    </div>

                    <p className="font-semibold text-slate-600">
                      {shift.toleranceMinutes} Menit
                    </p>

                    <button
                      type="button"
                      onClick={() => toggleShiftStatus(shift.id)}
                      className={`flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black transition ${
                        shift.status === "active"
                          ? "bg-blue-50 text-[#123c8c]"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`h-4 w-7 rounded-full p-0.5 transition ${
                          shift.status === "active"
                            ? "bg-[#123c8c]"
                            : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`block h-3 w-3 rounded-full bg-white transition ${
                            shift.status === "active"
                              ? "translate-x-3"
                              : "translate-x-0"
                          }`}
                        />
                      </span>
                      {shift.status === "active" ? "Aktif" : "Nonaktif"}
                    </button>

                    <div className="flex gap-2 md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(shift)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-xs font-black text-[#123c8c] transition hover:bg-[#eaf1ff]"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteShift(shift.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
                      >
                        <Trash2 size={14} />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="w-full max-w-lg rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  {editingShiftId ? "Edit Shift" : "Tambah Shift"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingShiftId ? "Edit Data Shift" : "Tambah Shift Baru"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Isi nama shift dan toleransi keterlambatan.
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

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Contoh: MAGANG"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Toleransi Telat
                </label>

                <input
                  type="number"
                  min={0}
                  value={form.toleranceMinutes}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      toleranceMinutes: event.target.value,
                    }))
                  }
                  placeholder="0"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Isi dalam satuan menit.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as "active" | "inactive",
                    }))
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>
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
                  className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
                >
                  {editingShiftId ? "Update Shift" : "Simpan Shift"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav variant="admin" />
    </MobileShell>
  );
}