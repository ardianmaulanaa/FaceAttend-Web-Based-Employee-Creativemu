"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
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

type Department = {
  id: string;
  name: string;
  shiftId: string;
  shiftName: string;
  salaryCalculation: "monthly" | "daily";
  status: "active" | "inactive";
};

type DepartmentForm = {
  name: string;
  shiftId: string;
  salaryCalculation: "monthly" | "daily";
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

const defaultDepartments: Department[] = [
  {
    id: "dept-creativemu-academy",
    name: "CREATIVEMU ACADEMY",
    shiftId: "shift-utama",
    shiftName: "UTAMA",
    salaryCalculation: "monthly",
    status: "active",
  },
  {
    id: "dept-digital-marketing",
    name: "DIGITAL MARKETING AGENCY",
    shiftId: "shift-utama",
    shiftName: "UTAMA",
    salaryCalculation: "monthly",
    status: "active",
  },
  {
    id: "dept-magang-digital-marketing",
    name: "MAGANG-DIGITAL MARKETING AGENCY",
    shiftId: "shift-magang",
    shiftName: "MAGANG",
    salaryCalculation: "daily",
    status: "active",
  },
  {
    id: "dept-manajemen",
    name: "MANAJEMEN",
    shiftId: "shift-utama",
    shiftName: "UTAMA",
    salaryCalculation: "monthly",
    status: "active",
  },
];

const initialForm: DepartmentForm = {
  name: "",
  shiftId: "",
  salaryCalculation: "monthly",
  status: "active",
};

function formatSalaryCalculation(value: "monthly" | "daily") {
  return value === "monthly" ? "bulan" : "hari";
}

export default function AdminDepartmentsPage() {
  const [shifts, setShifts] = useState<Shift[]>(defaultShifts);
  const [departments, setDepartments] =
    useState<Department[]>(defaultDepartments);

  const [search, setSearch] = useState("");
  const [selectedShiftId, setSelectedShiftId] = useState("all");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<DepartmentForm>(initialForm);

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

    const savedDepartments = localStorage.getItem("faceattend_departments");

    if (savedDepartments) {
      try {
        const parsedDepartments = JSON.parse(
          savedDepartments,
        ) as Department[];
        setDepartments(
          parsedDepartments.length > 0
            ? parsedDepartments
            : defaultDepartments,
        );
      } catch {
        setDepartments(defaultDepartments);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "faceattend_departments",
      JSON.stringify(departments),
    );
  }, [departments]);

  const activeShifts = useMemo(() => {
    return shifts.filter((shift) => shift.status === "active");
  }, [shifts]);

  const filteredDepartments = useMemo(() => {
    return departments.filter((department) => {
      if (
        search &&
        !department.name.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      if (selectedShiftId !== "all" && department.shiftId !== selectedShiftId) {
        return false;
      }

      return true;
    });
  }, [departments, search, selectedShiftId]);

  function resetFilter() {
    setSearch("");
    setSelectedShiftId("all");
  }

  function openAddModal() {
    setEditingDepartmentId(null);
    setForm({
      ...initialForm,
      shiftId: activeShifts[0]?.id || "",
    });
    setIsModalOpen(true);
  }

  function openEditModal(department: Department) {
    setEditingDepartmentId(department.id);
    setForm({
      name: department.name,
      shiftId: department.shiftId,
      salaryCalculation: department.salaryCalculation,
      status: department.status,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingDepartmentId(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const name = form.name.trim().toUpperCase();
    const selectedShift = shifts.find((shift) => shift.id === form.shiftId);

    if (!name) {
      alert("Nama divisi wajib diisi.");
      return;
    }

    if (!selectedShift) {
      alert("Shift divisi wajib dipilih.");
      return;
    }

    const isDuplicate = departments.some(
      (department) =>
        department.name.toLowerCase() === name.toLowerCase() &&
        department.id !== editingDepartmentId,
    );

    if (isDuplicate) {
      alert("Nama divisi sudah ada.");
      return;
    }

    if (editingDepartmentId) {
      setDepartments((prev) =>
        prev.map((department) =>
          department.id === editingDepartmentId
            ? {
                ...department,
                name,
                shiftId: selectedShift.id,
                shiftName: selectedShift.name,
                salaryCalculation: form.salaryCalculation,
                status: form.status,
              }
            : department,
        ),
      );
    } else {
      setDepartments((prev) => [
        ...prev,
        {
          id: `dept-${Date.now()}`,
          name,
          shiftId: selectedShift.id,
          shiftName: selectedShift.name,
          salaryCalculation: form.salaryCalculation,
          status: form.status,
        },
      ]);
    }

    closeModal();
  }

  function deleteDepartment(id: string) {
    const confirmed = confirm("Yakin ingin menghapus divisi ini?");

    if (!confirmed) return;

    setDepartments((prev) =>
      prev.filter((department) => department.id !== id),
    );
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Daftar Divisi"
        subtitle="Kelola master data divisi dan shift kerja"
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
                Daftar Divisi
              </h1>

              <p className="mt-2 text-sm font-semibold text-slate-500">
                Beranda / Manajemen Divisi / Daftar Divisi
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} />
              Tambah Divisi
            </button>
          </div>

          <div className="mt-8 grid gap-3 md:grid-cols-[1fr_0.75fr_auto] md:items-end">
            <div>
              <label className="mb-2 block text-xs font-black text-slate-500">
                Nama Divisi
              </label>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Nama Divisi..."
                  className="w-full rounded-xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>
            </div>

            <div>
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

          <div className="mt-8 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[0.25fr_1.5fr_1fr_1fr_1.1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>#</p>
              <p>Nama Divisi</p>
              <p>Shift Divisi</p>
              <p>Perhitungan Gaji</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50 bg-white">
              {filteredDepartments.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Data divisi tidak ditemukan.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba ubah filter pencarian.
                  </p>
                </div>
              ) : (
                filteredDepartments.map((department, index) => (
                  <div
                    key={department.id}
                    className="grid gap-4 px-5 py-5 text-sm transition hover:bg-[#f8fbff] md:grid-cols-[0.25fr_1.5fr_1fr_1fr_1.1fr] md:items-center"
                  >
                    <p className="font-black text-slate-500">{index + 1}</p>

                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] md:hidden">
                        <Building2 size={18} strokeWidth={2.7} />
                      </div>

                      <div>
                        <p className="font-black text-slate-800">
                          {department.name}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-400 md:hidden">
                          {department.shiftName} •{" "}
                          {formatSalaryCalculation(
                            department.salaryCalculation,
                          )}
                        </p>
                      </div>
                    </div>

                    <p className="font-semibold text-slate-600">
                      {department.shiftName}
                    </p>

                    <p className="font-semibold text-slate-600">
                      {formatSalaryCalculation(department.salaryCalculation)}
                    </p>

                    <div className="flex gap-2 md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(department)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2 text-xs font-black text-[#123c8c] transition hover:bg-[#eaf1ff]"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteDepartment(department.id)}
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
                  {editingDepartmentId ? "Edit Divisi" : "Tambah Divisi"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingDepartmentId
                    ? "Edit Data Divisi"
                    : "Tambah Divisi Baru"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Isi nama divisi, shift, dan sistem perhitungan gaji.
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
                  placeholder="Contoh: DIGITAL MARKETING AGENCY"
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Shift Divisi
                </label>

                <select
                  value={form.shiftId}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      shiftId: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="">Pilih Shift</option>
                  {activeShifts.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Perhitungan Gaji
                </label>

                <select
                  value={form.salaryCalculation}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      salaryCalculation: event.target.value as
                        | "monthly"
                        | "daily",
                    }))
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                >
                  <option value="monthly">bulan</option>
                  <option value="daily">hari</option>
                </select>
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
                  {editingDepartmentId ? "Update Divisi" : "Simpan Divisi"}
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