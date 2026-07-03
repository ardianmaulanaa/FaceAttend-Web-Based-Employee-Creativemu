"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit,
  Loader2,
  Network,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Unit = {
  id: string;
  name: string;
  status: string;
};

type Department = {
  id: string;
  name: string;
  unit_id: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  unit?: Unit | null;
  _count?: {
    users: number;
  };
};

type DepartmentForm = {
  name: string;
  unit_id: string;
  status: string;
};

const initialForm: DepartmentForm = {
  name: "",
  unit_id: "",
  status: "active",
};

const statusOptions = [
  {
    value: "all",
    label: "Semua Status",
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

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [unitFilter, setUnitFilter] = useState("all");
  const [form, setForm] = useState<DepartmentForm>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] =
    useState<Department | null>(null);

  const activeUnits = useMemo(() => {
    return units.filter((unit) => unit.status === "active");
  }, [units]);

  const filteredDepartments = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return departments.filter((department) => {
      const departmentName = department.name.toLowerCase();
      const unitName = department.unit?.name?.toLowerCase() || "";
      const departmentStatus = department.status.toLowerCase();

      if (
        keyword &&
        !departmentName.includes(keyword) &&
        !unitName.includes(keyword)
      ) {
        return false;
      }

      if (statusFilter !== "all" && departmentStatus !== statusFilter) {
        return false;
      }

      if (unitFilter !== "all") {
        if (unitFilter === "none" && department.unit_id) {
          return false;
        }

        if (unitFilter !== "none" && department.unit_id !== unitFilter) {
          return false;
        }
      }

      return true;
    });
  }, [departments, search, statusFilter, unitFilter]);

  async function loadDepartments() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/departments", {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal mengambil divisi.",
        );
      }

      setDepartments(data.departments || data.data || []);
      setUnits(data.units || []);
    } catch (error) {
      console.error("LOAD_DEPARTMENTS_ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data divisi.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDepartments();
  }, []);

  function openCreateModal() {
    setEditingDepartment(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(department: Department) {
    setEditingDepartment(department);
    setForm({
      name: department.name,
      unit_id: department.unit_id || "",
      status: department.status || "active",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingDepartment(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function resetFilter() {
    setSearch("");
    setStatusFilter("all");
    setUnitFilter("all");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();

    if (!name) {
      alert("Nama divisi wajib diisi.");
      return;
    }

    if (!["active", "inactive"].includes(form.status)) {
      alert("Status divisi tidak valid.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/admin/departments", {
        method: editingDepartment ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingDepartment?.id,
          name,
          unit_id: form.unit_id || "",
          status: form.status,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal menyimpan divisi.",
        );
      }

      await loadDepartments();
      closeModal();
    } catch (error) {
      console.error("SAVE_DEPARTMENT_ERROR:", error);

      alert(error instanceof Error ? error.message : "Gagal menyimpan divisi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteDepartment(department: Department) {
    if ((department._count?.users || 0) > 0) {
      alert(
        "Divisi ini masih digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Yakin ingin menghapus divisi "${department.name}"? Data yang dihapus tidak bisa dikembalikan.`,
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/admin/departments?id=${department.id}`, {
        method: "DELETE",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menghapus divisi.");
      }

      alert("Divisi berhasil dihapus.");
      await loadDepartments();
    } catch (error) {
      console.error("DELETE_DEPARTMENT_ERROR:", error);

      alert(error instanceof Error ? error.message : "Gagal menghapus divisi.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Divisi"
        subtitle="Kelola master data divisi perusahaan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl shadow-slate-300/30">
          <div className="bg-[#123c8c] p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                  Presensi Admin Panel
                </p>

                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  Daftar Divisi
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                  Divisi digunakan untuk mengelompokkan karyawan berdasarkan
                  bagian kerja di dalam unit perusahaan.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 active:scale-[0.98]"
              >
                <Plus size={18} />
                Tambah Divisi
              </button>
            </div>
          </div>

          <div className="p-5 md:p-8">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_auto]">
              <div>
                <label className="text-sm font-black text-slate-500">
                  Nama Divisi
                </label>

                <div className="relative mt-3">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari nama divisi atau unit..."
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-500">
                  Filter Unit
                </label>

                <select
                  value={unitFilter}
                  onChange={(event) => setUnitFilter(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="all">Semua Unit</option>
                  <option value="none">Tanpa Unit</option>
                  {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-black text-slate-500">
                  Filter Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  {statusOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={loadDepartments}
                  className="flex h-[54px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.96] md:flex-none"
                >
                  <RefreshCw size={20} strokeWidth={2.6} />
                  <span className="md:hidden">Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={resetFilter}
                  className="flex h-[54px] flex-1 items-center justify-center rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#123c8c] shadow-sm transition hover:bg-blue-50 active:scale-[0.96] md:flex-none"
                >
                  Reset
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100">
              <div className="hidden grid-cols-[0.3fr_1.3fr_1.1fr_0.8fr_1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c] md:grid">
                <p>#</p>
                <p>Divisi</p>
                <p>Unit</p>
                <p>Status</p>
                <p className="text-center">Aksi</p>
              </div>

              <div className="divide-y divide-blue-50 bg-white">
                {isLoading ? (
                  <div className="px-5 py-10 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
                    <p className="mt-3 text-sm font-black text-slate-600">
                      Mengambil data divisi...
                    </p>
                  </div>
                ) : filteredDepartments.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Network className="mx-auto text-slate-300" size={36} />
                    <p className="mt-3 font-black text-slate-700">
                      Data divisi tidak ditemukan.
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Tambahkan divisi baru atau ubah filter pencarian.
                    </p>
                  </div>
                ) : (
                  filteredDepartments.map((department, index) => (
                    <div
                      key={department.id}
                      className="grid gap-4 px-4 py-4 text-sm transition hover:bg-[#f8fbff] md:grid-cols-[0.3fr_1.3fr_1.1fr_0.8fr_1fr] md:items-center md:px-5 md:py-6"
                    >
                      <div className="flex items-start justify-between gap-3 md:block">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-xs font-black text-[#123c8c] md:h-auto md:w-auto md:bg-transparent md:text-sm md:text-slate-500">
                            {index + 1}
                          </div>

                          <div className="md:hidden">
                            <p className="font-black uppercase text-slate-950">
                              {department.name}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {department.unit?.name || "Tanpa Unit"} •{" "}
                              {department._count?.users || 0} karyawan
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black md:hidden ${
                            department.status === "active"
                              ? "bg-blue-50 text-[#123c8c]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(department.status)}
                        </span>
                      </div>

                      <div className="hidden md:block">
                        <p className="font-black uppercase text-slate-950">
                          {department.name}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {department._count?.users || 0} karyawan
                        </p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 md:border-0 md:bg-transparent md:p-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 md:hidden">
                          Unit
                        </p>

                        <p className="mt-1 font-black text-slate-600 md:mt-0">
                          {department.unit?.name || "Tanpa Unit"}
                        </p>
                      </div>

                      <div className="hidden md:block">
                        <span
                          className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
                            department.status === "active"
                              ? "bg-blue-50 text-[#123c8c]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(department.status)}
                        </span>
                      </div>

                      <div className="grid gap-2 md:flex md:justify-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(department)}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.97] md:h-auto md:w-fit md:rounded-xl md:border md:border-blue-100 md:bg-white md:px-4 md:py-2 md:text-xs md:text-[#123c8c] md:shadow-none md:hover:bg-[#eaf1ff]"
                        >
                          <Edit size={16} className="md:h-3.5 md:w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteDepartment(department)}
                          disabled={isDeleting || (department._count?.users || 0) > 0}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-600 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:h-auto md:w-fit md:rounded-xl md:px-4 md:py-2 md:text-xs"
                          title={
                            (department._count?.users || 0) > 0
                              ? "Divisi masih digunakan karyawan"
                              : "Hapus divisi"
                          }
                        >
                          {isDeleting ? (
                            <Loader2
                              size={16}
                              className="animate-spin md:h-3.5 md:w-3.5"
                            />
                          ) : (
                            <Trash2 size={16} className="md:h-3.5 md:w-3.5" />
                          )}
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  {editingDepartment ? "Edit Divisi" : "Tambah Divisi"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingDepartment ? "Update Data Divisi" : "Divisi Baru"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Hubungkan divisi dengan unit perusahaan.
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
                  Nama Divisi
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Customer Service, HRD, Finance"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Unit
                </label>

                <select
                  value={form.unit_id}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      unit_id: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="">Tanpa Unit</option>
                  {activeUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Unit aktif saja yang bisa dipilih untuk divisi baru.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Status Divisi
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
                  Pilih Nonaktif jika divisi tidak digunakan sementara.
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
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingDepartment
                      ? "Update Divisi"
                      : "Tambah Divisi"}
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