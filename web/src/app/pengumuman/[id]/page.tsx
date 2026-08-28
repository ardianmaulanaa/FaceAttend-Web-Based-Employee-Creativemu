"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { markAnnouncementAsRead } from "@/lib/announcement-read";

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
  content: string;
  document_url?: string | null;
  document_name?: string | null;
  document_size?: number | null;
  documentUrl?: string | null;
  documentName?: string | null;
  documentSize?: number | null;
  created_at: string;
  createdAt?: string;
};

type AnnouncementResponse = {
  success: boolean;
  error?: string;
  message?: string;
  announcement?: Announcement;
  data?: Announcement;
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFileSize(value?: number | null) {
  if (!value || value < 1) return "";

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function AnnouncementDetailMotionStyles() {
  return (
    <style>{`
      @keyframes employeeAnnouncementDetailEnter {
        0% {
          opacity: 0;
          transform: translateY(12px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .employee-announcement-detail-enter {
        animation: employeeAnnouncementDetailEnter 280ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .employee-announcement-detail-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function EmployeeAnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const announcementId = params.id;

  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const loadAnnouncement = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/announcements?audience=employee&id=${encodeURIComponent(
          announcementId,
        )}`,
        {
          cache: "no-store",
        },
      );

      const data: AnnouncementResponse = await readJsonResponse(response);

      if (!response.ok || !data.success) {
        setAnnouncement(null);
        setErrorMessage(
          data.error || data.message || "Gagal mengambil detail pengumuman.",
        );
        return;
      }

      const targetAnnouncement = data.announcement || data.data || null;
      setAnnouncement(targetAnnouncement);
      if (targetAnnouncement?.id) {
        markAnnouncementAsRead(targetAnnouncement.id);
      }
    } catch (error) {
      setAnnouncement(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil detail pengumuman.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [announcementId]);

  useEffect(() => {
    void loadAnnouncement();
  }, [loadAnnouncement]);

  const documentUrl =
    announcement?.document_url || announcement?.documentUrl || "";
  const documentName =
    announcement?.document_name ||
    announcement?.documentName ||
    "Lampiran Pengumuman";
  const documentSize = formatFileSize(
    announcement?.document_size || announcement?.documentSize,
  );
  const createdAt = announcement?.created_at || announcement?.createdAt;
  const isImage = isImageAttachment(documentUrl) || isImageAttachment(documentName);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <AnnouncementDetailMotionStyles />

      <div className="hidden md:block">
        <AppHeader
          title="Detail Pengumuman"
          rightLabel="Info"
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] px-5 py-6 pb-[calc(8rem+env(safe-area-inset-bottom))] text-slate-950 md:px-10 md:pb-28 lg:px-16">
        <div className="mx-auto max-w-6xl">
          <button
            type="button"
            onClick={() => router.push("/pengumuman")}
            className="employee-announcement-detail-enter inline-flex items-center gap-2 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-black text-[#123c8c] shadow-sm transition hover:bg-blue-50 active:scale-[0.98]"
          >
            <ArrowLeft size={18} />
            Kembali
          </button>

          {isLoading ? (
            <section className="employee-announcement-detail-enter mt-6 rounded-3xl border border-blue-100 bg-white px-5 py-12 text-center shadow-sm">
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-[#123c8c]" />
              <p className="mt-3 font-black text-slate-700">
                Mengambil detail pengumuman...
              </p>
            </section>
          ) : errorMessage || !announcement ? (
            <section className="employee-announcement-detail-enter mt-6 rounded-3xl border border-red-100 bg-red-50 px-5 py-8 text-center shadow-sm">
              <p className="font-black text-red-700">
                {errorMessage || "Pengumuman tidak ditemukan."}
              </p>
            </section>
          ) : (
            <section className="employee-announcement-detail-enter mt-6 overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-sm">
              <div className="border-b border-blue-50 bg-[#f8fbff] p-6 md:p-8">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#123c8c]">
                    <Megaphone size={22} strokeWidth={2.6} />
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                      Detail Pengumuman
                    </p>
                    <h1 className="mt-2 break-words text-2xl font-black leading-tight text-slate-950 [overflow-wrap:anywhere] md:text-3xl">
                      {announcement.title}
                    </h1>

                    <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-slate-500">
                      <CalendarDays size={16} />
                      {formatDate(createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6 md:p-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    Isi Pengumuman
                  </p>
                  <p className="mt-3 whitespace-pre-line break-words text-sm font-semibold leading-7 text-slate-700 [overflow-wrap:anywhere] md:text-base">
                    {announcement.content}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    {isImage ? "Lampiran Foto" : "Dokumen Lampiran"}
                  </p>

                  {documentUrl ? (
                    isImage ? (
                      <div className="mt-3 space-y-3">
                        <div className="group relative max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
                          <img
                            src={documentUrl}
                            alt={documentName}
                            className="max-h-80 w-full object-contain cursor-pointer transition hover:scale-[1.02]"
                            onClick={() => setPreviewImage(documentUrl)}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewImage(documentUrl)}
                            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-slate-900"
                          >
                            <Eye size={14} />
                            Perbesar Foto
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <a
                            href={documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2 text-xs font-black text-[#123c8c] transition hover:bg-blue-100"
                          >
                            <ExternalLink size={14} />
                            Buka di Tab Baru
                          </a>
                          <a
                            href={documentUrl}
                            download={documentName}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                          >
                            <Download size={14} />
                            Unduh Foto ({documentSize || "Gambar"})
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 flex flex-wrap gap-3">
                        <a
                          href={documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex max-w-full items-center gap-3 rounded-2xl bg-blue-50 px-4 py-3 text-sm font-black text-[#123c8c] transition hover:bg-blue-100"
                        >
                          <FileText size={18} className="shrink-0" />
                          <span className="min-w-0">
                            <span className="block truncate">{documentName}</span>
                            {documentSize ? (
                              <span className="block text-xs font-bold text-blue-500">
                                PDF • {documentSize}
                              </span>
                            ) : (
                              <span className="block text-xs font-bold text-blue-500">
                                Dokumen PDF
                              </span>
                            )}
                          </span>
                        </a>

                        <a
                          href={documentUrl}
                          download={documentName}
                          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                        >
                          <Download size={16} />
                          Unduh PDF
                        </a>
                      </div>
                    )
                  ) : (
                    <p className="mt-3 text-sm font-bold text-slate-400">
                      Tidak ada lampiran dokumen atau gambar.
                    </p>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        {previewImage && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
            onClick={() => setPreviewImage(null)}
          >
            <div
              className="relative max-h-[90vh] max-w-3xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900/80 text-white transition hover:bg-slate-900"
              >
                <X size={18} />
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-h-[82vh] w-auto max-w-full rounded-xl object-contain"
              />
            </div>
          </div>
        )}

        <BottomNav />
      </main>
    </MobileShell>
  );
}
