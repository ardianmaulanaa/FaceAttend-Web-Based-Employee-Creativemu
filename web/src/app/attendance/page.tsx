"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Camera,
  CheckCircle2,
  Clock3,
  ImageUp,
  Loader2,
  LogIn,
  LogOut,
  MapPin,
  Power,
  RotateCcw,
  ScanFace,
  ShieldCheck,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { AppButton, AppCard, AppTextarea } from "@/components/ui/AppUI";

type AttendanceAction = "check-in" | "check-out";

const LATE_LIMIT_HOUR = 8;
const LATE_LIMIT_MINUTE = 15;

const cameraOptions: MediaStreamConstraints = {
  video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
  audio: false,
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isCameraAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function createAbortError(message: string) {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}

function isLateCheckInNow() {
  const now = new Date();
  const limit = new Date();

  limit.setHours(LATE_LIMIT_HOUR, LATE_LIMIT_MINUTE, 0, 0);

  return now.getTime() > limit.getTime();
}

function CameraStatusIcon({
  cameraReady,
  cameraStarting,
}: {
  cameraReady: boolean;
  cameraStarting: boolean;
}) {
  return (
    <div
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-lg shadow-blue-100/50 ring-1",
        cameraReady && "bg-[#123c8c] text-white ring-[#123c8c]",
        cameraStarting && "bg-amber-50 text-amber-700 ring-amber-100",
        !cameraReady &&
          !cameraStarting &&
          "bg-white text-slate-400 ring-blue-100"
      )}
    >
      {cameraStarting ? (
        <Loader2 size={23} className="animate-spin" />
      ) : (
        <ScanFace size={24} strokeWidth={2.5} />
      )}
    </div>
  );
}

function StatusPill({
  cameraReady,
  cameraStarting,
}: {
  cameraReady: boolean;
  cameraStarting: boolean;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-4 py-2 text-xs font-black",
        cameraReady && "bg-emerald-50 text-emerald-700",
        cameraStarting && "bg-amber-50 text-amber-700",
        !cameraReady && !cameraStarting && "bg-slate-100 text-slate-500"
      )}
    >
      {cameraReady
        ? "Camera Active"
        : cameraStarting
          ? "Starting..."
          : "Camera Off"}
    </span>
  );
}

function CameraCorners() {
  const base =
    "pointer-events-none absolute h-11 w-11 border-blue-300 md:h-12 md:w-12";

  return (
    <>
      <div
        className={`${base} left-6 top-6 rounded-tl-3xl border-l-4 border-t-4 md:left-7 md:top-7`}
      />
      <div
        className={`${base} right-6 top-6 rounded-tr-3xl border-r-4 border-t-4 md:right-7 md:top-7`}
      />
      <div
        className={`${base} bottom-6 left-6 rounded-bl-3xl border-b-4 border-l-4 md:bottom-7 md:left-7`}
      />
      <div
        className={`${base} bottom-6 right-6 rounded-br-3xl border-b-4 border-r-4 md:bottom-7 md:right-7`}
      />
    </>
  );
}

function CameraEmptyState({ cameraStarting }: { cameraStarting: boolean }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center px-6 pb-20 text-center text-white md:pb-24">
      <div>
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl">
          {cameraStarting ? (
            <Loader2 size={42} className="animate-spin" />
          ) : (
            <Camera size={42} />
          )}
        </div>

        <p className="mt-5 text-sm font-black text-white">
          {cameraStarting ? "Starting Camera" : "Camera Preview"}
        </p>

        <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
          {cameraStarting
            ? "Mohon tunggu sampai kamera memuat gambar."
            : "Kamera sedang mati. Klik Aktifkan Kamera di area kamera."}
        </p>
      </div>
    </div>
  );
}

function CameraControlButton({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <AppButton
      type="button"
      onClick={onClick}
      disabled={disabled}
      variant="soft"
      full
      className={cn(
        "min-h-12 rounded-2xl px-3 text-xs shadow-xl backdrop-blur-md md:text-sm",
        danger ? "bg-red-500/95 text-white" : "bg-white/95 text-[#123c8c]"
      )}
    >
      {children}
    </AppButton>
  );
}

function ActionButton({
  label,
  subtitle,
  loading,
  primary,
  icon,
  onClick,
  disabled,
}: {
  label: string;
  subtitle: string;
  loading: boolean;
  primary?: boolean;
  icon: ReactNode;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <AppButton
      type="button"
      full
      onClick={onClick}
      disabled={disabled}
      variant={primary ? "primary" : "secondary"}
      className={cn(
        "min-h-[92px] rounded-[1.7rem] px-5 shadow-xl md:min-h-[70px] md:rounded-2xl",
        primary
          ? "bg-[#123c8c] text-white shadow-blue-900/25"
          : "border border-blue-200 bg-white text-[#123c8c] shadow-slate-200/70 md:bg-[#f8fbff]"
      )}
    >
      <span className="flex w-full items-center justify-center gap-3">
        {loading ? (
          <Loader2 size={24} className="animate-spin" />
        ) : (
          <span
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-2xl md:h-10 md:w-10",
              primary ? "bg-white/15" : "bg-blue-50"
            )}
          >
            {icon}
          </span>
        )}

        <span className="text-left">
          <span
            className={cn(
              "block text-[11px] font-black uppercase tracking-[0.22em]",
              primary ? "text-blue-100" : "text-slate-400"
            )}
          >
            {subtitle}
          </span>

          <span className="block text-xl font-black md:text-lg">
            {loading ? "Processing..." : label}
          </span>
        </span>
      </span>
    </AppButton>
  );
}

function LastPhoto({ url }: { url: string | null }) {
  if (!url) return null;

  return (
    <div className="mt-5 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-4">
      <div className="mb-3 flex items-center gap-2">
        <ImageUp size={18} className="text-[#123c8c]" />
        <p className="text-sm font-black text-slate-950">Foto Terakhir</p>
      </div>

      <img
        src={url}
        alt="Last attendance capture"
        className="h-36 w-36 rounded-2xl object-cover shadow-md"
      />
    </div>
  );
}

function ProofCard({ cameraReady }: { cameraReady: boolean }) {
  return (
    <div className="overflow-hidden rounded-[2rem] bg-[#123c8c] text-white shadow-2xl shadow-blue-900/20">
      <div className="relative p-6 md:p-8">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-blue-300/10" />

        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
            <ShieldCheck size={29} strokeWidth={2.6} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
              Attendance Proof
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight md:text-3xl">
              {cameraReady ? "Ready to Capture" : "Camera Standby"}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-white p-5">
      {icon}
      <p className="mt-3 text-sm font-black text-slate-950">{title}</p>
      <div className="mt-1 text-sm text-slate-500">{children}</div>
    </div>
  );
}

function LateReasonModal({
  value,
  loading,
  onChange,
  onCancel,
  onSubmit,
}: {
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: () => void;
}) {
  const canSubmit = value.trim().length > 0 && !loading;

  return (
    <>
      <style jsx global>{`
        @keyframes lateOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes lateModalIn {
          from {
            opacity: 0;
            transform: translateY(22px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>

      <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 px-4 pb-4 backdrop-blur-sm animate-[lateOverlayIn_180ms_ease-out] md:items-center md:pb-0">
        <AppCard className="relative w-full max-w-md overflow-hidden border-white/80 bg-white p-0 shadow-2xl shadow-slate-950/25 animate-[lateModalIn_230ms_ease-out]">
          <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-200 md:hidden" />

          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 ring-1 ring-orange-100">
                  <Clock3 size={24} strokeWidth={2.7} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-orange-600">
                    Check-in Terlambat
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
                    Isi alasan telat
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                    Kamu sudah melewati batas toleransi. Isi alasan terlebih
                    dahulu sebelum melanjutkan absensi.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 active:scale-95 disabled:opacity-60"
                aria-label="Tutup popup"
              >
                <X size={19} strokeWidth={2.7} />
              </button>
            </div>

            <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-orange-600">
                    Batas Toleransi
                  </p>

                  <p className="mt-1 text-lg font-black text-orange-800">
                    {String(LATE_LIMIT_HOUR).padStart(2, "0")}:
                    {String(LATE_LIMIT_MINUTE).padStart(2, "0")}
                  </p>
                </div>

                <div className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-orange-700 ring-1 ring-orange-100">
                  Wajib alasan
                </div>
              </div>
            </div>

            <div className="mt-5">
              <AppTextarea
                label="Alasan terlambat"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder="Contoh: Terlambat karena macet di perjalanan."
                className="min-h-32 rounded-[1.5rem]"
              />

              <p className="mt-2 text-xs font-semibold text-slate-400">
                Alasan ini akan tersimpan di laporan absensi admin.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <AppButton
                type="button"
                variant="secondary"
                onClick={onCancel}
                disabled={loading}
                full
              >
                Batal
              </AppButton>

              <AppButton
                type="button"
                disabled={!canSubmit}
                onClick={onSubmit}
                full
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Memproses
                  </>
                ) : (
                  "Lanjut Absen"
                )}
              </AppButton>
            </div>
          </div>
        </AppCard>
      </div>
    </>
  );
}

export default function AttendancePage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);
  const mountedRef = useRef(false);
  const lastPhotoUrlRef = useRef<string | null>(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<AttendanceAction | null>(
    null
  );

  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);
  const [lastLatitude, setLastLatitude] = useState<number | null>(null);
  const [lastLongitude, setLastLongitude] = useState<number | null>(null);
  const [lastAccuracy, setLastAccuracy] = useState<number | null>(null);

  const [lateReason, setLateReason] = useState("");
  const [isLateReasonOpen, setIsLateReasonOpen] = useState(false);

  const [statusTitle, setStatusTitle] = useState("Waiting for Camera");
  const [statusText, setStatusText] = useState(
    "Aktifkan kamera dan izinkan lokasi GPS sebelum melakukan absensi."
  );

  useEffect(() => {
    mountedRef.current = true;

    const timer = window.setTimeout(startCamera, 700);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      releaseCamera(false, false);

      if (lastPhotoUrlRef.current) {
        URL.revokeObjectURL(lastPhotoUrlRef.current);
        lastPhotoUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function safeSetStatus(title: string, text: string) {
    if (!mountedRef.current) return;
    setStatusTitle(title);
    setStatusText(text);
  }

  function releaseCamera(updateStatus = true, updateState = true) {
    startingRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    if (updateState && mountedRef.current) {
      setCameraReady(false);
      setCameraStarting(false);
    }

    if (updateStatus) {
      safeSetStatus(
        "Camera Off",
        "Kamera sudah dimatikan. Klik Aktifkan Kamera sebelum melakukan absensi."
      );
    }
  }

  function waitForVideoElement(): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      function checkVideo() {
        if (!mountedRef.current) {
          reject(createAbortError("Halaman kamera sudah ditutup."));
          return;
        }

        if (videoRef.current) {
          resolve(videoRef.current);
          return;
        }

        if (Date.now() - startTime > 4000) {
          reject(
            new Error("Element video belum siap. Refresh halaman lalu coba lagi.")
          );
          return;
        }

        window.requestAnimationFrame(checkVideo);
      }

      checkVideo();
    });
  }

  function waitForCameraFrame(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const ready = () =>
        video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;

      if (ready()) {
        resolve();
        return;
      }

      let intervalId: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", checkReady);
        video.removeEventListener("canplay", checkReady);
        video.removeEventListener("playing", checkReady);

        if (intervalId) clearInterval(intervalId);

        clearTimeout(timeoutId);
      };

      const checkReady = () => {
        if (!mountedRef.current) {
          cleanup();
          reject(createAbortError("Halaman kamera sudah ditutup."));
          return;
        }

        if (ready()) {
          cleanup();
          resolve();
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(
          new Error("Kamera belum memuat gambar. Tunggu sebentar lalu coba lagi.")
        );
      }, 7000);

      video.addEventListener("loadedmetadata", checkReady);
      video.addEventListener("canplay", checkReady);
      video.addEventListener("playing", checkReady);
      intervalId = setInterval(checkReady, 150);
    });
  }

  async function startCamera() {
    if (startingRef.current) return;

    try {
      startingRef.current = true;
      setCameraReady(false);
      setCameraStarting(true);
      safeSetStatus("Starting Camera", "Mengaktifkan kamera...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung kamera.");
      }

      const video = await waitForVideoElement();

      if (streamRef.current) {
        releaseCamera(false, true);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const stream = await navigator.mediaDevices.getUserMedia(cameraOptions);

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();
      await waitForCameraFrame(video);

      setCameraReady(true);
      setCameraStarting(false);

      safeSetStatus(
        "Camera Ready",
        "Kamera sudah aktif. Kamu bisa melakukan check-in atau check-out."
      );
    } catch (error) {
      if (isCameraAbortError(error)) {
        setCameraStarting(false);
        startingRef.current = false;
        return;
      }

      console.error("CAMERA_ERROR", error);
      releaseCamera(false, true);

      safeSetStatus(
        "Camera Permission Needed",
        error instanceof Error
          ? error.message
          : "Aktifkan izin kamera di browser terlebih dahulu."
      );
    } finally {
      startingRef.current = false;
    }
  }

  async function toggleCamera() {
    if (streamRef.current) {
      releaseCamera(true, true);
      return;
    }

    await startCamera();
  }

  function getCurrentLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Browser tidak mendukung GPS."));
        return;
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    });
  }

  async function capturePhoto(): Promise<File> {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current) {
      throw new Error("Kamera belum siap.");
    }

    await waitForCameraFrame(video);

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const context = canvas.getContext("2d");

    if (!context) throw new Error("Canvas tidak tersedia.");

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengambil foto."));
            return;
          }

          if (lastPhotoUrlRef.current) {
            URL.revokeObjectURL(lastPhotoUrlRef.current);
          }

          const previewUrl = URL.createObjectURL(blob);

          lastPhotoUrlRef.current = previewUrl;
          setLastPhotoUrl(previewUrl);

          resolve(
            new File([blob], `attendance-${Date.now()}.jpg`, {
              type: "image/jpeg",
            })
          );
        },
        "image/jpeg",
        0.9
      );
    });
  }

  function requestCheckIn() {
    if (isLateCheckInNow() && !lateReason.trim()) {
      setIsLateReasonOpen(true);
      return;
    }

    handleAttendance("check-in", lateReason.trim());
  }

  async function handleAttendance(action: AttendanceAction, reason = "") {
    try {
      setLoading(true);
      setActiveAction(action);
      safeSetStatus(
        "Processing",
        "Menyiapkan kamera, mengambil foto, dan lokasi GPS..."
      );

      if (!streamRef.current || !cameraReady) await startCamera();

      const video = await waitForVideoElement();

      if (!streamRef.current) throw new Error("Kamera belum siap.");

      await waitForCameraFrame(video);

      const photo = await capturePhoto();
      const position = await getCurrentLocation();
      const { latitude, longitude, accuracy } = position.coords;

      setLastLatitude(latitude);
      setLastLongitude(longitude);
      setLastAccuracy(accuracy);

      const formData = new FormData();
      const prefix = action === "check-in" ? "checkIn" : "checkOut";

      formData.append("photo", photo);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("accuracy", String(accuracy));
      formData.append(`${prefix}Latitude`, String(latitude));
      formData.append(`${prefix}Longitude`, String(longitude));
      formData.append(`${prefix}Accuracy`, String(accuracy));

      if (action === "check-in" && reason) {
        formData.append("lateReason", reason);
        formData.append("late_reason", reason);
      }

      const response = await fetch(`/api/attendance/${action}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data.error || data.message || "Absensi gagal.";

        if (data.requiresLateReason) setIsLateReasonOpen(true);

        safeSetStatus("Attendance Failed", message);
        alert(message);
        return;
      }

      const officeName = data.office?.name;
      const distance = data.office?.distance;
      const radius = data.office?.radius;

      safeSetStatus(
        "Attendance Success",
        officeName
          ? `${data.message} Lokasi valid di ${officeName}. Jarak ${distance} meter dari kantor, radius ${radius} meter. Akurasi GPS ±${Math.round(
              accuracy
            )} meter.`
          : `${data.message || "Absensi berhasil."} Akurasi GPS ±${Math.round(
              accuracy
            )} meter.`
      );

      setLateReason("");
      setIsLateReasonOpen(false);

      alert(data.message || "Absensi berhasil.");
    } catch (error) {
      console.error("ATTENDANCE_ERROR", error);

      const message =
        error instanceof Error
          ? error.message
          : "Gagal melakukan absensi. Pastikan kamera dan lokasi GPS diizinkan.";

      safeSetStatus("Attendance Failed", message);
      alert(message);
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  const checkInProcessing = loading && activeAction === "check-in";
  const checkOutProcessing = loading && activeAction === "check-out";

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <div className="hidden md:block">
        <AppHeader
          title="Face Attendance"
          subtitle="Ambil foto dan lokasi GPS untuk absensi"
          rightLabel={cameraReady ? "CAM ON" : undefined}
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-40 text-slate-950 md:pb-28">
        <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                FaceAttend
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073456]">
                Face Attendance
              </h1>
            </div>

            <CameraStatusIcon
              cameraReady={cameraReady}
              cameraStarting={cameraStarting}
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-5 pt-6 md:px-10 md:py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-16">
          <AppCard
            padding="md"
            className="rounded-[2rem] border-white/80 bg-white/95 p-4 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
          >
            <div className="mb-4 hidden items-start justify-between gap-4 md:flex">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Camera
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Attendance Capture
                </h2>

                <p className="mt-1 text-sm font-medium text-slate-500">
                  Foto akan disimpan sebagai bukti absensi.
                </p>
              </div>

              <StatusPill
                cameraReady={cameraReady}
                cameraStarting={cameraStarting}
              />
            </div>

            <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-950 shadow-inner">
              <div className="aspect-[3/4] md:aspect-[4/3] lg:aspect-[4/3]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={() => {
                    const video = videoRef.current;

                    if (
                      video &&
                      video.readyState >= 2 &&
                      video.videoWidth > 0 &&
                      video.videoHeight > 0
                    ) {
                      setCameraReady(true);
                      setCameraStarting(false);
                    }
                  }}
                  onCanPlay={() => {
                    const video = videoRef.current;

                    if (
                      video &&
                      video.readyState >= 2 &&
                      video.videoWidth > 0 &&
                      video.videoHeight > 0
                    ) {
                      setCameraReady(true);
                      setCameraStarting(false);
                    }
                  }}
                  className={cn(
                    "h-full w-full object-cover transition",
                    cameraReady ? "opacity-100" : "opacity-0"
                  )}
                />

                <div className="pointer-events-none absolute inset-5 rounded-[1.4rem] border border-white/15 md:inset-6" />
                <CameraCorners />

                <div className="absolute left-4 top-4 z-20 rounded-full bg-slate-950/50 px-3 py-1.5 text-[11px] font-black text-white backdrop-blur-md md:left-5 md:top-5 md:text-xs">
                  {cameraReady
                    ? "Camera Active"
                    : cameraStarting
                      ? "Starting..."
                      : "Camera Off"}
                </div>

                <div className="absolute bottom-4 left-4 right-4 z-30 grid grid-cols-2 gap-3 md:bottom-5 md:left-5 md:right-5">
                  <CameraControlButton
                    onClick={toggleCamera}
                    disabled={loading || cameraStarting}
                    danger={cameraReady}
                  >
                    {cameraStarting ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Power size={17} />
                    )}
                    {cameraReady ? "Matikan" : "Aktifkan"}
                  </CameraControlButton>

                  <CameraControlButton
                    onClick={startCamera}
                    disabled={loading || cameraStarting}
                  >
                    {cameraStarting ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <RotateCcw size={17} />
                    )}
                    Restart
                  </CameraControlButton>
                </div>

                {!cameraReady ? (
                  <CameraEmptyState cameraStarting={cameraStarting} />
                ) : null}
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-3">
              <ActionButton
                label="Check-in"
                subtitle="Masuk"
                loading={checkInProcessing}
                disabled={loading || cameraStarting}
                primary
                icon={<LogIn size={23} />}
                onClick={requestCheckIn}
              />

              <ActionButton
                label="Check-out"
                subtitle="Keluar"
                loading={checkOutProcessing}
                disabled={loading || cameraStarting}
                icon={<LogOut size={23} />}
                onClick={() => handleAttendance("check-out")}
              />
            </div>

            <LastPhoto url={lastPhotoUrl} />
          </AppCard>

          <div className="space-y-5">
            <ProofCard cameraReady={cameraReady} />

            <AppCard
              padding="md"
              className="rounded-[2rem] border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Verification Status
              </p>

              <div className="mt-4 flex items-start gap-4 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-5">
                <CheckCircle2
                  size={24}
                  className="mt-0.5 shrink-0 text-[#123c8c]"
                />

                <div>
                  <h3 className="font-black text-slate-950">{statusTitle}</h3>

                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    {statusText}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoTile
                  title="Jam Kerja"
                  icon={<Clock3 size={22} className="text-[#123c8c]" />}
                >
                  08:00 - 17:00
                </InfoTile>

                <InfoTile
                  title="GPS Location"
                  icon={<MapPin size={22} className="text-[#123c8c]" />}
                >
                  {lastLatitude !== null && lastLongitude !== null ? (
                    <div className="space-y-1">
                      <p>Lat: {lastLatitude.toFixed(6)}</p>
                      <p>Lng: {lastLongitude.toFixed(6)}</p>
                      <p>
                        Accuracy:{" "}
                        {lastAccuracy !== null
                          ? `±${Math.round(lastAccuracy)} meter`
                          : "-"}
                      </p>
                    </div>
                  ) : (
                    <p>Diminta saat absen</p>
                  )}
                </InfoTile>
              </div>
            </AppCard>
          </div>
        </section>

        {isLateReasonOpen ? (
          <LateReasonModal
            value={lateReason}
            loading={loading}
            onChange={setLateReason}
            onCancel={() => {
              setIsLateReasonOpen(false);
              setLateReason("");
            }}
            onSubmit={() => handleAttendance("check-in", lateReason.trim())}
          />
        ) : null}

        <BottomNav />
      </main>
    </MobileShell>
  );
}