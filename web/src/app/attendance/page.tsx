"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  FileImage,
  Send,
  ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

export default function AttendancePage() {
  const { authUser, markAttendance } = useAppData();
  const [attendanceType, setAttendanceType] = useState<
    "check-in" | "check-out"
  >("check-in");
  const [evidenceName, setEvidenceName] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("Form absensi siap dikirim.");

  const submissionSummary = useMemo(() => {
    if (!authUser) return "Belum login";
    return `${authUser.name} • ${authUser.email} • ${authUser.department}`;
  }, [authUser]);

  if (!authUser) return null;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setEvidenceName(file?.name ?? "");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = markAttendance(attendanceType, {
      location: {
        cityId: authUser.cityId,
        villageId: authUser.villageId,
      },
      imageDataUrl: evidenceName
        ? `evidence:${evidenceName};note:${notes}`
        : undefined,
    });

    setMessage(result.message);
  };

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Attendance Form"
        subtitle="Formulir absensi dengan bukti foto dan catatan"
        rightLabel={authUser.id}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Bukti Lampiran
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Upload Foto Kehadiran
              </h2>
            </div>

            <span className="rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black text-[#123c8c]">
              Form Ready
            </span>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-[#f6f8ff] p-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[#eaf1ff] text-[#123c8c]">
              <FileImage size={34} strokeWidth={2.6} />
            </div>
            <p className="mt-4 text-sm font-black text-slate-950">
              Google Form Style
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Kirim bukti foto seperti form upload. Yang dicatat ke data absensi
              adalah nama file dan keterangan tertulis, bukan pemindaian wajah.
            </p>
            <div className="mt-4 rounded-2xl border border-blue-100 bg-white p-4 text-sm font-semibold text-slate-600">
              {evidenceName || "Belum ada file dipilih"}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Send size={26} strokeWidth={2.6} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Attendance Submission
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  Ready to Submit
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-blue-100">
              Lengkapi form seperti Google Form, pilih tipe absensi, tambahkan
              bukti foto, lalu kirim sebagai catatan tertulis ke data absensi.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6"
          >
            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4 text-sm font-semibold text-slate-600">
              {submissionSummary}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  Jenis Absensi
                </label>
                <select
                  value={attendanceType}
                  onChange={(event) =>
                    setAttendanceType(
                      event.target.value as "check-in" | "check-out",
                    )
                  }
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-[#123c8c]"
                >
                  <option value="check-in">Check-in</option>
                  <option value="check-out">Check-out</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                  Upload Bukti Foto
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Catatan Tertulis
              </label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Contoh: hadir onsite, lampiran foto meja kerja, atau bukti lokasi kerja"
                className="min-h-28 w-full rounded-2xl border border-blue-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#123c8c]"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98]"
            >
              Kirim Form Absensi
            </button>
          </form>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
              Submission Status
            </p>

            <div className="mt-4 flex items-start gap-4 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <CheckCircle2
                size={24}
                className="mt-0.5 shrink-0 text-[#123c8c]"
              />

              <div>
                <h3 className="font-black text-slate-950">Form Attendance</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {message}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <Clock3 size={22} className="text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Jam Kerja
                </p>
                <p className="mt-1 text-sm text-slate-500">08:00 - 17:00</p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <ShieldCheck size={22} className="text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Bukti Absensi
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Foto + catatan teks
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
