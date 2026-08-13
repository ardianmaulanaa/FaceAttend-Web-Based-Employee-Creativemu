"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Loader2,
  Send,
  Upload,
  X,
  XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { AppLoadingState } from "@/components/ui/AppUI";

type LeaveRequest = {
  id: string;
  leaveType: string;
  leaveTypeLabel: string;
  startDate: string;
  startDateIso?: string | null;
  endDate: string;
  endDateIso?: string | null;
  totalDays: number;
  reason: string;
  status: string;
  statusLabel: string;
  adminNote: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string | null;
};

type LeaveStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type LeaveResponse = {
  success: boolean;
  message?: string;
  error?: string;
  requests?: LeaveRequest[];
  leaveRequests?: LeaveRequest[];
  request?: LeaveRequest;
  leaveRequest?: LeaveRequest;
  stats?: LeaveStats;
};

type PageAlert = {
  type: "success" | "error" | "warning";
  title: string;
  message: string;
} | null;

const emptyStats: LeaveStats = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
};

function getTodayDateInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

async function readJsonResponse(response: Response): Promise<LeaveResponse> {
  const text = await response.text();

  if (!text) {
    return {
      success: false,
      message:
        "Response API kosong. Restart server dan pastikan route /api/leave-requests mengembalikan BerikutnyaResponse.json.",
      error:
        "Response API kosong. Restart server dan pastikan route /api/leave-requests mengembalikan NextResponse.json.",
      requests: [],
      leaveRequests: [],
    };
  }

  try {
    return JSON.parse(text);
  } catch {
    console.error("API_BUKAN_JSON:", text);

    return {
      success: false,
      message:
        "API mengembalikan HTML/error page. Cek terminal Berikutnya.js untuk detail error.",
      error:
        "API mengembalikan HTML/error page. Cek terminal Next.js untuk detail error.",
      requests: [],
      leaveRequests: [],
    };
  }
}

function getStatusStyle(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (normalized === "rejected") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-orange-50 text-orange-700 ring-orange-100";
}

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") return CheckCircle2;
  if (normalized === "rejected") return XCircle;

  return Clock3;
}

function countDays(startDate: string, endDate: string) {
  if (!startDate || !endDate) return 0;

  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;

  const diffMs = end.getTime() - start.getTime();

  if (diffMs < 0) return 0;

  return Math.floor(diffMs / 86400000) + 1;
}

function getAlertClass(type: "success" | "error" | "warning") {
  if (type === "success") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (type === "error") {
    return "border-red-100 bg-red-50 text-red-700";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
}

function getAlertIcon(type: "success" | "error" | "warning") {
  if (type === "success") return CheckCircle2;
  if (type === "error") return XCircle;

  return AlertTriangle;
}

export default function LeaveRequestPage() {
  const [leaveType, setLeaveType] = useState("annual");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startTimeOvertime, setStartTimeOvertime] = useState("17:00");
  const [endTimeOvertime, setEndTimeOvertime] = useState("20:00");
  const [reason, setReason] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>(emptyStats);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pageAlert, setPageAlert] = useState<PageAlert>(null);

  const todayDate = useMemo(() => {
    return getTodayDateInputValue();
  }, []);

  const totalDays = useMemo(() => {
    return countDays(startDate, endDate);
  }, [startDate, endDate]);

  const overtimeDurationMinutes = useMemo(() => {
    if (leaveType !== "overtime") return 0;
    if (!startTimeOvertime || !endTimeOvertime) return 0;

    const [startH, startM] = startTimeOvertime.split(":").map(Number);
    const [endH, endM] = endTimeOvertime.split(":").map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    return endTotal - startTotal;
  }, [leaveType, startTimeOvertime, endTimeOvertime]);

  const overtimeDurationText = useMemo(() => {
    if (overtimeDurationMinutes <= 0) return "0 jam";
    const h = Math.floor(overtimeDurationMinutes / 60);
    const m = overtimeDurationMinutes % 60;

    if (h > 0 && m > 0) return `${h} jam ${m} menit`;
    if (h > 0) return `${h} jam`;
    return `${m} menit`;
  }, [overtimeDurationMinutes]);

  async function getLeaveRequests() {
    try {
      setIsLoading(true);

      const response = await fetch("/api/leave-requests", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setRequests([]);
        setStats(emptyStats);
        setPageAlert({
          type: "error",
          title: "Gagal mengambil pengajuan",
          message:
            data.message ||
            data.error ||
            "Gagal mengambil data pengajuan cuti.",
        });
        return;
      }

      setRequests(data.requests || data.leaveRequests || []);
      setStats(data.stats || emptyStats);
    } catch (error) {
      console.error("GET_LEAVE_REQUESTS_ERROR:", error);

      setRequests([]);
      setStats(emptyStats);
      setPageAlert({
        type: "error",
        title: "Terjadi kesalahan",
        message: "Gagal mengambil pengajuan cuti.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (leaveType === "overtime") {
      if (!startDate || !reason.trim()) {
        setPageAlert({
          type: "warning",
          title: "Data belum lengkap",
          message: "Tanggal lembur, jam start-selesai, dan deskripsi pekerjaan lembur wajib diisi.",
        });
        return;
      }

      if (overtimeDurationMinutes < 120) {
        setPageAlert({
          type: "warning",
          title: "Durasi lembur tidak memenuhi syarat",
          message: "Pengajuan lembur terhitung dan hanya diizinkan jika durasi 2 jam atau lebih (≥ 120 menit).",
        });
        return;
      }
    } else {
      if (!leaveType || !startDate || !endDate || !reason.trim()) {
        setPageAlert({
          type: "warning",
          title: "Data belum lengkap",
          message:
            "Jenis pengajuan, tanggal mulai, tanggal selesai, dan alasan wajib diisi.",
        });
        return;
      }

      if (startDate < todayDate) {
        setPageAlert({
          type: "warning",
          title: "Tanggal mulai tidak valid",
          message: "Tanggal mulai tidak boleh kurang dari tanggal hari ini.",
        });
        return;
      }

      if (totalDays <= 0) {
        setPageAlert({
          type: "warning",
          title: "Tanggal tidak valid",
          message: "Tanggal selesai tidak boleh lebih awal dari tanggal mulai.",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append("leaveType", leaveType);
      const effectiveEndDate = leaveType === "overtime" ? startDate : endDate;
      formData.append("startDate", startDate);
      formData.append("endDate", effectiveEndDate);

      const finalReason =
        leaveType === "overtime"
          ? `[Lembur: ${startTimeOvertime} - ${endTimeOvertime} (${overtimeDurationText})] ${reason.trim()}`
          : reason.trim();
      formData.append("reason", finalReason);

      if (attachmentFile) {
        formData.append("attachment", attachmentFile);
      }

      const response = await fetch("/api/leave-requests", {
        method: "POST",
        body: formData,
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setPageAlert({
          type: "error",
          title: "Gagal mengirim pengajuan",
          message:
            data.message || data.error || "Gagal mengirim pengajuan.",
        });
        return;
      }

      setLeaveType("annual");
      setStartDate("");
      setEndDate("");
      setReason("");
      setAttachmentFile(null);

      setPageAlert({
        type: "success",
        title: "Pengajuan terkirim",
        message:
          data.message ||
          "Pengajuan berhasil dikirim dan menunggu persetujuan admin.",
      });

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notification-count-changed"));
      }

      await getLeaveRequests();
    } catch (error) {
      console.error("SUBMIT_LEAVE_REQUEST_ERROR:", error);

      setPageAlert({
        type: "error",
        title: "Terjadi kesalahan",
        message: "Gagal mengirim pengajuan.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    void getLeaveRequests();
  }, []);

  return (
    <MobileShell variant="employee">
      <div className="hidden md:block">
        <AppHeader title="Pengajuan Cuti & Lembur" rightLabel="Cuti" />
      </div>

      <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
              Presensi
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-[#073456]">
              Pengajuan Cuti
            </h1>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl items-start gap-6 px-5 py-6 pb-28 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
        <form
          suppressHydrationWarning
          onSubmit={handleSubmit}
          noValidate
          className="h-fit self-start rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
              <CalendarDays size={24} strokeWidth={2.6} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                Form Cuti & Lembur
              </p>

              <h2 className="mt-1 text-2xl font-black text-slate-950">
                Buat Pengajuan
              </h2>
            </div>
          </div>

          {pageAlert ? (
            <div
              className={`mt-5 flex items-start justify-between gap-3 rounded-2xl border p-4 ${getAlertClass(
                pageAlert.type,
              )}`}
            >
              <div className="flex gap-3">
                {(() => {
                  const AlertIcon = getAlertIcon(pageAlert.type);

                  return (
                    <AlertIcon
                      size={21}
                      strokeWidth={2.7}
                      className="mt-0.5 shrink-0"
                    />
                  );
                })()}

                <div>
                  <p className="text-sm font-black">{pageAlert.title}</p>
                  <p className="mt-1 text-sm font-semibold leading-6">
                    {pageAlert.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPageAlert(null)}
                className="rounded-xl bg-white/70 p-2 transition hover:bg-white active:scale-[0.96]"
              >
                <X size={17} />
              </button>
            </div>
          ) : null}

          <div className="mt-5 space-y-4">
            <div>
              <label className="text-sm font-black text-slate-700">
                Jenis Pengajuan
              </label>

              <div className="relative mt-2">
                <select
                  suppressHydrationWarning
                  value={leaveType}
                  onChange={(event) => setLeaveType(event.target.value)}
                  className="min-h-[52px] w-full appearance-none rounded-2xl border border-blue-100 bg-[#f8fbff] pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                >
                  <option value="annual">Cuti Tahunan</option>
                  <option value="permission">Izin</option>
                  <option value="sick">Sakit</option>
                  <option value="overtime">Lembur</option>
                  <option value="other">Lainnya</option>
                </select>
                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
              </div>
            </div>

            {leaveType === "overtime" ? (
              <>
                <div>
                  <label className="text-sm font-black text-slate-700">
                    Tanggal Lembur
                  </label>
                  <div className="relative mt-2 flex items-center rounded-2xl">
                    <CalendarDays
                      size={18}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="date"
                      value={startDate}
                      min={todayDate}
                      onChange={(event) => {
                        setStartDate(event.target.value);
                        setEndDate(event.target.value);
                      }}
                      className="min-h-[52px] w-full min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Jam Start Lembur
                    </label>
                    <input
                      type="time"
                      value={startTimeOvertime}
                      onChange={(e) => setStartTimeOvertime(e.target.value)}
                      className="mt-2 min-h-[52px] w-full min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] px-3.5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Jam Selesai Lembur
                    </label>
                    <input
                      type="time"
                      value={endTimeOvertime}
                      onChange={(e) => setEndTimeOvertime(e.target.value)}
                      className="mt-2 min-h-[52px] w-full min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] px-3.5 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                    />
                  </div>
                </div>

                <div className={`rounded-2xl border p-4 ${overtimeDurationMinutes >= 120 ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-100 bg-amber-50 text-amber-800"}`}>
                  <p className="text-xs font-black uppercase tracking-wider">Total Durasi Lembur</p>
                  <p className="mt-1 text-2xl font-black">{overtimeDurationText}</p>
                  {overtimeDurationMinutes < 120 ? (
                    <p className="mt-1 text-xs font-bold text-amber-700">
                      ⚠️ Lembur minimal 2 jam (120 menit) untuk dapat diajukan.
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-bold text-emerald-700">
                      ✓ Durasi memenuhi syarat lembur (≥ 2 jam).
                    </p>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Tanggal Mulai
                    </label>

                    <div className="relative mt-2 flex items-center rounded-2xl">
                      <CalendarDays
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        value={startDate}
                        min={todayDate}
                        onChange={(event) => {
                          const nextStartDate = event.target.value;

                          setStartDate(nextStartDate);

                          if (endDate && nextStartDate > endDate) {
                            setEndDate(nextStartDate);
                          }
                        }}
                        className="min-h-[52px] w-full min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-slate-700">
                      Tanggal Selesai
                    </label>

                    <div className="relative mt-2 flex items-center rounded-2xl">
                      <CalendarDays
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || todayDate}
                        onChange={(event) => setEndDate(event.target.value)}
                        className="min-h-[52px] w-full min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                  <p className="text-sm font-black text-[#123c8c]">Total Hari</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {totalDays} hari
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-black text-slate-700">
                Alasan
              </label>

              <textarea
                suppressHydrationWarning
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="Contoh: Mengajukan cuti karena keperluan keluarga."
                className="mt-2 min-h-28 w-full resize-none rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-4 text-sm font-bold leading-6 text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-black text-slate-700">
                  {leaveType === "sick" ? "Surat Dokter / Lampiran" : "Lampiran Dokumen"}
                </label>
                <span className="text-[11px] font-bold text-slate-400">
                  (Opsional)
                </span>
              </div>

              {attachmentFile ? (
                <div className="mt-2 flex items-center justify-between rounded-2xl border border-blue-100 bg-[#f8fbff] p-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c]">
                      <FileText size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-black text-slate-800">
                        {attachmentFile.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400">
                        {(attachmentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachmentFile(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-600"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-[#f8fbff] p-4 text-center transition hover:border-[#123c8c] hover:bg-blue-50/50">
                  <Upload size={24} className="text-[#123c8c]" />
                  <p className="mt-1 text-xs font-black text-slate-700">
                    Upload Surat Dokter / Lampiran
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    Format: JPG, PNG, WEBP, PDF (Maks. 5MB)
                  </p>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        setPageAlert({
                          type: "warning",
                          title: "Ukuran file terlalu besar",
                          message: "Maksimal ukuran file lampiran adalah 5MB.",
                        });
                        return;
                      }
                      setAttachmentFile(file);
                    }}
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send size={18} strokeWidth={2.6} />
                  Kirim Pengajuan
                </>
              )}
            </button>
          </div>
        </form>

        <div className="min-w-0 space-y-4">
          <div className="rounded-[2rem] bg-[#123c8c] p-5 text-white shadow-xl shadow-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <FileText size={25} strokeWidth={2.6} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                  Riwayat
                </p>

                <h2 className="mt-1 text-2xl font-black">Pengajuan Saya</h2>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Total
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {stats.total}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Menunggu
              </p>
              <p className="mt-1 text-2xl font-black text-amber-700">
                {stats.pending}
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Disetujui
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-700">
                {stats.approved}
              </p>
            </div>
          </div>

          {isLoading ? (
            <AppLoadingState text="Memuat pengajuan cuti..." />
          ) : requests.length === 0 ? (
            <div className="rounded-[2rem] border border-blue-100 bg-white p-5 text-sm font-black text-slate-500 shadow-lg shadow-slate-200/60">
              Belum ada pengajuan cuti.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((item) => {
                const StatusIcon = getStatusIcon(item.status);

                return (
                  <div
                    key={item.id}
                    className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/60"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                          {item.leaveTypeLabel}
                        </p>

                        <h3 className="mt-2 text-xl font-black text-slate-950">
                          {item.startDate} - {item.endDate}
                        </h3>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          Total {item.totalDays} hari
                        </p>
                      </div>

                      <div
                        className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-black ring-1 ${getStatusStyle(
                          item.status,
                        )}`}
                      >
                        <StatusIcon size={16} strokeWidth={2.6} />
                        {item.statusLabel}
                      </div>
                    </div>

                    <p className="mt-4 rounded-2xl bg-[#f8fbff] p-4 text-sm font-semibold leading-6 text-slate-600">
                      {item.reason}
                    </p>

                    {item.attachmentUrl ? (
                      <div className="mt-3">
                        <a
                          href={item.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-black text-[#123c8c] hover:bg-blue-100 transition"
                        >
                          <FileText size={15} />
                          Lihat Surat Dokter / Lampiran
                        </a>
                      </div>
                    ) : null}

                    {item.adminNote ? (
                      <p className="mt-3 rounded-2xl bg-blue-50 p-4 text-sm font-semibold leading-6 text-[#123c8c]">
                        Catatan admin: {item.adminNote}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
