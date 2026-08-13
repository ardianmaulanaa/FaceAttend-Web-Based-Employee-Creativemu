"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  Send,
  X,
  XCircle,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type Colleague = {
  id: string;
  name: string;
  employeeCode: string | null;
  profilePhoto: string | null;
  shiftName: string;
};

type AvailableShift = {
  id: string;
  name: string;
  startTime?: string | null;
  endTime?: string | null;
};

type SwapRequest = {
  id: string;
  isSelfShift?: boolean;
  targetUser?: {
    id: string;
    name: string;
    employeeCode: string | null;
    profilePhoto: string | null;
  };
  requester?: {
    id: string;
    name: string;
    employeeCode: string | null;
    profilePhoto: string | null;
  };
  swapDate: string;
  requesterShiftName: string;
  targetShiftName: string;
  reason: string | null;
  status: string;
  createdAt: string;
};

function getTodayString() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function TukarShiftMotionStyles() {
  return (
    <style>{`
      @keyframes tukarShiftEnter {
        0% {
          opacity: 0;
          transform: translateY(18px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes tukarShiftAlertIn {
        0% {
          opacity: 0;
          transform: translateX(28px);
        }

        100% {
          opacity: 1;
          transform: translateX(0);
        }
      }

      .tukar-shift-enter {
        animation: tukarShiftEnter 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .tukar-shift-alert {
        animation: tukarShiftAlertIn 320ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      @media (prefers-reduced-motion: reduce) {
        .tukar-shift-enter,
        .tukar-shift-alert {
          animation: none;
        }
      }
    `}</style>
  );
}

function getShiftSwapAlertTheme(type: "success" | "error" | "warning") {
  if (type === "success") {
    return {
      shell: "from-emerald-50 via-white to-blue-50",
      iconWrap: "bg-emerald-100 text-emerald-600",
      badge: "text-emerald-600 bg-white/70",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20",
      icon: CheckCircle2,
      label: "BERHASIL",
      title: "Pengajuan berhasil",
    };
  }

  if (type === "error") {
    return {
      shell: "from-red-50 via-white to-blue-50",
      iconWrap: "bg-red-100 text-red-600",
      badge: "text-red-600 bg-white/70",
      button: "bg-red-600 hover:bg-red-700 shadow-red-900/20",
      icon: XCircle,
      label: "GAGAL",
      title: "Tukar shift gagal",
    };
  }

  return {
    shell: "from-orange-50 via-white to-blue-50",
    iconWrap: "bg-orange-100 text-orange-600",
    badge: "text-orange-600 bg-white/70",
    button: "bg-[#526fae] hover:bg-[#46629d] shadow-blue-900/20",
    icon: AlertTriangle,
    label: "PERHATIAN",
    title: "Tukar shift tidak bisa",
  };
}

export default function TukarShiftPage() {
  const [currentShiftName, setCurrentShiftName] = useState("Shift Utama");
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [availableShifts, setAvailableShifts] = useState<AvailableShift[]>([]);
  const [canSelfShift, setCanSelfShift] = useState(true);
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  const [sentRequests, setSentRequests] = useState<SwapRequest[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<SwapRequest[]>([]);

  const [requestMode, setRequestMode] = useState<"swap" | "self">("swap");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetShiftName, setTargetShiftName] = useState("");
  const [swapDate, setSwapDate] = useState(() => getTodayString());
  const [reason, setReason] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [alertState, setAlertState] = useState<{
    type: "success" | "error" | "warning";
    message: string;
  } | null>(null);

  // Custom cancel modal state (replaces window.prompt)
  const [cancelModal, setCancelModal] = useState<{
    swapId: string;
    reason: string;
  } | null>(null);

  async function loadData() {
    try {
      setIsLoading(true);

      const [dataRes, colRes] = await Promise.all([
        fetch("/api/shift-swaps", { cache: "no-store" }),
        fetch(`/api/shift-swaps/colleagues?swapDate=${swapDate}`, {
          cache: "no-store",
        }),
      ]);

      const dataJson = await dataRes.json();
      const colJson = await colRes.json();

      if (dataJson.success) {
        setCurrentShiftName(dataJson.currentShiftName || "Shift Utama");
        setSentRequests(dataJson.sentRequests || []);
        setIncomingRequests(dataJson.incomingRequests || []);
      }

      if (colJson.success) {
        setColleagues(colJson.colleagues || []);
        setAvailableShifts(colJson.availableShifts || []);
        setCanSelfShift(Boolean(colJson.canSelfShift));
      }
    } catch (err) {
      console.error("LOAD_SWAP_DATA_ERROR:", err);
      setAlertState({
        type: "error",
        message: "Gagal memuat data tukar shift.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, [swapDate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (requestMode === "swap" && (!targetUserId || !swapDate)) {
      setAlertState({
        type: "warning",
        message: "Pilih rekan kerja dan tanggal tukar shift.",
      });
      return;
    }

    if (requestMode === "self" && (!targetShiftName || !swapDate)) {
      setAlertState({
        type: "warning",
        message: "Pilih shift tujuan dan tanggal geser shift.",
      });
      return;
    }

    if (requestMode === "self" && !canSelfShift) {
      setAlertState({
        type: "warning",
        message: "Geser shift hanya berlaku untuk karyawan utama.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setAlertState(null);

      const res = await fetch("/api/shift-swaps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: requestMode,
          targetUserId: requestMode === "swap" ? targetUserId : undefined,
          targetShiftName: requestMode === "self" ? targetShiftName : undefined,
          swapDate,
          reason,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setAlertState({
          type: "error",
          message: json.error || "Gagal mengirimkan pengajuan tukar shift.",
        });
        return;
      }

      setAlertState({
        type: "success",
        message: json.message || "Pengajuan tukar shift berhasil dikirim.",
      });

      setTargetUserId("");
      setTargetShiftName("");
      setReason("");
      await loadData();
    } catch (err) {
      console.error("SUBMIT_SWAP_ERROR:", err);
      setAlertState({
        type: "error",
        message: "Terjadi kesalahan saat membuat pengajuan tukar shift.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAction(swapId: string, action: "approve" | "reject") {
    try {
      setProcessingId(swapId);
      setAlertState(null);

      const res = await fetch(`/api/shift-swaps/${swapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setAlertState({
          type: "error",
          message: json.error || "Gagal memproses permintaan tukar shift.",
        });
        return;
      }

      setAlertState({
        type: "success",
        message: json.message,
      });

      await loadData();
    } catch (err) {
      console.error("SWAP_ACTION_ERROR:", err);
      setAlertState({
        type: "error",
        message: "Terjadi kesalahan saat memproses tanggapan.",
      });
    } finally {
      setProcessingId(null);
    }
  }

  function handleCancel(swapId: string) {
    setCancelModal({ swapId, reason: "" });
  }

  async function executeCancelConfirmed() {
    if (!cancelModal) return;
    const { swapId, reason: cancelReason } = cancelModal;
    const finalReason = cancelReason.trim() || "Dibatalkan oleh karyawan";
    setCancelModal(null);
    try {
      setProcessingId(swapId);
      setAlertState(null);

      const res = await fetch(`/api/shift-swaps/${swapId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", cancelReason: finalReason }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setAlertState({
          type: "error",
          message: json.error || "Gagal membatalkan pengajuan.",
        });
        return;
      }

      setAlertState({
        type: "success",
        message: json.message || "Pengajuan berhasil dibatalkan.",
      });

      await loadData();
    } catch (err) {
      console.error("SWAP_CANCEL_ERROR:", err);
      setAlertState({
        type: "error",
        message: "Terjadi kesalahan saat membatalkan pengajuan.",
      });
    } finally {
      setProcessingId(null);
    }
  }

  const pendingIncoming = incomingRequests.filter(
    (r) => r.status === "pending",
  );
  const alertTheme = alertState
    ? getShiftSwapAlertTheme(alertState.type)
    : null;
  const ShiftSwapAlertIcon = alertTheme?.icon || AlertTriangle;

  return (
    <MobileShell variant="employee">
      <TukarShiftMotionStyles />
      <AppHeader
        title="Tukar Shift"
        eyebrow="Presensi"
        rightLabel="Tukar Shift"
        hideMobileMenuButton
      />

      {/* CUSTOM CANCEL MODAL */}
      {cancelModal ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/45 px-4 pb-4 md:items-center md:pb-0">
          <button
            type="button"
            aria-label="Tutup modal batal"
            className="absolute inset-0 cursor-default"
            onClick={() => setCancelModal(null)}
          />
          <div className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl shadow-slate-900/25">
            <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-red-50 to-white p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <XCircle size={24} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-500">Konfirmasi</p>
                <h3 className="mt-0.5 text-lg font-black text-slate-950">Batalkan Pengajuan?</h3>
              </div>
            </div>
            <div className="space-y-4 p-5">
              <p className="text-sm font-bold leading-6 text-slate-500">
                Pengajuan yang dibatalkan tidak dapat dikembalikan. Masukkan alasan jika perlu.
              </p>
              <div>
                <label className="text-sm font-black text-slate-700">Alasan Pembatalan <span className="text-xs font-bold text-slate-400">(opsional)</span></label>
                <textarea
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal((prev) => prev ? { ...prev, reason: e.target.value } : prev)}
                  placeholder="Tidak jadi / alasan lain..."
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 py-3.5 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100/60"
                />
              </div>
            </div>
            <div className="flex gap-3 border-t border-slate-100 bg-slate-50/60 p-4">
              <button
                type="button"
                onClick={() => setCancelModal(null)}
                className="flex flex-1 items-center justify-center rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={executeCancelConfirmed}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-md shadow-red-900/20 transition hover:bg-red-700 active:scale-[0.98]"
              >
                <XCircle size={16} />
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {alertState && alertTheme ? (
        <div className="pointer-events-none fixed right-4 top-4 z-[120] w-[calc(100vw-2rem)] max-w-md sm:right-7 sm:top-7">
          <div
            className={`tukar-shift-alert pointer-events-auto overflow-hidden rounded-[2rem] border border-white/70 bg-gradient-to-br ${alertTheme.shell} shadow-2xl shadow-slate-900/20 backdrop-blur-xl`}
          >
            <div className="relative p-5">
              <div className="relative flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] ${alertTheme.iconWrap} shadow-lg shadow-slate-300/40`}
                >
                  <ShiftSwapAlertIcon size={29} strokeWidth={3} />
                </div>

                <div className="min-w-0 flex-1">
                  <div
                    className={`inline-flex rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] ${alertTheme.badge}`}
                  >
                    {alertTheme.label}
                  </div>

                  <h3 className="mt-3 text-lg font-black leading-tight text-slate-950">
                    {alertTheme.title}
                  </h3>

                  <p className="mt-2 line-clamp-4 text-sm font-bold leading-6 text-slate-600">
                    {alertState.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setAlertState(null)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 active:scale-[0.96]"
                  aria-label="Tutup alert"
                >
                  <X size={20} strokeWidth={2.8} />
                </button>
              </div>
            </div>

            <div className="border-t border-white/60 bg-white/70 p-4">
              <button
                type="button"
                onClick={() => setAlertState(null)}
                className={`w-full rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[0.98] ${alertTheme.button}`}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isRulesOpen ? (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/45 px-4 pb-4 md:items-center md:pb-0">
          <button
            type="button"
            aria-label="Tutup aturan"
            className="absolute inset-0 cursor-default"
            onClick={() => setIsRulesOpen(false)}
          />

          <div className="tukar-shift-enter relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-[2rem] border border-white/80 bg-white p-5 shadow-2xl shadow-slate-950/25">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Aturan
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-950">
                  Tukar & Geser Shift
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setIsRulesOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 active:scale-95"
                aria-label="Tutup aturan"
              >
                <X size={20} strokeWidth={2.8} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                  Tukar shift antar rekan kerja
                </p>
                <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-slate-600">
                  <li>- Shift pagi bisa tukar dengan shift siang.</li>
                  <li>- Shift utama tidak bisa tukar dengan shift pagi (gunakan Geser Shift).</li>
                  <li>
                    - Pengajuan dan approval berbasis tanggal (berlaku untuk hari ini & besok) tanpa batasan jam/menit.
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                  Geser shift tanpa rekan
                </p>
                <ul className="mt-3 space-y-2 text-xs font-bold leading-5 text-amber-900">
                  <li>- Hanya berlaku untuk karyawan utama.</li>
                  <li>- Karyawan utama bisa geser ke shift siang.</li>
                  <li>
                    - Pengajuan berbasis tanggal (berlaku untuk hari ini & besok) secara fleksibel.
                  </li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsRulesOpen(false)}
              className="mt-5 flex min-h-[48px] w-full items-center justify-center rounded-3xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0e2f70] active:scale-[0.98]"
            >
              Mengerti
            </button>
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-6 pb-28 md:px-10 lg:px-16">
        {/* NOTIFIKASI PERMINTAAN SHIFT MASUK */}
        {pendingIncoming.length > 0 ? (
          <div className="tukar-shift-enter space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#123c8c]">
              Permintaan Tukar Shift Masuk
            </h3>

            {pendingIncoming.map((req, index) => (
              <div
                key={req.id}
                className="tukar-shift-enter flex flex-col gap-3 rounded-3xl border border-blue-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#123c8c]">
                    <ArrowLeftRight size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">
                      {req.requester?.name} ({req.requesterShiftName})
                    </p>
                    <p className="text-xs font-bold text-slate-500">
                      Tanggal:{" "}
                      <span className="text-[#123c8c]">{req.swapDate}</span>
                    </p>
                    {req.reason ? (
                      <p className="mt-0.5 text-xs font-medium italic text-slate-600">
                        &quot;{req.reason}&quot;
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <button
                    type="button"
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.id, "approve")}
                    className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-emerald-700 active:scale-95 disabled:opacity-50 sm:flex-none"
                  >
                    {processingId === req.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                    Setuju
                  </button>

                  <button
                    type="button"
                    disabled={processingId === req.id}
                    onClick={() => handleAction(req.id, "reject")}
                    className="flex flex-1 items-center justify-center gap-1 rounded-2xl bg-red-500 px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-red-600 active:scale-95 disabled:opacity-50 sm:flex-none"
                  >
                    {processingId === req.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <XCircle size={16} />
                    )}
                    Tolak
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          {/* FORM BUAT PENGAJUAN TUKAR SHIFT */}
          <form
            onSubmit={handleSubmit}
            className="tukar-shift-enter h-fit rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60 sm:p-6"
          >
            <div className="flex items-center gap-3 border-b border-slate-100 pb-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                <ArrowLeftRight size={24} strokeWidth={2.6} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                  Form Tukar Shift
                </p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">
                  Buat Pengajuan
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-400">
                  Shift kamu saat ini:{" "}
                  <span className="text-[#123c8c]">{currentShiftName}</span>
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-2 rounded-3xl bg-[#f8fbff] p-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setRequestMode("swap");
                    setTargetShiftName("");
                  }}
                  className={`rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] ${requestMode === "swap"
                      ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                      : "bg-white text-slate-600 ring-1 ring-blue-100"
                    }`}
                >
                  <span className="block text-xs font-black uppercase">
                    Tukar Shift
                  </span>
                  <span className="mt-1 block text-[11px] font-bold leading-4 opacity-80">
                    Antar rekan kerja
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRequestMode("self");
                    setTargetUserId("");
                  }}
                  className={`rounded-2xl px-4 py-3 text-left transition active:scale-[0.98] ${requestMode === "self"
                      ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                      : "bg-white text-slate-600 ring-1 ring-blue-100"
                    }`}
                >
                  <span className="block text-xs font-black uppercase">
                    Geser Shift
                  </span>
                  <span className="mt-1 block text-[11px] font-bold leading-4 opacity-80">
                    Khusus karyawan utama
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsRulesOpen(true)}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#123c8c] transition hover:bg-[#edf4ff] active:scale-[0.98]"
              >
                <Info size={18} strokeWidth={2.8} />
                Aturan
              </button>

              {requestMode === "swap" ? (
                <div>
                  <label className="text-sm font-black text-slate-700">
                    Pilih Rekan Kerja
                  </label>
                  <div className="relative mt-2">
                    <select
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      className="min-h-[54px] w-full appearance-none rounded-2xl border border-blue-100 bg-[#f8fbff] pl-6 pr-12 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100/60 shadow-sm cursor-pointer"
                    >
                      <option value="">-- Pilih Rekan Kerja --</option>
                      {colleagues.map((col) => (
                        <option key={col.id} value={col.id}>
                          {col.name} ({col.shiftName})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-black text-slate-700">
                    Pilih Shift Tujuan
                  </label>
                  <div className="relative mt-2">
                    <select
                      value={targetShiftName}
                      onChange={(e) => setTargetShiftName(e.target.value)}
                      disabled={!canSelfShift}
                      className="min-h-[54px] w-full appearance-none rounded-2xl border border-blue-100 bg-[#f8fbff] pl-6 pr-12 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100/60 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm cursor-pointer"
                    >
                      <option value="">
                        {canSelfShift
                          ? "-- Pilih Shift Tujuan --"
                          : "Hanya untuk karyawan utama"}
                      </option>
                      {availableShifts.map((shift) => (
                        <option key={shift.id} value={shift.name}>
                          {shift.name}
                          {shift.startTime && shift.endTime
                            ? ` (${shift.startTime}-${shift.endTime})`
                            : ""}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-black text-slate-700">
                  {requestMode === "swap"
                    ? "Tanggal Tukar Shift"
                    : "Tanggal Geser Shift"}
                </label>
                <input
                  type="date"
                  value={swapDate}
                  min={getTodayString()}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="mt-2 min-h-[54px] w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-6 py-3.5 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100/60 shadow-sm"
                />
                <p className="mt-2 text-[11px] font-bold leading-4 text-slate-400">
                  Pengajuan berbasis tanggal (berlaku fleksibel untuk hari ini & besok).
                </p>
              </div>

              <div>
                <label className="text-sm font-black text-slate-700">
                  Alasan (Opsional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    requestMode === "swap"
                      ? "Alasan singkat tukar shift..."
                      : "Alasan singkat geser shift..."
                  }
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-6 py-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100/60 shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-3xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0e2f70] active:scale-[0.98] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
                {requestMode === "swap"
                  ? "Kirim Pengajuan"
                  : "Simpan Geser Shift"}
              </button>
            </div>
          </form>

          {/* RIWAYAT SHIFT SWAP */}
          <div
            className="tukar-shift-enter min-w-0 space-y-4"
            style={{ animationDelay: "90ms" }}
          >
            <div className="rounded-3xl bg-[#123c8c] p-5 text-white shadow-xl shadow-blue-900/20">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <ArrowLeftRight size={25} strokeWidth={2.6} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                    Riwayat
                  </p>
                  <h2 className="mt-1 text-2xl font-black">Tukar Shift Saya</h2>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="tukar-shift-enter flex items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-white p-8 text-sm font-bold text-slate-400">
                <Loader2 size={16} className="animate-spin text-[#123c8c]" />
                Memuat data...
              </div>
            ) : sentRequests.length === 0 && incomingRequests.length === 0 ? (
              <div className="tukar-shift-enter rounded-3xl border border-blue-100 bg-white p-8 text-center text-sm font-bold text-slate-400">
                Belum ada riwayat tukar shift.
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map((req, index) => (
                  <div
                    key={req.id}
                    className="tukar-shift-enter flex flex-col gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    style={{ animationDelay: `${index * 45}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        {req.isSelfShift ? "Geser Shift" : "Tukar Keluar"}
                      </p>
                      <p className="mt-0.5 text-sm font-black text-slate-900 leading-snug break-words">
                        {req.isSelfShift
                          ? `${req.requesterShiftName} ke ${req.targetShiftName}`
                          : `Ke: ${req.targetUser?.name} (${req.targetShiftName})`}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Tanggal:{" "}
                        <span className="font-black text-[#123c8c]">{req.swapDate}</span>
                      </p>
                    </div>

                    <div className="flex w-full items-center justify-between gap-2.5 pt-2 border-t border-slate-100 sm:w-auto sm:justify-start sm:border-t-0 sm:pt-0">
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 900,
                          lineHeight: "1.2",
                          padding: "6px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className={`rounded-full ring-1 ${
                          req.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : req.status === "rejected"
                              ? "bg-red-50 text-red-700 ring-red-200"
                              : req.status === "cancelled"
                                ? "bg-slate-100 text-slate-500 ring-slate-200"
                                : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {req.status === "approved"
                          ? "Disetujui"
                          : req.status === "rejected"
                            ? "Ditolak"
                            : req.status === "cancelled"
                              ? "Dibatalkan"
                              : "Menunggu"}
                      </span>

                      {req.status === "pending" || req.status === "approved" ? (
                        <button
                          type="button"
                          disabled={processingId === req.id}
                          onClick={() => handleCancel(req.id)}
                          style={{
                            fontSize: "12px",
                            fontWeight: 900,
                            lineHeight: "1.2",
                            padding: "6px 12px",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            fontFamily: "inherit",
                          }}
                          className="ml-auto rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
                        >
                          {processingId === req.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <>
                              <X size={13} strokeWidth={3} />
                              Batalkan
                            </>
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}

                {incomingRequests.map((req, index) => (
                  <div
                    key={req.id}
                    className="tukar-shift-enter flex flex-col gap-3 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      animationDelay: `${(sentRequests.length + index) * 45}ms`,
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Tukar Masuk
                      </p>
                      <p className="mt-0.5 text-sm font-black text-slate-900 leading-snug break-words">
                        Dari: {req.requester?.name} ({req.requesterShiftName})
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Tanggal:{" "}
                        <span className="font-black text-[#123c8c]">{req.swapDate}</span>
                      </p>
                    </div>

                    <div className="flex items-center pt-1 sm:pt-0">
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 900,
                          lineHeight: "1.2",
                          padding: "6px 12px",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        className={`rounded-full ring-1 ${
                          req.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                            : req.status === "rejected"
                              ? "bg-red-50 text-red-700 ring-red-200"
                              : "bg-amber-50 text-amber-700 ring-amber-200"
                        }`}
                      >
                        {req.status === "approved"
                          ? "Disetujui"
                          : req.status === "rejected"
                            ? "Ditolak"
                            : "Menunggu"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav variant="employee" />
    </MobileShell>
  );
}
