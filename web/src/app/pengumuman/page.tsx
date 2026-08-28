"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, FileText, Image as ImageIcon, Loader2, Megaphone, Sparkles } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import {
  getReadAnnouncementIds,
  isAnnouncementToday,
  markAnnouncementAsRead,
} from "@/lib/announcement-read";

function isImageAttachment(urlOrName?: string | null) {
  if (!urlOrName) return false;
  const lower = urlOrName.toLowerCase();
  return (
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp") ||
    lower.includes(".gif") ||
    lower.startsWith("data:image/")
  );
}

type Announcement = {
  id: string;
  title: string;
  content?: string;
  document_url?: string | null;
  document_name?: string | null;
  document_size?: number | null;
  documentUrl?: string | null;
  documentName?: string | null;
  documentSize?: number | null;
  status?: string;
  created_at?: string;
  createdAt?: string;
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function formatDate(value?: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatFileSize(value?: number | null) {
  if (!value || value < 1) return "";

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function AnnouncementMotionStyles() {
  return (
    <style>{`
      @keyframes announcementEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes announcementRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes announcementIconPop {
        0% {
          opacity: 0;
          transform: translateY(8px) scale(0.92);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .announcement-enter {
        animation: announcementEnter 340ms ease-out both;
      }

      .announcement-row-enter {
        opacity: 0;
        animation: announcementRowEnter 300ms ease-out both;
      }

      .announcement-icon-pop {
        animation: announcementIconPop 280ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .announcement-enter,
        .announcement-row-enter,
        .announcement-icon-pop {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AnnouncementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [readIds, setReadIds] = useState<string[]>([]);

  useEffect(() => {
    setReadIds(getReadAnnouncementIds());
  }, []);

  const handleRead = (id: string) => {
    markAnnouncementAsRead(id);
    setReadIds(getReadAnnouncementIds());
  };

  async function getAnnouncements() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/announcements?audience=employee", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        setAnnouncements([]);
        setErrorMessage("Gagal mengambil pengumuman.");
        return;
      }

      const data = await readJsonResponse(response);
      const list = data.announcements || data.data || [];

      const safeList = Array.isArray(list) ? list : [];

      setAnnouncements(safeList);

      const latestId = safeList[0]?.id;

      if (latestId) {
        window.localStorage.setItem(
          "presensi_read_announcement_id",
          latestId,
        );
      }
    } catch (error) {
      console.error("GET_ANNOUNCEMENTS_ERROR:", error);
      setAnnouncements([]);
      setErrorMessage("Gagal mengambil pengumuman.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void getAnnouncements();
  }, []);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <AnnouncementMotionStyles />

      <div className="hidden md:block">
        <AppHeader title="Pengumuman" rightLabel="Info" variant="employee" />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-[calc(8rem+env(safe-area-inset-bottom))] text-slate-950 md:pb-28">
        <section className="mx-auto max-w-5xl px-5 pt-7 md:hidden">
          <div className="announcement-enter relative overflow-hidden rounded-[2rem] bg-[#123c8c] p-5 text-white shadow-xl shadow-blue-900/20">
            <div className="relative z-10 flex items-center gap-3">
              <div className="announcement-icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <Megaphone size={25} strokeWidth={2.6} />
              </div>

              <div className="min-w-0">
                <p className="announcement-row-enter text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                  Presensi
                </p>

                <h1
                  className="announcement-row-enter mt-1 text-3xl font-black tracking-tight"
                  style={{ animationDelay: "60ms" }}
                >
                  Pengumuman
                </h1>

                <p
                  className="announcement-row-enter mt-1 text-sm font-semibold text-blue-100"
                  style={{ animationDelay: "100ms" }}
                >
                  Informasi terbaru dari perusahaan.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-6 md:px-10 lg:px-0">
          {errorMessage ? (
            <div className="announcement-row-enter rounded-3xl border border-red-100 bg-red-50 p-5 text-sm font-black text-red-700">
              {errorMessage}
            </div>
          ) : null}

          {isLoading ? (
            <div className="announcement-row-enter flex items-center justify-center gap-2 rounded-3xl border border-blue-100 bg-white p-8 text-sm font-black text-slate-500 shadow-lg shadow-slate-200/50">
              <Loader2 size={18} className="animate-spin text-[#123c8c]" />
              Memuat pengumuman...
            </div>
          ) : announcements.length === 0 ? (
            <div className="announcement-row-enter rounded-3xl border border-dashed border-blue-100 bg-white px-5 py-14 text-center shadow-lg shadow-slate-200/50">
              <div className="announcement-icon-pop mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                <Megaphone size={26} strokeWidth={2.6} />
              </div>

              <p className="mt-4 text-base font-black text-slate-700">
                Pengumuman Kosong
              </p>

              <p className="mt-2 text-sm font-semibold text-slate-400">
                Belum ada pengumuman yang dipublikasikan.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement, index) => {
                const dateValue =
                  announcement.created_at || announcement.createdAt;
                const isToday = isAnnouncementToday(dateValue);
                const isRead = readIds.includes(announcement.id);
                const isYellowHighlighted = !isRead;

                return (
                  <article
                    key={announcement.id}
                    className={`announcement-row-enter min-w-0 rounded-[2rem] p-5 transition duration-200 hover:-translate-y-0.5 md:p-6 ${
                      isYellowHighlighted
                        ? "border-2 border-amber-300 bg-[#fffbeb] shadow-xl shadow-amber-100/70 ring-2 ring-amber-400/40 hover:bg-[#fff9e6]"
                        : "border border-blue-100 bg-white shadow-lg shadow-slate-200/50 hover:bg-[#f8fbff] hover:shadow-xl hover:shadow-slate-300/40"
                    }`}
                    style={{
                      animationDelay: `${index * 55}ms`,
                    }}
                  >
                    <Link
                      href={`/pengumuman/${announcement.id}`}
                      onClick={() => handleRead(announcement.id)}
                      className="block min-w-0"
                    >
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          {isYellowHighlighted ? (
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-500 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white shadow-sm">
                              <Sparkles size={14} className="animate-pulse" />
                              {isToday ? "Pengumuman Hari Ini" : "Pengumuman Baru"}
                            </div>
                          ) : (
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#eaf1ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
                              <Megaphone size={14} />
                              Pengumuman
                            </div>
                          )}

                          <h2 className={`break-words text-xl font-black leading-8 [overflow-wrap:anywhere] md:text-2xl md:leading-9 ${
                            isYellowHighlighted ? "text-amber-950" : "text-slate-950"
                          }`}>
                            {announcement.title}
                          </h2>
                        </div>

                        <div className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full px-3 py-2 text-xs font-black ${
                          isYellowHighlighted
                            ? "bg-amber-200/80 text-amber-950 ring-1 ring-amber-300"
                            : "bg-[#f8fbff] text-slate-500 ring-1 ring-blue-100"
                        }`}>
                          <CalendarDays size={14} strokeWidth={2.6} />
                          {formatDate(dateValue)}
                        </div>
                      </div>

                      {announcement.content ? (
                        <p className={`mt-5 line-clamp-3 whitespace-pre-wrap break-words rounded-3xl p-4 text-sm font-semibold leading-7 [overflow-wrap:anywhere] md:p-5 md:text-base md:leading-8 ${
                          isYellowHighlighted
                            ? "bg-amber-100/60 text-slate-900 border border-amber-200/70"
                            : "bg-[#f8fbff] text-slate-600"
                        }`}>
                          {announcement.content}
                        </p>
                      ) : (
                        <p className="mt-5 rounded-3xl bg-[#f8fbff] p-4 text-sm font-semibold text-slate-400">
                          Tidak ada isi pengumuman.
                        </p>
                      )}
                    </Link>

                    {announcement.document_url || announcement.documentUrl ? (
                      (() => {
                        const docUrl = announcement.document_url || announcement.documentUrl || "#";
                        const docName = announcement.document_name || announcement.documentName || "Lampiran Pengumuman";
                        const isImg = isImageAttachment(docUrl) || isImageAttachment(docName);

                        return (
                          <a
                            href={docUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex max-w-full items-center gap-3 rounded-2xl border border-blue-100 bg-[#eaf1ff] px-4 py-3 text-sm font-black text-[#123c8c] transition hover:-translate-y-0.5 hover:bg-blue-100 active:scale-[0.98]"
                          >
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                              {isImg ? (
                                <img src={docUrl} alt={docName} className="h-full w-full object-cover" />
                              ) : (
                                <FileText size={20} strokeWidth={2.6} />
                              )}
                            </span>
                            <span className="min-w-0 text-left">
                              <span className="block truncate">
                                {docName}
                              </span>
                              {formatFileSize(
                                announcement.document_size ||
                                  announcement.documentSize,
                              ) ? (
                                <span className="mt-0.5 block text-xs font-bold text-blue-500">
                                  {isImg ? "Gambar" : "PDF"}
                                  {" | "}
                                  {formatFileSize(
                                    announcement.document_size ||
                                      announcement.documentSize,
                                  )}
                                </span>
                              ) : (
                                <span className="mt-0.5 block text-xs font-bold text-blue-500">
                                  {isImg ? "Gambar" : "PDF"}
                                </span>
                              )}
                            </span>
                          </a>
                        );
                      })()
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}
