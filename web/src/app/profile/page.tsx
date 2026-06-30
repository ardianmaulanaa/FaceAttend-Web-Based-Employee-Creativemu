import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

export default function ProfilePage() {
  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Profile"
        subtitle="Informasi akun karyawan"
        rightLabel="EMP001"
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.85fr_1.15fr] lg:px-16">
        <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-center text-white shadow-xl shadow-blue-900/20">
            <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-3xl bg-white text-4xl font-black text-[#123c8c]">
              AM
            </div>

            <h2 className="mt-5 text-2xl font-black">
              Muhammad Ardian Maulana
            </h2>

            <p className="mt-1 text-sm font-semibold text-blue-100">
              EMP001 • IT Department
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black text-white">
              <BadgeCheck size={18} />
              Face Registered
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Employee ID
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">EMP001</p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-[#f6f8ff] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                Account Status
              </p>
              <p className="mt-2 text-lg font-black text-slate-950">Active</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <UserRound size={26} strokeWidth={2.6} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                  Employee Account
                </p>
                <h2 className="mt-1 text-3xl font-black tracking-tight">
                  Account Information
                </h2>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-blue-100">
              Data akun digunakan untuk login, identifikasi karyawan, dan
              pencatatan absensi berbasis verifikasi wajah.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Mail size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Email</p>
              <p className="mt-1 font-black text-slate-950">
                employee@company.com
              </p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <Building2 size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Department
              </p>
              <p className="mt-1 font-black text-slate-950">IT Department</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <ShieldCheck size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">Role</p>
              <p className="mt-1 font-black text-slate-950">Employee</p>
            </div>

            <div className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-slate-200/60">
              <CalendarDays size={23} className="text-[#123c8c]" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Work Schedule
              </p>
              <p className="mt-1 font-black text-slate-950">08:00 - 17:00</p>
            </div>
          </div>

          <div className="rounded-3xl border border-blue-100 bg-[#f6f8ff] p-5">
            <p className="text-sm font-black text-[#123c8c]">
              Face Verification
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Wajah karyawan sudah terdaftar dan dapat digunakan untuk proses
              check-in serta check-out melalui halaman attendance.
            </p>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}