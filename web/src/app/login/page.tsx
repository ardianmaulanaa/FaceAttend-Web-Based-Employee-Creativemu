import Image from "next/image";
import Link from "next/link";
import MobileShell from "@/components/MobileShell";

export default function LoginPage() {
  return (
    <MobileShell variant="auth" withBottomPadding={false}>
      <section className="relative min-h-screen w-full overflow-hidden bg-[#f6f8ff]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,138,0,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(18,60,140,0.18),transparent_36%)]" />

        <div className="relative z-10 grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
          {/* LEFT CONTENT */}
          <div className="relative flex flex-col px-6 py-7 md:px-12 lg:justify-between lg:px-20 lg:py-14">
            {/* Background logo desktop */}
            <Image
              src="/images/creativemu-logo/creativemu.png"
              alt="Creativemu Background Logo"
              width={620}
              height={620}
              className="pointer-events-none absolute -left-20 top-1/2 hidden -translate-y-1/2 opacity-[0.045] lg:block"
              priority
            />

            {/* Background logo mobile */}
            <Image
              src="/images/creativemu-logo/creativemu.png"
              alt="Creativemu Background Logo"
              width={300}
              height={300}
              className="pointer-events-none absolute -right-20 top-24 opacity-[0.04] lg:hidden"
              priority
            />

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-xl shadow-slate-300/60 md:h-14 md:w-14">
                  <Image
                    src="/images/creativemu-logo/creativemu.png"
                    alt="Creativemu Logo"
                    width={56}
                    height={56}
                    className="h-full w-full object-contain"
                    priority
                  />
                </div>

                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-950 md:text-2xl">
                    Creativemu
                  </h1>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 md:text-xs">
                    Employee Attendance System
                  </p>
                </div>
              </div>

              <div className="mt-14 max-w-2xl md:mt-16 lg:mt-28">
                <p className="text-xs font-black uppercase tracking-[0.35em] text-[#ff8a00] md:text-sm">
                  Welcome Back
                </p>

                <h2 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight md:mt-5 md:text-6xl">
                    <span className="typewriter-title">Smart Attendance</span>
                </h2>

                <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:mt-6 md:text-base md:leading-8">
                  Sistem absensi digital untuk karyawan Creativemu dengan
                  verifikasi wajah, riwayat kehadiran, dan pengelolaan data
                  absensi yang lebih cepat dan terintegrasi.
                </p>
              </div>
            </div>

            <div className="relative z-10 mt-10 hidden text-sm font-semibold text-slate-400 lg:block">
              © 2026 FaceAttend for Creativemu
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="flex items-start justify-center px-6 pb-8 pt-2 md:px-12 md:pb-12 lg:items-center lg:bg-white/35 lg:px-20 lg:py-14 lg:backdrop-blur-xl">
            <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-2xl shadow-slate-300/60 backdrop-blur-2xl md:p-8">
              <div className="mb-7 md:mb-8">
                <h3 className="text-3xl font-black tracking-tight text-slate-950">
                  Sign In
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Gunakan akun karyawan atau admin untuk masuk ke sistem.
                </p>
              </div>

              <label className="text-sm font-black text-slate-700">
                Email
              </label>
              <input
                type="email"
                placeholder="employee@company.com"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#123c8c] focus:bg-white"
              />

              <label className="mt-5 block text-sm font-black text-slate-700">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold outline-none transition focus:border-[#123c8c] focus:bg-white"
              />

              <Link
                href="/home"
                className="mt-6 block rounded-2xl bg-[#123c8c] px-5 py-4 text-center text-sm font-black text-white shadow-xl shadow-blue-900/25 transition active:scale-[0.98]"
              >
                Sign In
              </Link>

              <Link
                href="/admin/dashboard"
                className="mt-3 block rounded-2xl bg-[#fff4e6] px-5 py-4 text-center text-sm font-black text-[#ff8a00] transition active:scale-[0.98]"
              >
                Masuk sebagai Admin Demo
              </Link>
            </div>
          </div>

          <div className="px-6 pb-6 text-xs font-semibold text-slate-400 lg:hidden">
            © 2026 FaceAttend for Creativemu
          </div>
        </div>
      </section>
    </MobileShell>
  );
}