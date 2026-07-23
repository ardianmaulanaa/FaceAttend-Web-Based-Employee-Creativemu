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
  birth_place?: string | null;
  birth_date?: string | null;
  bank_account_number?: string | null;
  nik?: string | null;
  employment_status?: string | null;
  contract_start_date?: string | null;
  contract_end_date?: string | null;
  uploaded_document_url?: string | null;
  base_salary?: number | string | null;
};

const DEFAULT_AVATAR = "/images/creativemu-logo/creativemu.png";

function AdminEmployeeProfilesContent() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
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
            const found = data.employees.find(
              (e: Employee) => e.id === idParam,
            );
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

  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [calMonth, setCalMonth] = useState(new Date().getMonth() + 1);
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!selectedEmployee) return;
    const emp = selectedEmployee;
    async function fetchAttendance() {
      try {
        const res = await fetch(
          `/api/admin/attendance-reports?search=${encodeURIComponent(emp.email)}&month=${calMonth}&year=${calYear}`,
        );
        const data = await res.json();
        if (data.success && data.reports) {
          setAttendanceList(data.reports);
        }
      } catch (err) {
        console.error(err);
      }
    }
    void fetchAttendance();
  }, [selectedEmployee, calMonth, calYear]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return employees;
    return employees.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.phone && e.phone.includes(q)),
    );
  }, [employees, searchQuery]);

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, any>();

    for (const item of attendanceList) {
      const key = String(item?.date || "").trim();
      if (!key) continue;

      if (!map.has(key)) {
        map.set(key, item);
      }
    }

    return map;
  }, [attendanceList]);

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

            <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-start">
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
                  <p className="text-sm font-semibold text-slate-500">
                    {selectedEmployee.email}
                  </p>

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
                <div className="mt-8 border-t border-slate-100 pt-6 space-y-4 text-left">
                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                      Telepon
                    </span>
                    <span className="text-sm font-bold">
                      {selectedEmployee.phone || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                      NIK
                    </span>
                    <span className="text-sm font-bold">
                      {selectedEmployee.nik || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                      No. Rekening
                    </span>
                    <span className="text-sm font-bold">
                      {selectedEmployee.bank_account_number || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                      Lahir
                    </span>
                    <span className="text-sm font-bold">
                      {selectedEmployee.birth_place || "-"}
                      {selectedEmployee.birth_date
                        ? `, ${new Date(selectedEmployee.birth_date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`
                        : ""}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                      Status Posisi
                    </span>
                    <span className="text-sm font-bold uppercase text-[#123c8c]">
                      {selectedEmployee.employment_status === "kartap"
                        ? "Karyawan Tetap"
                        : selectedEmployee.employment_status || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-700">
                    <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                      Gaji
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {selectedEmployee.base_salary
                        ? new Intl.NumberFormat("id-ID", {
                            style: "currency",
                            currency: "IDR",
                            maximumFractionDigits: 0,
                          }).format(Number(selectedEmployee.base_salary))
                        : "-"}
                    </span>
                  </div>

                  {selectedEmployee.contract_start_date && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                        Mulai Kerja
                      </span>
                      <span className="text-sm font-bold">
                        {new Date(
                          selectedEmployee.contract_start_date,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {selectedEmployee.contract_end_date && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                        Selesai Kerja
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        {new Date(
                          selectedEmployee.contract_end_date,
                        ).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}

                  {selectedEmployee.uploaded_document_url && (
                    <div className="flex flex-col gap-1 text-slate-700 pt-2 border-t border-slate-50">
                      <span className="text-xs font-black uppercase text-slate-400">
                        Dokumen SK / Kontrak
                      </span>
                      <a
                        href={selectedEmployee.uploaded_document_url}
                        download={`SK_${selectedEmployee.name}`}
                        className="text-xs font-bold text-[#123c8c] hover:underline"
                      >
                        📥 Download SK Kartap / Kontrak
                      </a>
                    </div>
                  )}

                  <div className="flex items-center gap-3 text-slate-700 pt-2 border-t border-slate-100">
                    <span className="text-xs font-black uppercase text-slate-400 w-24 shrink-0">
                      Gabung
                    </span>
                    <span className="text-sm font-semibold">
                      {new Date(selectedEmployee.created_at).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </span>
                  </div>
                </div>{" "}
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
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Kantor Terdaftar
                      </p>
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
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Divisi
                      </p>
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
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Posisi
                      </p>
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
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Jabatan
                      </p>
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
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Shift Kerja
                      </p>
                      <p className="text-sm font-bold text-slate-800">
                        {selectedEmployee.shift?.name || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD 3: Kalender Kehadiran & Statistik */}
              <div className="rounded-[2rem] border border-blue-100 bg-white p-6 shadow-xl shadow-slate-200/50 md:col-span-2 lg:col-span-2 mt-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-black text-[#123c8c]">
                    Kalender Kehadiran
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (calMonth === 1) {
                          setCalMonth(12);
                          setCalYear((prev) => prev - 1);
                        } else {
                          setCalMonth((prev) => prev - 1);
                        }
                      }}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition active:scale-95"
                    >
                      ←
                    </button>
                    <span className="text-sm font-black text-slate-800 min-w-[100px] text-center">
                      {new Date(calYear, calMonth - 1, 1).toLocaleDateString(
                        "id-ID",
                        { month: "long", year: "numeric" },
                      )}
                    </span>
                    <button
                      onClick={() => {
                        if (calMonth === 12) {
                          setCalMonth(1);
                          setCalYear((prev) => prev + 1);
                        } else {
                          setCalMonth((prev) => prev + 1);
                        }
                      }}
                      className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition active:scale-95"
                    >
                      →
                    </button>
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="mt-6">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs font-black uppercase text-slate-400 mb-2">
                    <div>Min</div>
                    <div>Sen</div>
                    <div>Sel</div>
                    <div>Rab</div>
                    <div>Kam</div>
                    <div>Jum</div>
                    <div>Sab</div>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {/* Empty starting cells */}
                    {Array.from({
                      length: new Date(calYear, calMonth - 1, 1).getDay(),
                    }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        className="h-10 rounded-xl bg-slate-50/50"
                      />
                    ))}

                    {/* Day cells */}
                    {Array.from({
                      length: new Date(calYear, calMonth, 0).getDate(),
                    }).map((_, i) => {
                      const dayNum = i + 1;
                      const dayOfWeek = new Date(
                        calYear,
                        calMonth - 1,
                        dayNum,
                      ).getDay();
                      const dateKey = `${calYear}-${String(calMonth).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

                      // Match attendance
                      const att = attendanceByDate.get(dateKey);

                      let cellClass =
                        "bg-slate-50 text-slate-800 hover:bg-slate-100";
                      let statusText = "";

                      if (att) {
                        const statusLower = String(
                          att.statusLabel || att.status || "",
                        ).toLowerCase();
                        if (
                          statusLower.includes("hadir") ||
                          statusLower.includes("present") ||
                          statusLower.includes("on_time") ||
                          statusLower === "on_time"
                        ) {
                          cellClass =
                            "bg-emerald-500 text-white font-bold shadow-md shadow-emerald-200";
                          statusText = "Hadir";
                        } else if (
                          statusLower.includes("lambat") ||
                          statusLower.includes("late")
                        ) {
                          cellClass =
                            "bg-amber-500 text-white font-bold shadow-md shadow-amber-200";
                          statusText = "Telat";
                        } else if (statusLower.includes("cuti")) {
                          cellClass =
                            "bg-blue-500 text-white font-bold shadow-md shadow-blue-200";
                          statusText = "Cuti";
                        } else if (
                          statusLower.includes("izin") ||
                          statusLower.includes("sakit") ||
                          statusLower.includes("permission")
                        ) {
                          cellClass =
                            "bg-yellow-500 text-slate-900 font-bold shadow-md shadow-yellow-200";
                          statusText = "Izin/Sakit";
                        }
                      } else {
                        // Keep non-recorded weekdays neutral in calendar
                        const dayDate = new Date(calYear, calMonth - 1, dayNum);
                        dayDate.setHours(0, 0, 0, 0);

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);

                        const isPast = dayDate < today;
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        if (isPast && !isWeekend) {
                          cellClass = "bg-slate-50 text-slate-500";
                        } else if (isWeekend) {
                          cellClass = "bg-slate-100 text-slate-400";
                        }
                      }

                      return (
                        <div
                          key={`day-${dayNum}`}
                          title={statusText || "Tidak ada data"}
                          className={`relative flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer ${cellClass}`}
                        >
                          {dayNum}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Calendar Legend */}
                <div className="mt-6 flex flex-wrap gap-4 justify-center border-t border-slate-50 pt-4 text-xs font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-emerald-500" />
                    <span className="text-slate-600">Hadir</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-amber-500" />
                    <span className="text-slate-600">Telat</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-slate-600">Izin/Sakit</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-slate-600">Cuti</span>
                  </div>
                </div>

                {/* Kehadiran Summary Statistics */}
                <div className="mt-8 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-black text-slate-800 mb-4">
                    Statistik Bulanan
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 border border-emerald-100/50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                        Hadir
                      </p>
                      <p className="text-xl font-black text-emerald-800 mt-1">
                        {
                          attendanceList.filter((a) => {
                            const s = String(
                              a.statusLabel || a.status || "",
                            ).toLowerCase();
                            return (
                              s.includes("hadir") ||
                              s.includes("present") ||
                              s.includes("on_time") ||
                              s === "on_time"
                            );
                          }).length
                        }
                      </p>
                    </div>

                    <div className="bg-amber-50 border border-amber-100/50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-amber-600">
                        Telat
                      </p>
                      <p className="text-xl font-black text-amber-800 mt-1">
                        {
                          attendanceList.filter((a) => {
                            const s = String(
                              a.statusLabel || a.status || "",
                            ).toLowerCase();
                            return s.includes("lambat") || s.includes("late");
                          }).length
                        }
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-100/50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-yellow-600">
                        Izin/Sakit
                      </p>
                      <p className="text-xl font-black text-yellow-800 mt-1">
                        {
                          attendanceList.filter((a) => {
                            const s = String(
                              a.statusLabel || a.status || "",
                            ).toLowerCase();
                            return (
                              s.includes("izin") ||
                              s.includes("sakit") ||
                              s.includes("permission")
                            );
                          }).length
                        }
                      </p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100/50 p-3 rounded-2xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-wider text-blue-600">
                        Cuti
                      </p>
                      <p className="text-xl font-black text-blue-800 mt-1">
                        {
                          attendanceList.filter((a) => {
                            const s = String(
                              a.statusLabel || a.status || "",
                            ).toLowerCase();
                            return s.includes("cuti");
                          }).length
                        }
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
                <Search
                  size={18}
                  className="absolute left-4 top-3.5 text-slate-400"
                />
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
                        <p className="truncate text-xs font-semibold text-slate-400 mt-0.5">
                          {emp.email}
                        </p>

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
    <Suspense
      fallback={
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
      }
    >
      <AdminEmployeeProfilesContent />
    </Suspense>
  );
}
