"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit,
  Loader2,
  MapPin,
  Network,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Office = {
  id: string;
  name: string;
  address?: string | null;
  status?: string;
};

type Department = {
  id: string;
  name: string;
  office_id: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  office?: Office | null;
  _count?: {
    users: number;
    jabatans: number;
  };
};

type DepartmentForm = {
  name: string;
  office_id: string;
  status: string;
};

const initialForm: DepartmentForm = {
  name: "",
  office_id: "",
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

function DepartmentMotionStyles() {
  return (
    <style>{`
      @keyframes departmentEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes departmentRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes departmentModalBackdrop {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }

      @keyframes departmentModalPanel {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .department-enter {
        animation: departmentEnter 320ms ease-out both;
      }

      .department-row-enter {
        opacity: 0;
        animation: departmentRowEnter 300ms ease-out both;
      }

      .department-modal-backdrop {
        animation: departmentModalBackdrop 180ms ease-out both;
      }

      .department-modal-panel {
        animation: departmentModalPanel 260ms ease-out both;
        transform-origin: center bottom;
      }

      .department-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .department-enter,
        .department-row-enter,
        .department-modal-backdrop,
        .department-modal-panel {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [form, setForm] = useState<DepartmentForm>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(
    null,
  );

  const activeOffices = useMemo(() => {
    return offices.filter((office) => office.status !== "inactive");
  }, [offices]);

  const filteredDepartments = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return departments.filter((department) => {
      const departmentName = department.name.toLowerCase();
      const officeName = department.office?.name?.toLowerCase() || "";
      const officeAddress = department.office?.address?.toLowerCase() || "";
      const departmentStatus = department.status.toLowerCase();
      const departmentOfficeId =
        department.office_id || department.office?.id || "";

      if (
        keyword &&
        !departmentName.includes(keyword) &&
        !officeName.includes(keyword) &&
        !officeAddress.includes(keyword)
      ) {
        return false;
      }

      if (statusFilter !== "all" && departmentStatus !== statusFilter) {
        return false;
      }

      if (officeFilter !== "all") {
        if (officeFilter === "none" && departmentOfficeId) return false;

        if (officeFilter !== "none" && departmentOfficeId !== officeFilter) {
          return false;
        }
      }

      return true;
    });
  }, [departments, search, statusFilter, officeFilter]);

  async function loadDepartments() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = new URLSearchParams({
        search,
        status: statusFilter,
        office_id: officeFilter,
      });

      const response = await fetch(
        `/api/admin/departments?${params.toString()}`,
        {
          cache: "no-store",
        },
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal mengambil divisi.",
        );
      }

      setDepartments(data.departments || data.data || []);
      setOffices(data.offices || []);
    } catch (error) {
      console.error("LOAD_DEPARTMENTS_ERROR:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengambil data divisi.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      office_id: department.office_id || department.office?.id || "",
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
    setOfficeFilter("all");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();

    if (!form.office_id) {
      alert("Kantor wajib dipilih.");
      return;
    }

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
          office_id: form.office_id,
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
    const totalUsers = department._count?.users || 0;
    const totalJabatans = department._count?.jabatans || 0;

    if (totalUsers > 0 || totalJabatans > 0) {
      alert(
        "Divisi ini masih memiliki jabatan atau digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Yakin ingin menghapus divisi "${department.name}"? Data yang dihapus tidak bisa dikembalikan.`,
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(
        `/api/admin/departments?id=${department.id}`,
        {
          method: "DELETE",
        },
      );

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal menghapus divisi.",
        );
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
      <DepartmentMotionStyles />

      <AppHeader title="Daftar Divisi" variant="admin" />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        <div className="department-enter overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-xl shadow-slate-300/30">
          <div className="bg-[#123c8c] p-6 text-white md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
                  Daftar Divisi
                </h1>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 active:scale-[0.98]"
              >
                <Plus size={18} />
                Tambah Divisi
              </button>
            </div>
          </div>

          <div className="p-5 md:p-8">
            <div
              className="department-row-enter grid gap-3 md:grid-cols-[1fr_230px_210px_auto]"
              style={{ animationDelay: "80ms" }}
            >
              <div>
                <label className="text-sm font-black text-slate-500">
                  Nama Divisi / Kantor
                </label>

                <div className="relative mt-3">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari divisi atau kantor..."
                    className="department-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-500">
                  Filter Kantor
                </label>

                <select
                  value={officeFilter}
                  onChange={(event) => setOfficeFilter(event.target.value)}
                  className="department-field mt-3 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="all">Semua Kantor</option>
                  <option value="none">Tanpa Kantor</option>
                  {offices.map((office) => (
                    <option key={office.id} value={office.id}>
                      {office.name}
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
                  className="department-field mt-3 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                  onClick={resetFilter}
                  className="flex h-[54px] flex-1 items-center justify-center rounded-2xl border border-blue-100 bg-white px-5 text-sm font-black text-[#123c8c] shadow-sm transition hover:bg-blue-50 active:scale-[0.96] md:flex-none"
                >
                  Atur Ulang
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="department-row-enter mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-black text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div
              className="department-row-enter mt-8 overflow-hidden rounded-2xl border border-blue-100"
              style={{ animationDelay: "130ms" }}
            >
              <div className="hidden grid-cols-[0.3fr_1.3fr_1.2fr_0.75fr_0.75fr_1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c] md:grid">
                <p>#</p>
                <p>Divisi</p>
                <p>Kantor</p>
                <p>Jabatan</p>
                <p>Status</p>
                <p className="text-center">Aksi</p>
              </div>

              <div className="divide-y divide-blue-50 bg-white">
                {isLoading ? (
                  <div className="department-row-enter px-5 py-10 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
                    <p className="mt-3 text-sm font-black text-slate-600">
                      Mengambil data divisi...
                    </p>
                  </div>
                ) : filteredDepartments.length === 0 ? (
                  <div className="department-row-enter px-5 py-10 text-center">
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
                      className="department-row-enter grid gap-4 px-4 py-4 text-sm transition duration-200 hover:bg-[#f8fbff] md:grid-cols-[0.3fr_1.3fr_1.2fr_0.75fr_0.75fr_1fr] md:items-center md:px-5 md:py-6"
                      style={{
                        animationDelay: `${index * 55}ms`,
                      }}
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
                              {department.office?.name || "Tanpa Kantor"} •{" "}
                              {department._count?.jabatans || 0} jabatan •{" "}
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
                          Kantor
                        </p>

                        <p className="mt-1 font-black text-slate-600 md:mt-0">
                          {department.office?.name || "Tanpa Kantor"}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">
                          {department.office?.address || ""}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 md:border-0 md:bg-transparent md:p-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 md:hidden">
                          Jabatan
                        </p>

                        <p className="mt-1 font-black text-slate-600 md:mt-0">
                          {department._count?.jabatans || 0}
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
                          disabled={
                            isDeleting ||
                            (department._count?.users || 0) > 0 ||
                            (department._count?.jabatans || 0) > 0
                          }
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-sm font-black text-red-600 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:h-auto md:w-fit md:rounded-xl md:px-4 md:py-2 md:text-xs"
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
        <div className="department-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 md:items-center md:pb-0">
          <div className="department-modal-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  {editingDepartment ? "Edit Divisi" : "Tambah Divisi"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingDepartment ? "Update Data Divisi" : "Divisi Baru"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pilih kantor pemilik divisi, lalu isi nama divisi.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="department-row-enter">
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Kantor
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <select
                    value={form.office_id}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        office_id: event.target.value,
                      }))
                    }
                    className="department-field w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                  >
                    <option value="">Pilih Kantor</option>
                    {activeOffices.map((office) => (
                      <option key={office.id} value={office.id}>
                        {office.name}
                        {office.address ? ` - ${office.address}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div
                className="department-row-enter"
                style={{ animationDelay: "40ms" }}
              >
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
                  placeholder="Contoh: Technology, Finance, HRD"
                  className="department-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div
                className="department-row-enter"
                style={{ animationDelay: "80ms" }}
              >
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
                  className="department-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </select>

                <p className="mt-2 text-xs font-semibold text-slate-400">
                  Pilih Nonaktif jika divisi tidak digunakan sementara.
                </p>
              </div>

              <div
                className="department-row-enter rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4"
                style={{ animationDelay: "120ms" }}
              >
                <p className="text-sm font-black text-[#123c8c]">
                  Relasi Divisi
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Divisi berada langsung di bawah kantor. Contoh: Kantor Pusat
                  Bandung → Technology → Backend Development → Backend
                  Developer.
                </p>
              </div>

              <div
                className="department-row-enter flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end"
                style={{ animationDelay: "160ms" }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                >
                  Batal
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
