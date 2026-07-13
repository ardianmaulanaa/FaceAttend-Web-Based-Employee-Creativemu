"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

type AlertType = "warning" | "success" | "error" | "info";

type AlertState = {
  open: boolean;
  title: string;
  message: string;
  type: AlertType;
};

const emptyAlert: AlertState = {
  open: false,
  title: "",
  message: "",
  type: "warning",
};

export default function GlobalAlert() {
  const [alert, setAlert] = useState<AlertState>(emptyAlert);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeAlert = useCallback(() => {
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setAlert(emptyAlert);
      setIsClosing(false);
    }, 200);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Save the original alert
    const originalAlert = window.alert;

    // Override window.alert
    window.alert = (message: string) => {
      const msgLower = String(message || "").toLowerCase();
      let type: AlertType = "warning";
      let title = "Perhatian";

      if (msgLower.includes("berhasil") || msgLower.includes("sukses")) {
        type = "success";
        title = "Berhasil";
      } else if (
        msgLower.includes("gagal") ||
        msgLower.includes("error") ||
        msgLower.includes("salah") ||
        msgLower.includes("tidak") ||
        msgLower.includes("wajib")
      ) {
        type = "error";
        title = "Gagal";
      } else if (msgLower.includes("info") || msgLower.includes("keterangan")) {
        type = "info";
        title = "Informasi";
      }

      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      setIsClosing(false);

      setAlert({
        open: true,
        title,
        message: String(message),
        type,
      });
    };

    return () => {
      window.alert = originalAlert;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!alert.open) return null;

  const theme = {
    success: {
      shell: "from-emerald-50 via-white to-blue-50 dark:from-[#0f291e] dark:via-[#161b22] dark:to-[#0d141e] dark:border-[#21262d]",
      iconWrap: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
      badge: "text-emerald-600 bg-white/70 dark:bg-[#30363d] dark:text-emerald-400",
      button: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-[#0d1117]",
      icon: CheckCircle2,
      label: "BERHASIL",
    },
    error: {
      shell: "from-red-50 via-white to-blue-50 dark:from-[#2d1918] dark:via-[#161b22] dark:to-[#0f141c] dark:border-[#21262d]",
      iconWrap: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",
      badge: "text-red-600 bg-white/70 dark:bg-[#30363d] dark:text-red-400",
      button: "bg-red-600 hover:bg-red-700 shadow-red-900/20 dark:bg-red-500 dark:hover:bg-red-600 dark:text-[#0d1117]",
      icon: AlertTriangle,
      label: "GAGAL",
    },
    info: {
      shell: "from-blue-50 via-white to-blue-50 dark:from-[#0d1f3d] dark:via-[#161b22] dark:to-[#0d1f3d] dark:border-[#21262d]",
      iconWrap: "bg-blue-100 text-[#123c8c] dark:bg-blue-950/40 dark:text-[#58a6ff]",
      badge: "text-[#123c8c] bg-white/70 dark:bg-[#30363d] dark:text-[#58a6ff]",
      button: "bg-[#123c8c] hover:bg-[#0f3274] shadow-blue-900/20 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd]",
      icon: Info,
      label: "INFO",
    },
    warning: {
      shell: "from-orange-50 via-white to-blue-50 dark:from-[#2e1d0f] dark:via-[#161b22] dark:to-[#121d2f] dark:border-[#21262d]",
      iconWrap: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400",
      badge: "text-orange-600 bg-white/70 dark:bg-[#30363d] dark:text-orange-400",
      button: "bg-[#526fae] hover:bg-[#46629d] shadow-blue-900/20 dark:bg-[#1f6feb] dark:hover:bg-[#388bfd]",
      icon: AlertTriangle,
      label: "PERHATIAN",
    },
  }[alert.type];

  const Icon = theme.icon;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm transition-all duration-300`}
    >
      <div
        className={`w-full max-w-md overflow-hidden rounded-[2rem] border border-white bg-gradient-to-br p-0 shadow-2xl transition-all duration-300 md:max-w-lg ${
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        } ${theme.shell}`}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${theme.iconWrap}`}
            >
              <Icon size={32} strokeWidth={3} />
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <div
                className={`inline-flex rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-[0.24em] ${theme.badge}`}
              >
                {theme.label}
              </div>

              <h3 className="mt-3 text-2xl font-black leading-tight text-slate-950 dark:text-white">
                {alert.title}
              </h3>

              <p className="mt-2 text-sm font-bold leading-6 text-slate-600 dark:text-slate-400">
                {alert.message}
              </p>
            </div>

            <button
              type="button"
              onClick={closeAlert}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-transparent text-red-500 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 transition active:scale-[0.92]"
            >
              <X size={22} strokeWidth={2.8} />
            </button>
          </div>
        </div>

        <div className="border-t border-white/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/90 p-4">
          <button
            type="button"
            onClick={closeAlert}
            className={`w-full rounded-2xl px-6 py-3.5 text-sm font-black text-white shadow-lg transition active:scale-[0.98] ${theme.button}`}
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
