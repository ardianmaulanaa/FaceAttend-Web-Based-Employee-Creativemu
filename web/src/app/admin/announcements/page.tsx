"use client";

import { useMemo, useState } from "react";
import { Megaphone, Send, Trash2 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type AdminAnnouncement = {
  id: string;
  title: string;
  summary: string;
  audience: "all" | "employee" | "admin";
  publishedAt: string;
  active: boolean;
};

const initialAnnouncements: AdminAnnouncement[] = [
  {
    id: "ann-admin-1",
    title: "Aturan Presensi WFA/WFH",
    summary:
      "WFA wajib radius lokasi terdaftar. WFH wajib lampiran bukti kerja.",
    audience: "employee",
    publishedAt: "2026-07-01",
    active: true,
  },
  {
    id: "ann-admin-2",
    title: "Pengajuan Cuti dan Sakit",
    summary: "Surat cuti/sakit wajib diunggah sebelum pukul 10:00 hari kerja.",
    audience: "employee",
    publishedAt: "2026-07-01",
    active: true,
  },
];

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AdminAnnouncement[]>(initialAnnouncements);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [audience, setAudience] =
    useState<AdminAnnouncement["audience"]>("employee");

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [items],
  );

  function handlePublish() {
    const safeTitle = title.trim();
    const safeSummary = summary.trim();

    if (!safeTitle || !safeSummary) {
      alert("Judul dan ringkasan pengumuman wajib diisi.");
      return;
    }

    setItems((prev) => [
      {
        id: `ann-admin-${Date.now()}`,
        title: safeTitle,
        summary: safeSummary,
        audience,
        publishedAt: new Date().toISOString().slice(0, 10),
        active: true,
      },
      ...prev,
    ]);

    setTitle("");
    setSummary("");
    setAudience("employee");
  }

  function toggleStatus(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              active: !item.active,
            }
          : item,
      ),
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Pengumuman Admin"
        subtitle="Kelola pengumuman internal untuk karyawan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <div className="flex items-center gap-2 text-[#123c8c]">
            <Megaphone size={18} />
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Komunikasi Internal
            </p>
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Publikasi Pengumuman Operasional
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Buat pengumuman baru untuk kebijakan attendance, payroll, atau
            informasi perusahaan lainnya.
          </p>
        </div>

        <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30">
          <div className="grid gap-3 md:grid-cols-[1fr_0.7fr]">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Judul pengumuman"
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
            />
            <select
              value={audience}
              onChange={(event) =>
                setAudience(event.target.value as AdminAnnouncement["audience"])
              }
              className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="employee">Karyawan</option>
              <option value="admin">Admin</option>
              <option value="all">Semua</option>
            </select>
          </div>

          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            placeholder="Ringkasan isi pengumuman"
            className="mt-3 min-h-24 w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none"
          />

          <button
            type="button"
            onClick={handlePublish}
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#123c8c] px-4 py-2 text-sm font-black text-white"
          >
            <Send size={14} />
            Publikasikan
          </button>
        </div>

        <div className="space-y-3">
          {sortedItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg shadow-slate-200/60"
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {item.publishedAt} • Audience: {item.audience}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleStatus(item.id)}
                    className={`rounded-full px-3 py-1 text-xs font-black ${
                      item.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {item.active ? "Aktif" : "Nonaktif"}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-2 py-1 text-xs font-black text-rose-700"
                  >
                    <Trash2 size={12} />
                    Hapus
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {item.summary}
              </p>
            </div>
          ))}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
