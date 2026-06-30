import {
  Camera,
  CheckCircle2,
  Clock3,
  ScanFace,
  ShieldCheck,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

export default function AttendancePage() {
  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Face Scan"
        subtitle="Verifikasi wajah untuk check-in atau check-out"
        rightLabel="EMP001"
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                Camera
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Face Verification
              </h2>
            </div>

            <span className="rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black text-[#123c8c]">
              Standby
            </span>
          </div>

          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-3xl bg-slate-950 text-center text-white">
            <div className="absolute inset-6 rounded-3xl border border-white/15" />

            <div className="absolute left-7 top-7 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-blue-300" />
            <div className="absolute right-7 top-7 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-blue-300" />
            <div className="absolute bottom-7 left-7 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-blue-300" />
            <div className="absolute bottom-7 right-7 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-blue-300" />

            <div className="relative z-10 px-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl">
                <Camera size={42} />
              </div>

              <p className="mt-5 text-sm font-black text-white">
                Camera Preview
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                Kamera akan aktif saat integrasi browser dan API.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <ScanFace size={26} strokeWidth={2.6} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Attendance Verification
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  Ready to Scan
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-blue-100">
              Pastikan wajah terlihat jelas, pencahayaan cukup, dan posisi
              kamera menghadap lurus sebelum melakukan absensi.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button className="rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98]">
              Check-in
            </button>

            <button className="rounded-2xl border border-blue-100 bg-white px-5 py-4 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition hover:bg-[#f6f8ff] active:scale-[0.98]">
              Check-out
            </button>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
              Verification Status
            </p>

            <div className="mt-4 flex items-start gap-4 rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <CheckCircle2
                size={24}
                className="mt-0.5 shrink-0 text-[#123c8c]"
              />

              <div>
                <h3 className="font-black text-slate-950">
                  Waiting for Scan
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Sistem akan mencocokkan wajah dengan data yang sudah
                  didaftarkan oleh admin.
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
                  Face Status
                </p>
                <p className="mt-1 text-sm text-slate-500">Registered</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}