"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import MobileShell from "@/components/MobileShell";
import { supabase } from "@/lib/supabase/client";

type UserProfile = {
  id: string;
  role: "admin" | "employee";
  status: "active" | "inactive";
  must_change_password: boolean;
};

export default function ChangePasswordPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"admin" | "employee">("employee");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.user) {
        router.push("/login");
        return;
      }

      const currentUserId = sessionData.session.user.id;
      setUserId(currentUserId);

      const { data: profile, error } = await supabase
        .from("users")
        .select("id, role, status, must_change_password")
        .eq("id", currentUserId)
        .single<UserProfile>();

      if (error || !profile) {
        alert("Data user tidak ditemukan.");
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      if (profile.status === "inactive") {
        alert("Akun kamu sedang tidak aktif.");
        await supabase.auth.signOut();
        router.push("/login");
        return;
      }

      setRole(profile.role);

      if (!profile.must_change_password) {
        if (profile.role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/home");
        }
        return;
      }

      setIsLoading(false);
    }

    checkUser();
  }, [router]);

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newPassword || !confirmPassword) {
      alert("Password baru dan konfirmasi password wajib diisi.");
      return;
    }

    if (newPassword.length < 8) {
      alert("Password minimal 8 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Konfirmasi password tidak sama.");
      return;
    }

    try {
      setIsSaving(true);

      const { error: updatePasswordError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updatePasswordError) {
        alert(updatePasswordError.message || "Gagal mengganti password.");
        return;
      }

      const { error: updateUserError } = await supabase
        .from("users")
        .update({
          must_change_password: false,
        })
        .eq("id", userId);

      if (updateUserError) {
        alert(updateUserError.message || "Gagal memperbarui status user.");
        return;
      }

      alert("Password berhasil diganti.");

      if (role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/home");
      }
    } catch {
      alert("Terjadi kesalahan saat mengganti password.");
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <MobileShell variant="auth" withBottomPadding={false}>
        <main className="flex min-h-screen items-center justify-center bg-[#f6f8ff] px-5">
          <p className="text-sm font-bold text-slate-500">
            Checking session...
          </p>
        </main>
      </MobileShell>
    );
  }

  return (
    <MobileShell variant="auth" withBottomPadding={false}>
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f6f8ff] px-5 py-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(18,60,140,0.18),transparent_36%)]" />

        <section className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-2xl shadow-slate-300/60 backdrop-blur-2xl md:p-8">
          <div className="mb-7">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
              <ShieldCheck size={15} />
              Security Check
            </div>

            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Change Password
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kamu masih menggunakan temporary password dari admin. Silakan
              ganti password terlebih dahulu sebelum masuk ke sistem.
            </p>
          </div>

          <form onSubmit={handleChangePassword}>
            <label className="text-sm font-black text-slate-700">
              New Password
            </label>
            <div className="relative mt-2">
              <KeyRound
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#123c8c] focus:bg-white"
              />
            </div>

            <label className="mt-5 block text-sm font-black text-slate-700">
              Confirm Password
            </label>
            <div className="relative mt-2">
              <LockKeyhole
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Ulangi password baru"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-[#123c8c] focus:bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 block w-full rounded-2xl bg-[#123c8c] px-5 py-4 text-center text-sm font-black text-white shadow-xl shadow-blue-900/25 transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save New Password"}
            </button>
          </form>
        </section>
      </main>
    </MobileShell>
  );
}