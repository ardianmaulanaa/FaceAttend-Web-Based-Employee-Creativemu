"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, LogIn, ShieldCheck, X } from "lucide-react";
import MobileShell from "@/components/MobileShell";
import { AppButton, AppCard, AppInput } from "@/components/ui/AppUI";

const ADMIN_DEMO_EMAIL = "admin@creativemu.com";
const ADMIN_DEMO_PASSWORD = "admin123456";
const ALLOWED_EMAIL_DOMAIN = "@creativemu.com";

type LoginResponse = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
};

type AlertState = {
  open: boolean;
  title: string;
  message: string;
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function isValidEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function isCreativemuEmail(email: string) {
  return email.trim().toLowerCase().endsWith(ALLOWED_EMAIL_DOMAIN);
}

function FloatingAlert({
  open,
  title,
  message,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <>
      <style jsx global>{`
        @keyframes floatingAlertIn {
          0% {
            opacity: 0;
            transform: translateX(70px) translateY(-18px) scale(0.95);
          }
          70% {
            opacity: 1;
            transform: translateX(-6px) translateY(0) scale(1.01);
          }
          100% {
            opacity: 1;
            transform: translateX(0) translateY(0) scale(1);
          }
        }

        @keyframes alertPulse {
          0%,
          100% {
            transform: scale(1);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.22);
            opacity: 0.12;
          }
        }

        @keyframes alertIconPop {
          0% {
            transform: scale(0.65) rotate(-8deg);
            opacity: 0;
          }
          70% {
            transform: scale(1.08) rotate(3deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] max-w-[25rem] md:right-7 md:top-7">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/40 bg-white/15 shadow-2xl shadow-slate-950/20 ring-1 ring-white/35 backdrop-blur-[26px] animate-[floatingAlertIn_320ms_cubic-bezier(0.2,0.9,0.2,1)]">
          <div className="absolute inset-0 bg-gradient-to-br from-white/35 via-white/12 to-white/5" />

          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_44%),radial-gradient(circle_at_top_right,rgba(18,60,140,0.16),transparent_48%)]" />

          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-slate-700 shadow-sm ring-1 ring-white/40 backdrop-blur-xl transition hover:bg-white/35 hover:text-slate-950 active:scale-95"
            aria-label="Tutup alert"
          >
            <X size={19} strokeWidth={2.7} />
          </button>

          <div className="relative p-5">
            <div className="flex items-start gap-4">
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
                <div className="absolute inset-0 rounded-[1.5rem] bg-orange-300/45 animate-[alertPulse_1.6s_ease-in-out_infinite]" />

                <div className="relative flex h-14 w-14 items-center justify-center rounded-[1.25rem] border border-orange-100/50 bg-white/25 text-orange-600 shadow-xl shadow-orange-200/20 backdrop-blur-xl animate-[alertIconPop_320ms_ease-out]">
                  <AlertCircle size={30} strokeWidth={2.8} />
                </div>
              </div>

              <div className="min-w-0 flex-1 pr-9">
                <div className="inline-flex rounded-full bg-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-orange-700 ring-1 ring-orange-100/40 backdrop-blur-xl">
                  Perhatian
                </div>

                <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950">
                  {title}
                </h2>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {message}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/35 bg-[#123c8c]/75 px-5 text-sm font-black text-white shadow-xl shadow-blue-900/15 backdrop-blur-xl transition hover:bg-[#123c8c]/90 active:scale-[0.98]"
            >
              Mengerti
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAdminDemoLoading, setIsAdminDemoLoading] = useState(false);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    title: "",
    message: "",
  });

  function showAlert(title: string, message: string) {
    setAlert({
      open: true,
      title,
      message,
    });
  }

  function closeAlert() {
    setAlert({
      open: false,
      title: "",
      message: "",
    });
  }

  async function loginUser(
    loginEmail: string,
    loginPassword: string,
    mode: "manual" | "admin-demo" = "manual"
  ) {
    const normalizedEmail = loginEmail.trim().toLowerCase();

    if (!normalizedEmail || !loginPassword.trim()) {
      showAlert("Data belum lengkap", "Email dan password wajib diisi.");
      return;
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      showAlert(
        "Format email salah",
        "Masukkan email dengan format yang benar, contoh: nama@creativemu.com."
      );
      return;
    }

    if (!isCreativemuEmail(normalizedEmail)) {
      showAlert(
        "Email tidak valid",
        "Login hanya dapat menggunakan email resmi @creativemu.com."
      );
      return;
    }

    try {
      if (mode === "admin-demo") {
        setIsAdminDemoLoading(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: loginPassword,
        }),
      });

      const result: LoginResponse = await readJsonResponse(response);

      if (!response.ok) {
        showAlert("Login gagal", result.message || "Login gagal.");
        return;
      }

      router.replace(result.redirectTo || "/home");
      router.refresh();
    } catch (error) {
      console.error("LOGIN_ERROR:", error);

      showAlert(
        "Terjadi kesalahan",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat login."
      );
    } finally {
      if (mode === "admin-demo") {
        setIsAdminDemoLoading(false);
      } else {
        setIsLoading(false);
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loginUser(email, password, "manual");
  }

  async function handleAdminDemoLogin() {
    await loginUser(ADMIN_DEMO_EMAIL, ADMIN_DEMO_PASSWORD, "admin-demo");
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
                <div className="flex h-12 min-h-12 w-12 min-w-12 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-slate-300/60 md:h-14 md:w-14">
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
                  Sistem absensi digital untuk karyawan Creativemu dengan kamera
                  sebagai bukti kehadiran, validasi lokasi kantor, riwayat
                  absensi, dan pengelolaan data karyawan yang lebih cepat dan
                  terintegrasi.
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
              <form suppressHydrationWarning noValidate onSubmit={handleSubmit}>
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
                  <div>
                    <AppInput
                      suppressHydrationWarning
                      label="Email"
                      type="text"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="nama@creativemu.com"
                      autoComplete="email"
                      disabled={formIsBusy}
                    />

                    <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                      Login hanya dapat menggunakan email resmi{" "}
                      <span className="font-black text-[#123c8c]">
                        @creativemu.com
                      </span>
                      .
                    </p>
                  </div>

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

        <FloatingAlert
          open={alert.open}
          title={alert.title}
          message={alert.message}
          onClose={closeAlert}
        />
      </section>
    </MobileShell>
  );
}