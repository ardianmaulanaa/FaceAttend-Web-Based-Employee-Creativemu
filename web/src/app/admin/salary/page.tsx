"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CircleDollarSign, WalletCards } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type EmployeeOption = {
  id: string;
  name: string;
  email: string;
};

type SalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  amount: number;
  note: string;
  createdAt: string;
  createdByAdminId: string;
};

export default function AdminSalaryPage() {
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [form, setForm] = useState({
    employeeId: "",
    month: "",
    amount: "",
    note: "",
  });

  async function loadData() {
    try {
      const [employeesResponse, salaryResponse] = await Promise.all([
        fetch("/api/employees", { method: "GET", cache: "no-store" }),
        fetch("/api/salary", { method: "GET", cache: "no-store" }),
      ]);

      const employeesResult = await employeesResponse.json();
      const salaryResult = await salaryResponse.json();

      if (!employeesResponse.ok) {
        setStatusMessage(
          employeesResult.message || "Gagal mengambil daftar karyawan.",
        );
        return;
      }

      if (!salaryResponse.ok) {
        setStatusMessage(
          salaryResult.message || "Gagal mengambil daftar gaji.",
        );
        return;
      }

      setEmployees(
        (employeesResult.data || []).map((employee: EmployeeOption) => ({
          id: employee.id,
          name: employee.name,
          email: employee.email,
        })),
      );
      setRecords(salaryResult.records || []);
    } catch {
      setStatusMessage("Terjadi kesalahan saat memuat data gaji.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const totalPayout = useMemo(
    () => records.reduce((sum, item) => sum + item.amount, 0),
    [records],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.employeeId || !form.month || !form.amount) {
      setStatusMessage("Pilih karyawan, bulan, dan nominal gaji.");
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setStatusMessage("Nominal gaji harus lebih besar dari 0.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/salary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: form.employeeId,
          month: form.month,
          amount,
          note: form.note,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setStatusMessage(result.message || "Gagal menyimpan gaji.");
        return;
      }

      setStatusMessage(result.message || "Gaji berhasil disimpan.");
      setForm((prev) => ({ ...prev, amount: "", note: "" }));
      await loadData();
    } catch {
      setStatusMessage("Terjadi kesalahan saat menyimpan gaji.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Salary Input"
        subtitle="Admin hanya memasukkan data gaji karyawan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-[2rem] bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20">
          <p className="text-sm font-bold text-blue-100">Payroll Admin</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Input Gaji Karyawan
          </h2>
          <p className="mt-3 text-sm leading-7 text-blue-100">
            Halaman ini khusus admin untuk input gaji per karyawan. Karyawan
            akan menerima data tersebut pada halaman salary karyawan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">
                Total Input Gaji
              </p>
              <WalletCards className="text-[#123c8c]" />
            </div>
            <p className="mt-3 text-3xl font-black text-[#123c8c]">
              {records.length}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-5 shadow-lg shadow-slate-200/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-slate-500">Total Nominal</p>
              <CircleDollarSign className="text-emerald-600" />
            </div>
            <p className="mt-3 text-3xl font-black text-emerald-700">
              Rp {totalPayout.toLocaleString("id-ID")}
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl"
        >
          <h3 className="text-xl font-black text-slate-950">Form Input Gaji</h3>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                Karyawan
              </label>
              <select
                value={form.employeeId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    employeeId: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="">Pilih karyawan</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                Bulan
              </label>
              <input
                value={form.month}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, month: event.target.value }))
                }
                placeholder="Contoh: Juli 2026"
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                Nominal Gaji
              </label>
              <input
                type="number"
                min={1}
                value={form.amount}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                placeholder="0"
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                Catatan
              </label>
              <input
                value={form.note}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, note: event.target.value }))
                }
                placeholder="Catatan opsional"
                className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-slate-500">
              {statusMessage ||
                "Data gaji yang disimpan bisa dilihat karyawan."}
            </p>

            <button
              type="submit"
              disabled={saving || loading}
              className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan Gaji"}
            </button>
          </div>
        </form>

        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <h3 className="text-xl font-black text-slate-950">
            Riwayat Input Gaji
          </h3>

          <div className="mt-4 space-y-3">
            {loading && (
              <p className="text-sm font-semibold text-slate-500">
                Memuat data...
              </p>
            )}

            {!loading && records.length === 0 && (
              <p className="text-sm font-semibold text-slate-500">
                Belum ada data gaji yang diinput.
              </p>
            )}

            {!loading &&
              records.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-black text-slate-950">
                      {item.employeeName}
                    </p>
                    <p className="text-sm font-black text-[#123c8c]">
                      {item.month}
                    </p>
                  </div>

                  <p className="mt-2 text-sm font-bold text-slate-700">
                    Rp {item.amount.toLocaleString("id-ID")}
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.note || "Tanpa catatan"}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
