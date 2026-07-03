"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Loader2,
  Megaphone,
  RefreshCw,
  Search,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import StatCard from "@/components/StatCard";

type Announcement = {
  id: string;
  title: string;
  content: string;
  target: string;
  status: string;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
};

function formatDate(dateString: string) {
  if (!dateString) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

function formatTarget(target: string) {
  if (target === "all") return "Semua Pengguna";
  if (target === "employee") return "Karyawan";
  if (target === "admin") return "Admin";

  return target;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

export default function EmployeeAnnouncementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadAnnouncements() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/announcements?audience=employee", {
        method: "GET",
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal mengambil data.");
      }

      const list = data.announcements || data.data || [];
      const normalizedList = Array.isArray(list) ? list : [];

      setAnnouncements(normalizedList);

      if (normalizedList[0]?.id) {
        window.localStorage.setItem(
          "faceattend_read_announcement_id",
          normalizedList[0].id
        );
      }
    } catch (error) {
      console.error("ANNOUNCEMENTS_ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data pengumuman."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    const keyword = searchKeyword.toLowerCase().trim();

    if (!keyword) return announcements;

    return announcements.filter((announcement) => {
      return (
        announcement.title.toLowerCase().includes(keyword) ||
        announcement.content.toLowerCase().includes(keyword) ||
        formatTarget(announcement.target).toLowerCase().includes(keyword)
      );
    });
  }, [announcements, searchKeyword]);

  const latestAnnouncement = announcements[0];

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <div className="hidden md:block">
        <AppHeader
          title="Pengumuman"
          subtitle="Informasi terbaru untuk karyawan"
          rightLabel={`${announcements.length} Info`}
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-28 text-slate-950">
        <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                FaceAttend
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073456]">
                Pengumuman
              </h1>

              <p className="mt-2 text-sm font-bold text-slate-500">
                Informasi terbaru dari admin.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAnnouncements}
              disabled={loading}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white ring-1 ring-[#123c8c] transition active:scale-[0.96] disabled:opacity-60"
              aria-label="Refresh"
            >
              {loading ? (
                <Loader2 size={23} className="animate-spin" />
              ) : (
                <Megaphone size={24} strokeWidth={2.6} />
              )}
            </button>
          </div>
        </section>

        <section className="mx-auto hidden max-w-7xl px-10 pt-8 md:block lg:px-16">
          <div className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-8 text-white">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute bottom-[-7rem] right-24 h-60 w-60 rounded-full bg-blue-300/10" />

            <div className="relative z-10 flex items-center justify-between gap-8">
              <div className="flex min-w-0 items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-white/15 text-white ring-1 ring-white/20">
                  <Megaphone size={38} strokeWidth={2.5} />
                </div>

                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.22em] text-blue-100 ring-1 ring-white/15">
                    <Megaphone size={15} />
                    Announcement Center
                  </div>

                  <h1 className="mt-5 truncate text-4xl font-black tracking-tight">
                    Pengumuman Karyawan
                  </h1>

                  <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-blue-100">
                    Lihat pemberitahuan terbaru dari admin terkait absensi,
                    jadwal, divisi, dan informasi internal perusahaan.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      {announcements.length} Info
                    </span>

                    {latestAnnouncement ? (
                      <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                        Terbaru: {formatDate(latestAnnouncement.created_at)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={loadAnnouncements}
                disabled={loading}
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/20 transition active:scale-[0.96] disabled:opacity-60"
                aria-label="Refresh"
              >
                {loading ? (
                  <Loader2 size={28} className="animate-spin" />
                ) : (
                  <RefreshCw size={28} strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl rounded-t-[2.5rem] bg-white px-5 pb-10 pt-8 md:mt-8 md:rounded-[2.5rem] md:px-8 lg:px-10">
          <div className="grid gap-3 md:grid-cols-3">
            <StatCard
              label="Total Info"
              value={String(announcements.length)}
              description="Pengumuman tersedia"
              tone="blue"
              icon={Bell}
            />

            <StatCard
              label="Ditampilkan"
              value={String(filteredAnnouncements.length)}
              description="Sesuai pencarian"
              tone="green"
              icon={Megaphone}
            />

            <StatCard
              label="Status"
              value={loading ? "Memuat" : "Aktif"}
              description="Data pengumuman"
              tone={errorMessage ? "red" : "blue"}
              icon={RefreshCw}
            />
          </div>

          <div className="mt-6 rounded-[2rem] border border-blue-100 bg-white p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                  Daftar Pengumuman
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Informasi Terbaru
                </h2>

                <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                  Pengumuman yang dipublikasikan admin akan muncul di sini.
                </p>
              </div>

              <button
                type="button"
                onClick={loadAnnouncements}
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-black text-[#123c8c] transition hover:bg-[#eef5ff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={18}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
            </div>

            <div className="mt-5 flex h-13 items-center gap-3 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 md:h-14">
              <Search size={20} className="shrink-0 text-slate-400" />

              <input
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                placeholder="Cari pengumuman..."
                className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>

            {errorMessage ? (
              <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {loading ? (
              <div className="mt-6 flex items-center gap-3 rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 text-sm font-bold text-slate-500">
                <Loader2 size={20} className="animate-spin text-[#123c8c]" />
                Mengambil pengumuman...
              </div>
            ) : filteredAnnouncements.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf1ff] text-[#123c8c]">
                  <Megaphone size={30} strokeWidth={2.5} />
                </div>

                <h3 className="mt-4 text-lg font-black text-slate-950">
                  Belum ada pengumuman
                </h3>

                <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
                  Pengumuman dari admin akan tampil di halaman ini.
                </p>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {filteredAnnouncements.map((announcement) => (
                  <article
                    key={announcement.id}
                    className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-5 transition hover:bg-[#eef5ff]"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                          <Megaphone size={24} strokeWidth={2.5} />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-950">
                              {announcement.title}
                            </h3>

                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
                              Published
                            </span>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#123c8c] ring-1 ring-blue-100">
                              {formatTarget(announcement.target)}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-400">
                            <CalendarDays size={14} />

                            <span>{formatDate(announcement.created_at)}</span>

                            {announcement.author?.name ? (
                              <>
                                <span>•</span>
                                <span>Admin: {announcement.author.name}</span>
                              </>
                            ) : null}
                          </div>

                          <p className="mt-4 whitespace-pre-line text-sm font-semibold leading-7 text-slate-600">
                            {announcement.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}