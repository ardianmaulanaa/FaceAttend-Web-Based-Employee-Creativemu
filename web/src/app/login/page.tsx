"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AlertCircle, Eye, EyeOff, Loader2, LogIn, X } from "lucide-react";
import MobileShell from "@/components/MobileShell";
import { AppButton, AppCard, AppInput } from "@/components/ui/AppUI";
import { useSiteLogoSettings } from "@/hooks/useSiteLogo";
import { DEFAULT_SITE_MARK_LOGO_SRC } from "@/lib/site-logo-defaults";
import {
  CREATIVEMU_EMAIL_EXAMPLE,
  isCreativemuEmail,
  isValidEmailFormat,
} from "@/lib/creativemu-email";

type LoginResponse = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
  retryAfterSeconds?: number;
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

function LoginMotionStyles() {
  return (
    <style>{`
      @keyframes loginEnter {
        0% {
          opacity: 0;
          transform: translateY(16px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes loginCardEnter {
        0% {
          opacity: 0;
          transform: translateY(18px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes loginLogoPop {
        0% {
          opacity: 0;
          transform: translateY(10px) scale(0.92);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes loginTextReveal {
        0% {
          opacity: 0;
          transform: translateY(12px);
          filter: blur(5px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }

      @keyframes loginFieldEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes loginBackgroundFloat {
        0%,
        100% {
          transform: translate3d(0, 0, 0) scale(1);
        }

        50% {
          transform: translate3d(10px, -10px, 0) scale(1.04);
        }
      }

      @keyframes introLogoPulse {
        0%,
        100% {
          transform: scale(1);
          filter: drop-shadow(0 8px 18px rgba(18, 60, 140, 0.12));
        }

        50% {
          transform: scale(1.045);
          filter: drop-shadow(0 14px 26px rgba(255, 138, 0, 0.18));
        }
      }

      @keyframes introScanLine {
        0% {
          transform: translateY(-84px);
          opacity: 0;
        }

        12%,
        88% {
          opacity: 1;
        }

        100% {
          transform: translateY(84px);
          opacity: 0;
        }
      }

      @keyframes introTextIn {
        0% {
          opacity: 0;
          transform: translateY(12px);
          filter: blur(5px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0);
        }
      }

      .login-enter {
        animation: loginEnter 360ms ease-out both;
      }

      .login-card-enter {
        animation: loginCardEnter 420ms ease-out both;
      }

      .login-logo-pop {
        animation: loginLogoPop 320ms ease-out both;
      }

      .login-text-reveal {
        animation: loginTextReveal 420ms ease-out both;
      }

      .login-field-enter {
        opacity: 0;
        animation: loginFieldEnter 320ms ease-out both;
      }

      .login-bg-float {
        animation: loginBackgroundFloat 6s ease-in-out infinite;
      }

      .intro-logo-pulse {
        animation: introLogoPulse 2.2s ease-in-out infinite;
      }

      .intro-scan-line {
        animation: introScanLine 2.4s ease-in-out infinite;
      }

      .intro-text-in {
        animation: introTextIn 560ms ease-out both;
      }

      .login-field-smooth input {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease,
          transform 180ms ease;
      }

      .login-field-smooth input:focus {
        transform: translateY(-1px);
      }

      .login-presence-title {
        background: none;
        color: #123c8c;
      }

      @media (prefers-reduced-motion: reduce) {
        .login-enter,
        .login-card-enter,
        .login-logo-pop,
        .login-text-reveal,
        .login-field-enter,
        .login-bg-float,
        .intro-logo-pulse,
        .intro-scan-line,
        .intro-text-in {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
          filter: none !important;
        }
      }
    `}</style>
  );
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
  const { logoSrc, siteTitle } = useSiteLogoSettings();
  const introLogoSrc = DEFAULT_SITE_MARK_LOGO_SRC;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [introHintVisible, setIntroHintVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [loginRetryAt, setLoginRetryAt] = useState<number | null>(null);
  const [loginRetrySeconds, setLoginRetrySeconds] = useState(0);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const reason = searchParams.get("reason");

    if (reason === "inactive") {
      setShowIntro(false);
      showAlert(
        "Akun dinonaktifkan",
        "Akun kamu sudah dinonaktifkan, silakan hubungi admin untuk mengaktifkan kembali.",
      );
      return;
    }

    if (reason === "expired") {
      setShowIntro(false);
      showAlert("Sesi berakhir", "Silakan login kembali untuk melanjutkan.");
    }
  }, []);

  useEffect(() => {
    const restoreDarkMode = document.documentElement.classList.contains("dark");
    document.documentElement.classList.remove("dark");

    const hintTimer = setTimeout(() => setIntroHintVisible(true), 900);
    const autoCloseTimer = setTimeout(() => {
      setIntroLeaving(true);
      setTimeout(() => setShowIntro(false), 420);
    }, 2400);

    return () => {
      clearTimeout(hintTimer);
      clearTimeout(autoCloseTimer);
      if (restoreDarkMode || localStorage.getItem("theme") === "dark") {
        document.documentElement.classList.add("dark");
      }
    };
  }, []);

  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTime(
        new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Jakarta",
        }).format(new Date()),
      );
    };

    updateCurrentTime();

    const timer = window.setInterval(updateCurrentTime, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!loginRetryAt) return;

    const updateCountdown = () => {
      const remainingSeconds = Math.max(
        0,
        Math.ceil((loginRetryAt - Date.now()) / 1000),
      );

      setLoginRetrySeconds(remainingSeconds);

      if (remainingSeconds <= 0) {
        setLoginRetryAt(null);
      }
    };

    updateCountdown();

    const timer = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [loginRetryAt]);

  function dismissIntro() {
    if (introLeaving) return;

    setIntroLeaving(true);
    setTimeout(() => setShowIntro(false), 420);
  }

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

  async function loginUser(loginEmail: string, loginPassword: string) {
    if (loginRetrySeconds > 0) {
      showAlert(
        "Tunggu 1 menit",
        `Tunggu ${loginRetrySeconds} detik hingga kamu bisa mencoba kembali.`,
      );
      return;
    }

    const normalizedEmail = loginEmail.trim().toLowerCase();

    if (!normalizedEmail || !loginPassword.trim()) {
      showAlert("Data belum lengkap", "Email dan password wajib diisi.");
      return;
    }

    if (!isValidEmailFormat(normalizedEmail)) {
      showAlert(
        "Format email salah",
        "Masukkan email dengan format yang benar, contoh: nama@email.com",
      );
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
          email: normalizedEmail,
          password: loginPassword,
        }),
      });

      const result: LoginResponse = await readJsonResponse(response);

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfterHeader = Number(response.headers.get("Retry-After"));
          const retryAfterSeconds =
            result.retryAfterSeconds || retryAfterHeader || 60;

          setLoginRetryAt(Date.now() + retryAfterSeconds * 1000);
          setLoginRetrySeconds(retryAfterSeconds);

          showAlert(
            "Tunggu 1 menit",
            `Tunggu ${retryAfterSeconds} detik hingga kamu bisa mencoba kembali.`,
          );
          return;
        }

        showAlert("Masuk gagal", result.message || "Masuk gagal.");
        return;
      }

      router.replace(result.redirectTo || "/beranda");
      router.refresh();
    } catch (error) {
      console.error("LOGIN_ERROR:", error);

      showAlert(
        "Terjadi kesalahan",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat login.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await loginUser(email, password);
  }

  const formIsBusy = isLoading || loginRetrySeconds > 0;
  const alertMessage =
    loginRetrySeconds > 0 && alert.title === "Tunggu 1 menit"
      ? `Tunggu ${loginRetrySeconds} detik hingga kamu bisa mencoba kembali.`
      : alert.message;

  return (
    <MobileShell variant="auth" withBottomPadding={false}>
      <LoginMotionStyles />

      {showIntro ? (
        <div
          role="button"
          tabIndex={0}
          onClick={dismissIntro}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              dismissIntro();
            }
          }}
          className={`fixed inset-0 z-[999] flex cursor-pointer select-none flex-col items-center justify-center overflow-hidden px-6 transition-all duration-500 ${
            introLeaving ? "scale-105 opacity-0 blur-md" : "opacity-100"
          } bg-[#f6f8ff]`}
          aria-label="Lanjut ke halaman login"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(18,60,140,0.18),transparent_38%)]" />

          <div className="relative flex h-56 w-56 items-center justify-center md:h-72 md:w-72">
            <div className="absolute inset-3 hidden rounded-[2rem] border border-[#123c8c]/10 bg-white/25 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:block" />
            <div className="intro-scan-line absolute left-8 right-8 top-1/2 z-20 h-0.5 bg-gradient-to-r from-transparent via-[#ff8a00] to-transparent shadow-[0_0_14px_rgba(255,138,0,0.72)]" />

            <div className="relative z-10 flex h-32 w-32 items-center justify-center p-0 md:h-40 md:w-40 md:overflow-hidden md:rounded-[2rem] md:border md:border-white/80 md:bg-white md:p-7 md:shadow-[0_24px_58px_rgba(18,60,140,0.14)]">
              <Image
                src={introLogoSrc}
                alt="Creativemu Logo"
                width={421}
                height={390}
                unoptimized
                className="intro-logo-pulse h-full w-full object-contain"
                priority
              />
            </div>
          </div>

          <div className="relative mt-9 text-center md:mt-12">
            <h2 className="intro-text-in text-3xl font-black uppercase tracking-[0.18em] text-slate-950 md:text-5xl">
              {siteTitle}
            </h2>
            <p
              className="intro-text-in mt-3 text-xs font-black uppercase tracking-[0.28em] text-[#ff8a00] md:text-sm"
              style={{ animationDelay: "160ms" }}
            >
              Sistem Presensi Wajah
            </p>
          </div>

          <p
            className={`relative mt-14 text-sm font-semibold text-slate-400 transition-opacity duration-300 md:mt-16 ${
              introHintVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            Tap di mana saja untuk melanjutkan
          </p>
        </div>
      ) : null}

      <section className="relative min-h-dvh w-full overflow-hidden bg-[#f6f8ff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(18,60,140,0.18),transparent_36%)]" />

        {/* 1. WATERMARK C-SOLO LOGO - DEAD CENTERED IN ENTIRE PAGE (X & Y) */}
        <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
          <Image
            src={introLogoSrc}
            alt="Watermark Logo"
            width={500}
            height={500}
            unoptimized
            className="mx-auto w-[22rem] max-w-[85vw] opacity-[0.05] mix-blend-multiply sm:w-[24rem] md:w-[25rem] lg:w-[24rem]"
            priority
          />
        </div>

        {/* 2. MAIN LOGO CREATIVEMU - CENTERED ON ALL SCREENS (MOBILE & WEB) */}
        <div className="login-logo-pop pointer-events-none absolute left-1/2 top-5 z-30 flex -translate-x-1/2 justify-center text-center sm:top-7 lg:top-8">
          <div className="pointer-events-auto flex h-20 w-72 shrink-0 items-center justify-center transition-transform duration-300 hover:scale-[1.02] sm:h-24 sm:w-80 md:h-28 md:w-[26rem] lg:h-32 lg:w-[28rem]">
            <Image
              src={logoSrc}
              alt="Creativemu Logo"
              width={512}
              height={128}
              unoptimized
              className="h-full w-full object-contain object-center"
              priority
            />
          </div>
        </div>

        <div className="relative z-10 grid min-h-dvh w-full grid-cols-1 lg:grid-cols-2">
          {/* Left Column Content */}
          <div className="login-enter relative flex flex-col justify-between px-6 pb-8 pt-28 md:px-12 lg:px-20 lg:pb-14 lg:pt-36">
            <div className="relative z-10 my-auto max-w-2xl text-center lg:text-left">
              <p
                className="login-text-reveal text-xs font-black uppercase tracking-[0.35em] text-[#123c8c] md:text-sm"
                style={{
                  animationDelay: "120ms",
                }}
              >
                Selamat Datang Kembali
              </p>

              <h2
                className="login-text-reveal mt-4 text-[2rem] font-black leading-[1.05] tracking-tight text-slate-950 sm:text-4xl md:mt-5 md:text-6xl"
                style={{
                  animationDelay: "180ms",
                }}
              >
                <span className="typewriter-title login-presence-title">
                  Presensi {siteTitle}
                </span>
              </h2>

              <p
                className="login-text-reveal mt-5 text-lg font-black tabular-nums tracking-[0.16em] text-[#123c8c] md:text-2xl"
                style={{
                  animationDelay: "240ms",
                }}
              >
                {currentTime || "--:--:--"} WIB
              </p>
            </div>

            <div
              className="login-field-enter relative z-10 hidden text-left text-xs font-semibold text-slate-400 sm:text-sm lg:block"
              style={{
                animationDelay: "280ms",
              }}
            >
              © 2026 Presensi for {siteTitle}
            </div>
          </div>

          <div className="flex items-start justify-center px-6 pb-8 pt-2 md:px-12 md:pb-12 lg:items-center lg:px-20 lg:py-14">
            <AppCard
              padding="lg"
              className="login-card-enter w-full max-w-md border-white/70 bg-white/90 shadow-2xl shadow-slate-300/60 backdrop-blur-2xl"
            >
              <form suppressHydrationWarning noValidate onSubmit={handleSubmit}>
                <div className="login-field-enter mb-7 md:mb-8">
                  <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    Masuk
                  </h3>
                </div>

                <div className="space-y-5">
                  <div
                    className="login-field-enter login-field-smooth"
                    style={{
                      animationDelay: "80ms",
                    }}
                  >
                    <label className="block">
                      <span className="text-sm font-black text-slate-700">
                        Email
                      </span>

                      <div className="relative mt-2">
                        <input
                          suppressHydrationWarning
                          type="text"
                          inputMode="email"
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder=""
                          autoComplete="email"
                          disabled={formIsBusy}
                          className="min-h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 pr-32 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-100 dark:bg-[#f8fbff] dark:text-slate-700 dark:placeholder:text-slate-400 dark:focus:border-[#123c8c] dark:focus:bg-white dark:focus:ring-blue-100/50"
                        />

                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                          @creativemu.id
                        </span>
                      </div>
                    </label>
                  </div>

                  <div
                    className="login-field-enter login-field-smooth"
                    style={{
                      animationDelay: "130ms",
                    }}
                  >
                    <label className="block">
                      <span className="text-sm font-black text-slate-700">
                        Kata Sandi
                      </span>

                      <div className="relative mt-2">
                        <input
                          suppressHydrationWarning
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={formIsBusy}
                          className="min-h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 pr-12 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100/50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-100 dark:bg-[#f8fbff] dark:text-slate-700 dark:placeholder:text-slate-400 dark:focus:border-[#123c8c] dark:focus:bg-white dark:focus:ring-blue-100/50"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          disabled={formIsBusy}
                          className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-white hover:text-[#123c8c] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={
                            showPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-6">
                  <div
                    className="login-field-enter"
                    style={{
                      animationDelay: "180ms",
                    }}
                  >
                    <AppButton
                      type="submit"
                      full
                      disabled={formIsBusy}
                      leftIcon={<LogIn size={18} />}
                    >
                      {loginRetrySeconds > 0 ? (
                        `Tunggu ${loginRetrySeconds} detik`
                      ) : isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        "Masuk"
                      )}
                    </AppButton>
                  </div>
                </div>
              </form>
            </AppCard>
          </div>

          <div
            className="login-field-enter px-6 pb-6 text-center text-xs font-semibold text-slate-400 lg:hidden"
            style={{
              animationDelay: "300ms",
            }}
          >
            © 2026 Presensi for {siteTitle}
          </div>
        </div>

        <FloatingAlert
          open={alert.open}
          title={alert.title}
          message={alertMessage}
          onClose={closeAlert}
        />
      </section>
    </MobileShell>
  );
}
