"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CalendarDays,
  Megaphone,
  RefreshCw,
  Search,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

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
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Gagal mengambil data.");
      }

      setAnnouncements(data.announcements || data.data || []);
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

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Pengumuman"
        subtitle="Informasi terbaru untuk karyawan"
        rightLabel={`${announcements.length} Info`}
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="overflow-hidden rounded-[2rem] bg-[#123c8c] text-white shadow-2xl shadow-blue-900/20">
          <div className="relative p-6 md:p-8">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 right-12 h-44 w-44 rounded-full bg-blue-300/10" />

            <div className="relative inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-blue-100">
              <Megaphone size={16} />
              Announcement Center
            </div>

            <h1 className="relative mt-6 text-3xl font-black tracking-tight md:text-4xl">
              Pengumuman Karyawan
            </h1>

            <p className="relative mt-4 max-w-3xl text-sm leading-7 text-blue-100">
              Lihat pemberitahuan terbaru dari admin terkait absensi, jadwal,
              divisi, dan informasi internal perusahaan.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-1">
          <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-[#123c8c]">
                <Bell size={22} />
              </div>

              <div>
                <p className="text-sm font-bold text-slate-500">Total Info</p>
                <p className="text-2xl font-black text-slate-950">
                  {announcements.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Daftar Pengumuman
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Informasi Terbaru
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Pengumuman yang dipublikasikan admin akan muncul di sini.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAnnouncements}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition hover:bg-[#eef5ff] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3">
            <Search size={20} className="text-slate-400" />
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
            <div className="mt-6 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-8 text-center">
              <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
              <p className="mt-3 text-sm font-black text-slate-600">
                Mengambil pengumuman...
              </p>
            </div>
          ) : filteredAnnouncements.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-[#123c8c] shadow-sm">
                <Megaphone size={30} />
              </div>

              <h3 className="mt-4 text-lg font-black text-slate-950">
                Belum ada pengumuman
              </h3>

              <p className="mt-2 text-sm font-medium text-slate-500">
                Pengumuman dari admin akan tampil di halaman ini.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {filteredAnnouncements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f6f8ff] text-[#123c8c]">
                        <Megaphone size={24} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-black text-slate-950">
                            {announcement.title}
                          </h3>

                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                            Published
                          </span>

                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#123c8c]">
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

                        <p className="mt-4 whitespace-pre-line text-sm font-medium leading-7 text-slate-600">
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
    </MobileShell>
  );
}