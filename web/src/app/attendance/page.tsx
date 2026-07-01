"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

export default function AttendancePage() {
  const { authUser, markAttendance } = useAppData();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [attendanceType, setAttendanceType] = useState<
    "check-in" | "check-out"
  >("check-in");
  const [workMode, setWorkMode] = useState<"onsite" | "wfh" | "cuti">("onsite");
  const [leaveType, setLeaveType] = useState<"cuti" | "sakit">("cuti");
  const [leaveLetterName, setLeaveLetterName] = useState("");
  const [leaveLetterDataUrl, setLeaveLetterDataUrl] = useState<
    string | undefined
  >();
  const [evidenceName, setEvidenceName] = useState("");
  const [evidenceDataUrl, setEvidenceDataUrl] = useState<string | undefined>();
  const [gps, setGps] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState("GPS belum diambil.");
  const [cameraPermissionGranted, setCameraPermissionGranted] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");
  const [cameraStatus, setCameraStatus] = useState("Kamera belum diaktifkan.");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("Form absensi siap dikirim.");
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);

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

    return null;
  }, [sessionUser, authUser]);

  const submissionSummary = useMemo(() => {
    if (!effectiveUser) return "Belum login";
    return `${effectiveUser.name} • ${effectiveUser.email} • ${effectiveUser.department}`;
  }, [effectiveUser]);

  const stopCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraOn(false);
    setCameraStatus("Kamera dimatikan.");
  };

  const startCameraByMode = async (
    targetFacingMode: "user" | "environment" = cameraFacingMode,
  ) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("Browser tidak mendukung akses kamera.");
      return;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }

    try {
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraPermissionGranted(false);
      setCameraStatus("Izin kamera ditolak. Mohon izinkan kamera.");
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: cameraFacingMode } },
        audio: false,
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
          geo: gps,
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

      setMessage(result.message || "Absensi berhasil disimpan.");
    } catch {
      setMessage("Terjadi kesalahan saat mengirim absensi.");
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

            <span className="rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black text-[#123c8c]">
              Form Ready
            </span>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-[#f6f8ff] p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#eaf1ff] text-[#123c8c]">
              <FileImage size={34} strokeWidth={2.6} />
            </div>
            <p className="mt-4 text-sm font-black text-slate-950">
              Google Form Style
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kirim bukti foto seperti form upload. Yang dicatat ke data absensi
              adalah nama file dan keterangan tertulis, bukan pemindaian wajah.
            </p>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 text-sm font-semibold text-slate-600">
              {evidenceName || "Belum ada file dipilih"}
            </div>
          </div>
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

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
          >
            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4 text-sm font-semibold text-slate-600">
              {submissionSummary}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  Mode Kerja
                </label>
                <select
                  value={workMode}
                  onChange={(event) =>
                    setWorkMode(event.target.value as "onsite" | "wfh" | "cuti")
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                >
                  <option value="onsite">Onsite (Radius Lokasi Utama)</option>
                  <option value="wfh">WFH</option>
                  <option value="cuti">Cuti / Sakit</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  Jenis Absensi
                </label>
                <select
                  value={attendanceType}
                  onChange={(event) =>
                    setAttendanceType(
                      event.target.value as "check-in" | "check-out",
                    )
                  }
                  disabled={workMode === "cuti"}
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                >
                  <option value="check-in">Check-in</option>
                  <option value="check-out">Check-out</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  Upload Bukti Foto {workMode === "cuti" ? "(Opsional)" : ""}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileChange}
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                />
              </div>

              {workMode === "cuti" && (
                <>
                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                      Jenis Surat
                    </label>
                    <select
                      value={leaveType}
                      onChange={(event) =>
                        setLeaveType(event.target.value as "cuti" | "sakit")
                      }
                      className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                    >
                      <option value="cuti">Surat Cuti</option>
                      <option value="sakit">Surat Sakit</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                      Upload Surat (Wajib)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleLeaveFileChange}
                      className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                    />
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      {leaveLetterName || "Belum ada surat dipilih"}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-black text-[#123c8c]">
                <span>Mode Kamera:</span>
                <span>
                  {cameraFacingMode === "user" ? "Depan" : "Belakang"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    void requestCameraPermission();
                  }}
                  className="rounded-xl bg-slate-700 px-4 py-2 text-xs font-black text-white"
                >
                  Izin Buka Kamera
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void startCamera();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white"
                >
                  <Camera size={14} />
                  ON Camera
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-black text-white"
                >
                  <CameraOff size={14} />
                  OFF Camera
                </button>

                <button
                  type="button"
                  onClick={() => {
                    void handleSwitchCamera();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-xs font-black text-white"
                >
                  <RefreshCw size={14} />
                  {cameraFacingMode === "user"
                    ? "Switch ke Belakang"
                    : "Switch ke Depan"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    captureFromCamera();
                  }}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-xs font-black text-white"
                >
                  Take Photo
                </button>
              </div>

              <p className="mt-3 text-xs font-semibold text-slate-600">
                {cameraStatus}
              </p>

              <div className="mt-3 overflow-hidden rounded-2xl border border-blue-100 bg-black/80">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-52 w-full object-cover"
                />
              </div>

              {!cameraPermissionGranted && (
                <p className="mt-2 text-xs font-semibold text-rose-600">
                  Izin kamera belum aktif. Tekan tombol &quot;Izin Buka
                  Kamera&quot;.
                </p>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-slate-600">
                  {workMode === "onsite"
                    ? gpsStatus
                    : "Mode ini tidak mewajibkan radius lokasi utama."}
                </p>
                <button
                  type="button"
                  onClick={handleGetGps}
                  disabled={workMode !== "onsite"}
                  className="rounded-xl bg-[#123c8c] px-4 py-2 text-xs font-black text-white"
                >
                  Ambil GPS Lokasi
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Catatan Tertulis
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contoh: hadir onsite, lampiran foto meja kerja, atau bukti lokasi kerja"
                className="min-h-28 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
