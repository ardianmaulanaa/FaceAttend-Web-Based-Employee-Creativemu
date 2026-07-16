"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  Search,
  X,
  XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

type AdminLeaveRequest = {
  id: string;
  employeeName: string;
  employeeCode: string | null;
  employeePosition: string | null;
  employeeDepartment: string | null;
  leaveType: string;
  leaveTypeLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  statusLabel: string;
  adminNote: string | null;
  createdAt: string;
};

type AdminLeaveResponse = {
  success: boolean;
  message?: string;
  error?: string;
  requests: AdminLeaveRequest[];
};

type StatusFilter = "all" | "pending" | "approved" | "rejected";

type PendingAction = {
  id: string;
  status: "approved" | "rejected";
  employeeName: string;
} | null;

type AdminAnswerOption = {
  label: string;
  value: string;
};

const approvedAnswerOptions: AdminAnswerOption[] = [
  {
    label: "Disetujui standar",
    value: "Pengajuan cuti disetujui oleh admin.",
  },
  {
    label: "Disetujui, koordinasi pekerjaan",
    value:
      "Pengajuan cuti disetujui. Silakan pastikan pekerjaan yang sedang berjalan sudah dikoordinasikan terlebih dahulu.",
  },
  {
    label: "Disetujui, lampirkan bukti bila diperlukan",
    value:
      "Pengajuan cuti disetujui. Apabila diperlukan, silakan lengkapi dokumen pendukung setelah kembali bekerja.",
  },
  {
    label: "Tulis sendiri",
    value: "custom",
  },
];

const rejectedAnswerOptions: AdminAnswerOption[] = [
  {
    label: "Ditolak standar",
    value: "Pengajuan cuti ditolak oleh admin.",
  },
  {
    label: "Ditolak karena jadwal belum memungkinkan",
    value:
      "Pengajuan cuti belum dapat disetujui karena jadwal kerja pada tanggal tersebut belum memungkinkan.",
  },
  {
    label: "Ditolak, perlu revisi tanggal",
    value:
      "Pengajuan cuti belum dapat disetujui. Silakan ajukan ulang dengan tanggal yang lebih sesuai.",
  },
  {
    label: "Ditolak, alasan belum cukup jelas",
    value:
      "Pengajuan cuti belum dapat disetujui karena alasan pengajuan belum cukup jelas. Silakan ajukan ulang dengan keterangan yang lebih lengkap.",
  },
  {
    label: "Tulis sendiri",
    value: "custom",
  },
];

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    console.error("API_BUKAN_JSON:", text);

    return {
      success: false,
      message: "API mengembalikan response bukan JSON.",
      requests: [],
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

function getStatusLabel(status: StatusFilter) {
  if (status === "pending") return "Menunggu";
  if (status === "approved") return "Disetujui";
  if (status === "rejected") return "Ditolak";

  return "Semua Status";
}

function getAnswerOptions(status: "approved" | "rejected") {
  if (status === "approved") return approvedAnswerOptions;

  return rejectedAnswerOptions;
}

function getDefaultAnswer(status: "approved" | "rejected") {
  const options = getAnswerOptions(status);

  return options[0]?.value || "";
}

function LeaveReportMotionStyles() {
  return (
    <style>{`
      @keyframes leaveReportEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes leaveReportRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes leaveReportModalBackdrop {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }

      @keyframes leaveReportModalPanel {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .leave-report-enter {
        animation: leaveReportEnter 320ms ease-out both;
      }

      .leave-report-row-enter {
        opacity: 0;
        animation: leaveReportRowEnter 300ms ease-out both;
      }

      .leave-report-modal-backdrop {
        animation: leaveReportModalBackdrop 180ms ease-out both;
      }

      .leave-report-modal-panel {
        animation: leaveReportModalPanel 260ms ease-out both;
        transform-origin: center bottom;
      }

      .leave-report-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .leave-report-enter,
        .leave-report-row-enter,
        .leave-report-modal-backdrop,
        .leave-report-modal-panel {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminLeaveReportPage() {
  const [requests, setRequests] = useState<AdminLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [adminNote, setAdminNote] = useState("");

  async function getLeaveRequests() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/leave-requests", {
        method: "GET",
        cache: "no-store",
      });

      const data: AdminLeaveResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setRequests([]);
        setErrorMessage(
          data.message || data.error || "Gagal mengambil laporan cuti.",
        );
        return;
      }

      setRequests(data.requests || []);
    } catch (error) {
      console.error("GET_ADMIN_LEAVE_REQUESTS_ERROR:", error);
      setRequests([]);
      setErrorMessage("Gagal mengambil laporan cuti.");
    } finally {
      setIsLoading(false);
    }
  }

  function openAnswerModal(
    item: AdminLeaveRequest,
    status: "approved" | "rejected",
  ) {
    const defaultAnswer = getDefaultAnswer(status);

    setPendingAction({
      id: item.id,
      status,
      employeeName: item.employeeName,
    });

    setSelectedAnswer(defaultAnswer);
    setAdminNote(defaultAnswer);
  }

  function closeAnswerModal() {
    setPendingAction(null);
    setSelectedAnswer("");
    setAdminNote("");
  }

  function handleSelectedAnswerChange(value: string) {
    setSelectedAnswer(value);

    if (value === "custom") {
      setAdminNote("");
      return;
    }

    setAdminNote(value);
  }

  async function confirmUpdateLeaveStatus() {
    if (!pendingAction) return;

    try {
      setIsUpdatingId(pendingAction.id);

      const response = await fetch("/api/admin/leave-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pendingAction.id,
          status: pendingAction.status,
          adminNote: adminNote.trim(),
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        alert(data.message || data.error || "Gagal memperbarui status cuti.");
        return;
      }

      closeAnswerModal();
      await getLeaveRequests();
    } catch (error) {
      console.error("UPDATE_LEAVE_STATUS_ERROR:", error);
      alert("Gagal memperbarui status cuti.");
    } finally {
      setIsUpdatingId(null);
    }
  }

  useEffect(() => {
    void getLeaveRequests();
  }, []);

  const stats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter(
      (item) => item.status.toLowerCase() === "pending",
    ).length;
    const approved = requests.filter(
      (item) => item.status.toLowerCase() === "approved",
    ).length;
    const rejected = requests.filter(
      (item) => item.status.toLowerCase() === "rejected",
    ).length;

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();

    return requests.filter((item) => {
      const matchStatus =
        statusFilter === "all" || item.status.toLowerCase() === statusFilter;

      const searchableText = [
        item.employeeName,
        item.employeeCode,
        item.employeePosition,
        item.employeeDepartment,
        item.leaveTypeLabel,
        item.reason,
        item.statusLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = !keyword || searchableText.includes(keyword);

      return matchStatus && matchKeyword;
    });
  }, [requests, searchKeyword, statusFilter]);

  const currentAnswerOptions = pendingAction
    ? getAnswerOptions(pendingAction.status)
    : [];

  const modalTitle =
    pendingAction?.status === "approved"
      ? "Setujui Pengajuan Cuti"
      : "Tolak Pengajuan Cuti";

  const modalDescription =
    pendingAction?.status === "approved"
      ? "Pilih atau tulis jawaban admin sebelum pengajuan cuti disetujui."
      : "Pilih atau tulis jawaban admin sebelum pengajuan cuti ditolak.";

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <LeaveReportMotionStyles />

      <AppHeader title="Laporan Cuti" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <div className="leave-report-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
            <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="bg-[#123c8c] p-6 text-white md:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                    <FileText size={25} strokeWidth={2.6} />
                  </div>

                  <div>
                    <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                      Laporan Pengajuan Cuti
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4 md:p-6">
                <div
                  className="leave-report-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                  style={{ animationDelay: "60ms" }}
                >
                  <p className="text-xs font-bold text-slate-500">Total</p>
                  <h3 className="mt-3 text-3xl font-black text-[#123c8c]">
                    {stats.total}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    Semua laporan
                  </p>
                </div>

                <div
                  className="leave-report-row-enter rounded-2xl border border-orange-100 bg-orange-50 p-4"
                  style={{ animationDelay: "100ms" }}
                >
                  <p className="text-xs font-bold text-orange-700">Menunggu</p>
                  <h3 className="mt-3 text-3xl font-black text-orange-700">
                    {stats.pending}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-orange-700/70">
                    Belum diproses
                  </p>
                </div>

                <div
                  className="leave-report-row-enter rounded-2xl border border-emerald-100 bg-emerald-50 p-4"
                  style={{ animationDelay: "140ms" }}
                >
                  <p className="text-xs font-bold text-emerald-700">
                    Disetujui
                  </p>
                  <h3 className="mt-3 text-3xl font-black text-emerald-700">
                    {stats.approved}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-emerald-700/70">
                    Sudah diterima
                  </p>
                </div>

                <div
                  className="leave-report-row-enter rounded-2xl border border-red-100 bg-red-50 p-4"
                  style={{ animationDelay: "180ms" }}
                >
                  <p className="text-xs font-bold text-red-700">Ditolak</p>
                  <h3 className="mt-3 text-3xl font-black text-red-700">
                    {stats.rejected}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-red-700/70">
                    Tidak diterima
                  </p>
                </div>
              </div>
            </div>
          </div>

          {errorMessage ? (
            <div className="leave-report-row-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div
            className="leave-report-enter rounded-[2rem] border border-white/70 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
            style={{ animationDelay: "100ms" }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Data Laporan
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Daftar Pengajuan Cuti
                </h2>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-[1fr_220px]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="Cari nama, kode, alasan, atau jenis cuti..."
                  className="leave-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="leave-report-field h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
            </div>

            <div className="mt-6">
              {isLoading ? (
                <div className="leave-report-row-enter flex items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-[#f8fbff] px-5 py-12 text-sm font-bold text-slate-500">
                  <Loader2 size={18} className="animate-spin text-[#123c8c]" />
                  Memuat laporan cuti...
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="leave-report-row-enter rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                    <CalendarDays size={26} strokeWidth={2.6} />
                  </div>

                  <p className="mt-4 text-sm font-black text-slate-500">
                    Tidak ada laporan cuti untuk filter{" "}
                    {getStatusLabel(statusFilter)}.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredRequests.map((item, index) => {
                    const StatusIcon = getStatusIcon(item.status);
                    const isPending = item.status.toLowerCase() === "pending";

                    return (
                      <article
                        key={item.id}
                        className="leave-report-row-enter rounded-[2rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40"
                        style={{
                          animationDelay: `${index * 55}ms`,
                        }}
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#123c8c]">
                                {item.leaveTypeLabel}
                              </span>

                              <span
                                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
                                  item.status,
                                )}`}
                              >
                                <StatusIcon size={14} strokeWidth={2.6} />
                                {item.statusLabel}
                              </span>
                            </div>

                            <h3 className="mt-3 text-xl font-black text-slate-950">
                              {item.employeeName}
                            </h3>

                            <p className="mt-1 text-sm font-bold text-slate-500">
                              {item.employeeCode || "-"}{" "}
                              {item.employeePosition
                                ? `• ${item.employeePosition}`
                                : ""}
                              {item.employeeDepartment
                                ? ` • ${item.employeeDepartment}`
                                : ""}
                            </p>
                          </div>

                          <div className="grid gap-2 rounded-3xl bg-[#f8fbff] p-4 text-sm font-bold text-slate-600 sm:grid-cols-3 lg:min-w-[360px]">
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">
                                Mulai
                              </p>
                              <p className="mt-1 text-[#123456]">
                                {item.startDate}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">
                                Selesai
                              </p>
                              <p className="mt-1 text-[#123456]">
                                {item.endDate}
                              </p>
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400">
                                Total
                              </p>
                              <p className="mt-1 text-[#123456]">
                                {item.totalDays} hari
                              </p>
                            </div>
                          </div>
                        </div>

                        {(() => {
                          const [displayReason, attachmentUrl] = item.reason.split(" | Attachment: ");
                          return (
                            <>
                              <div className="mt-4 rounded-3xl bg-[#f8fbff] p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                  Alasan
                                </p>

                                <p className="mt-2 break-words text-sm font-semibold leading-7 text-slate-600">
                                  {displayReason}
                                </p>
                              </div>

                              {attachmentUrl && (
                                <div className="mt-3">
                                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                                    Dokumen Pendukung
                                  </p>
                                  {attachmentUrl.startsWith("data:image/") || /\.(png|jpe?g|gif|webp)$/i.test(attachmentUrl) ? (
                                    <div className="mt-2 max-w-sm rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 p-2">
                                      <img
                                        src={attachmentUrl}
                                        alt="Bukti Dokumen Cuti"
                                        className="w-full max-h-60 object-contain rounded-xl"
                                      />
                                    </div>
                                  ) : (
                                    <a
                                      href={attachmentUrl}
                                      download={`bukti-${item.leaveType}-${item.employeeName}.pdf`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-[#123c8c] hover:underline bg-[#123c8c]/5 px-3 py-1.5 rounded-xl transition"
                                    >
                                      <FileText size={14} />
                                      Lihat/Unduh Bukti Dokumen
                                    </a>
                                  )}
                                </div>
                              )}
                            </>
                          );
                        })()}

                        {item.adminNote ? (
                          <div className="mt-3 rounded-3xl bg-blue-50 p-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#123c8c]">
                              Jawaban Admin
                            </p>

                            <p className="mt-2 break-words text-sm font-semibold leading-7 text-[#123c8c]">
                              {item.adminNote}
                            </p>
                          </div>
                        ) : null}

                        {isPending ? (
                          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() => openAnswerModal(item, "rejected")}
                              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 active:scale-[0.98]"
                            >
                              <XCircle size={17} strokeWidth={2.6} />
                              Tolak
                            </button>

                            <button
                              type="button"
                              onClick={() => openAnswerModal(item, "approved")}
                              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                            >
                              <CheckCircle2 size={17} strokeWidth={2.6} />
                              Setujui
                            </button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {pendingAction ? (
        <div className="leave-report-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="leave-report-modal-panel max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Jawaban Admin
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {modalTitle}
                </h2>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {modalDescription}
                </p>
              </div>

              <button
                type="button"
                onClick={closeAnswerModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="leave-report-row-enter mt-5 rounded-2xl bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Karyawan
              </p>

              <p className="mt-1 text-base font-black text-[#123456]">
                {pendingAction.employeeName}
              </p>
            </div>

            <div
              className="leave-report-row-enter mt-5"
              style={{ animationDelay: "40ms" }}
            >
              <label className="text-sm font-black text-slate-700">
                Pilih Jawaban
              </label>

              <select
                value={selectedAnswer}
                onChange={(event) =>
                  handleSelectedAnswerChange(event.target.value)
                }
                className="leave-report-field mt-2 h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
              >
                {currentAnswerOptions.map((option) => (
                  <option key={option.label} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              className="leave-report-row-enter mt-4"
              style={{ animationDelay: "80ms" }}
            >
              <label className="text-sm font-black text-slate-700">
                Catatan Admin
                <span className="ml-1 text-xs font-bold text-slate-400">
                  opsional
                </span>
              </label>

              <textarea
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Tulis jawaban admin jika diperlukan..."
                className="leave-report-field mt-2 min-h-32 w-full resize-none rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-4 text-sm font-bold leading-6 text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div
              className="leave-report-row-enter mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs font-semibold leading-6 text-[#123c8c]"
              style={{ animationDelay: "120ms" }}
            >
              Catatan ini akan tampil pada riwayat pengajuan cuti karyawan
              sebagai jawaban dari admin.
            </div>

            <div
              className="leave-report-row-enter mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end"
              style={{ animationDelay: "160ms" }}
            >
              <button
                type="button"
                onClick={closeAnswerModal}
                disabled={Boolean(isUpdatingId)}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmUpdateLeaveStatus}
                disabled={Boolean(isUpdatingId)}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  pendingAction.status === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isUpdatingId ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses...
                  </>
                ) : pendingAction.status === "approved" ? (
                  <>
                    <CheckCircle2 size={18} />
                    Setujui Sekarang
                  </>
                ) : (
                  <>
                    <XCircle size={18} />
                    Tolak Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}
