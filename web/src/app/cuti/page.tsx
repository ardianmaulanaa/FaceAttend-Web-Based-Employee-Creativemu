"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Send,
  X,
  XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

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
  requestedWorkMode: string | null;
  locationUnlockRequested: boolean;
  locationUnlockApproved: boolean;
  visitLocationName: string | null;
  visitAddress: string | null;
  visitLatitude: number | null;
  visitLongitude: number | null;
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
        "Response API kosong. Restart server dan pastikan route /api/leave-requests mengembalikan NextResponse.json.",
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
        "API mengembalikan HTML/error page. Cek terminal Next.js untuk detail error.",
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
  const [reason, setReason] = useState("");
  const [requestedWorkMode, setRequestedWorkMode] = useState("office");
  const [locationUnlockRequested, setLocationUnlockRequested] = useState(false);
  const [visitLocationName, setVisitLocationName] = useState("");
  const [visitAddress, setVisitAddress] = useState("");
  const [visitLatitude, setVisitLatitude] = useState("");
  const [visitLongitude, setVisitLongitude] = useState("");
  const [fileBase64, setFileBase64] = useState("");

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState<LeaveStats>(emptyStats);

  const [isLoading, setIsLoading] = useState(true);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Ukuran file maksimal adalah 2MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pageAlert, setPageAlert] = useState<PageAlert>(null);

  const todayDate = useMemo(() => {
    return getTodayDateInputValue();
  }, []);

  const totalDays = useMemo(() => {
    return countDays(startDate, endDate);
  }, [startDate, endDate]);

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

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/leave-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveType,
          startDate,
          endDate,
          reason: fileBase64 ? `${reason.trim()} | Attachment: ${fileBase64}` : reason.trim(),
          requestedWorkMode,
          locationUnlockRequested,
          visitLocationName,
          visitAddress,
          visitLatitude,
          visitLongitude,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setPageAlert({
          type: "error",
          title: "Gagal mengirim pengajuan",
          message:
            data.message || data.error || "Gagal mengirim pengajuan cuti.",
        });
        return;
      }

      setLeaveType("annual");
      setStartDate("");
      setEndDate("");
      setReason("");
      setFileBase64("");
      setRequestedWorkMode("office");
      setLocationUnlockRequested(false);
      setVisitLocationName("");
      setVisitAddress("");
      setVisitLatitude("");
      setVisitLongitude("");

      setPageAlert({
        type: "success",
        title: "Pengajuan terkirim",
        message:
          data.message ||
          "Pengajuan berhasil dikirim dan menunggu persetujuan admin.",
      });

      await getLeaveRequests();
    } catch (error) {
      console.error("SUBMIT_LEAVE_REQUEST_ERROR:", error);

      setPageAlert({
        type: "error",
        title: "Terjadi kesalahan",
        message: "Gagal mengirim pengajuan cuti.",
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
      <AppHeader
        title="Pengajuan Karyawan"
        subtitle="Ajukan cuti, sakit, izin, WFH, kunjungan, lembur, atau alasan lain"
        rightLabel="Cuti"
      />

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
                Form Cuti
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

              <select
                suppressHydrationWarning
                value={leaveType}
                onChange={(event) => setLeaveType(event.target.value)}
                className="mt-2 min-h-[52px] w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
              >
                <option value="annual">Cuti Tahunan</option>
                <option value="permission">Izin</option>
                <option value="sick">Sakit</option>
                <option value="wfh">WFH</option>
                <option value="visit">Kunjungan</option>
                <option value="overtime">Lembur</option>
                <option value="other">Lainnya</option>
              </select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-black text-slate-700">
                  Mode Kerja
                </label>

                <select
                  value={requestedWorkMode}
                  onChange={(event) => setRequestedWorkMode(event.target.value)}
                  className="mt-2 h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                >
                  <option value="office">WFO / Kantor</option>
                  <option value="wfh">WFH</option>
                  <option value="visit">Kunjungan Lokasi</option>
                  <option value="flexible">Shift Fleksibel</option>
                </select>
              </div>

              <label className="flex min-h-14 items-center gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={locationUnlockRequested}
                  onChange={(event) => setLocationUnlockRequested(event.target.checked)}
                  className="h-5 w-5 rounded border-blue-200 text-[#123c8c]"
                />
                Minta admin membuka kunci lokasi
              </label>
            </div>

            {leaveType === "visit" || requestedWorkMode === "visit" ? (
              <div className="space-y-4 rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                <div>
                  <label className="text-sm font-black text-slate-700">
                    Nama Lokasi Kunjungan
                  </label>
                  <input
                    value={visitLocationName}
                    onChange={(event) => setVisitLocationName(event.target.value)}
                    placeholder="Contoh: Client Bandung"
                    className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                  />
                </div>

                <div>
                  <label className="text-sm font-black text-slate-700">
                    Alamat / Catatan Lokasi
                  </label>
                  <input
                    value={visitAddress}
                    onChange={(event) => setVisitAddress(event.target.value)}
                    placeholder="Alamat lokasi kunjungan"
                    className="mt-2 h-12 w-full rounded-xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={visitLatitude}
                    onChange={(event) => setVisitLatitude(event.target.value)}
                    placeholder="Latitude opsional"
                    className="h-12 rounded-xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                  />
                  <input
                    value={visitLongitude}
                    onChange={(event) => setVisitLongitude(event.target.value)}
                    placeholder="Longitude opsional"
                    className="h-12 rounded-xl border border-blue-100 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                  />
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-black text-slate-700">
                  Tanggal Mulai
                </label>

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
                  className="mt-2 min-h-[52px] w-full min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] px-1 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  Tanggal Selesai
                </label>

                <input
                  type="date"
                  value={endDate}
                  min={startDate || todayDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="mt-2 min-h-[52px] w-full min-w-0 rounded-2xl border border-blue-100 bg-[#f8fbff] px-1 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
              <p className="text-sm font-black text-[#123c8c]">Total Hari</p>
              <p className="mt-1 text-2xl font-black text-slate-950">
                {totalDays} hari
              </p>
            </div>

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
              <label className="text-sm font-black text-slate-700">
                Bukti Lampiran (Foto/PDF, Maks 2MB - Opsional)
              </label>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="mt-2 block w-full text-xs font-bold text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-[#123c8c]/10 file:text-[#123c8c] hover:file:bg-[#123c8c]/20"
              />

              {fileBase64 && (
                <p className="mt-2 text-xs font-semibold text-emerald-600">
                  ✓ Dokumen berhasil dilampirkan.
                </p>
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

            <p className="mt-4 text-sm font-semibold leading-6 text-blue-100">
              Status pengajuan dan kunci lokasi akan berubah setelah admin melakukan persetujuan atau penolakan.
            </p>
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
                Pending
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
            <div className="flex items-center gap-3 rounded-[2rem] border border-blue-100 bg-white p-5 text-sm font-black text-slate-500 shadow-lg shadow-slate-200/60">
              <Loader2 size={18} className="animate-spin text-[#123c8c]" />
              Memuat pengajuan cuti...
            </div>
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

                    {(() => {
                      const [displayReason, attachmentUrl] = item.reason.split(" | Attachment: ");
                      return (
                        <>
                          <p className="mt-4 rounded-2xl bg-[#f8fbff] p-4 text-sm font-semibold leading-6 text-slate-600">
                            {displayReason}
                          </p>

                          {attachmentUrl && (
                            <div className="mt-3">
                              {attachmentUrl.startsWith("data:image/") || /\.(png|jpe?g|gif|webp)$/i.test(attachmentUrl) ? (
                                <div className="mt-2 max-w-xs rounded-xl overflow-hidden border border-slate-100 bg-slate-50 p-2">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img
                                    src={attachmentUrl}
                                    alt="Bukti Dokumen Cuti"
                                    className="w-full max-h-40 object-contain rounded-lg"
                                  />
                                </div>
                              ) : (
                                <a
                                  href={attachmentUrl}
                                  download={`bukti-${item.leaveType}-${item.startDate}.pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs font-black text-[#123c8c] hover:underline bg-[#123c8c]/5 px-3 py-1.5 rounded-xl transition"
                                >
                                  <FileText size={14} />
                                  Lihat/Unduh Bukti Lampiran
                                </a>
                              )}
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {item.locationUnlockRequested ? (
                      <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-700">
                        Kunci lokasi: {item.locationUnlockApproved ? "dibuka admin" : "menunggu approval admin"}
                      </p>
                    ) : null}

                    {item.visitLocationName || item.visitAddress ? (
                      <p className="mt-3 rounded-2xl bg-[#f8fbff] p-4 text-sm font-semibold leading-6 text-slate-600">
                        Lokasi: {[item.visitLocationName, item.visitAddress].filter(Boolean).join(" - ")}
                      </p>
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
