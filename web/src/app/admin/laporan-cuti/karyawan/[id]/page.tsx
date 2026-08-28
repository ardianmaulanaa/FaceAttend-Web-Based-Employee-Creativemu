"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  attachmentMime?: string | null;
  createdAt: string;
};

type Employee = {
  id: string;
  name: string;
  email: string;
  employee_code?: string | null;
  phone?: string | null;
  employment_status?: string | null;
  employment_start_date?: string | null;
  employment_end_date?: string | null;
  nik?: string | null;
  profile_photo?: string | null;
  registered_office?: { name?: string | null } | null;
  department?: { name?: string | null } | null;
  jabatan?: { name?: string | null } | null;
  position?: { name?: string | null } | null;
  shift?: { name?: string | null } | null;
};

type AdminLeaveResponse = {
  success: boolean;
  message?: string;
  error?: string;
  requests?: AdminLeaveRequest[];
};

type EmployeesResponse = {
  success: boolean;
  message?: string;
  error?: string;
  employees?: Employee[];
  data?: Employee[];
};

type PendingAction = {
  id: string;
  status: "approved" | "rejected";
  leaveTypeLabel: string;
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

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "approved") return CheckCircle2;
  if (normalized === "rejected") return XCircle;

  return Clock3;
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

function formatDateDisplay(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="min-w-0 border-b border-slate-100 py-3 last:border-b-0 md:last:border-b md:[&:nth-last-child(-n+2)]:border-b-0">
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-slate-800">
        {value || "-"}
      </p>
    </div>
  );
}

function StatChip({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "orange" | "emerald" | "red";
}) {
  const toneClass =
    tone === "orange"
      ? "bg-orange-50 text-orange-700 ring-orange-100"
      : tone === "emerald"
        ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
        : tone === "red"
          ? "bg-red-50 text-red-700 ring-red-100"
          : "bg-slate-50 text-slate-600 ring-slate-200";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-black ring-1 ${toneClass}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function LeaveEmployeeDetailMotionStyles() {
  return (
    <style>{`
      @keyframes leaveEmployeeDetailEnter {
        0% {
          opacity: 0;
          transform: translateY(12px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .leave-employee-detail-enter {
        animation: leaveEmployeeDetailEnter 280ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .leave-employee-detail-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminEmployeeLeaveDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const employeeId = params.id;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [requests, setRequests] = useState<AdminLeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const getEmployeeLeaveDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [employeesResponse, leaveResponse] = await Promise.all([
        fetch("/api/employees", {
          method: "GET",
          cache: "no-store",
        }),
        fetch(
          `/api/admin/leave-requests?employeeId=${encodeURIComponent(employeeId)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        ),
      ]);

      const employeesData: EmployeesResponse =
        await readJsonResponse(employeesResponse);
      const leaveData: AdminLeaveResponse = await readJsonResponse(leaveResponse);

      if (!employeesResponse.ok || !employeesData.success) {
        setEmployee(null);
        setRequests([]);
        setErrorMessage(
          employeesData.message ||
            employeesData.error ||
            "Gagal mengambil data karyawan.",
        );
        return;
      }

      if (!leaveResponse.ok || !leaveData.success) {
        setRequests([]);
        setErrorMessage(
          leaveData.message || leaveData.error || "Gagal mengambil data cuti.",
        );
      }

      const selectedEmployee =
        (employeesData.employees || employeesData.data || []).find(
          (item) => item.id === employeeId,
        ) || null;

      setEmployee(selectedEmployee);
      setRequests(leaveData.requests || []);

      if (!selectedEmployee) {
        setErrorMessage("Data karyawan tidak ditemukan.");
      }
    } catch (error) {
      console.error("GET_EMPLOYEE_LEAVE_DETAIL_ERROR:", error);
      setEmployee(null);
      setRequests([]);
      setErrorMessage("Gagal mengambil detail cuti karyawan.");
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  function openAnswerModal(
    request: AdminLeaveRequest,
    status: "approved" | "rejected",
  ) {
    const defaultAnswer = getDefaultAnswer(status);

    setPendingAction({
      id: request.id,
      status,
      leaveTypeLabel: request.leaveTypeLabel,
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
    setAdminNote(value === "custom" ? "" : value);
  }

  async function confirmUpdateLeaveStatus() {
    if (!pendingAction) return;

    try {
      setIsUpdating(true);

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
      await getEmployeeLeaveDetail();
    } catch (error) {
      console.error("UPDATE_EMPLOYEE_LEAVE_STATUS_ERROR:", error);
      alert("Gagal memperbarui status cuti.");
    } finally {
      setIsUpdating(false);
    }
  }

  useEffect(() => {
    void getEmployeeLeaveDetail();
  }, [getEmployeeLeaveDetail]);

  const stats = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((item) => item.status.toLowerCase() === "pending")
        .length,
      approved: requests.filter(
        (item) => item.status.toLowerCase() === "approved",
      ).length,
      rejected: requests.filter(
        (item) => item.status.toLowerCase() === "rejected",
      ).length,
    }),
    [requests],
  );

  const profilePhoto =
    employee?.profile_photo || requests[0]?.employeeProfilePhoto || null;
  const currentAnswerOptions = pendingAction
    ? getAnswerOptions(pendingAction.status)
    : [];

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <LeaveEmployeeDetailMotionStyles />
      <AppHeader title="Detail Cuti Karyawan" variant="admin" />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-6xl space-y-5 px-5 py-6 md:px-10 lg:px-16">
          <button
            type="button"
            onClick={() => router.push("/admin/laporan-cuti")}
            className="leave-employee-detail-enter inline-flex h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#123c8c] ring-1 ring-blue-100 transition hover:bg-[#f8fbff] active:scale-[0.98]"
          >
            <ArrowLeft size={18} strokeWidth={2.6} />
            Kembali ke Laporan Cuti
          </button>

          {isLoading ? (
            <div className="leave-employee-detail-enter flex items-center justify-center gap-2 rounded-[2rem] border border-blue-100 bg-white px-5 py-14 text-sm font-bold text-slate-500 shadow-xl shadow-slate-300/30">
              <Loader2 size={18} className="animate-spin text-[#123c8c]" />
              Memuat detail cuti karyawan...
            </div>
          ) : errorMessage || !employee ? (
            <div className="leave-employee-detail-enter rounded-[2rem] border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
              {errorMessage || "Data karyawan tidak ditemukan."}
            </div>
          ) : (
            <>
              <article className="leave-employee-detail-enter rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-300/20 md:p-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 items-center gap-4">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt={`Foto profil ${employee.name}`}
                        className="h-14 w-14 shrink-0 rounded-2xl border border-blue-100 object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#eef4ff] text-[#123c8c]">
                        <UserRound size={28} strokeWidth={2.6} />
                      </div>
                    )}

                    <div className="min-w-0">
                      <h1 className="truncate text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                        {employee.name}
                      </h1>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatChip label="Total" value={stats.total} />
                    <StatChip label="Request" value={stats.pending} tone="orange" />
                    <StatChip label="Disetujui" value={stats.approved} tone="emerald" />
                    <StatChip label="Ditolak" value={stats.rejected} tone="red" />
                  </div>
                </div>

                <div className="mt-5 grid gap-x-8 md:grid-cols-2">
                  <DetailItem label="Kantor" value={employee.registered_office?.name} />
                  <DetailItem label="Divisi" value={employee.department?.name} />
                  <DetailItem label="Jabatan" value={employee.jabatan?.name} />
                  <DetailItem label="Posisi" value={employee.position?.name} />
                  <DetailItem label="Shift" value={employee.shift?.name} />
                  <DetailItem
                    label="Status Kepegawaian"
                    value={employee.employment_status}
                  />
                  <DetailItem
                    label="Masa Kerja"
                    value={`${formatDateDisplay(
                      employee.employment_start_date,
                    )} - ${formatDateDisplay(employee.employment_end_date)}`}
                  />
                  <DetailItem label="NIK" value={employee.nik} />
                </div>
              </article>

              <section className="leave-employee-detail-enter rounded-3xl border border-white/70 bg-white/95 p-5 shadow-lg shadow-slate-300/20 backdrop-blur-xl md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-950">
                      Riwayat Pengajuan Cuti
                    </h2>
                    <p className="mt-0.5 text-sm font-bold text-slate-500">
                      Semua pengajuan milik {employee.name}
                    </p>
                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#123c8c]">
                    <CalendarDays size={22} strokeWidth={2.6} />
                  </div>
                </div>

                <div className="mt-5 grid gap-3">
                  {requests.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-10 text-center text-sm font-black text-slate-500">
                      Karyawan ini belum pernah mengajukan cuti.
                    </div>
                  ) : (
                    requests.map((request) => {
                      const StatusIcon = getStatusIcon(request.status);
                      const isPending =
                        request.status.toLowerCase() === "pending";

                      return (
                        <article
                          key={request.id}
                          className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm shadow-slate-200/60"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-black text-slate-950">
                                  {request.leaveTypeLabel}
                                </h3>

                                <span
                                  className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ring-1 ${getStatusStyle(
                                    request.status,
                                  )}`}
                                >
                                  <StatusIcon size={13} strokeWidth={2.6} />
                                  {request.statusLabel}
                                </span>
                              </div>

                              <p className="text-sm font-bold text-slate-500">
                                {formatDateDisplay(request.startDate)} -{" "}
                                {formatDateDisplay(request.endDate)} •{" "}
                                {request.totalDays} hari
                              </p>
                            </div>

                            <p className="text-xs font-bold text-slate-400 sm:text-right sm:shrink-0">
                              Diajukan {formatDateTimeDisplay(request.createdAt)}
                            </p>
                          </div>

                          <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                            <p className="break-words text-sm leading-6 text-slate-600">
                              <span className="font-black text-slate-700">
                                Alasan:
                              </span>{" "}
                              {request.reason}
                            </p>

                            {request.attachmentUrl ? (
                              <div className="mt-3 rounded-2xl border border-blue-100 bg-[#f8fbff] p-3.5">
                                <p className="text-[11px] font-black uppercase tracking-wider text-[#123c8c]">
                                  Lampiran Dokumen / Surat Dokter
                                </p>

                                {isImageAttachment(request.attachmentUrl) ||
                                isImageAttachment(request.attachmentName) ? (
                                  <div className="mt-2.5 space-y-3">
                                    <div className="group relative max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                      <img
                                        src={request.attachmentUrl}
                                        alt={request.attachmentName || "Lampiran cuti"}
                                        className="max-h-60 w-full object-contain cursor-pointer transition hover:scale-[1.02]"
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
                                        className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-black text-[#123c8c] transition hover:bg-blue-100"
                                      >
                                        <ExternalLink size={13} />
                                        Buka Tab Baru
                                      </a>
                                      <a
                                        href={request.attachmentUrl}
                                        download={request.attachmentName || "lampiran"}
                                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                                      >
                                        <Download size={13} />
                                        Unduh Foto
                                      </a>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                                    <a
                                      href={request.attachmentUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-3.5 py-2 text-xs font-black text-[#123c8c] transition hover:bg-blue-100"
                                    >
                                      <FileText size={15} />
                                      <span>
                                        {request.attachmentName || "Buka / Unduh Dokumen PDF"}
                                      </span>
                                    </a>

                                    <a
                                      href={request.attachmentUrl}
                                      download={request.attachmentName || "dokumen.pdf"}
                                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                                    >
                                      <Download size={14} />
                                      Unduh File
                                    </a>
                                  </div>
                                )}
                              </div>
                            ) : null}

                            {request.adminNote ? (
                              <p className="break-words text-sm leading-6 text-slate-600">
                                <span className="font-black text-slate-700">
                                  Jawaban admin:
                                </span>{" "}
                                {request.adminNote}
                              </p>
                            ) : null}
                          </div>

                          {isPending ? (
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                              <button
                                type="button"
                                onClick={() => openAnswerModal(request, "rejected")}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-50 px-4 text-sm font-black text-red-700 ring-1 ring-red-100 transition hover:bg-red-100 active:scale-[0.98]"
                              >
                                <XCircle size={17} strokeWidth={2.6} />
                                Tolak
                              </button>

                              <button
                                type="button"
                                onClick={() => openAnswerModal(request, "approved")}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 active:scale-[0.98]"
                              >
                                <CheckCircle2 size={17} strokeWidth={2.6} />
                                Setujui
                              </button>
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
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
                Pengajuan
              </p>
              <p className="mt-1 text-base font-black text-[#123456]">
                {employee?.name} - {pendingAction.leaveTypeLabel}
              </p>
            </div>

            <label className="mt-5 block text-sm font-black text-slate-700">
              Pilih Jawaban
            </label>
            <select
              value={selectedAnswer}
              onChange={(event) => handleSelectedAnswerChange(event.target.value)}
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
