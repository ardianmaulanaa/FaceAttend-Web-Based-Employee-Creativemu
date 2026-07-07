"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  Clock3,
  Edit,
  KeyRound,
  Mail,
  MapPin,
  Network,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type RelationItem = {
  id: string;
  name: string;
} | null;

type OfficeMiniRelation = {
  id: string;
  name: string;
} | null;

type UnitRelation = {
  id: string;
  name: string;
  office_id?: string | null;
  office?: OfficeMiniRelation;
} | null;

type DepartmentRelation = {
  id: string;
  name: string;
  unit_id?: string | null;
  unit?: UnitRelation;
} | null;

type PositionRelation = {
  id: string;
  name: string;
  department_id?: string | null;
  department?: DepartmentRelation;
} | null;

type UnitOption = {
  id: string;
  name: string;
  status: string;
  office_id: string | null;
  office?: {
    id: string;
    name: string;
  } | null;
};

type DepartmentOption = {
  id: string;
  name: string;
  status: string;
  unit_id: string | null;
  unit?: {
    id: string;
    name: string;
    office_id?: string | null;
    office?: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type PositionOption = {
  id: string;
  name: string;
  department_id: string | null;
  status: string;
  department?: {
    id: string;
    name: string;
    unit_id: string | null;
    unit?: {
      id: string;
      name: string;
      office_id?: string | null;
      office?: {
        id: string;
        name: string;
      } | null;
    } | null;
  } | null;
};

type ShiftOption = {
  id: string;
  name: string;
  status: string;
  tolerance_minutes: number;
};

type OfficeOption = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  status: string;
};

type ShiftRelation = {
  id: string;
  name: string;
  tolerance_minutes?: number;
  status?: string;
} | null;

type OfficeRelation = {
  id: string;
  name: string;
  address: string | null;
  latitude?: number;
  longitude?: number;
  radius_meters?: number;
  status?: string;
} | null;

type Employee = {
  id: string;
  employee_code: string | null;
  name: string;
  email: string;
  role: string;
  unit: UnitRelation;
  department: DepartmentRelation;
  position: PositionRelation;
  shift: ShiftRelation;
  registered_office: OfficeRelation;
  phone: string | null;
  status: "active" | "inactive";
  created_at: string;
};

type EmployeeForm = {
  name: string;
  email: string;
  unit_id: string;
  department_id: string;
  position_id: string;
  shift_id: string;
  registered_office_id: string;
  temporaryPassword: string;
  status: "active" | "inactive";
};

const initialForm: EmployeeForm = {
  name: "",
  email: "",
  unit_id: "",
  department_id: "",
  position_id: "",
  shift_id: "",
  registered_office_id: "",
  temporaryPassword: "",
  status: "active",
};

function getInitialName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatStatus(status: "active" | "inactive") {
  return status === "active" ? "Active" : "Inactive";
}

function getRelationName(
  item:
    | RelationItem
    | UnitRelation
    | DepartmentRelation
    | PositionRelation
    | ShiftRelation
    | OfficeRelation
) {
  return item?.name || "-";
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [positions, setPositions] = useState<PositionOption[]>([]);
  const [shifts, setShifts] = useState<ShiftOption[]>([]);
  const [offices, setOffices] = useState<OfficeOption[]>([]);

  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [form, setForm] = useState<EmployeeForm>(initialForm);

  const loadEmployees = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        alert(result.message || "Gagal mengambil data karyawan.");
        return;
      }

      setEmployees(result.data || []);
      setUnits(result.units || []);
      setDepartments(result.departments || []);
      setPositions(result.positions || []);
      setShifts(result.shifts || []);
      setOffices(result.offices || []);
    } catch (error) {
      console.error("LOAD_EMPLOYEES_ERROR:", error);
      alert("Terjadi kesalahan saat mengambil data karyawan.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  const activeOffices = useMemo(() => {
    return offices.filter((office) => office.status === "active");
  }, [offices]);

  const filteredUnits = useMemo(() => {
    if (!form.registered_office_id) {
      return [];
    }

    return units.filter((unit) => {
      const officeId = unit.office_id || unit.office?.id || "";

      return unit.status === "active" && officeId === form.registered_office_id;
    });
  }, [units, form.registered_office_id]);

  const filteredDepartments = useMemo(() => {
    if (!form.unit_id) {
      return [];
    }

    return departments.filter((department) => {
      return (
        department.status === "active" && department.unit_id === form.unit_id
      );
    });
  }, [departments, form.unit_id]);

  const filteredPositions = useMemo(() => {
    if (!form.department_id) {
      return [];
    }

    return positions.filter((position) => {
      return (
        position.status === "active" &&
        position.department_id === form.department_id
      );
    });
  }, [positions, form.department_id]);

  const activeShifts = useMemo(() => {
    return shifts.filter((shift) => shift.status === "active");
  }, [shifts]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const text = `
        ${employee.name}
        ${employee.email}
        ${employee.employee_code || ""}
        ${employee.registered_office?.name || ""}
        ${employee.registered_office?.address || ""}
        ${employee.unit?.name || ""}
        ${employee.department?.name || ""}
        ${employee.position?.name || ""}
        ${employee.shift?.name || ""}
        ${employee.status}
      `.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [employees, keyword]);

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active"
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "inactive"
  ).length;

  function openRegisterModal() {
    setEditingEmployee(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(employee: Employee) {
    const officeId = employee.registered_office?.id || "";
    const unitId = employee.unit?.id || employee.department?.unit_id || "";
    const departmentId = employee.department?.id || "";
    const positionId = employee.position?.id || "";

    setEditingEmployee(employee);
    setForm({
      name: employee.name,
      email: employee.email,
      registered_office_id: officeId,
      unit_id: unitId,
      department_id: departmentId,
      position_id: positionId,
      shift_id: employee.shift?.id || "",
      temporaryPassword: "",
      status: employee.status,
    });
    setIsModalOpen(true);
  }

  function closeRegisterModal() {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setForm(initialForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const isEditing = Boolean(editingEmployee);

    if (
      !form.name ||
      !form.email ||
      !form.registered_office_id ||
      !form.unit_id ||
      !form.department_id ||
      !form.position_id ||
      !form.shift_id
    ) {
      alert("Nama, email, kantor, unit, divisi, jabatan, dan shift wajib diisi.");
      return;
    }

    if (!isEditing && !form.temporaryPassword) {
      alert("Temporary password wajib diisi.");
      return;
    }

    if (!isEditing && form.temporaryPassword.length < 8) {
      alert("Temporary password minimal 8 karakter.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/employees", {
        method: isEditing ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingEmployee?.id,
          name: form.name,
          email: form.email,
          temporaryPassword: form.temporaryPassword,
          registered_office_id: form.registered_office_id,
          unit_id: form.unit_id,
          department_id: form.department_id,
          position_id: form.position_id,
          shift_id: form.shift_id,
          status: form.status,
        }),
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        alert(
          result.message ||
            (isEditing
              ? "Gagal memperbarui karyawan."
              : "Gagal menambahkan karyawan.")
        );
        return;
      }

      alert(
        isEditing
          ? "Employee berhasil diperbarui."
          : "Employee berhasil dibuat."
      );

      closeRegisterModal();
      await loadEmployees();
    } catch (error) {
      console.error("SAVE_EMPLOYEE_ERROR:", error);
      alert("Terjadi kesalahan saat menyimpan karyawan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteEmployee(employee: Employee) {
    const confirmDelete = window.confirm(
      `Yakin ingin menghapus employee "${employee.name}"? Data yang dihapus tidak bisa dikembalikan.`
    );

    if (!confirmDelete) return;

    try {
      setDeletingId(employee.id);

      const response = await fetch(`/api/employees?id=${employee.id}`, {
        method: "DELETE",
      });

      const result = await readJsonResponse(response);

      if (!response.ok) {
        alert(result.message || "Gagal menghapus employee.");
        return;
      }

      alert("Employee berhasil dihapus.");
      await loadEmployees();
    } catch (error) {
      console.error("DELETE_EMPLOYEE_ERROR:", error);
      alert("Terjadi kesalahan saat menghapus employee.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Employees"
        subtitle="Kelola data karyawan dan akun login"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                <ShieldCheck size={15} />
                Employee Management
              </div>

              <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                Data Karyawan
              </h2>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                Admin dapat menambahkan akun karyawan dengan alur Kantor → Unit
                → Divisi → Jabatan → Shift.
              </p>
            </div>

            <button
              type="button"
              onClick={openRegisterModal}
              className="group inline-flex w-full items-center justify-center gap-4 rounded-[1.8rem] bg-white px-6 py-5 text-[#123c8c] shadow-2xl shadow-blue-950/20 ring-1 ring-white/70 transition-all duration-300 hover:-translate-y-1 hover:bg-blue-50 hover:shadow-blue-950/30 active:scale-[0.97] md:w-auto"
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] bg-[#eaf1ff] transition-all duration-300 group-hover:rotate-90 group-hover:bg-[#123c8c] group-hover:text-white">
                <Plus size={27} strokeWidth={3} />
              </span>

              <span className="text-left">
                <span className="block text-xl font-black leading-none tracking-tight">
                  Register Employee
                </span>
                <span className="mt-2 block text-sm font-bold text-slate-400">
                  Add new employee account
                </span>
              </span>
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.7rem] border border-blue-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Total Employee
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {employees.length}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                <UsersRound size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-emerald-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Active Account
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {activeEmployees}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <BadgeCheck size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-500">
                  Inactive Account
                </p>
                <h3 className="mt-2 text-3xl font-black text-slate-950">
                  {inactiveEmployees}
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <UserRound size={25} strokeWidth={2.7} />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-black text-slate-950">
                Employee List
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Total {employees.length} karyawan terdaftar
              </p>
            </div>

            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative w-full md:w-[330px]">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Search employee..."
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <button
                type="button"
                onClick={loadEmployees}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
              >
                <RefreshCw size={18} />
                Refresh
              </button>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-blue-100">
            <div className="hidden grid-cols-[1fr_1.05fr_0.75fr_0.65fr_0.65fr_0.7fr_0.65fr_0.6fr_0.85fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>Employee</p>
              <p>Email</p>
              <p>Kantor</p>
              <p>Unit</p>
              <p>Divisi</p>
              <p>Jabatan</p>
              <p>Shift</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50">
              {isLoading && (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Loading employee data...
                  </p>
                </div>
              )}

              {!isLoading &&
                filteredEmployees.map((employee) => (
                  <div
                    key={employee.id}
                    className="grid gap-4 px-5 py-5 transition hover:bg-[#f8fbff] md:grid-cols-[1fr_1.05fr_0.75fr_0.65fr_0.65fr_0.7fr_0.65fr_0.6fr_0.85fr] md:items-center"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-sm font-black text-[#123c8c]">
                        {getInitialName(employee.name)}
                      </div>

                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {employee.name}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {employee.employee_code || "Employee Account"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-600">
                      {employee.email}
                    </p>

                    <div className="text-sm font-semibold text-slate-600">
                      <p>{getRelationName(employee.registered_office)}</p>
                      <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                        {employee.registered_office?.address || "-"}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-600">
                      {getRelationName(employee.unit)}
                    </p>

                    <p className="text-sm font-semibold text-slate-600">
                      {getRelationName(employee.department)}
                    </p>

                    <p className="text-sm font-semibold text-slate-600">
                      {getRelationName(employee.position)}
                    </p>

                    <p className="text-sm font-semibold text-slate-600">
                      {getRelationName(employee.shift)}
                    </p>

                    <div>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          employee.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {formatStatus(employee.status)}
                      </span>
                    </div>

                    <div className="grid gap-2 md:flex md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(employee)}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 text-xs font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.97] md:h-auto md:rounded-xl md:border md:border-blue-100 md:bg-white md:py-2 md:text-[#123c8c] md:shadow-none md:hover:bg-[#eaf1ff]"
                      >
                        <Edit size={15} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteEmployee(employee)}
                        disabled={deletingId === employee.id}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 text-xs font-black text-red-600 transition hover:bg-red-100 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 md:h-auto md:rounded-xl md:py-2"
                      >
                        <Trash2 size={15} />
                        {deletingId === employee.id ? "..." : "Hapus"}
                      </button>
                    </div>
                  </div>
                ))}

              {!isLoading && filteredEmployees.length === 0 && (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Data tidak ditemukan
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba gunakan keyword pencarian lain.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  <Plus size={15} strokeWidth={3} />
                  {editingEmployee ? "Edit Employee" : "Register Employee"}
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  {editingEmployee
                    ? "Update Data Karyawan"
                    : "Tambah Karyawan Baru"}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {editingEmployee
                    ? "Ubah data karyawan dengan alur kantor, unit, divisi, jabatan, shift, dan status."
                    : "Pilih kantor dulu, lalu unit, divisi, jabatan, dan shift."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeRegisterModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Full Name
                </label>
                <div className="relative">
                  <UserRound
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Nama karyawan"
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    placeholder="employee@creativemu.com"
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-5">
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
                      value={form.registered_office_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          registered_office_id: event.target.value,
                          unit_id: "",
                          department_id: "",
                          position_id: "",
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    >
                      <option value="">Pilih Kantor</option>
                      {activeOffices.map((office) => (
                        <option key={office.id} value={office.id}>
                          {office.name} - {office.address || "Tanpa alamat"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Unit
                  </label>
                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={form.unit_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          unit_id: event.target.value,
                          department_id: "",
                          position_id: "",
                        }))
                      }
                      disabled={!form.registered_office_id}
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.registered_office_id
                          ? "Pilih Unit"
                          : "Pilih Kantor dulu"}
                      </option>
                      {filteredUnits.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
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
                          position_id: "",
                        }))
                      }
                      disabled={!form.unit_id}
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.unit_id ? "Pilih Divisi" : "Pilih Unit dulu"}
                      </option>
                      {filteredDepartments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Jabatan
                  </label>
                  <div className="relative">
                    <BriefcaseBusiness
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={form.position_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          position_id: event.target.value,
                        }))
                      }
                      disabled={!form.department_id}
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">
                        {form.department_id
                          ? "Pilih Jabatan"
                          : "Pilih Divisi dulu"}
                      </option>
                      {filteredPositions.map((position) => (
                        <option key={position.id} value={position.id}>
                          {position.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Shift
                  </label>
                  <div className="relative">
                    <Clock3
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <select
                      value={form.shift_id}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          shift_id: event.target.value,
                        }))
                      }
                      className="w-full appearance-none rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    >
                      <option value="">Pilih Shift</option>
                      {activeShifts.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.name} - Toleransi{" "}
                          {shift.tolerance_minutes} menit
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {form.registered_office_id && filteredUnits.length === 0 ? (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                  <p className="text-sm font-black text-amber-700">
                    Unit belum tersedia untuk kantor ini
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-700/80">
                    Pastikan data Unit sudah terhubung dengan kantor yang
                    dipilih. Jika memilih Alfabank, maka Unit harus memiliki
                    office_id Alfabank.
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                {!editingEmployee ? (
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-700">
                      Temporary Password
                    </label>
                    <div className="relative">
                      <KeyRound
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="password"
                        value={form.temporaryPassword}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            temporaryPassword: event.target.value,
                          }))
                        }
                        placeholder="Minimal 8 karakter"
                        className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                      />
                    </div>
                  </div>
                ) : null}

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
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <p className="text-sm font-black text-[#123c8c]">
                  Catatan Employee
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Kantor dipilih terlebih dahulu. Setelah itu sistem hanya
                  menampilkan Unit milik kantor tersebut. Divisi mengikuti Unit,
                  Jabatan mengikuti Divisi, sedangkan Shift tetap global.
                </p>
              </div>

              <div className="mt-2 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeRegisterModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? "Saving..."
                    : editingEmployee
                      ? "Update Employee"
                      : "Save Employee"}
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