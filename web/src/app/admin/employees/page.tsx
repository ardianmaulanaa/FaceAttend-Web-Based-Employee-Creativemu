"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  KeyRound,
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  department: string | null;
  position: string | null;
  phone: string | null;
  status: "active" | "inactive";
  must_change_password: boolean;
  created_at: string;
};

type EmployeeForm = {
  name: string;
  email: string;
  department: string;
  position: string;
  temporaryPassword: string;
  status: "active" | "inactive";
};

const initialForm: EmployeeForm = {
  name: "",
  email: "",
  department: "",
  position: "",
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

export default function AdminEmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [keyword, setKeyword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState<EmployeeForm>(initialForm);

  async function loadEmployees() {
    try {
      const response = await fetch("/api/employees", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal mengambil data karyawan.");
        return;
      }

      setEmployees(result.data || []);
    } catch {
      alert("Terjadi kesalahan saat mengambil data karyawan.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchEmployees() {
      try {
        const response = await fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        });

        const result = await response.json();

        if (!response.ok) {
          alert(result.message || "Gagal mengambil data karyawan.");
          return;
        }

        if (isMounted) {
          setEmployees(result.data || []);
        }
      } catch {
        if (isMounted) {
          alert("Terjadi kesalahan saat mengambil data karyawan.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void fetchEmployees();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const text = `
        ${employee.name}
        ${employee.email}
        ${employee.department || ""}
        ${employee.position || ""}
        ${employee.status}
      `.toLowerCase();

      return text.includes(keyword.toLowerCase());
    });
  }, [employees, keyword]);

  const activeEmployees = employees.filter(
    (employee) => employee.status === "active",
  ).length;

  const inactiveEmployees = employees.filter(
    (employee) => employee.status === "inactive",
  ).length;

  function openRegisterModal() {
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function closeRegisterModal() {
    setIsModalOpen(false);
    setForm(initialForm);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !form.name ||
      !form.email ||
      !form.department ||
      !form.position ||
      !form.temporaryPassword
    ) {
      alert("Semua field wajib diisi.");
      return;
    }

    if (form.temporaryPassword.length < 8) {
      alert("Temporary password minimal 8 karakter.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          temporaryPassword: form.temporaryPassword,
          department: form.department,
          position: form.position,
          status: form.status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal menambahkan karyawan.");
        return;
      }

      alert("Employee berhasil dibuat.");

      setForm(initialForm);
      setIsModalOpen(false);
      await loadEmployees();
    } catch {
      alert("Terjadi kesalahan saat menyimpan karyawan.");
    } finally {
      setIsSaving(false);
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
                Admin dapat menambahkan akun karyawan untuk login ke sistem
                absensi. Register wajah akan dibuat pada tahap berikutnya.
              </p>
            </div>

            <button
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
          </div>

          <div className="mt-5 overflow-hidden rounded-3xl border border-blue-100">
            <div className="hidden grid-cols-[1fr_1.2fr_1fr_1fr_0.7fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>Employee</p>
              <p>Email</p>
              <p>Department</p>
              <p>Position</p>
              <p>Status</p>
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
                    className="grid gap-4 px-5 py-5 transition hover:bg-[#f8fbff] md:grid-cols-[1fr_1.2fr_1fr_1fr_0.7fr] md:items-center"
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
                          {employee.must_change_password
                            ? "Must change password"
                            : "Password changed"}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-600">
                      {employee.email}
                    </p>

                    <p className="text-sm font-semibold text-slate-600">
                      {employee.department || "-"}
                    </p>

                    <p className="text-sm font-semibold text-slate-600">
                      {employee.position || "-"}
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
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  <Plus size={15} strokeWidth={3} />
                  Register Employee
                </div>

                <h2 className="mt-4 text-2xl font-black text-slate-950">
                  Tambah Karyawan Baru
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Form ini membuat akun karyawan. Password akan tersimpan dalam
                  bentuk hash dan absensi dilakukan lewat formulir, bukan scan
                  wajah.
                </p>
              </div>

              <button
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

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Department
                  </label>
                  <div className="relative">
                    <Building2
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={form.department}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          department: event.target.value,
                        }))
                      }
                      placeholder="IT Department"
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Position
                  </label>
                  <div className="relative">
                    <BriefcaseBusiness
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={form.position}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          position: event.target.value,
                        }))
                      }
                      placeholder="Backend Intern"
                      className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
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
                  Catatan sementara
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Temporary password digunakan untuk login pertama karyawan.
                  Password akan disimpan ke MySQL dalam bentuk{" "}
                  <span className="font-black text-slate-700">
                    password_hash
                  </span>
                  , bukan password asli.
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
                  {isSaving ? "Saving..." : "Save Employee"}
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
