"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Clock3,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import {
  AppButton,
  AppEmptyState,
  AppInput,
  AppSelect,
} from "@/components/ui/AppUI";

type Shift = {
  id: string;
  name: string;
  tolerance_minutes?: number;
  check_in_open?: string;
  check_out_open?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  _count?: {
    users?: number;
    work_schedules?: number;
  };
};

type ShiftForm = {
  name: string;
  status: string;
  tolerance_minutes: number;
  check_in_open: string;
  check_out_open: string;
};

const initialForm: ShiftForm = {
  name: "",
  status: "active",
  tolerance_minutes: 5,
  check_in_open: "07:00",
  check_out_open: "16:50",
};

const filterOptions = [
  { value: "all", label: "Semua Status" },
  { value: "active", label: "Status Aktif" },
  { value: "inactive", label: "Status Nonaktif" },
];

function formatStatus(status: string) {
  if (status === "active") return "Aktif";
  if (status === "inactive") return "Nonaktif";
  return status;
}

function statusClass(status: string) {
  return status === "active"
    ? "bg-blue-50 text-[#123c8c]"
    : "bg-slate-100 text-slate-600";
}

async function readJsonResponse(response: Response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function MotionStyles() {
  return (
    <style>{`
      @keyframes enter {
        0% { opacity: 0; transform: translateY(14px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes rowEnter {
        0% { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes backdrop {
        0% { opacity: 0; }
        100% { opacity: 1; }
      }
      @keyframes panel {
        0% { opacity: 0; transform: translateY(16px) scale(0.985); }
        100% { opacity: 1; transform: translateY(0) scale(1); }
      }
      .page-enter {
        animation: enter 320ms ease-out both;
      }
      .row-enter {
        opacity: 0;
        animation: rowEnter 300ms ease-out both;
      }
      .modal-backdrop {
        animation: backdrop 180ms ease-out both;
      }
      .modal-panel {
        animation: panel 260ms ease-out both;
        transform-origin: center bottom;
      }
      @media (prefers-reduced-motion: reduce) {
        .page-enter, .row-enter, .modal-backdrop, .modal-panel {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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
        throw new Error(
          data.error || data.message || "Gagal mengambil data shift.",
        );
      }

      setShifts(data.shifts || data.data || []);
    } catch (error) {
      console.error("LOAD_SHIFTS_ERROR:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengambil data shift.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadShifts();
  }, []);

  const filteredShifts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return shifts.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(keyword);
      const statusMatch =
        statusFilter === "all" || item.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [shifts, search, statusFilter]);

  function openAddModal() {
    setEditingShift(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(item: Shift) {
    setEditingShift(item);
    setForm({
      name: item.name,
      status: item.status,
      tolerance_minutes: item.tolerance_minutes ?? 5,
      check_in_open: item.check_in_open || "07:00",
      check_out_open: item.check_out_open || "16:50",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingShift(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      alert("Nama shift wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      const url = "/api/admin/shifts";
      const method = editingShift ? "PATCH" : "POST";
      const bodyPayload = {
        ...(editingShift ? { id: editingShift.id } : {}),
        name,
        status: form.status,
        tolerance_minutes: form.tolerance_minutes,
        check_in_open: form.check_in_open,
        check_out_open: form.check_out_open,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menyimpan data.");
      }

      await loadShifts();
      closeModal();
    } catch (error) {
      console.error("SAVE_SHIFT_ERROR:", error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: Shift) {
    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus shift "${item.name}"?`,
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/shifts?id=${item.id}`, {
        method: "DELETE",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menghapus data.");
      }

      await loadShifts();
    } catch (error) {
      console.error("DELETE_SHIFT_ERROR:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus data.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <MotionStyles />

      <AppHeader title="Shift Kerja" variant="admin" />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="page-enter rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-8">
          <div className="flex flex-col items-center text-center gap-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Master Data Admin Panel
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                SHIFT KERJA
              </h1>
            </div>

            <div className="flex w-full justify-center">
              <AppButton
                onClick={openAddModal}
                leftIcon={<Plus size={18} />}
                className="w-full sm:w-auto shrink-0 whitespace-nowrap"
              >
                Tambah Shift
              </AppButton>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                suppressHydrationWarning
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari shift kerja..."
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div className="relative">
              <select
                suppressHydrationWarning
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3.5 pl-4 pr-10 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
              >
                {filterOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>

          {errorMessage ? (
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold text-amber-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-8">
            {isLoading ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center gap-3">
                <Loader2 size={36} className="animate-spin text-[#123c8c]" />
                <p className="text-sm font-bold text-slate-500">
                  Memuat data shift...
                </p>
              </div>
            ) : filteredShifts.length === 0 ? (
              <AppEmptyState
                title="Tidak Ada Data"
                description={
                  search
                    ? "Tidak ada shift kerja yang cocok dengan pencarian Anda."
                    : "Belum ada data shift kerja yang ditambahkan."
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {filteredShifts.map((item, index) => (
                  <div
                    key={item.id}
                    className="row-enter rounded-3xl border border-blue-50/50 bg-[#fbfdff] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:bg-white hover:shadow-md hover:shadow-blue-900/5"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                          <Clock3 size={20} />
                        </div>
                        <div>
                          <h3 className="text-base font-black text-slate-800">
                            {item.name}
                          </h3>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusClass(item.status)}`}
                            >
                              {formatStatus(item.status)}
                            </span>
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                              {item._count?.users ?? 0} Karyawan
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-blue-50 bg-white text-[#123c8c] shadow-sm transition hover:bg-blue-50"
                          title="Ubah"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 bg-rose-50/50 text-rose-600 transition hover:bg-rose-100"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Shift settings */}
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between rounded-xl bg-blue-50/40 px-3 py-2">
                        <span className="text-xs font-bold text-slate-500">Check-in Dibuka</span>
                        <span className="text-sm font-black text-[#123c8c]">
                          {item.check_in_open || "07:00"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-blue-50/40 px-3 py-2">
                        <span className="text-xs font-bold text-slate-500">Check-out Dibuka</span>
                        <span className="text-sm font-black text-[#123c8c]">
                          {item.check_out_open || "16:50"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-xl bg-blue-50/40 px-3 py-2">
                        <span className="text-xs font-bold text-slate-500">Toleransi Telat</span>
                        <span className="text-sm font-black text-slate-800">
                          {item.tolerance_minutes ?? 0} menit
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Modal Dialog Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="modal-backdrop absolute inset-0 bg-slate-900/60"
            onClick={closeModal}
          />

          <div className="modal-panel relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-white bg-white p-6 shadow-2xl md:p-8">
            <button
              onClick={closeModal}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-slate-950">
              {editingShift ? "Ubah Shift Kerja" : "Tambah Shift Kerja"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {editingShift
                ? "Perbarui pengaturan shift terpilih."
                : "Masukkan nama shift kerja baru untuk disimpan."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Nama Shift Kerja
                </label>
                <AppInput
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Contoh: Utama, Magang, Shift Pagi"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Status
                </label>
                <AppSelect
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value }))
                  }
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </AppSelect>
              </div>

              <hr className="border-slate-100" />

              <p className="text-xs font-black uppercase tracking-widest text-[#123c8c]">
                Pengaturan Shift
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-600">
                    Check-in Dibuka
                  </label>
                  <input
                    type="time"
                    value={form.check_in_open}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        check_in_open: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-black text-slate-600">
                    Check-out Dibuka
                  </label>
                  <input
                    type="time"
                    value={form.check_out_open}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        check_out_open: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-3.5 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-black text-slate-600">
                  Toleransi Keterlambatan (menit)
                </label>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={form.tolerance_minutes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      tolerance_minutes: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  Batal
                </AppButton>
                <AppButton type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="mr-2 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan"
                  )}
                </AppButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
