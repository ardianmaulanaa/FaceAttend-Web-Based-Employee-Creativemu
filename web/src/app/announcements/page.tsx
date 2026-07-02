"use client";

import { Download, Eye, Megaphone } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const announcements = [
  {
    id: "ann-001",
    title: "Pengumuman Lokasi Presensi Juli 2026",
    summary:
      "Aturan terbaru lokasi WFA/onsite, WFH, serta pengajuan cuti/sakit.",
    fileUrl: "/announcements/pengumuman-jadwal-juli-2026.txt",
    fileName: "pengumuman-jadwal-juli-2026.txt",
    publishedAt: "01 Juli 2026",
  },
  {
    id: "ann-002",
    title: "Template Surat Cuti",
    summary: "Gunakan format ini untuk pengajuan cuti resmi.",
    fileUrl: "/announcements/template-surat-cuti.txt",
    fileName: "template-surat-cuti.txt",
    publishedAt: "01 Juli 2026",
  },
  {
    id: "ann-003",
    title: "Template Surat Sakit",
    summary: "Gunakan format ini untuk pengajuan sakit dengan lampiran.",
    fileUrl: "/announcements/template-surat-sakit.txt",
    fileName: "template-surat-sakit.txt",
    publishedAt: "01 Juli 2026",
  },
];

export default function AnnouncementsPage() {
  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Pengumuman"
        subtitle="Baca dan download pengumuman resmi perusahaan"
        rightLabel="INFO"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <Megaphone size={26} strokeWidth={2.6} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Official Board
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                Pengumuman Karyawan
              </h2>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
            Semua dokumen dapat dibaca langsung dari browser atau diunduh untuk
            kebutuhan administrasi. Gunakan menu ini untuk cek aturan lokasi,
            mode WFA/WFH, dan format surat cuti/sakit.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {announcements.map((item) => (
            <article
              key={item.id}
              className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                {item.publishedAt}
              </p>
              <h3 className="mt-2 text-lg font-black text-slate-950">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {item.summary}
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {item.id === "ann-001" && (
                  <>
                    <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-[11px] font-black text-[#123c8c]">
                      Lokasi WFA/Onsite
                    </span>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                      WFH
                    </span>
                  </>
                )}
                {item.id === "ann-002" && (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                    Surat Cuti
                  </span>
                )}
                {item.id === "ann-003" && (
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-black text-rose-700">
                    Surat Sakit
                  </span>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <a
                  href={item.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                >
                  <Eye size={14} />
                  Baca
                </a>

                <a
                  href={item.fileUrl}
                  download={item.fileName}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#123c8c] px-3 py-2 text-xs font-black text-white"
                >
                  <Download size={14} />
                  Download
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
