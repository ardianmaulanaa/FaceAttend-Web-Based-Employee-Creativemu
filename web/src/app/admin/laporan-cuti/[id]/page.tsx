"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  UserRound,
  X,
  XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

function isImageAttachment(urlOrName?: string | null) {
  if (!urlOrName) return false;
  const lower = urlOrName.toLowerCase();
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.startsWith("data:image/")
  );
}

type AdminLeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string | null;
  employeeEmail: string | null;
  employeePhone: string | null;
  employeeEmploymentStatus: string | null;
  employeeEmploymentStartDate: string | null;
  employeeEmploymentEndDate: string | null;
  employeeNik: string | null;
  employeeProfilePhoto: string | null;
  employeeJabatan: string | null;
  employeePosition: string | null;
  employeeDepartment: string | null;
  employeeShift: string | null;
  employeeOffice: string | null;
  leaveTypeLabel: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: string;
  statusLabel: string;
  adminNote: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  createdAt: string;
};

type AdminLeaveResponse = {
  success: boolean;
  message?: string;
  error?: string;
  requests?: AdminLeaveRequest[];
};

type PendingAction = {
  status: "approved" | "rejected";
} | null;

const approvedAnswerOptions = [
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

const rejectedAnswerOptions = [
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

function getAnswerOptions(status: "approved" | "rejected") {
  return status === "approved" ? approvedAnswerOptions : rejectedAnswerOptions;
}

function getDefaultAnswer(status: "approved" | "rejected") {
  return getAnswerOptions(status)[0]?.value || "";
}

function formatDateTimeDisplay(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoCard({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fbff] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-black text-[#123456]">
        {value || "-"}
      </p>
    </div>
  );
}

function LeaveDetailMotionStyles() {
  return (
    <style>{`
      @keyframes leaveDetailEnter {
        0% {
          opacity: 0;
          transform: translateY(12px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .leave-detail-enter {
        animation: leaveDetailEnter 280ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .leave-detail-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminLeaveRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState<AdminLeaveRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getLeaveRequest = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/admin/leave-requests?id=${encodeURIComponent(requestId)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data: AdminLeaveResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setRequest(null);
        setErrorMessage(
          data.message || data.error || "Gagal mengambil detail pengajuan.",
        );
        return;
      }

      const selectedRequest = data.requests?.[0] || null;
      setRequest(selectedRequest);

      if (!selectedRequest) {
        setErrorMessage("Detail pengajuan tidak ditemukan.");
      }
    } catch (error) {
      console.error("GET_ADMIN_LEAVE_REQUEST_DETAIL_ERROR:", error);
      setRequest(null);
      setErrorMessage("Gagal mengambil detail pengajuan.");
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  function openAnswerModal(status: "approved" | "rejected") {
    const defaultAnswer = getDefaultAnswer(status);

    setPendingAction({ status });
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
    setAdminNote(value === "custom" ? "" : value);
  }

  async function confirmUpdateLeaveStatus() {
    if (!pendingAction || !request) return;

    try {
      setIsUpdating(true);

      const response = await fetch("/api/admin/leave-requests", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: request.id,
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
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notification-count-changed"));
      }
      await getLeaveRequest();
    } catch (error) {
      console.error("UPDATE_LEAVE_REQUEST_DETAIL_STATUS_ERROR:", error);
      alert("Gagal memperbarui status cuti.");
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    void getLeaveRequest();
  }, [getLeaveRequest]);

  const isPending = request?.status.toLowerCase() === "pending";
  const currentAnswerOptions = pendingAction
    ? getAnswerOptions(pendingAction.status)
    : [];

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <LeaveDetailMotionStyles />
      <AppHeader title="Detail Pengajuan Cuti" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-6xl space-y-5 px-5 py-6 md:px-10 lg:px-16">
          <button
            type="button"
            onClick={() => router.push("/admin/laporan-cuti")}
            className="leave-detail-enter inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#123c8c] ring-1 ring-blue-100 transition hover:bg-[#f8fbff] active:scale-[0.98]"
          >
            <ArrowLeft size={18} strokeWidth={2.6} />
            Kembali ke Laporan Cuti
          </button>

          {isLoading ? (
            <div className="leave-detail-enter flex items-center justify-center gap-2 rounded-[2rem] border border-blue-100 bg-white px-5 py-14 text-sm font-bold text-slate-500 shadow-xl shadow-slate-300/30">
              <Loader2 size={18} className="animate-spin text-[#123c8c]" />
              Memuat detail pengajuan...
            </div>
          ) : errorMessage || !request ? (
            <div className="leave-detail-enter rounded-[2rem] border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
              {errorMessage || "Detail pengajuan tidak ditemukan."}
            </div>
          ) : (
            <>
              <article className="leave-detail-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
                <div className="bg-[#123c8c] p-5 text-white md:p-7">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                      {request.employeeProfilePhoto ? (
                        <img
                          src={request.employeeProfilePhoto}
                          alt={`Foto profil ${request.employeeName}`}
                          className="h-16 w-16 shrink-0 rounded-2xl border border-white/30 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                          <UserRound size={30} strokeWidth={2.6} />
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/70">
                          Detail Pengajuan
                        </p>
                        <h1 className="mt-1 truncate text-2xl font-black md:text-3xl">
                          {request.employeeName}
                        </h1>
                        <p className="mt-1 truncate text-sm font-bold text-white/75">
                          {request.employeeCode || "-"}{" "}
                          {request.employeeDepartment
                            ? `• ${request.employeeDepartment}`
                            : ""}
                          {request.employeeJabatan
                            ? ` • ${request.employeeJabatan}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-black ring-1 ${getStatusStyle(
                        request.status,
                      )}`}
                    >
                      {request.status.toLowerCase() === "approved" ? (
                        <CheckCircle2 size={17} strokeWidth={2.6} />
                      ) : request.status.toLowerCase() === "rejected" ? (
                        <XCircle size={17} strokeWidth={2.6} />
                      ) : (
                        <Clock3 size={17} strokeWidth={2.6} />
                      )}
                      {request.statusLabel}
                    </span>
                  </div>
                </div>

                <div className="grid gap-5 p-5 md:p-6">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                    <InfoCard label="Kantor" value={request.employeeOffice} />
                    <InfoCard
                      label="Divisi"
                      value={request.employeeDepartment}
                    />
                    <InfoCard label="Jabatan" value={request.employeeJabatan} />
                    <InfoCard label="Posisi" value={request.employeePosition} />
                    <InfoCard label="Shift" value={request.employeeShift} />
                    <InfoCard
                      label="Status Kepegawaian"
                      value={request.employeeEmploymentStatus}
                    />
                    <InfoCard
                      label="Masa Kerja"
                      value={`${request.employeeEmploymentStartDate || "-"} - ${
                        request.employeeEmploymentEndDate || "-"
                      }`}
                    />
                    <InfoCard label="NIK" value={request.employeeNik} />
                  </div>

                  <div className="rounded-[1.5rem] border border-blue-100 bg-[#f8fbff] p-4 md:p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between pr-2 sm:pr-4 md:pr-6">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#123c8c]">
                              {request.leaveTypeLabel}
                            </span>

                            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-blue-100">
                              <CalendarDays size={14} strokeWidth={2.6} />
                              {request.totalDays} hari
                            </span>
                          </div>

                          <p className="text-xs font-bold text-slate-400 sm:text-right">
                            Diajukan {formatDateTimeDisplay(request.createdAt)}
                          </p>
                        </div>

                        <h2 className="mt-3 text-xl font-black text-slate-950">
                          Detail Pengajuan
                        </h2>
                      </div>

                      <div className="grid gap-2 rounded-3xl bg-white p-4 text-sm font-bold text-slate-600 sm:grid-cols-3 lg:min-w-[420px]">
                        <InfoCard label="Mulai" value={request.startDate} />
                        <InfoCard label="Selesai" value={request.endDate} />
                        <InfoCard
                          label="Total"
                          value={`${request.totalDays} hari`}
                        />
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl bg-white p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                        Alasan
                      </p>
                      <p className="mt-2 break-words text-sm font-semibold leading-7 text-slate-600">
                        {request.reason}
                      </p>
                    </div>

                    {request.attachmentUrl ? (
                      <div className="mt-3 rounded-3xl bg-white p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                          Surat Dokter / Lampiran
                        </p>

                        {isImageAttachment(request.attachmentUrl) ||
                        isImageAttachment(request.attachmentName) ? (
                          <div className="mt-3 space-y-3">
                            <div className="group relative max-w-sm overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                              <img
                                src={request.attachmentUrl}
                                alt={request.attachmentName || "Lampiran"}
                                className="max-h-64 w-full object-contain cursor-pointer transition hover:scale-[1.02]"
                                onClick={() => setPreviewImage(request.attachmentUrl!)}
                              />
                              <button
                                type="button"
                                onClick={() => setPreviewImage(request.attachmentUrl!)}
                                className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-slate-900"
                              >
                                <Eye size={13} />
                                Perbesar
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <a
                                href={request.attachmentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-black text-[#123c8c] transition hover:bg-blue-100"
                              >
                                <ExternalLink size={13} />
                                Buka Tab Baru
                              </a>
                              <a
                                href={request.attachmentUrl}
                                download={request.attachmentName || "lampiran"}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                              >
                                <Download size={13} />
                                Unduh Foto
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-2.5 flex flex-wrap gap-2">
                            <a
                              href={request.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs font-black text-[#123c8c] shadow-sm transition hover:bg-blue-100 active:scale-[0.98]"
                            >
                              <FileText size={16} />
                              {request.attachmentName || "Buka / Unduh Lampiran Surat Dokter"}
                            </a>
                            <a
                              href={request.attachmentUrl}
                              download={request.attachmentName || "lampiran.pdf"}
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-[0.98]"
                            >
                              <Download size={16} />
                              Unduh File
                            </a>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {request.adminNote ? (
                      <div className="mt-3 rounded-3xl bg-blue-50 p-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#123c8c]">
                          Jawaban Admin
                        </p>
                        <p className="mt-2 break-words text-sm font-semibold leading-7 text-[#123c8c]">
                          {request.adminNote}
                        </p>
                      </div>
                    ) : null}

                    {isPending ? (
                      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => openAnswerModal("rejected")}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-red-50 px-5 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 active:scale-[0.98]"
                        >
                          <XCircle size={17} strokeWidth={2.6} />
                          Tolak
                        </button>

                        <button
                          type="button"
                          onClick={() => openAnswerModal("approved")}
                          className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                        >
                          <CheckCircle2 size={17} strokeWidth={2.6} />
                          Setujui
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            </>
          )}
        </section>
      </main>

      {pendingAction ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Jawaban Admin
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {pendingAction.status === "approved"
                    ? "Setujui Pengajuan Cuti"
                    : "Tolak Pengajuan Cuti"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeAnswerModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 rounded-2xl bg-[#f8fbff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Karyawan
              </p>
              <p className="mt-1 text-base font-black text-[#123456]">
                {request?.employeeName}
              </p>
            </div>

            <label className="mt-5 block text-sm font-black text-slate-700">
              Pilih Jawaban
            </label>
            <select
              value={selectedAnswer}
              onChange={(event) =>
                handleSelectedAnswerChange(event.target.value)
              }
              className="mt-2 h-14 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
            >
              {currentAnswerOptions.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-sm font-black text-slate-700">
              Catatan Admin
              <span className="ml-1 text-xs font-bold text-slate-400">
                opsional
              </span>
            </label>
            <textarea
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
              placeholder="Tulis jawaban admin jika diperlukan..."
              className="mt-2 min-h-32 w-full resize-none rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-4 text-sm font-bold leading-6 text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
            />

            <div className="mt-6 flex flex-col-reverse gap-3 md:flex-row md:justify-end">
              <button
                type="button"
                onClick={closeAnswerModal}
                disabled={isUpdating}
                className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={confirmUpdateLeaveStatus}
                disabled={isUpdating}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${
                  pendingAction.status === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {isUpdating ? (
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
      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white transition hover:bg-slate-900"
            >
              <X size={18} />
            </button>
            <img
              src={previewImage}
              alt="Preview Surat Dokter / Lampiran"
              className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </MobileShell>
  );
}
