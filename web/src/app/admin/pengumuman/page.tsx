"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit,
  FileText,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
  Loader2,
  Users,
  Archive,
  Send,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { AppCard } from "@/components/ui/AppUI";

type AnnouncementStatus = "draft" | "published" | "archived";

type Announcement = {
  id: string;
  title: string;
  content: string;
  target: string;
  status: AnnouncementStatus;
  attachment_url: string | null;
  attachmentUrl?: string | null;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    name: string;
    email: string;
  } | null;
};

type AnnouncementForm = {
  title: string;
  content: string;
  status: AnnouncementStatus;
  attachmentUrl: string | null;
};

const initialForm: AnnouncementForm = {
  title: "",
  content: "",
  status: "published",
  attachmentUrl: null,
};

function formatStatus(status: AnnouncementStatus) {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}

function formatDate(value: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function AnnouncementMotionStyles() {
  return (
    <style>{`
      @keyframes adminAnnouncementEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes adminAnnouncementModalBackdrop {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }

      @keyframes adminAnnouncementModalPanel {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes adminAnnouncementRow {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .admin-announcement-enter {
        animation: adminAnnouncementEnter 320ms ease-out both;
      }

      .admin-announcement-row-enter {
        opacity: 0;
        animation: adminAnnouncementRow 300ms ease-out both;
      }

      .admin-announcement-modal-backdrop {
        animation: adminAnnouncementModalBackdrop 180ms ease-out both;
      }

      .admin-announcement-modal-panel {
        animation: adminAnnouncementModalPanel 260ms ease-out both;
        transform-origin: center bottom;
      }

      .admin-announcement-field {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .admin-announcement-enter,
        .admin-announcement-row-enter,
        .admin-announcement-modal-backdrop,
        .admin-announcement-modal-panel {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | AnnouncementStatus>(
    "all",
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<
    string | null
  >(null);
  const [form, setForm] = useState<AnnouncementForm>(initialForm);

  const [readers, setReaders] = useState<{ userName: string; userEmail: string; timestamp: number }[]>([]);
  const [activeReadersAnnouncementId, setActiveReadersAnnouncementId] = useState<string | null>(null);
  const [isReadersLoading, setIsReadersLoading] = useState(false);

  async function openReadersModal(announcementId: string) {
    setActiveReadersAnnouncementId(announcementId);
    setIsReadersLoading(true);
    try {
      const res = await fetch(`/api/announcements/read?announcementId=${announcementId}`);
      if (res.ok) {
        const data = await res.json();
        setReaders(data.readers || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsReadersLoading(false);
    }
  }

  async function readJsonResponse(response: Response) {
    const text = await response.text();

    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw new Error("Response API bukan JSON.");
    }
  }

  async function loadAnnouncements() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch("/api/announcements?audience=admin", {
        cache: "no-store",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal mengambil pengumuman.",
        );
      }

      setAnnouncements(data.announcements || data.data || []);
    } catch (error) {
      console.error("ADMIN_ANNOUNCEMENTS_ERROR:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data pengumuman.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAnnouncements();
  }, []);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const keyword = search.toLowerCase().trim();

      if (
        keyword &&
        !announcement.title.toLowerCase().includes(keyword) &&
        !announcement.content.toLowerCase().includes(keyword)
      ) {
        return false;
      }

      if (filterStatus !== "all" && announcement.status !== filterStatus) {
        return false;
      }

      return true;
    });
  }, [announcements, filterStatus, search]);

  const publishedCount = announcements.filter(
    (item) => item.status === "published",
  ).length;

  const draftCount = announcements.filter(
    (item) => item.status === "draft",
  ).length;

  const archivedCount = announcements.filter(
    (item) => item.status === "archived",
  ).length;

  function resetFilter() {
    setSearch("");
    setFilterStatus("all");
  }

  function openAddModal() {
    setEditingAnnouncementId(null);
    setForm(initialForm);
    setIsModalOpen(true);
  }

  function openEditModal(announcement: Announcement) {
    setEditingAnnouncementId(announcement.id);
    setForm({
      title: announcement.title,
      content: announcement.content,
      status: announcement.status,
      attachmentUrl: announcement.attachment_url || announcement.attachmentUrl || null,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingAnnouncementId(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const content = form.content.trim();

    if (!title || !content) {
      alert("Judul dan isi pengumuman wajib diisi.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch("/api/announcements", {
        method: editingAnnouncementId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingAnnouncementId,
          title,
          content,
          target: "all",
          status: form.status,
          attachmentUrl: form.attachmentUrl,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal menyimpan pengumuman.",
        );
      }

      await loadAnnouncements();
      closeModal();
    } catch (error) {
      console.error("SAVE_ANNOUNCEMENT_ERROR:", error);

      alert(
        error instanceof Error ? error.message : "Gagal menyimpan pengumuman.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function deleteAnnouncement(id: string) {
    const confirmed = window.customConfirm
      ? await window.customConfirm("Yakin ingin menghapus pengumuman ini?")
      : confirm("Yakin ingin menghapus pengumuman ini?");

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/announcements?id=${id}`, {
        method: "DELETE",
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal menghapus pengumuman.",
        );
      }

      await loadAnnouncements();
    } catch (error) {
      console.error("DELETE_ANNOUNCEMENT_ERROR:", error);

      alert(
        error instanceof Error ? error.message : "Gagal menghapus pengumuman.",
      );
    }
  }

  async function updateStatus(id: string, status: AnnouncementStatus) {
    try {
      const response = await fetch("/api/announcements", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          target: "all",
          status,
        }),
      });

      const data = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || "Gagal mengubah status pengumuman.",
        );
      }

      await loadAnnouncements();
    } catch (error) {
      console.error("UPDATE_STATUS_ANNOUNCEMENT_ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Gagal mengubah status pengumuman.",
      );
    }
  }

  return (
    <MobileShell variant="admin">
      <AnnouncementMotionStyles />

      <AppHeader title="Pengumuman" variant="admin" />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section
          style={{ paddingTop: '12px', paddingBottom: '12px', paddingLeft: '24px', paddingRight: '24px' }}
          className="admin-announcement-enter relative overflow-hidden rounded-[1.8rem] bg-[#123c8c] text-white shadow-2xl shadow-blue-900/25"
        >
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                <Megaphone size={15} />
                Announcement Center
              </div>

              <h1 className="mt-2 text-2xl font-black tracking-tight md:text-3xl">
                Pengumuman Admin
              </h1>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-3 rounded-[1.3rem] bg-white dark:bg-[#21262d] px-5 py-3 text-sm font-black text-[#123c8c] dark:text-[#58a6ff] shadow-2xl shadow-blue-950/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-50 dark:hover:bg-[#30363d] active:scale-[0.98]"
            >
              <Plus size={18} strokeWidth={3} />
              Tambah Pengumuman
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div
            className="admin-announcement-row-enter rounded-[1.7rem] border border-emerald-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30"
            style={{ animationDelay: "70ms" }}
          >
            <p className="text-sm font-bold text-slate-500">Published</p>
            <h3 className="mt-2 text-3xl font-black text-emerald-700">
              {publishedCount}
            </h3>
          </div>

          <div
            className="admin-announcement-row-enter rounded-[1.7rem] border border-amber-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30"
            style={{ animationDelay: "110ms" }}
          >
            <p className="text-sm font-bold text-slate-500">Draft</p>
            <h3 className="mt-2 text-3xl font-black text-amber-700">
              {draftCount}
            </h3>
          </div>

          <div
            className="admin-announcement-row-enter rounded-[1.7rem] border border-slate-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30"
            style={{ animationDelay: "150ms" }}
          >
            <p className="text-sm font-bold text-slate-500">Archived</p>
            <h3 className="mt-2 text-3xl font-black text-slate-700">
              {archivedCount}
            </h3>
          </div>
        </section>

        <section
          className="admin-announcement-enter mt-6 rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Daftar Pengumuman
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-[1.5fr_0.8fr_auto]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari pengumuman..."
                  className="admin-announcement-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <select
                value={filterStatus}
                onChange={(event) =>
                  setFilterStatus(
                    event.target.value as "all" | AnnouncementStatus,
                  )
                }
                className="admin-announcement-field rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
              >
                <option value="all">Semua Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <button
                type="button"
                onClick={resetFilter}
                className="inline-flex h-[46px] items-center justify-center rounded-2xl border border-blue-100 bg-white px-4 text-[#123c8c] shadow-sm transition duration-200 hover:bg-[#eaf1ff] active:scale-[0.96]"
                title="Reset Filter"
              >
                <RefreshCw size={20} strokeWidth={2.6} />
              </button>
            </div>
          </div>

          {errorMessage ? (
            <div className="admin-announcement-row-enter mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[1.4fr_2fr_0.8fr_1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>Judul</p>
              <p>Isi Pengumuman</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50 bg-white">
              {isLoading ? (
                <div className="admin-announcement-row-enter px-5 py-10 text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
                  <p className="mt-3 font-black text-slate-700">
                    Mengambil data pengumuman...
                  </p>
                </div>
              ) : filteredAnnouncements.length === 0 ? (
                <div className="admin-announcement-row-enter px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Pengumuman tidak ditemukan.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba ubah filter pencarian.
                  </p>
                </div>
              ) : (
                filteredAnnouncements.map((announcement, index) => (
                  <div
                    key={announcement.id}
                    className="admin-announcement-row-enter grid gap-4 px-5 py-5 text-sm transition duration-200 hover:bg-[#f8fbff] md:grid-cols-[1.4fr_2fr_0.8fr_1fr] md:items-center"
                    style={{
                      animationDelay: `${index * 55}ms`,
                    }}
                  >
                    <div>
                      <p className="font-black text-slate-950">
                        {announcement.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {formatDate(announcement.created_at)}
                      </p>
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openReadersModal(announcement.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-[#123c8c] transition hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/80 active:scale-[0.97]"
                        >
                          <Users size={14} />
                          Lihat Pembaca
                        </button>

                        {(announcement.attachment_url || announcement.attachmentUrl) && (
                          /\.pdf$/i.test(announcement.attachment_url || announcement.attachmentUrl || "") ? (
                            <a
                              href={announcement.attachment_url || announcement.attachmentUrl || ""}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/80 active:scale-[0.97]"
                            >
                              <FileText size={14} />
                              Lihat PDF
                            </a>
                          ) : /\.(mp4|webm|ogg|mov)$/i.test(announcement.attachment_url || announcement.attachmentUrl || "") ? (
                            <video src={announcement.attachment_url || announcement.attachmentUrl || ""} className="max-h-20 w-full rounded-lg object-cover bg-black" />
                          ) : (
                            <img src={announcement.attachment_url || announcement.attachmentUrl || ""} alt="Media" className="max-h-20 w-full rounded-lg object-cover bg-slate-100" />
                          )
                        )}
                      </div>
                    </div>

                    <p className="line-clamp-2 font-semibold leading-6 text-slate-600 dark:text-slate-300">
                      {announcement.content}
                    </p>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${announcement.status === "published"
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300"
                        : announcement.status === "draft"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                    >
                      {formatStatus(announcement.status)}
                    </span>

                    <div className="flex flex-wrap items-center gap-2 md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(announcement)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-3 py-1.5 text-xs font-bold text-[#123c8c] transition hover:bg-blue-100 dark:border-blue-800/60 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/80 active:scale-[0.97]"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      {announcement.status !== "published" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(announcement.id, "published")
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/80 active:scale-[0.97]"
                        >
                          <Send size={14} />
                          Publish
                        </button>
                      )}

                      {announcement.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(announcement.id, "archived")
                          }
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 active:scale-[0.97]"
                        >
                          <Archive size={14} />
                          Archive
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(announcement.id)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/70 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/60 dark:bg-rose-950/60 dark:text-rose-300 dark:hover:bg-rose-900/80 active:scale-[0.97]"
                      >
                        <Trash2 size={14} />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {isModalOpen && (
        <div className="admin-announcement-modal-backdrop fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="admin-announcement-modal-panel max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  {editingAnnouncementId
                    ? "Edit Pengumuman"
                    : "Tambah Pengumuman"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {editingAnnouncementId
                    ? "Edit Data Pengumuman"
                    : "Tambah Pengumuman Baru"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition hover:bg-slate-200 active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="admin-announcement-row-enter">
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Judul Pengumuman
                </label>

                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Contoh: Pengingat Absensi Harian"
                  className="admin-announcement-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div
                className="admin-announcement-row-enter"
                style={{ animationDelay: "40ms" }}
              >
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Isi Pengumuman
                </label>

                <textarea
                  value={form.content}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      content: event.target.value,
                    }))
                  }
                  rows={6}
                  placeholder="Tulis isi pemberitahuan..."
                  className="admin-announcement-field w-full resize-none rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold leading-6 text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                />
              </div>

              <div
                className="admin-announcement-row-enter"
                style={{ animationDelay: "80ms" }}
              >
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Media Pengumuman (Foto/Video/PDF, Maks 50MB)
                </label>

                {form.attachmentUrl ? (
                  <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-slate-50 p-2">
                    {/\.pdf$/i.test(form.attachmentUrl) ? (
                      <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100">
                        <FileText className="text-red-500" size={32} />
                        <div>
                          <p className="text-sm font-black text-slate-800">Lampiran Dokumen PDF</p>
                          <a href={form.attachmentUrl} target="_blank" className="text-xs font-bold text-[#123c8c] hover:underline">Buka PDF</a>
                        </div>
                      </div>
                    ) : /\.(mp4|webm|ogg|mov)$/i.test(form.attachmentUrl) ? (
                      <video src={form.attachmentUrl} controls className="max-h-60 w-full rounded-xl object-contain bg-black" />
                    ) : (
                      <img src={form.attachmentUrl} alt="Preview Attachment" className="max-h-60 w-full rounded-xl object-contain bg-slate-100" />
                    )}

                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, attachmentUrl: null }))}
                      className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow hover:bg-rose-600 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-blue-200 bg-[#f6f8ff] py-6 hover:bg-[#eaf1ff] transition duration-200">
                    <input
                      type="file"
                      accept="image/*,video/*,application/pdf"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 50 * 1024 * 1024) {
                          alert("Ukuran file tidak boleh melebihi 50MB.");
                          return;
                        }

                        try {
                          setIsSubmitting(true);
                          const formData = new FormData();
                          formData.append("file", file);

                          const res = await fetch("/api/upload", {
                            method: "POST",
                            body: formData,
                          });
                          const data = await res.json();
                          if (res.ok && data.success) {
                            setForm(prev => ({ ...prev, attachmentUrl: data.url }));
                          } else {
                            alert(data.error || "Gagal mengunggah file.");
                          }
                        } catch (err) {
                          console.error(err);
                          alert("Gagal mengunggah file.");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <Megaphone className="h-8 w-8 text-[#123c8c] opacity-60" />
                    <p className="mt-2 text-xs font-black text-[#123c8c]">
                      Pilih Foto / Video / PDF
                    </p>
                    <p className="mt-1 text-[10px] font-semibold text-slate-400">
                      Mendukung gambar, video, dan dokumen PDF (Maks 50MB)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      status: event.target.value as AnnouncementStatus,
                    }))
                  }
                  className="admin-announcement-field w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white focus:ring-4 focus:ring-blue-100"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div
                className="admin-announcement-row-enter flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end"
                style={{ animationDelay: "120ms" }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200 active:scale-[0.98]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Menyimpan..."
                    : editingAnnouncementId
                      ? "Update Pengumuman"
                      : "Simpan Pengumuman"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {activeReadersAnnouncementId && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <AppCard className="w-full max-w-md overflow-hidden bg-white p-6 shadow-2xl rounded-[2rem]">
            <div className="flex items-center justify-between border-b border-blue-50 pb-4 mb-4">
              <h3 className="text-lg font-black text-slate-900">Daftar Pembaca</h3>
              <button
                onClick={() => setActiveReadersAnnouncementId(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X size={20} strokeWidth={2.6} />
              </button>
            </div>

            {isReadersLoading ? (
              <div className="flex h-44 flex-col items-center justify-center gap-2">
                <Loader2 className="animate-spin text-[#123c8c]" size={28} />
                <p className="text-xs font-semibold text-slate-500">Memuat pembaca...</p>
              </div>
            ) : readers.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-slate-500">Belum ada karyawan yang membaca pengumuman ini.</p>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-3 pr-2">
                {readers.map((reader, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl">
                    <div>
                      <p className="text-sm font-black text-slate-900">{reader.userName}</p>
                      <p className="text-xs text-slate-400 font-semibold">{reader.userEmail}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">
                      {new Date(reader.timestamp).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })} WIB
                    </span>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={() => setActiveReadersAnnouncementId(null)}
              className="mt-6 w-full rounded-2xl bg-[#123c8c] py-3 text-sm font-black text-white shadow-md transition hover:bg-[#0f3274]"
            >
              Tutup
            </button>
          </AppCard>
        </div>
      )}

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
