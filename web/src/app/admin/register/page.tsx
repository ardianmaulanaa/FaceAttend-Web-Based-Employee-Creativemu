import { ClipboardList, ImagePlus, ShieldCheck, UserRound } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

export default function RegisterFacePage() {
  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Attendance Form Setup"
        subtitle="Panduan lampiran bukti absensi karyawan"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        {/* INTRO SECTION */}
        <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <div className="bg-[#123c8c] p-6 text-white md:p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/15">
                  <ClipboardList size={28} strokeWidth={2.6} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                    Attendance Evidence
                  </p>

                  <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                    Employee Submission Setup
                  </h2>
                </div>
              </div>

              <p className="mt-5 max-w-xl text-sm leading-7 text-blue-100">
                Sistem tidak lagi memakai scan wajah. Karyawan akan mengirim
                formulir absensi dengan bukti foto dan catatan tertulis.
              </p>
            </div>

            <div className="grid gap-3 p-5 md:grid-cols-3 md:p-6">
              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <UserRound className="text-[#123c8c]" size={24} />

                <h3 className="mt-3 text-sm font-black text-slate-950">
                  Pilih Karyawan
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Tentukan karyawan yang akan didaftarkan wajahnya.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <Camera className="text-[#123c8c]" size={24} />

                <h3 className="mt-3 text-sm font-black text-slate-950">
                  Lampiran Bukti
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Karyawan memilih foto bukti seperti upload Google Form.
                </p>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <ShieldCheck className="text-[#123c8c]" size={24} />

                <h3 className="mt-3 text-sm font-black text-slate-950">
                  Simpan Data
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Yang dicatat ke data absensi adalah keterangan tertulis dan
                  nama file bukti.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* EMPLOYEE PANEL */}
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
              Employee Data
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              Select Employee
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Pilih karyawan sebelum melakukan pendaftaran wajah.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-black text-slate-700">
                  Employee
                </label>

                <select className="mt-2 w-full rounded-2xl border border-blue-100 bg-[#f6f8ff] px-4 py-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:bg-white">
                  <option>Muhammad Ardian Maulana - EMP001</option>
                  <option>Budi Santoso - EMP002</option>
                  <option>Siti Rahma - EMP003</option>
                </select>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-lg font-black text-white">
                    AM
                  </div>

                  <div>
                    <h3 className="font-black text-slate-950">
                      Muhammad Ardian Maulana
                    </h3>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      EMP001 • IT Department
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-blue-100 bg-white p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-[#123c8c]"
                  />

                  <div>
                    <p className="text-sm font-black text-slate-950">
                      Registration Status
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Wajah karyawan belum didaftarkan. Silakan aktifkan kamera
                      dan lakukan capture wajah.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-[#eaf1ff] p-4">
                <p className="text-sm font-black text-[#123c8c]">
                  Catatan Admin
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Fitur ini hanya digunakan untuk pendaftaran wajah awal atau
                  pembaruan data wajah karyawan.
                </p>
              </div>
            </div>
          </div>

          {/* CAMERA PANEL */}
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
                  Camera Preview
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  Face Capture Area
                </h2>
              </div>

              <span className="w-fit rounded-full bg-[#eaf1ff] px-4 py-2 text-xs font-black text-[#123c8c]">
                Waiting for camera
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
                  Camera is not active yet
                </p>

                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Kamera akan aktif saat integrasi API dan browser permission.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <button className="rounded-2xl border border-blue-100 bg-[#f6f8ff] px-5 py-4 text-sm font-black text-[#123c8c] transition hover:bg-[#eaf1ff] active:scale-[0.98]">
                Activate Camera
              </button>

              <button className="rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3478] active:scale-[0.98]">
                Register Employee Face
              </button>
            </div>

            <p className="mt-4 text-center text-xs font-semibold leading-5 text-slate-400">
              Pastikan wajah menghadap lurus, pencahayaan cukup, dan tidak
              tertutup masker atau aksesoris.
            </p>
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
