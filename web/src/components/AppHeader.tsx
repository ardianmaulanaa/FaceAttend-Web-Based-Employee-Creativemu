"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
  rightLabel?: string;
  variant?: "employee" | "admin";
};

const employeeNav = [
  { href: "/home", label: "Home" },
  { href: "/attendance", label: "Attendance" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

const adminNav = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/employees", label: "Employees" },
  { href: "/admin/reports", label: "Reports" },
];

export default function AppHeader({
  title,
  subtitle,
  variant = "employee",
}: AppHeaderProps) {
  const pathname = usePathname();
  const menus = variant === "admin" ? adminNav : employeeNav;

  return (
    <header className="sticky top-0 z-30 overflow-hidden border-b border-white/60 bg-white/85 px-5 py-4 shadow-sm shadow-slate-200/40 backdrop-blur-2xl md:px-10 lg:px-16">
      <Image
        src="/images/creativemu-logo/creativemu.png"
        alt="Creativemu Background Logo"
        width={190}
        height={190}
        className="pointer-events-none absolute right-10 top-1/2 hidden h-auto -translate-y-1/2 opacity-[0.04] md:block"
        priority
      />

      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg shadow-slate-300/50">
            <Image
              src="/images/creativemu-logo/creativemu.png"
              alt="Creativemu Logo"
              width={48}
              height={48}
              className="h-full w-full object-contain"
              priority
            />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#123c8c]">
              FaceAttend
            </p>

            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              {title}
            </h1>

            {subtitle && (
              <p className="mt-1 max-w-[320px] text-sm leading-5 text-slate-500 md:max-w-xl">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <nav className="hidden items-center justify-center gap-2 md:flex">
          {menus.map((menu) => {
            const active = pathname === menu.href;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`rounded-2xl px-4 py-2 text-sm font-black transition-all duration-300 ${
                  active
                    ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20"
                    : "text-slate-500 hover:bg-slate-100 hover:text-[#123c8c]"
                }`}
              >
                {menu.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center justify-end md:flex">
          <Link
            href="/login"
            className="rounded-2xl bg-[#eaf1ff] px-5 py-2.5 text-xs font-black text-[#123c8c] transition hover:bg-[#dceaff] active:scale-[0.98]"
          >
            Logout
          </Link>
        </div>
      </div>
    </header>
  );
}
