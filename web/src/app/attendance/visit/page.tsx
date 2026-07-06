"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Compass,
  Loader2,
  RefreshCw,
  RotateCw,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

export default function SubmitVisitProofPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [cameraMode, setCameraMode] = useState<"user" | "environment">("environment");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Start Camera Stream
  async function startCamera() {
    try {
      setCameraReady(false);
      setCameraError("");

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Kamera tidak didukung oleh browser Anda.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play();
        streamRef.current = stream;
        setCameraReady(true);
      }
    } catch (error) {
      console.error("CAMERA_ERROR", error);
      setCameraError(
        error instanceof Error ? error.message : "Gagal mengaktifkan kamera."
      );
    }
  }

  // Stop Camera Stream
  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }

  // Switch Camera Mode
  function toggleCameraMode() {
    setCameraMode((prev) => (prev === "environment" ? "user" : "environment"));
  }

  // Capture Photo
  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !streamRef.current || !cameraReady) {
      alert("Kamera belum siap.");
      return;
    }

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      alert("Gagal memproses gambar canvas.");
      return;
    }

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          alert("Gagal mengompres gambar.");
          return;
        }

        const file = new File([blob], `visit_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(blob));
        stopCamera();
      },
      "image/jpeg",
      0.85
    );
  }

  // Retake Photo
  function handleRetake() {
    setPhotoFile(null);
    setPhotoPreview("");
    void startCamera();
  }

  // Get Current Location
  function requestLocation() {
    if (!navigator.geolocation) {
      setLocationError("Browser Anda tidak mendukung deteksi lokasi GPS.");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setAccuracy(position.coords.accuracy);
        setLocationLoading(false);
      },
      (error) => {
        console.error("GPS_ERROR", error);
        setLocationLoading(false);
        if (error.code === 1) {
          setLocationError("Akses lokasi ditolak. Aktifkan izin GPS.");
        } else {
          setLocationError("Gagal mendeteksi lokasi GPS.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  // Initialize Page
  useEffect(() => {
    void startCamera();
    requestLocation();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraMode]);

  // Handle Form Submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      alert("Judul kunjungan wajib diisi.");
      return;
    }
    if (!photoFile) {
      alert("Foto bukti kunjungan wajib diambil.");
      return;
    }
    if (latitude === null || longitude === null) {
      alert("Lokasi GPS wajib dideteksi.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage("");

      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("clientName", clientName.trim());
      formData.append("address", address.trim());
      formData.append("note", note.trim());
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("accuracy", String(accuracy || 0));
      formData.append("photo", photoFile);

      const res = await fetch("/api/visits", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.message || "Gagal menyimpan bukti kunjungan.");
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        router.replace("/home");
      }, 2500);
    } catch (err) {
      console.error(err);
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan koneksi."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Presensi Tambahan"
        subtitle="Kirim bukti kunjungan kerja lapangan tambahan"
        rightLabel="Visit"
      />

      <section className="mx-auto max-w-3xl space-y-6 px-5 py-6 pb-24 md:px-10">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:text-[#123c8c] active:scale-[0.98]"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Menu</span>
        </button>

        {submitSuccess ? (
          <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-emerald-100 bg-white p-8 text-center shadow-xl shadow-emerald-100/50 md:p-12 animate-in fade-in zoom-in-95 duration-300">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={48} className="animate-bounce" />
            </div>
            <h2 className="mt-6 text-2xl font-black text-slate-900">
              Bukti Kunjungan Terkirim!
            </h2>
            <p className="mt-3 text-sm font-semibold text-slate-500 leading-relaxed max-w-sm">
              Bukti kunjungan kerja Anda berhasil direkam dan masuk monitor. 
              Mengarahkan Anda kembali ke halaman home...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Camera Snap Proof */}
            <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/50">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                Dokumentasi Bukti
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">
                Ambil Foto Kunjungan <span className="text-red-500">*</span>
              </h3>

              <div className="relative mt-4 overflow-hidden rounded-2xl bg-slate-900 shadow-inner">
                {photoPreview ? (
                  // Captured Photo Preview
                  <div className="aspect-[4/3] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoPreview}
                      alt="Visit Proof Captured"
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  // Live Camera Stream
                  <div className="relative aspect-[4/3] w-full bg-slate-950">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                    />

                    {cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 p-6 text-center text-sm font-semibold text-red-400">
                        {cameraError}
                      </div>
                    )}

                    {!cameraReady && !cameraError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/55">
                        <Loader2 className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex gap-3">
                {photoPreview ? (
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-3.5 text-sm font-black text-[#123c8c] hover:bg-slate-50 transition active:scale-[0.98]"
                  >
                    <RotateCw size={16} />
                    <span>Foto Ulang</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!cameraReady}
                      onClick={capturePhoto}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 py-3.5 text-sm font-black text-white hover:bg-[#0f3275] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 transition active:scale-[0.98]"
                    >
                      <Camera size={16} />
                      <span>Ambil Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleCameraMode}
                      className="flex items-center justify-center rounded-2xl border border-blue-100 bg-white px-4 py-3.5 text-slate-600 hover:bg-slate-50 transition active:scale-[0.98]"
                      title="Switch Camera"
                    >
                      <RefreshCw size={16} />
                    </button>
                  </>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* 2. Geolocation Proof */}
            <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                    Lokasi Presensi
                  </p>
                  <h3 className="mt-1 text-lg font-black text-slate-900">
                    Sinyal GPS Koordinat <span className="text-red-500">*</span>
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#123c8c] hover:bg-blue-100 disabled:opacity-50 transition active:scale-[0.98]"
                >
                  <Compass size={18} className={locationLoading ? "animate-spin" : ""} />
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-50 bg-[#f8fbff] p-4 text-sm font-semibold">
                {locationError ? (
                  <p className="text-red-600">{locationError}</p>
                ) : latitude !== null && longitude !== null ? (
                  <div className="space-y-1.5 text-slate-700">
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-bold">Latitude:</span>
                      <span className="font-black text-slate-900">{latitude.toFixed(6)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-bold">Longitude:</span>
                      <span className="font-black text-slate-900">{longitude.toFixed(6)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-slate-400 font-bold">Akurasi:</span>
                      <span
                        className={`font-black ${
                          accuracy && accuracy <= 100 ? "text-emerald-600" : "text-amber-600"
                        }`}
                      >
                        ±{accuracy ? Math.round(accuracy) : 0} meter
                      </span>
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-2">
                    Mencari koordinat GPS Anda...
                  </p>
                )}
              </div>
            </div>

            {/* 3. Form Inputs */}
            <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/50 space-y-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                Detail Informasi
              </p>
              <h3 className="mt-1 text-lg font-black text-slate-900">
                Informasi Kunjungan Kerja
              </h3>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                  Judul Kunjungan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Kunjungan Dinas / Meeting Klien Bandung"
                  className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                    Nama Client / Instansi
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Contoh: PT. ABC Sejahtera"
                    className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#123c8c] focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                    Alamat Kunjungan
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Contoh: Gedung Sate Lt 2, Bandung"
                    className="mt-2 h-14 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#123c8c] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-[0.16em] text-slate-600">
                  Catatan Kunjungan
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Isi keterangan / catatan hasil kunjungan Anda di sini..."
                  className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>
            </div>

            {errorMessage && (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !photoFile || latitude === null || longitude === null || !title.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#123c8c] to-blue-600 px-6 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 transition hover:from-[#0f3275] hover:to-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 disabled:shadow-none"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengirim Bukti Kunjungan...</span>
                </>
              ) : (
                <span>Kirim Bukti Kunjungan</span>
              )}
            </button>
          </form>
        )}
      </section>

      <BottomNav />
    </MobileShell>
  );
}
