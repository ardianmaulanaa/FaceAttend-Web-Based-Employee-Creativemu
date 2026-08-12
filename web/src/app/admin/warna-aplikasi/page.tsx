"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Palette,
  RotateCcw,
  Save,
} from "lucide-react";

import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";
import {
  AppFormReveal,
  AppLoadingState,
  AppPageTransition,
} from "@/components/ui/AppUI";
import {
  DEFAULT_APP_THEME,
  type AppThemeSettings,
} from "@/lib/app-theme-defaults";
import {
  applyAppTheme,
  clearStoredAppTheme,
  isDefaultAppTheme,
  normalizeClientAppTheme,
  readStoredAppTheme,
  storeAppTheme,
} from "@/lib/app-theme-client";

type AppThemeResponse = {
  success?: boolean;
  message?: string;
  theme?: AppThemeSettings;
  defaultTheme?: AppThemeSettings;
};

const colorFields: Array<{
  key: keyof AppThemeSettings;
  label: string;
}> = [
  {
    key: "primaryColor",
    label: "Warna Utama",
  },
  {
    key: "primaryHoverColor",
    label: "Warna Hover",
  },
  {
    key: "softColor",
    label: "Warna Muda",
  },
  {
    key: "subtleColor",
    label: "Warna Latar Halus",
  },
  {
    key: "textColor",
    label: "Warna Tulisan Biru",
  },
];

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function notifyAppThemeChanged() {
  window.dispatchEvent(new Event("app-theme-changed"));
}

export default function AdminAppThemePage() {
  const [theme, setTheme] = useState<AppThemeSettings>(DEFAULT_APP_THEME);
  const [defaultTheme, setDefaultTheme] =
    useState<AppThemeSettings>(DEFAULT_APP_THEME);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const loadTheme = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/admin/app-theme", {
        method: "GET",
        cache: "no-store",
      });
      const data = (await readJsonResponse(response)) as AppThemeResponse;

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Gagal mengambil warna aplikasi.");
        return;
      }

      const storedTheme = readStoredAppTheme();
      const loadedTheme = data.theme || DEFAULT_APP_THEME;
      const nextTheme =
        storedTheme && isDefaultAppTheme(loadedTheme)
          ? storedTheme
          : loadedTheme;

      setTheme(nextTheme);
      setDefaultTheme(data.defaultTheme || DEFAULT_APP_THEME);
      applyAppTheme(nextTheme);
      storeAppTheme(nextTheme);
      notifyAppThemeChanged();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil warna aplikasi.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTheme();
  }, [loadTheme]);

  function updateColor(key: keyof AppThemeSettings, value: string) {
    setFeedbackMessage("");
    setErrorMessage("");
    setTheme((currentTheme) => {
      const nextTheme = normalizeClientAppTheme({
        ...currentTheme,
        [key]: value,
      });

      applyAppTheme(nextTheme);
      storeAppTheme(nextTheme);

      return nextTheme;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setIsSaving(true);
      setFeedbackMessage("");
      setErrorMessage("");

      const response = await fetch("/api/admin/app-theme", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(theme),
      });
      const data = (await readJsonResponse(response)) as AppThemeResponse;

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Gagal memperbarui warna aplikasi.");
        return;
      }

      const nextTheme = data.theme || DEFAULT_APP_THEME;
      setTheme(nextTheme);
      setDefaultTheme(data.defaultTheme || DEFAULT_APP_THEME);
      applyAppTheme(nextTheme);
      storeAppTheme(nextTheme);
      setFeedbackMessage(data.message || "Warna aplikasi berhasil diperbarui.");
      notifyAppThemeChanged();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal memperbarui warna aplikasi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleResetTheme() {
    if (!window.confirm("Kembalikan warna aplikasi ke default?")) return;

    try {
      setIsSaving(true);
      setFeedbackMessage("");
      setErrorMessage("");

      const response = await fetch("/api/admin/app-theme", {
        method: "DELETE",
      });
      const data = (await readJsonResponse(response)) as AppThemeResponse;

      if (!response.ok || !data.success) {
        setErrorMessage(data.message || "Gagal mengembalikan warna aplikasi.");
        return;
      }

      const nextTheme = data.theme || DEFAULT_APP_THEME;
      clearStoredAppTheme();
      setTheme(nextTheme);
      setDefaultTheme(data.defaultTheme || DEFAULT_APP_THEME);
      applyAppTheme(nextTheme);
      setFeedbackMessage(data.message || "Warna berhasil dikembalikan.");
      notifyAppThemeChanged();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengembalikan warna aplikasi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <MobileShell variant="admin">
      <AppHeader title="Warna Aplikasi" variant="admin" />

      <main className="min-h-[calc(100dvh-88px)] bg-[#f6f8ff] px-4 pb-24 pt-6 md:px-8 lg:px-16">
        <AppPageTransition className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <AppFormReveal delay={60}>
            <section className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c] ring-1 ring-blue-100">
                  <Palette size={23} strokeWidth={2.7} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                    Tema
                  </p>
                  <h2 className="text-xl font-black tracking-tight text-slate-950">
                    Ubah Warna Biru Aplikasi
                  </h2>
                </div>
              </div>

              {errorMessage ? (
                <div className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-600 ring-1 ring-rose-100">
                  {errorMessage}
                </div>
              ) : null}

              {feedbackMessage ? (
                <div className="mt-5 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-100">
                  <CheckCircle2 size={18} strokeWidth={2.7} />
                  {feedbackMessage}
                </div>
              ) : null}

              {isLoading ? (
                <div className="mt-6">
                  <AppLoadingState text="Memuat warna aplikasi..." />
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {colorFields.map((field) => (
                    <label
                      key={field.key}
                      className="grid gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <span>
                        <span className="block text-sm font-black text-slate-800">
                          {field.label}
                        </span>
                      </span>

                      <span className="flex items-center gap-3">
                        <input
                          type="color"
                          value={theme[field.key]}
                          onChange={(event) =>
                            updateColor(field.key, event.target.value)
                          }
                          className="h-12 w-14 cursor-pointer rounded-xl border border-blue-100 bg-white p-1"
                        />
                        <input
                          type="text"
                          value={theme[field.key]}
                          onChange={(event) =>
                            updateColor(field.key, event.target.value)
                          }
                          className="h-12 w-28 rounded-xl border border-blue-100 bg-white px-3 text-sm font-black uppercase text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
                        />
                      </span>
                    </label>
                  ))}

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-4 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSaving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save size={18} strokeWidth={2.7} />
                      )}
                      Simpan Warna
                    </button>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleResetTheme}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#123c8c] ring-1 ring-blue-100 transition hover:bg-[#eaf1ff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <RotateCcw size={18} strokeWidth={2.7} />
                      Reset Default
                    </button>
                  </div>
                </form>
              )}
            </section>
          </AppFormReveal>

          <AppFormReveal delay={140}>
            <section className="rounded-[1.5rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/50">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Preview
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Contoh Tampilan
              </h2>

              <div className="mt-5 overflow-hidden rounded-3xl bg-[#123c8c] p-5 text-white shadow-2xl shadow-blue-900/20">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                  Check-in
                </p>
                <h3 className="mt-2 text-2xl font-black">Presensi Hari Ini</h3>
                <p className="mt-2 text-sm font-bold text-blue-100">
                  Warna utama mengikuti pilihan admin.
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-2xl border border-blue-100 bg-white">
                <div className="bg-[#eaf1ff] px-4 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-[#123c8c]">
                  Check-in
                </div>
                <div className="px-4 py-4 text-center text-sm font-black uppercase tracking-[0.12em] text-[#123c8c]">
                  Check-out
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                <p className="text-sm font-black text-[#123c8c]">
                  Tulisan biru juga ikut berubah.
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                  Default: {defaultTheme.primaryColor}
                </p>
              </div>
            </section>
          </AppFormReveal>
        </AppPageTransition>
      </main>
    </MobileShell>
  );
}
