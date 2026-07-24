"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Edit,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import {
  AppButton,
  AppCard,
  AppEmptyState,
  AppInput,
  AppSelect,
} from "@/components/ui/AppUI";

type EmploymentStatus = {
  id: string;
  name: string;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type EmploymentStatusForm = {
  name: string;
  status: string;
};

const initialForm: EmploymentStatusForm = {
  name: "",
  status: "active",
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

export default function EmploymentStatusPage() {
  const [statuses, setStatuses] = useState<EmploymentStatus[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState<EmploymentStatusForm>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<EmploymentStatus | null>(null);

  async function loadStatuses() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/employment-statuses", {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal mengambil status kepegawaian.");
      }

      setStatuses(data.statuses || []);
    } catch (error) {
      console.error("LOAD_STATUSES_ERROR:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengambil data status kepegawaian."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStatuses();
  }, []);

  const filteredStatuses = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return statuses.filter((item) => {
      const nameMatch = item.name.toLowerCase().includes(keyword);
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [search, statusFilter, statuses]);

  function openAddModal() {
    setEditingStatus(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(item: EmploymentStatus) {
    setEditingStatus(item);
    setForm({
      name: item.name,
      status: item.status,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingStatus(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      alert("Nama status kepegawaian wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      const url = "/api/admin/employment-statuses";
      const method = editingStatus ? "PATCH" : "POST";
      const bodyPayload = editingStatus
        ? { id: editingStatus.id, name, status: form.status }
        : { name, status: form.status };

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

      await loadStatuses();
      closeModal();
    } catch (error) {
      console.error("SAVE_STATUS_ERROR:", error);
      alert(error instanceof Error ? error.message : "Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(item: EmploymentStatus) {
    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus status kepegawaian "${item.name}"?`
    );

    if (!confirmed) return;

    try {
      setIsLoading(true);

      const response = await fetch(`/api/admin/employment-statuses?id=${item.id}`, {
        method: "DELETE",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menghapus data.");
      }

      await loadStatuses();
    } catch (error) {
      console.error("DELETE_STATUS_ERROR:", error);
      alert(error instanceof Error ? error.message : "Gagal menghapus data.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <MotionStyles />

      <AppHeader title="Status Kepegawaian" variant="admin" />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="page-enter rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Master Data Admin Panel
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                STATUS KEPEGAWAIAN
              </h1>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:items-center">
              <AppButton
                onClick={openAddModal}
                className="w-full sm:w-auto"
              >
                <Plus size={18} className="mr-2" />
                Tambah Status
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
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari status kepegawaian..."
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                {filterOptions.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
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
                  Memuat data status kepegawaian...
                </p>
              </div>
            ) : filteredStatuses.length === 0 ? (
              <AppEmptyState
                title="Tidak Ada Data"
                description={
                  search
                    ? "Tidak ada status kepegawaian yang cocok dengan pencarian Anda."
                    : "Belum ada data status kepegawaian yang ditambahkan."
                }
              />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredStatuses.map((item, index) => (
                  <div
                    key={item.id}
                    className="row-enter rounded-3xl border border-blue-50/50 bg-[#fbfdff] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-100 hover:bg-white hover:shadow-md hover:shadow-blue-900/5"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                          <BadgeCheck size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-slate-800 text-base">
                            {item.name}
                          </h3>
                          <span
                            className={`mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-black uppercase tracking-wider ${statusClass(
                              item.status
                            )}`}
                          >
                            {formatStatus(item.status)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEditModal(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-50 bg-white text-[#123c8c] shadow-sm hover:bg-blue-50 transition"
                          title="Ubah"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100 transition"
                          title="Hapus"
                        >
                          <Trash2 size={16} />
                        </button>
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

          <div className="modal-panel relative w-full max-w-md rounded-[2.5rem] border border-white bg-white p-6 shadow-2xl md:p-8">
            <button
              onClick={closeModal}
              className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-black text-slate-950">
              {editingStatus ? "Ubah Status Kepegawaian" : "Tambah Status Kepegawaian"}
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {editingStatus
                ? "Perbarui nama atau status kepegawaian terpilih."
                : "Masukkan nama status kepegawaian baru untuk disimpan."}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Nama Status Kepegawaian
                </label>
                <AppInput
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  placeholder="Contoh: Tetap, Kontrak, Freelance"
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
