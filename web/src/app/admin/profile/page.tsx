"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, Phone, User } from "lucide-react";
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
                        Isi URL foto profil untuk mengganti avatar.
                      </p>
                    </div>
                  </div>

                  <label className="w-full md:w-[360px]">
                    <span className="mb-1.5 inline-flex items-center gap-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
                      <Camera className="h-3.5 w-3.5" />
                      URL Foto Profil
                    </span>
                    <input
                      value={form.profilePhotoUrl}
                      onChange={(event) =>
                        setForm((prev) => ({
                          ...prev,
                          profilePhotoUrl: event.target.value,
                        }))
                      }
                      placeholder="https://..."
                      className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none ring-[#123c8c]/20 transition focus:ring"
                    />
                  </label>
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
                      placeholder="admin@creativemu.com"
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
