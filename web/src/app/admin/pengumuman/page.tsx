"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Edit,
  FileText,
  Loader2,
  Megaphone,
  Paperclip,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type AnnouncementStatus = "draft" | "published" | "archived";

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
  target: string;
  status: AnnouncementStatus;
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
  document: File | null;
  existingDocumentName: string;
  existingDocumentUrl: string;
  removeDocument: boolean;
};

const initialForm: AnnouncementForm = {
  title: "",
  content: "",
  status: "published",
  document: null,
  existingDocumentName: "",
  existingDocumentUrl: "",
  removeDocument: false,
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

function formatFileSize(value?: number | null) {
  if (!value || value < 1) return "";

  if (value >= 1024 * 1024) {
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
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

  const loadAnnouncements = useCallback(async () => {
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
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil data pengumuman.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

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
      document: null,
      existingDocumentName:
        announcement.document_name || announcement.documentName || "",
      existingDocumentUrl:
        announcement.document_url || announcement.documentUrl || "",
      removeDocument: false,
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

      const formData = new FormData();
      formData.append("title", title);
      formData.append("content", content);
      formData.append("target", "all");
      formData.append("status", form.status);

      if (editingAnnouncementId) {
        formData.append("id", editingAnnouncementId);
      }

      if (form.document) {
        formData.append("document", form.document);
      }

      if (form.removeDocument) {
        formData.append("removeDocument", "true");
      }

      const response = await fetch("/api/announcements", {
        method: editingAnnouncementId ? "PATCH" : "POST",
        body: formData,
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
    const confirmed = confirm("Yakin ingin menghapus pengumuman ini?");

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

  return (
    <MobileShell variant="admin">
      <AnnouncementMotionStyles />

      <AppHeader title="Pengumuman" variant="admin" />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="admin-announcement-enter relative overflow-hidden rounded-[2rem] bg-[#123c8c] p-6 text-white shadow-md shadow-slate-300/40 md:p-8">
          <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                Pengumuman Admin
              </h1>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-3 rounded-[1.4rem] bg-white px-6 py-4 text-sm font-black text-[#123c8c] shadow-sm ring-1 ring-white/70 transition duration-200 hover:bg-blue-50 active:scale-[0.98]"
            >
              <Plus size={20} strokeWidth={3} />
              Tambah Pengumuman
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div
            className="admin-announcement-row-enter rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
            style={{ animationDelay: "70ms" }}
          >
            <p className="text-sm font-bold text-slate-500">Published</p>
            <h3 className="mt-2 text-3xl font-black text-emerald-700">
              {publishedCount}
            </h3>
          </div>

          <div
            className="admin-announcement-row-enter rounded-[1.5rem] border border-amber-100 bg-white p-5 shadow-sm"
            style={{ animationDelay: "110ms" }}
          >
            <p className="text-sm font-bold text-slate-500">Draft</p>
            <h3 className="mt-2 text-3xl font-black text-amber-700">
              {draftCount}
            </h3>
          </div>

          <div
            className="admin-announcement-row-enter rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm"
            style={{ animationDelay: "150ms" }}
          >
            <p className="text-sm font-bold text-slate-500">Archived</p>
            <h3 className="mt-2 text-3xl font-black text-slate-700">
              {archivedCount}
            </h3>
          </div>
        </section>

        <section
          className="admin-announcement-enter mt-6 rounded-3xl border border-blue-100 bg-white p-4 shadow-sm md:p-5"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black text-slate-950">
                Daftar Pengumuman
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-400">
                {filteredAnnouncements.length} data ditampilkan
              </p>
            </div>

            <div className="grid gap-3 md:w-[34rem] md:grid-cols-[1.5fr_0.9fr_auto]">
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
            </div>
          </div>

          {errorMessage ? (
            <div className="admin-announcement-row-enter mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <div className="mt-5 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[minmax(0,1.7fr)_minmax(11rem,0.75fr)_0.5fr_0.75fr] items-center bg-[#f6f8ff] px-5 py-3 text-[11px] font-black uppercase tracking-[0.14em] text-[#123c8c] md:grid">
              <p>Pengumuman</p>
              <p>Dokumen</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50 bg-white">
              {isLoading ? (
                <div className="admin-announcement-row-enter px-5 py-10 text-center">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#123c8c]" />
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
                    className="admin-announcement-row-enter grid gap-3 px-4 py-4 text-sm transition duration-200 hover:bg-[#f8fbff] md:grid-cols-[minmax(0,1.7fr)_minmax(11rem,0.75fr)_0.5fr_0.75fr] md:items-start md:px-5"
                    style={{
                      animationDelay: `${index * 55}ms`,
                    }}
                  >
                    <Link
                      href={`/admin/pengumuman/${announcement.id}`}
                      className="min-w-0 rounded-2xl transition hover:bg-blue-50/50 focus:outline-none focus:ring-4 focus:ring-blue-100"
                    >
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-[#123c8c]">
                          <Megaphone size={17} strokeWidth={2.6} />
                        </span>

                        <div className="min-w-0">
                          <p className="line-clamp-2 break-words font-black leading-6 text-slate-950 [overflow-wrap:anywhere]">
                            {announcement.title}
                          </p>
                          <p className="mt-1 line-clamp-2 break-words text-xs font-semibold leading-5 text-slate-500 [overflow-wrap:anywhere]">
                            {announcement.content}
                          </p>
                          <p className="mt-2 text-[11px] font-bold text-slate-400">
                            {formatDate(announcement.created_at)}
                          </p>
                        </div>
                      </div>
                    </Link>

                    {announcement.document_url || announcement.documentUrl ? (
                      <a
                        href={
                          announcement.document_url ||
                          announcement.documentUrl ||
                          "#"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-w-0 items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-black text-[#123c8c] transition hover:bg-blue-100 md:mt-1"
                      >
                        <FileText size={15} className="shrink-0" />
                        <span className="min-w-0">
                          <span className="block truncate">
                            {announcement.document_name ||
                              announcement.documentName ||
                              "Dokumen PDF"}
                          </span>
                          {formatFileSize(
                            announcement.document_size ||
                              announcement.documentSize,
                          ) ? (
                            <span className="block text-[10px] font-bold text-blue-500">
                              {formatFileSize(
                                announcement.document_size ||
                                  announcement.documentSize,
                              )}
                            </span>
                          ) : null}
                        </span>
                      </a>
                    ) : (
                      <span className="inline-flex w-fit rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-300">
                        Tidak ada
                      </span>
                    )}

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black md:justify-self-start ${
                        announcement.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : announcement.status === "draft"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {formatStatus(announcement.status)}
                    </span>

                    <div className="grid grid-cols-2 gap-2 md:mt-1 md:justify-self-end">
                      <button
                        type="button"
                        onClick={() => openEditModal(announcement)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 text-xs font-black text-[#123c8c] transition hover:bg-[#eaf1ff] active:scale-[0.97]"
                      >
                        <Edit size={14} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(announcement.id)}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 text-xs font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.97]"
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
        <div className="admin-announcement-modal-backdrop fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="admin-announcement-modal-panel flex max-h-[calc(100dvh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-xl shadow-slate-950/25">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#123c8c]">
                  {editingAnnouncementId
                    ? "Edit Pengumuman"
                    : "Tambah Pengumuman"}
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950 md:text-2xl">
                  {editingAnnouncementId
                    ? "Edit Data Pengumuman"
                    : "Tambah Pengumuman Baru"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pengumuman otomatis ditujukan untuk semua pengguna.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 md:px-6">
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
                  placeholder="Contoh: Pengingat Presensi Harian"
                  className="admin-announcement-field w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-2 focus:ring-blue-100"
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
                  className="admin-announcement-field w-full resize-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold leading-6 text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div
                className="admin-announcement-row-enter"
                style={{ animationDelay: "80ms" }}
              >
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
                  className="admin-announcement-field w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-2 focus:ring-blue-100"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div
                className="admin-announcement-row-enter"
                style={{ animationDelay: "120ms" }}
              >
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Dokumen PDF
                </label>

                <label className="admin-announcement-field flex cursor-pointer flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 text-sm font-bold text-slate-600 outline-none transition hover:border-[#123c8c] hover:ring-2 hover:ring-blue-100 md:flex-row md:items-center md:justify-between">
                  <span className="inline-flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[#123c8c]">
                      <Paperclip size={20} strokeWidth={2.6} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-slate-800">
                        {form.document
                          ? form.document.name
                          : form.existingDocumentName
                            ? form.existingDocumentName
                            : "Pilih dokumen PDF"}
                      </span>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-400">
                        Maksimal 10MB, hanya PDF.
                      </span>
                    </span>
                  </span>

                  <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-[#123c8c]">
                    Pilih File
                  </span>

                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;

                      if (!file) {
                        setForm((prev) => ({
                          ...prev,
                          document: null,
                        }));
                        return;
                      }

                      if (
                        file.type !== "application/pdf" &&
                        !file.name.toLowerCase().endsWith(".pdf")
                      ) {
                        alert("Dokumen pengumuman harus berformat PDF.");
                        event.target.value = "";
                        return;
                      }

                      if (file.size > 10 * 1024 * 1024) {
                        alert("Ukuran dokumen PDF maksimal 10MB.");
                        event.target.value = "";
                        return;
                      }

                      setForm((prev) => ({
                        ...prev,
                        document: file,
                        removeDocument: false,
                      }));
                    }}
                  />
                </label>

                {form.existingDocumentUrl && !form.document ? (
                  <div className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-500 md:flex-row md:items-center md:justify-between">
                    <a
                      href={form.existingDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-w-0 items-center gap-2 text-[#123c8c] hover:text-[#0f3274]"
                    >
                      <FileText size={15} />
                      <span className="truncate">
                        {form.existingDocumentName || "Dokumen PDF"}
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          existingDocumentName: "",
                          existingDocumentUrl: "",
                          removeDocument: true,
                        }))
                      }
                      className="w-fit rounded-xl bg-rose-50 px-3 py-2 font-black text-rose-600 transition hover:bg-rose-100 active:scale-[0.97]"
                    >
                      Hapus Dokumen
                    </button>
                  </div>
                ) : null}
              </div>

              </div>

              <div
                className="admin-announcement-row-enter flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] md:flex-row md:justify-end md:px-6"
                style={{ animationDelay: "160ms" }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-600 transition hover:bg-slate-50 active:scale-[0.98]"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#123c8c] px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
