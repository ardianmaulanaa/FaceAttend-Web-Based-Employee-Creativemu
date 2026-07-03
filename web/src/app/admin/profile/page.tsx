"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Camera,
  CameraOff,
  Loader2,
  Phone,
  RefreshCw,
  Upload,
  User,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

type ProfilePayload = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  profile_photo_url?: string | null;
};

const DEFAULT_AVATAR = "/images/creativemu-logo/creativemu.png";

export default function AdminProfilePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    profilePhotoUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<
    "user" | "environment"
  >("user");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraOn(false);
  }

  async function startCamera() {
    try {
      setCameraError("");
      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraOn(true);
    } catch {
      setCameraError("Kamera tidak dapat diakses. Periksa izin browser.");
      setIsCameraOn(false);
    }
  }

  async function toggleCamera() {
    if (isCameraOn) {
      stopCamera();
      return;
    }

    await startCamera();
  }

  async function switchCamera() {
    setCameraFacingMode((prev) => (prev === "user" ? "environment" : "user"));

    if (isCameraOn) {
      await startCamera();
    }
  }

  function captureFromCamera() {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    setForm((prev) => ({
      ...prev,
      profilePhotoUrl: dataUrl,
    }));

    stopCamera();
  }

  function handleProfilePhotoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        profilePhotoUrl: String(reader.result || ""),
      }));
      stopCamera();
    };
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok || !result.user) {
          alert(result.message || "Gagal memuat profil admin.");
          return;
        }

        const user = result.user as ProfilePayload;
        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          profilePhotoUrl: user.profile_photo_url || "",
        });
      } catch {
        alert("Terjadi kesalahan saat memuat profil admin.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadProfile();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsCameraOn(false);
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      alert("Nama dan email wajib diisi.");
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch("/api/auth/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          profilePhotoUrl: form.profilePhotoUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        alert(result.message || "Gagal memperbarui profil admin.");
        return;
      }

      const updated = result.user as ProfilePayload;
      setForm((prev) => ({
        ...prev,
        name: updated.name || prev.name,
        email: updated.email || prev.email,
        phone: updated.phone || "",
        profilePhotoUrl: updated.profile_photo_url || prev.profilePhotoUrl,
      }));

      alert("Profil admin berhasil diperbarui.");
    } catch {
      alert("Terjadi kesalahan saat menyimpan profil admin.");
    } finally {
      setIsSaving(false);
    }
  }

  const avatarSrc = form.profilePhotoUrl.trim() || DEFAULT_AVATAR;

  return (
    <MobileShell>
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7ff] via-white to-[#eef4ff] pb-24">
        <AppHeader
          title="Profil Admin"
          subtitle="Kelola data dasar akun admin Creativemu"
          variant="admin"
        />

        <section className="mx-auto mt-5 w-full max-w-3xl px-4 md:px-8">
          <div className="rounded-3xl border border-blue-100 bg-white/95 p-5 shadow-xl shadow-slate-900/10 backdrop-blur md:p-8">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-sm font-bold text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat profil admin...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-[#f7f9ff] p-4 md:flex-row md:items-end md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border-2 border-white bg-slate-100 shadow-lg shadow-slate-300/30">
                      <Image
                        src={avatarSrc}
                        alt="Foto profil admin"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    </div>

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#123c8c]">
                        Update Foto
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        Gunakan kamera atau pilih file gambar dari perangkat.
                      </p>
                    </div>
                  </div>

                  <div className="w-full space-y-2 md:w-[420px]">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={toggleCamera}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[#123c8c] transition hover:bg-[#f0f5ff]"
                      >
                        {isCameraOn ? (
                          <CameraOff className="h-4 w-4" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        {isCameraOn ? "Matikan Kamera" : "Buka Kamera"}
                      </button>

                      <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-xs font-black uppercase tracking-[0.12em] text-[#123c8c] transition hover:bg-[#f0f5ff]">
                        <Upload className="h-4 w-4" />
                        Pilih File
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhotoUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {isCameraOn && (
                      <div className="space-y-2 rounded-2xl border border-blue-100 bg-white p-3">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="h-44 w-full rounded-xl bg-slate-900 object-cover"
                        />

                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={captureFromCamera}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#123c8c] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-white transition hover:bg-[#0f3377]"
                          >
                            <Camera className="h-4 w-4" />
                            Ambil Foto
                          </button>

                          <button
                            type="button"
                            onClick={switchCamera}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-[#f6f8ff] px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#123c8c] transition hover:bg-[#eaf1ff]"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Ganti Kamera
                          </button>
                        </div>
                      </div>
                    )}

                    {cameraError && (
                      <p className="text-xs font-bold text-rose-600">
                        {cameraError}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label>
                    <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      Nama
                    </span>
                    <input
                      value={form.name}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                      placeholder="Nama Admin"
                      className="w-full rounded-xl border border-blue-100 bg-[#f8faff] px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none ring-[#123c8c]/20 transition focus:ring"
                      required
                    />
                  </label>

                  <label>
                    <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      Email
                    </span>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      placeholder="admin@creativemu.co.id"
                      className="w-full rounded-xl border border-blue-100 bg-[#f8faff] px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none ring-[#123c8c]/20 transition focus:ring"
                      required
                    />
                  </label>

                  <label className="md:col-span-2">
                    <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      No Telp
                    </span>
                    <input
                      value={form.phone}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      placeholder="08xxxxxxxxxx"
                      className="w-full rounded-xl border border-blue-100 bg-[#f8faff] px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none ring-[#123c8c]/20 transition focus:ring"
                    />
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#123c8c] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0f3377] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isSaving ? "Menyimpan..." : "Simpan Profil"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>
    </MobileShell>
  );
}
