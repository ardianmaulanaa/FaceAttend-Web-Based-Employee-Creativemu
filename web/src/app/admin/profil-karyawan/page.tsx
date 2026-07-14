"use client";

import { useEffect, useState, useMemo, Suspense } from "react";
import Image from "next/image";
import {
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock3,
  Globe,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Network,
  Phone,
  Search,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import BottomNav from "@/components/BottomNav";
import { useSearchParams } from "next/navigation";

type Employee = {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  status: "active" | "inactive";
  created_at: string;
  profile_photo_url?: string | null;
  registered_office?: { name: string } | null;
  department?: { name: string } | null;
  unit?: { name: string } | null;
  position?: { name: string } | null;
  shift?: { name: string } | null;
};

const DEFAULT_AVATAR = "/images/creativemu-logo/creativemu.png";

function AdminEmployeeProfilesContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    async function fetchEmployees() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/employees", { cache: "no-store" });
        const data = await response.json();
        if (data.success && data.employees) {
          setEmployees(data.employees);
          
          // Auto select if id param exists
          const idParam = searchParams.get("id");
          if (idParam) {
            const found = data.employees.find((e: Employee) => e.id === idParam);
            if (found) setSelectedEmployee(found);
          }
          
          // Auto fill search if search param exists
          const searchParam = searchParams.get("search");
          if (searchParam) {
            setSearchQuery(searchParam);
          }
        }
      } catch (error) {
        console.error("FETCH_EMPLOYEES_ERROR:", error);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchEmployees();
  }, [searchParams]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.phone && e.phone.includes(q))
    );
  }, [employees, searchQuery]);

  return (
    <MobileShell variant="admin">
      <main className="min-h-screen bg-[#f8fbff] pb-24">
        <AppHeader
          title="Profil Karyawan"
          subtitle="Admin Panel / Manajemen Karyawan / Detail Profil"
          variant="admin"
        />

        {isLoading ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="animate-spin text-[#123c8c]" size={36} />
          </div>
        ) : selectedEmployee ? (
          /* DETAILED PROFILE VIEW */
          <section className="mx-auto mt-6 max-w-5xl px-5 md:px-10">
            <button
              type="button"
              onClick={() => setSelectedEmployee(null)}
              className="mb-5 inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#123c8c] hover:bg-slate-50 transition active:scale-[0.98]"
            >
              ← Kembali ke Daftar
            </button>

            <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
              {/* LEFT CARD: Foto Profil, Nama, Email, Status */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <div className="flex flex-col items-center text-center">
                  <div className="relative h-32 w-32 overflow-hidden rounded-[2.5rem] border-4 border-blue-50 bg-slate-100 shadow-md">
                    <Image
                      src={selectedEmployee.profile_photo_url || DEFAULT_AVATAR}
                      alt={`Foto ${selectedEmployee.name}`}
                      fill
                      sizes="128px"
                      className="object-cover"
                    />
                  </div>

                  <h2 className="mt-4 text-xl font-black text-slate-900 leading-tight">
                    {selectedEmployee.name}
                  </h2>
                  <p className="text-sm font-semibold text-slate-500">{selectedEmployee.email}</p>

                  <div className="mt-4">
                    <span
                      className={`inline-flex rounded-full px-4 py-1 text-xs font-black uppercase tracking-widest ${
                        selectedEmployee.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      {selectedEmployee.status}
                    </span>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 space-y-4">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Phone size={18} className="text-[#123c8c] shrink-0" />
                    <span className="text-sm font-bold">{selectedEmployee.phone || "-"}</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700">
                    <CalendarDays size={18} className="text-[#123c8c] shrink-0" />
                    <span className="text-sm font-bold">
                      Gabung: {new Date(selectedEmployee.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: Penempatan & Shift */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50">
                <h3 className="text-lg font-black text-[#123c8c] border-b border-slate-100 pb-3">
                  Detail Penempatan & Shift Kerja
                </h3>

                <div className="mt-6 grid gap-6 md:grid-cols-2">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Kantor Terdaftar</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedEmployee.registered_office?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                      <Network size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Divisi</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedEmployee.department?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                      <IdCard size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Unit Kerja</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedEmployee.unit?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                      <BriefcaseBusiness size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Jabatan</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedEmployee.position?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 md:col-span-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                      <Clock3 size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Shift Kerja</p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedEmployee.shift?.name || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* EMPLOYEES LIST VIEW */
          <section className="mx-auto mt-6 max-w-6xl px-5 md:px-10">
            {/* Search filter bar */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="Cari nama, email, atau telepon..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-blue-100 bg-white pl-12 pr-4 text-sm font-bold text-slate-800 outline-none shadow-md shadow-slate-100 focus:border-[#123c8c]"
                />
                <Search size={18} className="absolute left-4 top-3.5 text-slate-400" />
              </div>

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="rounded-2xl bg-red-50 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-red-600 border border-red-100 transition hover:bg-red-100/50"
                >
                  Atur Ulang
                </button>
              )}
            </div>

            {filteredEmployees.length === 0 ? (
              <div className="rounded-3xl border border-blue-50 bg-white p-12 text-center text-sm font-bold text-slate-500 shadow-md">
                Tidak ada karyawan yang ditemukan.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => setSelectedEmployee(emp)}
                    className="group cursor-pointer rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-100/60 transition duration-300 hover:-translate-y-1 hover:border-[#123c8c] hover:shadow-2xl hover:shadow-slate-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-50 border border-slate-100">
                        <Image
                          src={emp.profile_photo_url || DEFAULT_AVATAR}
                          alt={emp.name}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-black text-slate-900 group-hover:text-[#123c8c] transition-all">
                          {emp.name}
                        </h3>
                        <p className="truncate text-xs font-semibold text-slate-400 mt-0.5">{emp.email}</p>
                        
                        <div className="mt-2 flex items-center justify-between">
                          <span className="truncate text-[10px] font-black uppercase tracking-wide text-[#123c8c] bg-blue-50/50 px-2 py-1 rounded-md">
                            {emp.position?.name || "Karyawan"}
                          </span>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              emp.status === "active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {emp.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        <BottomNav variant="admin" />
      </main>
    </MobileShell>
  );
}

export default function AdminEmployeeProfilesPage() {
  return (
    <Suspense fallback={
      <MobileShell variant="admin">
        <main className="min-h-screen bg-[#f8fbff] pb-24">
          <AppHeader
            title="Profil Karyawan"
            subtitle="Admin Panel / Manajemen Karyawan / Detail Profil"
            variant="admin"
          />
          <div className="flex min-h-[400px] items-center justify-center">
            <Loader2 className="animate-spin text-[#123c8c]" size={36} />
          </div>
          <BottomNav variant="admin" />
        </main>
      </MobileShell>
    }>
      <AdminEmployeeProfilesContent />
    </Suspense>
  );
}
