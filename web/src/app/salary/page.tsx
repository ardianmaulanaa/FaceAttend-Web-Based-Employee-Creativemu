"use client";

import { useEffect, useState } from "react";
import {
  Coins,
  CheckCircle,
  AlertTriangle,
  Printer,
  Loader2,
  FileText,
  Calendar,
  Scale,
  Info,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type ProfileData = {
  id: string;
  name: string;
  email: string;
  created_at: string;
  employment_status: "kartap" | "kontrak" | "magang" | "pkl" | null;
  contract_start_date: string | null;
  base_salary: number | string | null;
  department?: { name: string } | null;
  position?: { name: string } | null;
  unit?: { name: string } | null;
  nik?: string | null;
  bank_account_number?: string | null;
};

type SalaryRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  amount: number;
  note: string;
  createdAt: string;
};

export default function EmployeeSalaryPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Attendance stats for current month
  const [attendanceStats, setAttendanceStats] = useState({
    hadir: 0,
    telat: 0,
    izin: 0,
    sakit: 0,
    cuti: 0,
    totalDays: 30,
    recommendedSalary: 0,
    mealAllowance: 0,
    transportAllowance: 0,
    latePenalty: 0,
    bpjsDeduction: 0,
    netPay: 0,
  });

  const fetchStats = async (email: string, rawBaseSalary: number) => {
    try {
      const baseSalary = rawBaseSalary > 0 ? rawBaseSalary : 2000000;
      const today = new Date();
      const monthNum = today.getMonth() + 1;
      const yearNum = today.getFullYear();

      const res = await fetch(
        `/api/attendance/history?month=${monthNum}&year=${yearNum}`,
      );
      const data = await res.json();

      if (data.records) {
        const reports = data.records;
        const hadir = reports.filter((a: any) => {
          const s = String(a.status || "").toLowerCase();
          return (
            s.includes("hadir") ||
            s.includes("present") ||
            s.includes("on_time") ||
            s === "on_time"
          );
        }).length;
        const telat = reports.filter((a: any) => {
          const s = String(a.status || "").toLowerCase();
          return s.includes("lambat") || s.includes("late");
        }).length;
        const izin = reports.filter((a: any) => {
          const s = String(a.status || "").toLowerCase();
          return s.includes("izin") || s.includes("permission");
        }).length;
        const sakit = reports.filter((a: any) => {
          const s = String(a.status || "").toLowerCase();
          return s.includes("sakit");
        }).length;
        const cuti = reports.filter((a: any) => {
          const s = String(a.status || "").toLowerCase();
          return s.includes("cuti");
        }).length;

        // Effective working days in current month (excluding weekends)
        let totalDays = 0;
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
        for (let d = 1; d <= daysInMonth; d++) {
          const dayOfWeek = new Date(yearNum, monthNum - 1, d).getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) totalDays++;
        }
        if (totalDays === 0) totalDays = 22; // default 22 hari kerja

        // Hari kerja yang diakui dibayar (Hadir + Telat + Cuti Resmi + Sakit Ber-surat Dokter + Izin)
        const paidDays = Math.min(hadir + telat + cuti + sakit + izin, totalDays);
        
        // Gaji pokok Prorata
        const recommended = Math.round(baseSalary * (paidDays / totalDays));
        
        // Tunjangan uang makan & transport per hari hadir nyata
        const mealAllowance = (hadir + telat) * 25000;
        const transportAllowance = (hadir + telat) * 15000;
        const latePenalty = telat * 5000;
        const bpjsDeduction = Math.round(baseSalary * 0.03); // 3% BPJS
        
        const netPay =
          recommended +
          mealAllowance +
          transportAllowance -
          latePenalty -
          bpjsDeduction;

        setAttendanceStats({
          hadir,
          telat,
          izin,
          sakit,
          cuti,
          totalDays,
          recommendedSalary: recommended,
          mealAllowance,
          transportAllowance,
          latePenalty,
          bpjsDeduction,
          netPay: Math.max(0, netPay),
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const [profileRes, salRes] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch("/api/salary", { cache: "no-store" }),
        ]);

        const profileData = await profileRes.json();
        const salData = await salRes.json();

        if (profileData.success && profileData.user) {
          const userWithFixedSalary = { ...profileData.user, base_salary: 2000000 };
          setProfile(userWithFixedSalary);
          void fetchStats(profileData.user.email, 2000000);
        }
        if (salData.success && salData.records) {
          setRecords(salData.records);
        }
      } catch (err) {
        console.error("Gagal memuat data payroll karyawan:", err);
      } finally {
        setIsLoading(false);
      }
    }
    void fetchData();
  }, []);

  const formatIDR = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <MobileShell variant="employee">
      <div className="print:hidden">
        <AppHeader
          title="Rincian Payroll & Slip"
          subtitle="Rincian pendapatan bersih dan slip gaji resmi Anda"
          variant="employee"
        />

        <main className="min-h-screen bg-[#f6f8ff] dark:bg-[#0d1117] pb-28 text-slate-900 dark:text-white">
          <div className="mx-auto max-w-7xl px-5 py-6 md:px-10 lg:px-16 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-[#123c8c]" size={36} />
              </div>
            ) : !profile ? (
              <p className="text-center text-sm font-semibold text-slate-500 py-6">
                Profil tidak ditemukan.
              </p>
            ) : (
              <>


                {/* Cetak PDF Button */}
                <div className="flex justify-end print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="rounded-2xl px-5 py-3 text-xs font-black bg-[#123c8c] hover:bg-blue-800 text-white transition-all flex items-center gap-2 shadow-md shadow-blue-900/15 active:scale-95"
                  >
                    <Printer size={15} strokeWidth={2.5} />
                    Cetak Rincian Slip PDF
                  </button>
                </div>

                {/* RINGKASAN PAYROLL DETAIL */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* 1. KARTU UTAMA NET TAKE-HOME PAY */}
                  <div className="lg:col-span-1 rounded-[2.2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none flex flex-col justify-between">
                    <div>
                      <span className="inline-block px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                        Estimasi Diterima Bersih
                      </span>
                      <h2 className="mt-4 text-3xl font-black text-emerald-600 dark:text-emerald-450">
                        {formatIDR(attendanceStats.netPay)}
                      </h2>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Gaji Pokok (Dasar: {formatIDR(Number(profile.base_salary || 2000000))})</span>
                        <span className="text-slate-800 dark:text-white font-black">
                          {formatIDR(attendanceStats.recommendedSalary)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Tunjangan Hadir</span>
                        <span className="text-emerald-600">
                          +
                          {formatIDR(
                            attendanceStats.mealAllowance +
                              attendanceStats.transportAllowance,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-500">Potongan Wajib</span>
                        <span className="text-red-500">
                          -
                          {formatIDR(
                            attendanceStats.latePenalty +
                              attendanceStats.bpjsDeduction,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. RINCIAN PENDAPATAN & POTONGAN (DETAILED BREAKDOWN) */}
                  <div className="lg:col-span-2 rounded-[2.2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6">
                    {/* PENDAPATAN (EARNINGS) */}
                    <div>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                        Pendapatan Tambahan (Earnings)
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/5 border border-emerald-100/30">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white">
                              Tunjangan Uang Makan
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              Rp 25.000 x{" "}
                              {attendanceStats.hadir + attendanceStats.telat}{" "}
                              Hari Hadir
                            </p>
                          </div>
                          <span className="text-sm font-black text-emerald-600">
                            +{formatIDR(attendanceStats.mealAllowance)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/5 border border-emerald-100/30">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white">
                              Tunjangan Transportasi
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              Rp 15.000 x{" "}
                              {attendanceStats.hadir + attendanceStats.telat}{" "}
                              Hari Hadir
                            </p>
                          </div>
                          <span className="text-sm font-black text-emerald-600">
                            +{formatIDR(attendanceStats.transportAllowance)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* POTONGAN (DEDUCTIONS) */}
                    <div>
                      <h3 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-3">
                        Potongan Gaji (Deductions)
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50/40 dark:bg-red-950/5 border border-red-100/30">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white">
                              Potongan Terlambat
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              Rp 5.000 x {attendanceStats.telat} Hari Telat
                            </p>
                          </div>
                          <span className="text-sm font-black text-red-500">
                            -{formatIDR(attendanceStats.latePenalty)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-red-50/40 dark:bg-red-950/5 border border-red-100/30">
                          <div>
                            <p className="text-xs font-black text-slate-800 dark:text-white">
                              Iuran Wajib BPJS (Kesehat. & Ketenag.)
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              Estimasi 3% dari Gaji Pokok
                            </p>
                          </div>
                          <span className="text-sm font-black text-red-500">
                            -{formatIDR(attendanceStats.bpjsDeduction)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ESTIMASI KEMNAKER BULAN INI */}
                <div className="rounded-[2.2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-5 flex items-center gap-2">
                    <Calendar
                      size={18}
                      className="text-[#123c8c] dark:text-blue-400"
                    />
                    Statistik & Status Kehadiran Terlaporkan
                  </h3>

                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 text-xs font-bold text-slate-600 dark:text-slate-350">
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400">
                          Hadir + Telat
                        </span>
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                          {attendanceStats.hadir + attendanceStats.telat}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400">
                          Sakit / Izin
                        </span>
                        <span className="text-base font-black text-yellow-600 dark:text-yellow-400">
                          {attendanceStats.sakit + attendanceStats.izin}
                        </span>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                        <span className="block text-[10px] text-slate-400">
                          Cuti
                        </span>
                        <span className="text-base font-black text-blue-600 dark:text-blue-400">
                          {attendanceStats.cuti}
                        </span>
                      </div>
                    </div>

                    {/* Message Info */}
                    <div className="flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-4 md:pt-0 md:pl-6">
                      <p className="text-[10px] font-black text-slate-400 uppercase">
                        Informasi Formula Prorata Gaji
                      </p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-350 mt-1 leading-relaxed">
                        Gaji pokok dihitung prorata dari total{" "}
                        <span className="text-[#123c8c] dark:text-blue-400 font-black">
                          {attendanceStats.hadir + attendanceStats.telat + attendanceStats.cuti + attendanceStats.sakit + attendanceStats.izin} hari kerja berbayar
                        </span>{" "}
                        (Hadir, Cuti Resmi, Sakit & Izin) dari{" "}
                        <span className="font-black text-slate-800 dark:text-white">
                          {attendanceStats.totalDays} hari kerja efektif
                        </span>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* LIST SLIP GAJI */}
                <div className="rounded-[2.2rem] border border-blue-100 dark:border-slate-800 bg-white dark:bg-[#161b22] p-6 shadow-xl shadow-slate-200/50 dark:shadow-none">
                  <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                    <FileText className="text-[#123c8c] dark:text-blue-400" />
                    Riwayat Slip Gaji Anda
                  </h3>

                  {records.length === 0 ? (
                    <p className="text-center text-sm font-semibold text-slate-500 py-6">
                      Belum ada slip gaji yang diterbitkan.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {records.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-center justify-between p-4 rounded-2xl border border-blue-50 dark:border-slate-850 bg-[#f8fbff] dark:bg-[#0d1117]/30 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-950/20 text-[#123c8c] dark:text-blue-450">
                              <FileText size={18} />
                            </div>
                            <div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                                Periode: {rec.month}
                              </h4>
                              <p className="text-xs font-semibold text-slate-500">
                                {rec.note || "Gaji bulanan reguler"}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-400">
                                Diterima
                              </p>
                              <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                                {formatIDR(rec.amount)}
                              </p>
                            </div>

                            <button
                              onClick={() => window.print()}
                              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 transition active:scale-95"
                              title="Cetak Slip Gaji"
                            >
                              <Printer size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </main>

        <BottomNav variant="employee" />
      </div>

      {/* DEDICATED CORPORATE SLIP / PAYROLL DRAFT PRINT LAYOUT */}
      <div id="print-area-emp-salary" className="hidden print:block p-8 bg-white text-black font-sans text-xs">
        <style jsx global>{`
          @media print {
            body {
              visibility: hidden !important;
              background: #ffffff !important;
            }
            #print-area-emp-salary,
            #print-area-emp-salary * {
              visibility: visible !important;
            }
            #print-area-emp-salary {
              display: block !important;
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              z-index: 999999 !important;
              background: #ffffff !important;
              margin: 0 !important;
              padding: 20px !important;
            }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          }
        `}</style>
        {/* KOP SURAT PERUSAHAAN */}
        <div className="border-b-4 border-[#123c8c] pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-[#123c8c] text-white flex items-center justify-center font-black text-xl">
                FA
              </div>
              <div>
                <h1 className="text-lg font-black text-[#123c8c] uppercase tracking-wide">
                  PT CREATIVEMU INDONESIA
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">
                  Sistem Informasi SDM & Presensi Digital FaceAttend
                </p>
                <p className="text-[9px] text-slate-500">
                  Jl. Raya Utama No. 88, Jakarta | Email: hr@creativemu.co.id | Telp: (021) 555-0199
                </p>
              </div>
            </div>
            <div className="text-right border-l-2 border-slate-200 pl-4">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase tracking-wider mb-1">
                Lunas / Terbayar
              </span>
              <p className="text-[10px] font-bold text-slate-500">
                Dokumen Resmi Payroll
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-base font-black uppercase tracking-wide">
            SLIP GAJI RESMI KARYAWAN
          </h2>
          <p className="text-[10px] font-bold text-slate-600 mt-0.5">
            Bukti Pembayaran Gaji Bulanan Digital
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <table className="w-full text-[10px]">
              <tbody>
                <tr>
                  <td className="font-bold py-0.5">Nama Karyawan</td>
                  <td>: {profile?.name || "-"}</td>
                </tr>
                <tr>
                  <td className="font-bold py-0.5">No. NIK Karyawan</td>
                  <td>: {profile?.nik || "-"}</td>
                </tr>
                <tr>
                  <td className="font-bold py-0.5">Jabatan / Unit</td>
                  <td>
                    : {profile?.position?.name || "-"} /{" "}
                    {profile?.unit?.name || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-right">
            <table className="w-full text-[10px]">
              <tbody>
                <tr>
                  <td className="font-bold py-0.5 text-left md:text-right">
                    Tanggal Cetak
                  </td>
                  <td>
                    :{" "}
                    {new Date().toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold py-0.5 text-left md:text-right">
                    No. Rekening
                  </td>
                  <td>: {profile?.bank_account_number || "-"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 border border-slate-400 p-4 mb-6">
          {/* EARNINGS COLUMN */}
          <div>
            <h4 className="font-black uppercase tracking-wider text-[10px] border-b border-slate-400 pb-1 mb-2">
              I. Pendapatan (Earnings)
            </h4>
            <table className="w-full text-[10px] space-y-1">
              <tbody>
                <tr>
                  <td>Gaji Pokok Terdaftar</td>
                  <td className="text-right">
                    {formatIDR(Number(profile?.base_salary || 0))}
                  </td>
                </tr>
                <tr>
                  <td>
                    Tunjangan Makan (
                    {attendanceStats.hadir + attendanceStats.telat} Hari)
                  </td>
                  <td className="text-right">
                    {formatIDR(attendanceStats.mealAllowance)}
                  </td>
                </tr>
                <tr>
                  <td>
                    Tunjangan Transportasi (
                    {attendanceStats.hadir + attendanceStats.telat} Hari)
                  </td>
                  <td className="text-right">
                    {formatIDR(attendanceStats.transportAllowance)}
                  </td>
                </tr>
                <tr className="font-bold border-t border-slate-200 pt-1">
                  <td>Total Pendapatan (A)</td>
                  <td className="text-right">
                    {formatIDR(
                      Number(profile?.base_salary || 0) +
                        attendanceStats.mealAllowance +
                        attendanceStats.transportAllowance,
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* DEDUCTIONS COLUMN */}
          <div className="border-l border-slate-300 pl-6">
            <h4 className="font-black uppercase tracking-wider text-[10px] border-b border-slate-400 pb-1 mb-2">
              II. Potongan (Deductions)
            </h4>
            <table className="w-full text-[10px] space-y-1">
              <tbody>
                <tr>
                  <td>Potongan Terlambat ({attendanceStats.telat} Kali)</td>
                  <td className="text-right">
                    {formatIDR(attendanceStats.latePenalty)}
                  </td>
                </tr>
                <tr>
                  <td>Iuran BPJS Wajib (3%)</td>
                  <td className="text-right">
                    {formatIDR(attendanceStats.bpjsDeduction)}
                  </td>
                </tr>
                <tr className="font-bold border-t border-slate-200 pt-1">
                  <td>Total Potongan (B)</td>
                  <td className="text-right">
                    {formatIDR(
                      attendanceStats.latePenalty +
                        attendanceStats.bpjsDeduction,
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* TAKE HOME PAY TOTAL */}
        <div className="border-2 border-slate-900 bg-slate-50 p-3 mb-8 flex justify-between items-center text-xs font-black">
          <span>GAJI BERSIH DITERIMA (NET TAKE-HOME PAY - A - B)</span>
          <span>{formatIDR(attendanceStats.netPay)}</span>
        </div>

        <div className="grid grid-cols-2 gap-12 text-center text-[10px] mt-8 pt-4">
          <div>
            <p>Penerima (Karyawan),</p>
            <div className="h-14" />
            <p className="font-bold underline">
              {profile?.name || "........................"}
            </p>
          </div>
          <div>
            <p>Manajemen HRD / Owner,</p>
            <div className="h-14" />
            <p className="font-bold underline">
              ......................................
            </p>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}
