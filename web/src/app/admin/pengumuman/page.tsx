"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Edit,
  Megaphone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type AnnouncementStatus = "draft" | "published" | "archived";
type AnnouncementTarget = "all" | "employee" | "admin";

type Announcement = {
  id: string;
  title: string;
  message: string;
  target: AnnouncementTarget;
  status: AnnouncementStatus;
  createdAt: string;
};

type AnnouncementForm = {
  title: string;
  message: string;
  target: AnnouncementTarget;
  status: AnnouncementStatus;
};

const defaultAnnouncements: Announcement[] = [
  {
    id: "announcement-1",
    title: "Pengingat Absensi Harian",
    message:
      "Seluruh karyawan diharapkan melakukan check-in dan check-out sesuai jam kerja yang berlaku.",
    target: "employee",
    status: "published",
    createdAt: new Date().toISOString(),
  },
  {
    id: "announcement-2",
    title: "Update Data Karyawan",
    message:
      "Admin diminta memastikan data karyawan, divisi, jabatan, dan shift sudah sesuai.",
    target: "admin",
    status: "draft",
    createdAt: new Date().toISOString(),
  },
];

const initialForm: AnnouncementForm = {
  title: "",
  message: "",
  target: "all",
  status: "published",
};

function formatTarget(target: AnnouncementTarget) {
  if (target === "employee") return "Karyawan";
  if (target === "admin") return "Admin";
  return "Semua Pengguna";
}

function formatStatus(status: AnnouncementStatus) {
  if (status === "published") return "Published";
  if (status === "archived") return "Archived";
  return "Draft";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(defaultAnnouncements);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | AnnouncementStatus>(
    "all",
  );
  const [filterTarget, setFilterTarget] = useState<"all" | AnnouncementTarget>(
    "all",
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<
    string | null
  >(null);
  const [form, setForm] = useState<AnnouncementForm>(initialForm);

  useEffect(() => {
    const savedAnnouncements = localStorage.getItem(
      "faceattend_announcements",
    );

    if (savedAnnouncements) {
      try {
        const parsedAnnouncements = JSON.parse(
          savedAnnouncements,
        ) as Announcement[];

        setAnnouncements(
          parsedAnnouncements.length > 0
            ? parsedAnnouncements
            : defaultAnnouncements,
        );
      } catch {
        setAnnouncements(defaultAnnouncements);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "faceattend_announcements",
      JSON.stringify(announcements),
    );
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    return announcements.filter((announcement) => {
      const keyword = search.toLowerCase();

      if (
        search &&
        !announcement.title.toLowerCase().includes(keyword) &&
        !announcement.message.toLowerCase().includes(keyword)
      ) {
        return false;
      }

      if (filterStatus !== "all" && announcement.status !== filterStatus) {
        return false;
      }

      if (filterTarget !== "all" && announcement.target !== filterTarget) {
        return false;
      }

      return true;
    });
  }, [announcements, filterStatus, filterTarget, search]);

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
    setFilterTarget("all");
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
      message: announcement.message,
      target: announcement.target,
      status: announcement.status,
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingAnnouncementId(null);
    setForm(initialForm);
    setIsModalOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = form.title.trim();
    const message = form.message.trim();

    if (!title || !message) {
      alert("Judul dan isi pengumuman wajib diisi.");
      return;
    }

    if (editingAnnouncementId) {
      setAnnouncements((prev) =>
        prev.map((announcement) =>
          announcement.id === editingAnnouncementId
            ? {
                ...announcement,
                title,
                message,
                target: form.target,
                status: form.status,
              }
            : announcement,
        ),
      );
    } else {
      setAnnouncements((prev) => [
        {
          id: `announcement-${Date.now()}`,
          title,
          message,
          target: form.target,
          status: form.status,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    }

    closeModal();
  }

  function deleteAnnouncement(id: string) {
    const confirmed = confirm("Yakin ingin menghapus pengumuman ini?");

    if (!confirmed) return;

    setAnnouncements((prev) =>
      prev.filter((announcement) => announcement.id !== id),
    );
  }

  function updateStatus(id: string, status: AnnouncementStatus) {
    setAnnouncements((prev) =>
      prev.map((announcement) =>
        announcement.id === id
          ? {
              ...announcement,
              status,
            }
          : announcement,
      ),
    );
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Pengumuman"
        subtitle="Kelola pemberitahuan untuk admin dan karyawan"
        variant="admin"
      />

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28 md:px-10 lg:px-16">
        <section className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-8">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-16 h-64 w-64 rounded-full bg-blue-300/20 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-100">
                <Megaphone size={15} />
                Announcement Center
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
                Pengumuman Admin
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
                Buat dan kelola pemberitahuan untuk seluruh pengguna, karyawan,
                atau admin internal.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-3 rounded-[1.6rem] bg-white px-6 py-4 text-sm font-black text-[#123c8c] shadow-2xl shadow-blue-950/20 transition active:scale-[0.98]"
            >
              <Plus size={20} strokeWidth={3} />
              Tambah Pengumuman
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.7rem] border border-emerald-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <p className="text-sm font-bold text-slate-500">Published</p>
            <h3 className="mt-2 text-3xl font-black text-emerald-700">
              {publishedCount}
            </h3>
          </div>

          <div className="rounded-[1.7rem] border border-amber-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <p className="text-sm font-bold text-slate-500">Draft</p>
            <h3 className="mt-2 text-3xl font-black text-amber-700">
              {draftCount}
            </h3>
          </div>

          <div className="rounded-[1.7rem] border border-slate-100 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <p className="text-sm font-bold text-slate-500">Archived</p>
            <h3 className="mt-2 text-3xl font-black text-slate-700">
              {archivedCount}
            </h3>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-black text-slate-950">
                Daftar Pengumuman
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Filter berdasarkan judul, target, dan status pengumuman.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Cari pengumuman..."
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] py-3 pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <select
                value={filterTarget}
                onChange={(event) =>
                  setFilterTarget(
                    event.target.value as "all" | AnnouncementTarget,
                  )
                }
                className="rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
              >
                <option value="all">Semua Target</option>
                <option value="all">Semua Pengguna</option>
                <option value="employee">Karyawan</option>
                <option value="admin">Admin</option>
              </select>

              <select
                value={filterStatus}
                onChange={(event) =>
                  setFilterStatus(
                    event.target.value as "all" | AnnouncementStatus,
                  )
                }
                className="rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>

              <button
                type="button"
                onClick={resetFilter}
                className="inline-flex h-[46px] items-center justify-center rounded-2xl border border-blue-100 bg-white px-4 text-[#123c8c] shadow-sm transition active:scale-[0.96]"
                title="Reset Filter"
              >
                <RefreshCw size={20} strokeWidth={2.6} />
              </button>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl border border-blue-100">
            <div className="hidden grid-cols-[1.4fr_1.8fr_0.7fr_0.7fr_1fr] bg-[#f6f8ff] px-5 py-4 text-xs font-black uppercase tracking-[0.16em] text-[#123c8c] md:grid">
              <p>Judul</p>
              <p>Isi Pengumuman</p>
              <p>Target</p>
              <p>Status</p>
              <p className="text-center">Aksi</p>
            </div>

            <div className="divide-y divide-blue-50 bg-white">
              {filteredAnnouncements.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="font-black text-slate-700">
                    Pengumuman tidak ditemukan.
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Coba ubah filter pencarian.
                  </p>
                </div>
              ) : (
                filteredAnnouncements.map((announcement) => (
                  <div
                    key={announcement.id}
                    className="grid gap-4 px-5 py-5 text-sm transition hover:bg-[#f8fbff] md:grid-cols-[1.4fr_1.8fr_0.7fr_0.7fr_1fr] md:items-center"
                  >
                    <div>
                      <p className="font-black text-slate-950">
                        {announcement.title}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-slate-400">
                        {formatDate(announcement.createdAt)}
                      </p>
                    </div>

                    <p className="line-clamp-2 font-semibold leading-6 text-slate-600">
                      {announcement.message}
                    </p>

                    <span className="w-fit rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-black text-[#123c8c]">
                      {formatTarget(announcement.target)}
                    </span>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-black ${
                        announcement.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : announcement.status === "draft"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {formatStatus(announcement.status)}
                    </span>

                    <div className="flex flex-wrap gap-2 md:justify-center">
                      <button
                        type="button"
                        onClick={() => openEditModal(announcement)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-black text-[#123c8c] transition hover:bg-[#eaf1ff]"
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
                          className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Publish
                        </button>
                      )}

                      {announcement.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(announcement.id, "archived")
                          }
                          className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
                        >
                          Archive
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => deleteAnnouncement(announcement.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-xs font-black text-rose-600 transition hover:bg-rose-100"
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
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 px-4 pb-4 backdrop-blur-sm md:items-center md:pb-0">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7">
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

                <p className="mt-1 text-sm text-slate-500">
                  Buat pemberitahuan untuk admin, karyawan, atau semua pengguna.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition active:scale-[0.96]"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
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
                  className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Isi Pengumuman
                </label>

                <textarea
                  value={form.message}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      message: event.target.value,
                    }))
                  }
                  rows={6}
                  placeholder="Tulis isi pemberitahuan..."
                  className="w-full resize-none rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold leading-6 text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-700">
                    Target Pengumuman
                  </label>

                  <select
                    value={form.target}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        target: event.target.value as AnnouncementTarget,
                      }))
                    }
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                  >
                    <option value="all">Semua Pengguna</option>
                    <option value="employee">Karyawan</option>
                    <option value="admin">Admin</option>
                  </select>
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
                    className="w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
                >
                  {editingAnnouncementId
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