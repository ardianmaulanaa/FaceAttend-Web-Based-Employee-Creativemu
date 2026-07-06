"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import MobileShell from "@/components/MobileShell";
import { AppButton, AppCard, AppInput } from "@/components/ui/AppUI";

const ADMIN_DEMO_EMAIL = "admin@creativemu.com";
const ADMIN_DEMO_PASSWORD = "admin123456";

type LoginResponse = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAdminDemoLoading, setIsAdminDemoLoading] = useState(false);

  async function loginUser(loginEmail: string, loginPassword: string) {
    if (!loginEmail.trim() || !loginPassword.trim()) {
      alert("Email dan password wajib diisi.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      const result: LoginResponse = await readJsonResponse(response);

      if (!response.ok) {
        alert(result.message || "Login gagal.");
        return;
      }

      router.replace(result.redirectTo || "/home");
      router.refresh();
    } catch (error) {
      console.error("LOGIN_ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat login."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loginUser(email, password);
  }

  async function handleAdminDemoLogin() {
    try {
      setIsAdminDemoLoading(true);
      await loginUser(ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD);
    } finally {
      setIsAdminDemoLoading(false);
    }
  }

  const formIsBusy = isLoading || isAdminDemoLoading;

  return (
    <MobileShell variant="auth" withBottomPadding={false}>
      <section className="relative min-h-dvh w-full overflow-hidden bg-[#f6f8ff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(18,60,140,0.18),transparent_36%)]" />

        <div className="relative z-10 grid min-h-dvh w-full grid-cols-1 lg:grid-cols-2">
          <div className="relative flex flex-col px-6 py-7 md:px-12 lg:justify-between lg:px-20 lg:py-14">
            <Image
              src="/images/creativemu-logo/creativemu.png"
              alt="Creativemu Background Logo"
              width={620}
              height={620}
              className="pointer-events-none absolute -left-20 top-1/2 hidden -translate-y-1/2 opacity-[0.045] lg:block"
              priority
            />

            <Image
              src="/images/creativemu-logo/creativemu.png"
              alt="Creativemu Background Logo"
              width={300}
              height={300}
              className="pointer-events-none absolute -right-20 top-24 opacity-[0.04] lg:hidden"
              priority
            />

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-13 min-h-13 w-13 min-w-13 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-slate-300/60 md:h-14 md:w-14">
                  <Image
                    src="/images/creativemu-logo/creativemu.png"
                    alt="Creativemu Logo"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>

                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                    Creativemu
                  </h1>

                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 md:text-xs">
                    Employee Attendance System
                  </p>
                </div>
              </div>

              <div className="mt-14 max-w-2xl md:mt-16 lg:mt-28">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[#ff8a00] md:text-sm">
                  Welcome Back
                </p>

                <h2 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 md:mt-5 md:text-6xl">
                  <span className="typewriter-title">
                    Creativemu Presence
                  </span>
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:mt-6 md:text-base md:leading-8">
                  Sistem absensi digital untuk karyawan Creativemu dengan
                  kamera sebagai bukti kehadiran, validasi lokasi kantor,
                  riwayat absensi, dan pengelolaan data karyawan yang lebih
                  cepat dan terintegrasi.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-10 hidden text-sm font-semibold text-slate-400 lg:block">
              © 2026 FaceAttend for Creativemu
            </div>
          </div>

          <div className="flex items-start justify-center px-6 pb-8 pt-2 md:px-12 md:pb-12 lg:items-center lg:bg-white/35 lg:px-20 lg:py-14 lg:backdrop-blur-xl">
            <AppCard
              padding="lg"
              className="w-full max-w-md border-white/70 bg-white/90 shadow-2xl shadow-slate-300/60 backdrop-blur-2xl"
            >
              <form suppressHydrationWarning onSubmit={handleSubmit}>
                <div className="mb-7 md:mb-8">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                    FaceAttend
                  </p>

                  <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    Sign In
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Gunakan akun karyawan atau admin untuk masuk ke sistem.
                  </p>
                </div>

                <div className="space-y-5">
                  <AppInput
                    suppressHydrationWarning
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="employee@company.com"
                    autoComplete="email"
                    disabled={formIsBusy}
                  />

                  <AppInput
                    suppressHydrationWarning
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={formIsBusy}
                  />
                </div>

                <div className="mt-6 space-y-3">
                  <AppButton
                    type="submit"
                    full
                    disabled={formIsBusy}
                    leftIcon={
                      isLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <LogIn size={18} strokeWidth={2.6} />
                      )
                    }
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </AppButton>

                  <AppButton
                    type="button"
                    full
                    variant="soft"
                    disabled={formIsBusy}
                    onClick={handleAdminDemoLogin}
                    className="bg-[#fff4e6] text-[#ff8a00] ring-orange-100 hover:bg-[#ffe8cc]"
                    leftIcon={
                      isAdminDemoLoading ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={18} strokeWidth={2.6} />
                      )
                    }
                  >
                    {isAdminDemoLoading
                      ? "Masuk sebagai Admin..."
                      : "Masuk sebagai Admin Demo"}
                  </AppButton>
                </div>
              </form>
            </AppCard>
          </div>

          <div className="px-6 pb-6 text-xs font-semibold text-slate-400 lg:hidden">
            © 2026 FaceAttend for Creativemu
          </div>
        </div>
      </section>
    </MobileShell>
  );
}