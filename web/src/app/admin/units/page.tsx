"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Edit,
  Loader2,
  MapPin,
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
  office?: Office | null;
};

type Unit = {
  id: string;
  name: string;
  department_id: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  department?: Department | null;
  _count?: {
    users: number;
    positions: number;
  };
};

type UnitForm = {
  name: string;
  office_id: string;
  department_id: string;
  status: string;
};

const initialForm: UnitForm = {
  name: "",
  office_id: "",
  department_id: "",
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

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [form, setForm] = useState<UnitForm>(initialForm);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  const activeOffices = useMemo(() => {
    return offices.filter((office) => office.status !== "inactive");
  }, [offices]);

  const activeDepartments = useMemo(() => {
    return departments.filter((department) => department.status === "active");
  }, [departments]);

  const formDepartments = useMemo(() => {
    if (!form.office_id) return [];

    return activeDepartments.filter((department) => {
      const officeId = department.office_id || department.office?.id || "";

      return officeId === form.office_id;
    });
  }, [activeDepartments, form.office_id]);

  const filteredDepartmentsForFilter = useMemo(() => {
    return departments.filter((department) => {
      const officeId = department.office_id || department.office?.id || "";

      if (officeFilter === "all") return true;
      if (officeFilter === "none") return !officeId;

      return officeId === officeFilter;
    });
  }, [departments, officeFilter]);

  const filteredUnits = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return units.filter((unit) => {
      const unitName = unit.name.toLowerCase();
      const unitStatus = unit.status.toLowerCase();
      const departmentName = unit.department?.name?.toLowerCase() || "";
      const officeName = unit.department?.office?.name?.toLowerCase() || "";
      const officeAddress =
        unit.department?.office?.address?.toLowerCase() || "";

      const unitOfficeId =
        unit.department?.office_id || unit.department?.office?.id || "";
      const unitDepartmentId =
        unit.department_id || unit.department?.id || "";

      if (
        keyword &&
        !unitName.includes(keyword) &&
        !departmentName.includes(keyword) &&
        !officeName.includes(keyword) &&
        !officeAddress.includes(keyword)
      ) {
        return false;
      }

      if (statusFilter !== "all" && unitStatus !== statusFilter) {
        return false;
      }

      if (officeFilter !== "all") {
        if (officeFilter === "none" && unitOfficeId) return false;
        if (officeFilter !== "none" && unitOfficeId !== officeFilter) {
          return false;
        }
      }

      if (departmentFilter !== "all") {
        if (departmentFilter === "none" && unitDepartmentId) return false;

        if (
          departmentFilter !== "none" &&
          unitDepartmentId !== departmentFilter
        ) {
          return false;
        }
      }

      return true;
    });
  }, [units, search, statusFilter, officeFilter, departmentFilter]);

  async function loadUnits() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const params = new URLSearchParams({
        search,
        status: statusFilter,
        office_id: officeFilter,
        department_id: departmentFilter,
      });

      const response = await fetch(`/api/admin/units?${params.toString()}`, {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal mengambil unit.");
      }

      setUnits(data.units || data.data || []);
      setDepartments(data.departments || []);
      setOffices(data.offices || []);
    } catch (error) {
      console.error("LOAD_UNITS_ERROR:", error);

      setErrorMessage(
        error instanceof Error ? error.message : "Gagal mengambil data unit."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUnits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openCreateModal() {
    setEditingUnit(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(unit: Unit) {
    const officeId =
      unit.department?.office_id || unit.department?.office?.id || "";

    setEditingUnit(unit);
    setForm({
      name: unit.name,
      office_id: officeId,
      department_id: unit.department_id || "",
      status: unit.status || "active",
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingUnit(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function resetFilter() {
    setSearch("");
    setStatusFilter("all");
    setOfficeFilter("all");
    setDepartmentFilter("all");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim();

    if (!form.office_id) {
      alert("Kantor wajib dipilih.");
      return;
    }

    if (!form.department_id) {
      alert("Divisi wajib dipilih.");
      return;
    }

    if (!name) {
      alert("Nama unit wajib diisi.");
      return;
    }

    if (!["active", "inactive"].includes(form.status)) {
      alert("Status unit tidak valid.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/admin/units", {
        method: editingUnit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingUnit?.id,
          name,
          office_id: form.office_id,
          department_id: form.department_id,
          status: form.status,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menyimpan unit.");
      }

      await loadUnits();
      closeModal();
    } catch (error) {
      console.error("SAVE_UNIT_ERROR:", error);

      alert(error instanceof Error ? error.message : "Gagal menyimpan unit.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteUnit(unit: Unit) {
    const totalUsers = unit._count?.users || 0;
    const totalPositions = unit._count?.positions || 0;

    if (totalUsers > 0 || totalPositions > 0) {
      alert(
        "Unit ini masih memiliki jabatan atau digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan."
      );
      return;
    }

    const confirmDelete = window.confirm(
      `Yakin ingin menghapus unit "${unit.name}"? Data yang dihapus tidak bisa dikembalikan.`
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);

      const response = await fetch(`/api/admin/units?id=${unit.id}`, {
        method: "DELETE",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal menghapus unit.");
      }

      alert("Unit berhasil dihapus.");
      await loadUnits();
    } catch (error) {
      console.error("DELETE_UNIT_ERROR:", error);

      alert(error instanceof Error ? error.message : "Gagal menghapus unit.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Unit"
        subtitle="Kelola master data unit berdasarkan kantor dan divisi"
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
                  Daftar Unit
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                  Unit berada di bawah divisi. Contoh: Kantor Pusat Bandung →
                  Technology → Backend Development.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-[#123c8c] shadow-lg shadow-blue-950/20 transition hover:bg-blue-50 active:scale-[0.98]"
              >
                <Plus size={18} />
                Tambah Unit
              </button>
            </div>
          </div>

          <div className="p-5 md:p-8">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_220px_210px_auto]">
              <div>
                <label className="text-sm font-black text-slate-500">
                  Nama Unit / Divisi / Kantor
                </label>

                <div className="relative mt-3">
                  <Search
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Cari unit, divisi, atau kantor..."
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-4 pl-12 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-slate-500">
                  Filter Kantor
                </label>

                <select
                  value={officeFilter}
                  onChange={(event) => {
                    setOfficeFilter(event.target.value);
                    setDepartmentFilter("all");
                  }}
                  className="mt-3 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
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
                  Filter Divisi
                </label>

                <select
                  value={departmentFilter}
                  onChange={(event) => setDepartmentFilter(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-black text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="all">Semua Divisi</option>
                  <option value="none">Tanpa Divisi</option>
                  {filteredDepartmentsForFilter.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                      {department.office?.name
                        ? ` - ${department.office.name}`
                        : ""}
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
                  onClick={loadUnits}
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
              <div className="hidden grid-cols-[0.3fr_1.2fr_1.1fr_1.1fr_0.75fr_0.75fr_1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c] md:grid">
                <p>#</p>
                <p>Unit</p>
                <p>Kantor</p>
                <p>Divisi</p>
                <p>Jabatan</p>
                <p>Status</p>
                <p className="text-center">Aksi</p>
              </div>

              <div className="divide-y divide-blue-50 bg-white">
                {isLoading ? (
                  <div className="px-5 py-10 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
                    <p className="mt-3 text-sm font-black text-slate-600">
                      Mengambil data unit...
                    </p>
                  </div>
                ) : filteredUnits.length === 0 ? (
                  <div className="px-5 py-10 text-center">
                    <Building2 className="mx-auto text-slate-300" size={36} />
                    <p className="mt-3 font-black text-slate-700">
                      Data unit tidak ditemukan.
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Tambahkan unit baru atau ubah filter pencarian.
                    </p>
                  </div>
                ) : (
                  filteredUnits.map((unit, index) => (
                    <div
                      key={unit.id}
                      className="grid gap-4 px-4 py-4 text-sm transition hover:bg-[#f8fbff] md:grid-cols-[0.3fr_1.2fr_1.1fr_1.1fr_0.75fr_0.75fr_1fr] md:items-center md:px-5 md:py-6"
                    >
                      <div className="flex items-start justify-between gap-3 md:block">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-xs font-black text-[#123c8c] md:h-auto md:w-auto md:bg-transparent md:text-sm md:text-slate-500">
                            {index + 1}
                          </div>

                          <div className="md:hidden">
                            <p className="font-black uppercase text-slate-950">
                              {unit.name}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {unit.department?.office?.name || "Tanpa Kantor"}{" "}
                              • {unit.department?.name || "Tanpa Divisi"} •{" "}
                              {unit._count?.positions || 0} jabatan
                            </p>
                          </div>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black md:hidden ${
                            unit.status === "active"
                              ? "bg-blue-50 text-[#123c8c]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(unit.status)}
                        </span>
                      </div>

                      <div className="hidden md:block">
                        <p className="font-black uppercase text-slate-950">
                          {unit.name}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {unit._count?.users || 0} karyawan
                        </p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 md:border-0 md:bg-transparent md:p-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 md:hidden">
                          Kantor
                        </p>

                        <p className="mt-1 font-black text-slate-600 md:mt-0">
                          {unit.department?.office?.name || "Tanpa Kantor"}
                        </p>

                        <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-400">
                          {unit.department?.office?.address || ""}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 md:border-0 md:bg-transparent md:p-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 md:hidden">
                          Divisi
                        </p>

                        <p className="mt-1 font-black text-slate-600 md:mt-0">
                          {unit.department?.name || "Tanpa Divisi"}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-3 md:border-0 md:bg-transparent md:p-0">
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 md:hidden">
                          Jabatan
                        </p>

                        <p className="mt-1 font-black text-slate-600 md:mt-0">
                          {unit._count?.positions || 0}
                        </p>
                      </div>

                      <div className="hidden md:block">
                        <span
                          className={`w-fit rounded-full px-4 py-2 text-xs font-black ${
                            unit.status === "active"
                              ? "bg-blue-50 text-[#123c8c]"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(unit.status)}
                        </span>
                      </div>

                      <div className="grid gap-2 md:flex md:justify-center">
                        <button
                          type="button"
                          onClick={() => openEditModal(unit)}
                          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.97] md:h-auto md:w-fit md:rounded-xl md:border md:border-blue-100 md:bg-white md:px-4 md:py-2 md:text-xs md:text-[#123c8c] md:shadow-none md:hover:bg-[#eaf1ff]"
                        >
                          <Edit size={16} className="md:h-3.5 md:w-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteUnit(unit)}
                          disabled={
                            isDeleting ||
                            (unit._count?.users || 0) > 0 ||
                            (unit._count?.positions || 0) > 0
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
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  {editingUnit ? "Edit Unit" : "Tambah Unit"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingUnit ? "Update Data Unit" : "Unit Baru"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pilih kantor, lalu pilih divisi, kemudian isi nama unit.
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
              <div className="rounded-[1.6rem] border border-blue-100 bg-[#f8fbff] p-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
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
                            department_id: "",
                          }))
                        }
                        className="w-full appearance-none rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c]"
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

                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Divisi
                    </label>

                    <div className="relative">
                      <Network
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <select
                        value={form.department_id}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            department_id: event.target.value,
                          }))
                        }
                        disabled={!form.office_id}
                        className="w-full appearance-none rounded-2xl border border-blue-100 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="">
                          {form.office_id
                            ? "Pilih Divisi"
                            : "Pilih Kantor dulu"}
                        </option>
                        {formDepartments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {form.office_id && formDepartments.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-sm font-black text-amber-700">
                      Divisi belum tersedia untuk kantor ini
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-700/80">
                      Tambahkan Divisi terlebih dahulu dan hubungkan ke kantor
                      yang dipilih.
                    </p>
                  </div>
                ) : null}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Nama Unit
                </label>

                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Backend Development, Mobile Development, Accounting"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Status Unit
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
                  Pilih Nonaktif jika unit tidak digunakan sementara.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <p className="text-sm font-black text-[#123c8c]">
                  Relasi Unit
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Unit berada di bawah divisi. Contoh: Kantor Pusat Bandung →
                  Technology → Backend Development → Backend Developer.
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
                    : editingUnit
                      ? "Update Unit"
                      : "Tambah Unit"}
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