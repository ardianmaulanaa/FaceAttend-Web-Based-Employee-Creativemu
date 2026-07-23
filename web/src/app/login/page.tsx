"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  LogIn,
  ShieldCheck,
  X,
  Moon,
  Sun,
} from "lucide-react";
import MobileShell from "@/components/MobileShell";
import { AppButton, AppCard, AppInput } from "@/components/ui/AppUI";
import { useTheme } from "@/context/ThemeContext";
import { useCompanyLogo, useCompanyName } from "@/hooks/useCompanyLogo";

const ADMIN_DEMO_EMAIL = "admin@creativemu.co.id";
const ADMIN_DEMO_PASSWORD = "123456";
const ALLOWED_EMAIL_DOMAIN = "@creativemu.co.id";
const OWNER_DEMO_EMAIL = "owner@creativemu.co.id";
const OWNER_DEMO_PASSWORD = "123456";

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

function isValidEmailFormat(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase());
}

function isCreativemuEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith("@creativemu.co.id") ||
    normalized.endsWith(".co.id")
  );
}

function LoginMotionStyles() {
  return (
    <style>{`
      @keyframes faceScannerLine {
        0%, 100% {
          top: 0%;
          opacity: 0;
        }
        10%, 90% {
          opacity: 1;
        }
        50% {
          top: 100%;
          opacity: 1;
        }
      }

      @keyframes faceScanBracket {
        0%, 100% {
          transform: scale(1);
          opacity: 0.7;
        }
        50% {
          transform: scale(1.06);
          opacity: 1;
        }
      }

      @keyframes biometricPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.15;
        }
        50% {
          transform: scale(1.05);
          opacity: 0.35;
        }
      }

      @keyframes techStatusPulse {
        0%, 100% {
          opacity: 0.4;
          transform: translateY(0);
        }
        50% {
          opacity: 1;
          transform: translateY(-2px);
        }
      }



      @keyframes splashLogoPulse {
        0%, 100% {
          transform: scale(1);
          filter: drop-shadow(0 4px 6px rgba(18, 60, 140, 0.08));
        }
        50% {
          transform: scale(1.05);
          filter: drop-shadow(0 10px 15px rgba(255, 138, 0, 0.18));
        }
      }

      @keyframes splashTextFadeIn {
        0% {
          opacity: 0;
          transform: translateY(10px);
          filter: blur(4px);
        }
        100% {
          opacity: 1;
          transform: translateY(0);
          filter: blur(0px);
        }
      }

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
          border-color 220ms ease,
          background-color 220ms ease,
          box-shadow 220ms ease,
          transform 220ms ease;
      }

      .login-field-smooth input:hover {
        transform: translateY(-1px);
        border-color: rgba(18, 60, 140, 0.25);
        box-shadow: 0 4px 12px rgba(18, 60, 140, 0.04);
      }

      .login-field-smooth input:focus {
        transform: translateY(-3px);
        border-color: #123c8c;
        background-color: #ffffff;
        box-shadow: 
          0 10px 20px -5px rgba(18, 60, 140, 0.12),
          0 0 0 4px rgba(18, 60, 140, 0.08);
      }

      .login-field-smooth label span {
        display: inline-block;
        transition: color 220ms ease, transform 220ms ease;
      }

      .login-field-smooth label:has(input:focus) span {
        color: #123c8c;
        transform: translateX(3px) scale(1.02);
      }

      .login-presence-title {
        background: none;
        color: #123c8c;
      }

      @media (max-width: 767px) {
        .login-presence-title {
          width: auto !important;
          max-width: 100%;
          overflow: visible;
          white-space: normal;
          border-right: 0 !important;
          animation: none !important;
        }
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
  const { theme, toggleTheme } = useTheme();
  const companyLogo = useCompanyLogo();
  const companyName = useCompanyName();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [introLeaving, setIntroLeaving] = useState(false);
  const [introHintVisible, setIntroHintVisible] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const [showSplash, setShowSplash] = useState(true);
  const [splashReady, setSplashReady] = useState(false);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashReady(true), 1200);
    return () => clearTimeout(t);
  }, []);

  function dismissSplash() {
    setFadeSplash(true);
    setTimeout(() => setShowSplash(false), 500);
  }

  const [isLoading, setIsLoading] = useState(false);
  const [isAdminDemoLoading, setIsAdminDemoLoading] = useState(false);
  const [loginRetryAt, setLoginRetryAt] = useState<number | null>(null);
  const [loginRetrySeconds, setLoginRetrySeconds] = useState(0);

  const [alert, setAlert] = useState<AlertState>({
    open: false,
    title: "",
    message: "",
  });

  useEffect(() => {
    const hintTimer = setTimeout(() => setIntroHintVisible(true), 900);
    const autoCloseTimer = setTimeout(() => {
      setIntroLeaving(true);
      setTimeout(() => setShowIntro(false), 420);
    }, 2400);

    return () => {
      clearTimeout(hintTimer);
      clearTimeout(autoCloseTimer);
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

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

  async function loginUser(
    loginEmail: string,
    loginPassword: string,
    mode: "manual" | "owner-demo" = "manual",
  ) {
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
        "Masukkan email dengan format yang benar, contoh: nama@creativemu.co.id",
      );
      return;
    }

    if (!isCreativemuEmail(normalizedEmail)) {
      showAlert(
        "Email tidak valid",
        "Login hanya dapat menggunakan domain .co.id (contoh: nama@creativemu.co.id).",
      );
      return;
    }

    try {
      if (mode === "owner-demo") {
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

        showAlert("Login gagal", result.message || "Login gagal.");
        return;
      }

      const targetUrl = result.redirectTo || "/home";
      window.location.href = targetUrl;
      return;
    } catch (error) {
      console.error("LOGIN_ERROR:", error);

      showAlert(
        "Terjadi kesalahan",
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat login.",
      );
    } finally {
      if (mode === "owner-demo") {
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
    await loginUser(OWNER_DEMO_EMAIL, OWNER_DEMO_PASSWORD, "owner-demo");
  }

  const formIsBusy = isLoading || isAdminDemoLoading || loginRetrySeconds > 0;
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
          }`}
          style={{ backgroundColor: theme === "dark" ? "#0d1117" : "#f6f8ff" }}
          aria-label="Lanjut ke halaman login"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(18,60,140,0.18),transparent_38%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(240,136,62,0.06),transparent_38%),radial-gradient(circle_at_top_right,rgba(88,166,255,0.06),transparent_38%)]" />

          <div className="relative flex h-56 w-56 items-center justify-center md:h-72 md:w-72">
            <div className="absolute inset-3 rounded-[2rem] border border-[#123c8c]/10 bg-white/25 shadow-2xl shadow-slate-300/30 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#161b22]/30" />
            <div className="intro-scan-line absolute left-8 right-8 top-1/2 z-20 h-0.5 bg-gradient-to-r from-transparent via-[#ff8a00] to-transparent shadow-[0_0_14px_rgba(255,138,0,0.72)]" />

            <div className="relative z-10 flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] border border-white/80 bg-white p-5 shadow-[0_24px_58px_rgba(18,60,140,0.14)] md:h-40 md:w-40 md:p-7 dark:border-slate-800/80 dark:bg-[#0d1117] dark:shadow-none">
              <Image
                src={companyLogo}
                alt="Creativemu Logo"
                width={140}
                height={140}
                className="intro-logo-pulse h-full w-full object-contain"
                priority
              />
            </div>
          </div>

          <div className="relative mt-9 text-center md:mt-12">
            <h2 className="intro-text-in text-3xl font-black uppercase tracking-[0.18em] text-slate-950 dark:text-white md:text-5xl">
              {companyName}
            </h2>
            <p
              className="intro-text-in mt-3 text-xs font-black uppercase tracking-[0.28em] text-[#ff8a00] md:text-sm"
              style={{ animationDelay: "160ms" }}
            >
              Face Attend System
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

      <section className="relative min-h-dvh w-full overflow-hidden bg-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(18,60,140,0.18),transparent_36%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(240,136,62,0.06),transparent_38%),radial-gradient(circle_at_top_right,rgba(88,166,255,0.06),transparent_38%)]" />

        {/* Floating Theme Toggle (Allows theme switching directly from the login page) */}
        <div className="absolute right-4 top-4 z-50 flex items-center gap-2 md:right-8 md:top-8">
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-100 bg-white/80 text-[#123c8c] shadow-lg backdrop-blur-md transition hover:bg-white active:scale-95 dark:border-slate-800/80 dark:bg-[#161b22]/80 dark:text-[#58a6ff] dark:hover:bg-[#161b22]"
            title={
              theme === "light" ? "Aktifkan Mode Gelap" : "Aktifkan Mode Terang"
            }
          >
            {theme === "light" ? (
              <Moon size={20} strokeWidth={2.5} />
            ) : (
              <Sun size={20} strokeWidth={2.5} />
            )}
          </button>
        </div>

        <div className="login-bg-float pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-orange-200/20 blur-3xl" />
        <div className="login-bg-float pointer-events-none absolute -right-28 bottom-20 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

        <div className="relative z-10 grid min-h-dvh w-full grid-cols-1 lg:grid-cols-2">
          <div className="login-enter relative flex flex-col px-6 py-7 md:px-12 lg:justify-between lg:px-20 lg:py-14">
            <div className="relative z-10">
              <div className="login-logo-pop flex items-center gap-4">
                <div className="flex h-12 min-h-12 w-12 min-w-12 items-center justify-center overflow-hidden rounded-2xl bg-white keep-white p-2 shadow-xl shadow-slate-300/60 md:h-14 md:w-14">
                  <Image
                    src={companyLogo}
                    alt={`${companyName} Logo`}
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>

                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                    {companyName}
                  </h1>
                </div>
              </div>

              <div className="relative mt-14 max-w-2xl md:mt-16 lg:mt-28">

                <p
                  className="login-text-reveal text-xs font-black uppercase tracking-[0.35em] text-[#123c8c] md:text-sm"
                  style={{
                    animationDelay: "120ms",
                  }}
                >
                  Welcome Back
                </p>

                <h2
                  className="login-text-reveal mt-4 text-4xl font-black leading-[1.05] tracking-tight text-slate-950 md:mt-5 md:text-6xl"
                  style={{
                    animationDelay: "180ms",
                  }}
                >
                  <span className="typewriter-title login-presence-title">
                    {companyName} Presence
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
            </div>

            <div
              className="login-field-enter relative z-10 mt-10 hidden text-sm font-semibold text-slate-400 lg:block"
              style={{
                animationDelay: "280ms",
              }}
            >
              © 2026 FaceAttend for {companyName}
            </div>
          </div>

          <div className="flex items-start justify-center px-6 pb-8 pt-2 md:px-12 md:pb-12 lg:items-center lg:px-20 lg:py-14">
            <AppCard
              padding="lg"
              className={`login-card-enter w-full max-w-md shadow-2xl backdrop-blur-2xl ${theme === "dark" ? "border-[#30363d] bg-[#161b22] shadow-black/30" : "border-white/70 bg-white/90 shadow-slate-300/60"}`}
            >
              <form suppressHydrationWarning noValidate onSubmit={handleSubmit}>
                <div className="login-field-enter mb-7 md:mb-8">
                  <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                    Sign In
                  </h3>
                </div>

                <div className="space-y-5">
                  <div
                    className="login-field-enter login-field-smooth"
                    style={{
                      animationDelay: "80ms",
                    }}
                  >
                    <AppInput
                      suppressHydrationWarning
                      label="Email"
                      type="text"
                      inputMode="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="nama@creativemu.co.id"
                      autoComplete="email"
                      disabled={formIsBusy}
                      className="border-blue-100 bg-[#f8fbff] text-slate-700 placeholder:text-slate-400 focus:border-[#123c8c] focus:bg-white focus:ring-blue-100/50 dark:border-blue-100 dark:bg-[#f8fbff] dark:text-slate-700 dark:placeholder:text-slate-400 dark:focus:border-[#123c8c] dark:focus:bg-white dark:focus:ring-blue-100/50"
                    />
                  </div>

                  <div
                    className="login-field-enter login-field-smooth"
                    style={{
                      animationDelay: "130ms",
                    }}
                  >
                    <AppInput
                      suppressHydrationWarning
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      disabled={formIsBusy}
                      className="border-blue-100 bg-[#f8fbff] text-slate-700 placeholder:text-slate-400 focus:border-[#123c8c] focus:bg-[#f8fbff] focus:ring-blue-100/50 dark:border-blue-100 dark:bg-[#f8fbff] dark:text-slate-700 dark:placeholder:text-slate-400 dark:focus:border-[#123c8c] dark:focus:bg-[#f8fbff] dark:focus:ring-blue-100/50"
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex={-1}
                          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-200/50 hover:text-[#123c8c] active:scale-95 cursor-pointer"
                          aria-label={
                            showPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                          title={
                            showPassword
                              ? "Sembunyikan password"
                              : "Tampilkan password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff
                              size={18}
                              strokeWidth={2.4}
                              className="text-[#123c8c]"
                            />
                          ) : (
                            <Eye size={18} strokeWidth={2.4} />
                          )}
                        </button>
                      }
                    />
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
                      leftIcon={
                        isLoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <LogIn size={18} />
                        )
                      }
                    >
                      {loginRetrySeconds > 0
                        ? `Tunggu ${loginRetrySeconds}s`
                        : isLoading
                          ? "Memproses..."
                          : "Masuk"}
                    </AppButton>
                  </div>
                </div>
              </form>
            </AppCard>
          </div>

          <div
            className="login-field-enter px-6 pb-6 text-xs font-semibold text-slate-400 lg:hidden"
            style={{
              animationDelay: "300ms",
            }}
          >
            © 2026 FaceAttend for Creativemu
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
