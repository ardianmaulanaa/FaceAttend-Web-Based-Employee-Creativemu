"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  CameraOff,
  CheckCircle2,
  Clock3,
  FileImage,
  RefreshCw,
  Send,
  ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  city_id: string | null;
  village_id: string | null;
};

type AttendanceDraft = {
  attendanceType: "check-in" | "check-out";
  workMode: "onsite" | "wfh" | "cuti";
  leaveType: "cuti" | "sakit";
  leaveLetterName: string;
  leaveLetterDataUrl?: string;
  evidenceName: string;
  evidenceDataUrl?: string;
  notes: string;
  gps: {
    latitude: number;
    longitude: number;
  } | null;
};

function getDraftStorageKey(userId: string) {
  return `attendance-draft-${userId}`;
}

function isCameraAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export default function AttendancePage() {
  const { authUser, markAttendance } = useAppData();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startingRef = useRef(false);

  const [cameraReady, setCameraReady] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastPhotoUrl, setLastPhotoUrl] = useState<string | null>(null);

  const effectiveUser = useMemo(() => {
    if (sessionUser) {
      return {
        id: sessionUser.id,
        name: sessionUser.name,
        email: sessionUser.email,
        department: sessionUser.department || "-",
        cityId: sessionUser.city_id || "",
        villageId: sessionUser.village_id || "",
      };
    }

    if (authUser) {
      return {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        department: authUser.department,
        cityId: authUser.cityId,
        villageId: authUser.villageId,
      };
    }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      startCamera();
    }, 500);

    return () => {
      window.clearTimeout(timer);
      releaseCamera(false, false);

      if (lastPhotoUrl) {
        URL.revokeObjectURL(lastPhotoUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function releaseCamera(updateStatus = true, updateState = true) {
    startingRef.current = false;

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (updateState) {
      setCameraReady(false);
      setCameraStarting(false);
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

  function waitForCameraFrame(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const isReady = () => {
        return (
          video.readyState >= 2 &&
          video.videoWidth > 0 &&
          video.videoHeight > 0
        );
      };

      if (isReady()) {
        resolve();
        return;
      }

      let intervalId: ReturnType<typeof setInterval> | null = null;

      const cleanup = () => {
        video.removeEventListener("loadedmetadata", checkReady);
        video.removeEventListener("canplay", checkReady);
        video.removeEventListener("playing", checkReady);

        if (intervalId) {
          clearInterval(intervalId);
        }

        clearTimeout(timeoutId);
      };

      const checkReady = () => {
        if (isReady()) {
          cleanup();
          resolve();
        }
      };

      const timeoutId = setTimeout(() => {
        cleanup();
        reject(
          new Error(
            "Kamera belum memuat gambar. Tunggu sebentar lalu coba lagi."
          )
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
      setStatusTitle("Starting Camera");
      setStatusText("Mengaktifkan kamera...");

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Browser tidak mendukung kamera.");
      }

      if (streamRef.current) {
        releaseCamera(false, true);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: targetFacingMode } },
        audio: false,
      });

      cameraStreamRef.current = stream;
      setCameraPermissionGranted(true);
      setCameraOn(true);
      setCameraFacingMode(targetFacingMode);
      setCameraStatus(
        `Kamera aktif (${targetFacingMode === "user" ? "depan" : "belakang"}). Ambil foto untuk bukti absensi.`,
      );

      const video = videoRef.current;

      if (!video) {
        throw new Error("Element video tidak ditemukan.");
      }

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      await video.play();
      await waitForCameraFrame(video);

      setCameraReady(true);
      setCameraStarting(false);
      setStatusTitle("Camera Ready");
      setStatusText(
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
      setStatusTitle("Camera Permission Needed");
      setStatusText(
        error instanceof Error
          ? error.message
          : "Aktifkan izin kamera di browser terlebih dahulu."
      );
    } finally {
      startingRef.current = false;
    }
  };

  const startCamera = async () => {
    await startCameraByMode(cameraFacingMode);
  };

  const requestCameraPermission = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("Browser tidak mendukung akses kamera.");
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

    if (!context) {
      throw new Error("Canvas tidak tersedia.");
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Gagal mengambil foto."));
            return;
          }

          if (lastPhotoUrl) {
            URL.revokeObjectURL(lastPhotoUrl);
          }

          const previewUrl = URL.createObjectURL(blob);
          setLastPhotoUrl(previewUrl);

          const file = new File([blob], `attendance-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });

          resolve(file);
        },
        "image/jpeg",
        0.9
      );
    });
  }

  async function handleAttendance(action: AttendanceAction) {
    try {
      setLoading(true);
      setStatusTitle("Processing");
      setStatusText("Menyiapkan kamera, mengambil foto, dan lokasi GPS...");

      if (!streamRef.current || !cameraReady) {
        await startCamera();
      }

      const video = videoRef.current;

      if (!video) {
        throw new Error("Kamera belum siap.");
      }

      await waitForCameraFrame(video);

      const photo = await capturePhoto();
      const position = await getCurrentLocation();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      setLastLatitude(latitude);
      setLastLongitude(longitude);
      setLastAccuracy(accuracy);

      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("accuracy", String(accuracy));

      if (action === "check-in") {
        formData.append("checkInLatitude", String(latitude));
        formData.append("checkInLongitude", String(longitude));
        formData.append("checkInAccuracy", String(accuracy));
      }

      if (action === "check-out") {
        formData.append("checkOutLatitude", String(latitude));
        formData.append("checkOutLongitude", String(longitude));
        formData.append("checkOutAccuracy", String(accuracy));
      }

      const response = await fetch(`/api/attendance/${action}`, {
        method: "POST",
        body: formData,
      });

      setCameraPermissionGranted(true);
      setCameraStatus("Izin kamera berhasil diberikan.");
      stream.getTracks().forEach((track) => track.stop());
    } catch {
      setCameraPermissionGranted(false);
      setCameraStatus(
        "Izin kamera gagal. Buka permission browser lalu izinkan.",
      );
    }
  };

  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current || !cameraOn) {
      setMessage("Nyalakan kamera dulu sebelum ambil foto.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      setMessage("Gagal memproses foto dari kamera.");
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const capturedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const fileName = `kamera-${attendanceType}-${Date.now()}.jpg`;

    setEvidenceDataUrl(capturedDataUrl);
    setEvidenceName(fileName);
    setMessage("Foto dari kamera berhasil diambil.");
  };

  const handleSwitchCamera = async () => {
    const nextFacingMode = cameraFacingMode === "user" ? "environment" : "user";

    if (!cameraOn) {
      setCameraFacingMode(nextFacingMode);
      setCameraStatus(
        `Mode kamera diubah ke ${nextFacingMode === "user" ? "depan" : "belakang"}. Nyalakan kamera untuk mulai.`,
      );
      return;
    }

    await startCameraByMode(nextFacingMode);
  };

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadSessionUser() {
      try {
        const response = await fetch("/api/auth/me", {
          method: "GET",
          cache: "no-store",
        });
        const result = await response.json();

        if (!active) return;

        if (response.ok && result.user) {
          setSessionUser(result.user as SessionUser);
        } else {
          setSessionUser(null);
        }
      } catch {
        if (active) {
          setSessionUser(null);
        }
      } finally {
        if (active) {
          setIsLoadingSession(false);
        }
      }
    }

    void loadSessionUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!effectiveUser || hasLoadedDraft) return;

    try {
      const rawDraft = window.localStorage.getItem(
        getDraftStorageKey(effectiveUser.id),
      );

      if (!rawDraft) {
        setHasLoadedDraft(true);
        return;
      }

      const draft = JSON.parse(rawDraft) as AttendanceDraft;

      setAttendanceType(draft.attendanceType || "check-in");
      setWorkMode(draft.workMode || "onsite");
      setLeaveType(draft.leaveType || "cuti");
      setLeaveLetterName(draft.leaveLetterName || "");
      setLeaveLetterDataUrl(draft.leaveLetterDataUrl);
      setEvidenceName(draft.evidenceName || "");
      setEvidenceDataUrl(draft.evidenceDataUrl);
      setNotes(draft.notes || "");
      setGps(draft.gps ?? null);

      if (draft.gps) {
        setGpsStatus(
          `GPS dipulihkan dari draft (${draft.gps.latitude}, ${draft.gps.longitude})`,
        );
      }

      if (draft.evidenceDataUrl) {
        setMessage("Draft terakhir dipulihkan otomatis.");
      }
    } catch {
      // Ignore invalid local draft payload.
    } finally {
      setHasLoadedDraft(true);
    }
  }, [effectiveUser, hasLoadedDraft]);

  useEffect(() => {
    if (!hasLoadedDraft || hasAppliedQueryPreset) return;

    const mode = searchParams.get("mode");
    const leave = searchParams.get("leave");

    if (mode === "cuti" || mode === "wfh" || mode === "onsite") {
      setWorkMode(mode);
      if (mode === "cuti") {
        setAttendanceType("check-in");
      }
    }

    if (leave === "cuti" || leave === "sakit") {
      setLeaveType(leave);
    }

    if (mode || leave) {
      setMessage("Preset form diterapkan dari tautan.");
    }

    setHasAppliedQueryPreset(true);
  }, [hasLoadedDraft, hasAppliedQueryPreset, searchParams]);

  useEffect(() => {
    if (!effectiveUser || !hasLoadedDraft) return;

    const draft: AttendanceDraft = {
      attendanceType,
      workMode,
      leaveType,
      leaveLetterName,
      leaveLetterDataUrl,
      evidenceName,
      evidenceDataUrl,
      notes,
      gps,
    };

    window.localStorage.setItem(
      getDraftStorageKey(effectiveUser.id),
      JSON.stringify(draft),
    );
  }, [
    effectiveUser,
    hasLoadedDraft,
    attendanceType,
    workMode,
    leaveType,
    leaveLetterName,
    leaveLetterDataUrl,
    evidenceName,
    evidenceDataUrl,
    notes,
    gps,
  ]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setEvidenceName(file?.name ?? "");

    if (!file) {
      setEvidenceDataUrl(undefined);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setEvidenceDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLeaveFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setLeaveLetterName(file?.name ?? "");

    if (!file) {
      setLeaveLetterDataUrl(undefined);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        setLeaveLetterDataUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (workMode === "cuti" && attendanceType !== "check-in") {
      setAttendanceType("check-in");
    }
  }, [workMode, attendanceType]);

  const handleGetGps = () => {
    if (!navigator.geolocation) {
      setGpsStatus("Browser tidak mendukung geolocation.");
      return;
    }

    setGpsStatus("Mengambil GPS...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = Number(position.coords.latitude.toFixed(6));
        const longitude = Number(position.coords.longitude.toFixed(6));
        setGps({ latitude, longitude });
        setGpsStatus(`GPS tersimpan (${latitude}, ${longitude})`);
      },
      () => {
        setGpsStatus("Gagal mengambil GPS. Mohon izinkan lokasi.");
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      },
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!effectiveUser) {
      setMessage("Silakan login ulang lalu kirim absensi.");
      return;
    }

    if (workMode !== "cuti" && !evidenceDataUrl) {
      setMessage("Upload/ambil foto wajib sebelum submit absensi.");
      return;
    }

    if (workMode === "onsite" && !gps) {
      setMessage("Ambil GPS lokasi terlebih dahulu.");
      return;
    }

    if (workMode === "cuti" && !leaveLetterDataUrl) {
      setMessage("Surat cuti/sakit wajib diunggah.");
      return;
    }

    if (!effectiveUser.cityId || !effectiveUser.villageId) {
      setMessage("Lokasi kerja user belum lengkap. Hubungi admin.");
      return;
    }

    try {
      setIsSubmitting(true);

      const endpoint =
        attendanceType === "check-in"
          ? "/api/attendance/check-in"
          : "/api/attendance/check-out";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageDataUrl: workMode === "cuti" ? undefined : evidenceDataUrl,
          leaveType: workMode === "cuti" ? leaveType : undefined,
          leaveLetterDataUrl:
            workMode === "cuti" ? leaveLetterDataUrl : undefined,
          latitude: gps?.latitude,
          longitude: gps?.longitude,
          workMode,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.message || "Gagal menyimpan absensi.");
        return;
      }

      if (authUser?.id === effectiveUser.id) {
        markAttendance(attendanceType, {
          location: {
            cityId: effectiveUser.cityId,
            villageId: effectiveUser.villageId,
          },
          geo: undefined,
          imageDataUrl: evidenceDataUrl,
          workMode,
          leaveType,
          leaveLetterDataUrl,
        });
      }

      window.localStorage.removeItem(getDraftStorageKey(effectiveUser.id));
      setEvidenceName("");
      setEvidenceDataUrl(undefined);
      setLeaveLetterName("");
      setLeaveLetterDataUrl(undefined);
      setNotes("");
      setGps(null);
      setGpsStatus("GPS belum diambil.");

      alert(data.message || "Absensi berhasil.");
    } catch (error) {
      console.error("ATTENDANCE_ERROR", error);

      const message =
        error instanceof Error
          ? error.message
          : "Gagal melakukan absensi. Pastikan kamera dan lokasi GPS diizinkan.";

      setStatusTitle("Attendance Failed");
      setStatusText(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSession) {
    return (
      <MobileShell variant="employee">
        <AppHeader
          title="Attendance Form"
          subtitle="Formulir absensi dengan bukti foto dan catatan"
          rightLabel="..."
        />
        <section className="mx-auto max-w-7xl px-5 py-6 md:px-10 lg:px-16">
          <div className="rounded-2xl border border-blue-100 bg-white p-6 text-sm font-semibold text-slate-600">
            Memuat data user...
          </div>
        </section>
        <BottomNav />
      </MobileShell>
    );
  }

  if (!effectiveUser) return null;

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Attendance Form"
        subtitle="Formulir absensi dengan bukti foto dan catatan"
        rightLabel={effectiveUser.id}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Bukti Lampiran
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Upload Foto Kehadiran
              </h2>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-xs font-black ${
                cameraReady
                  ? "bg-emerald-50 text-emerald-700"
                  : cameraStarting
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-500"
              }`}
            >
              {cameraReady
                ? "Camera Active"
                : cameraStarting
                  ? "Starting..."
                  : "Camera Off"}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-950 shadow-inner">
            <div className="aspect-[4/3]">
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
                className={`h-full w-full object-cover transition ${
                  cameraReady ? "opacity-100" : "opacity-0"
                }`}
              />

              <div className="pointer-events-none absolute inset-6 rounded-[1.4rem] border border-white/15" />

              <div className="pointer-events-none absolute left-7 top-7 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-blue-300" />
              <div className="pointer-events-none absolute right-7 top-7 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-blue-300" />
              <div className="pointer-events-none absolute bottom-7 left-7 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-blue-300" />
              <div className="pointer-events-none absolute bottom-7 right-7 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-blue-300" />

              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white">
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
                        : "Kamera sedang mati. Klik tombol aktifkan kamera."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={toggleCamera}
              type="button"
              disabled={loading || cameraStarting}
              className="rounded-2xl border border-blue-200 bg-[#f8fbff] px-5 py-4 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition hover:bg-[#eef5ff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                <Power size={18} />
                {cameraReady ? "Matikan Kamera" : "Aktifkan Kamera"}
              </span>
            </button>

            <button
              onClick={startCamera}
              type="button"
              disabled={loading || cameraStarting}
              className="rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                <RotateCcw size={18} />
                Restart Camera
              </span>
            </button>
          </div>

          {lastPhotoUrl && (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ImageUp size={18} className="text-[#123c8c]" />
                <p className="text-sm font-black text-slate-950">
                  Foto Terakhir
                </p>
              </div>

              <img
                src={lastPhotoUrl}
                alt="Last attendance capture"
                className="h-36 w-36 rounded-2xl object-cover shadow-md"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Send size={26} strokeWidth={2.6} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Attendance Submission
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  Ready to Submit
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-blue-100">
              Lengkapi form seperti Google Form, pilih tipe absensi, tambahkan
              bukti foto, lalu kirim sebagai catatan tertulis ke data absensi.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              disabled={loading || cameraStarting}
              onClick={() => handleAttendance("check-in")}
              className="rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {loading ? "Processing..." : "Check-in"}
              </span>
            </button>

            <button
              disabled={loading || cameraStarting}
              onClick={() => handleAttendance("check-out")}
              className="rounded-2xl border border-blue-200 bg-[#f8fbff] px-5 py-4 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition hover:bg-[#eef5ff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Menyimpan..." : "Kirim Form Absensi"}
            </button>
          </form>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
              Submission Status
            </p>

            <div className="mt-4 flex items-start gap-4 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <CheckCircle2
                size={24}
                className="mt-0.5 shrink-0 text-[#123c8c]"
              />

              <div>
                <h3 className="font-black text-slate-950">Form Attendance</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <Clock3 size={22} className="text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Jam Kerja
                </p>
                <p className="mt-1 text-sm text-slate-500">08:00 - 17:00</p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <ShieldCheck size={22} className="text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Bukti Absensi
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Foto + catatan teks
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
