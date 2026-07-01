"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ScanFace,
  History,
  UserRound,
  LayoutDashboard,
  UsersRound,
  ClipboardList,
  LogOut,
  Megaphone,
} from "lucide-react";

type BottomNavProps = {
  variant?: "employee" | "admin";
};

const employeeMenus = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/attendance", label: "Attend", icon: ScanFace },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

const adminMenus = [
  { href: "/admin/dashboard", label: "Dash", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Staff", icon: UsersRound },
  { href: "/admin/monitor_perusahaan", label: "Reports", icon: ClipboardList },
  { href: "/admin/pengumuman", label: "Info", icon: Megaphone },
];

export default function BottomNav({ variant = "employee" }: BottomNavProps) {
  const pathname = usePathname();
  const menus = variant === "admin" ? adminMenus : employeeMenus;

  return (
    <nav className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-[2rem] border border-white/70 bg-white/90 px-3 py-3 shadow-2xl shadow-slate-300/60 backdrop-blur-2xl md:hidden">
      <div className="grid grid-cols-4 gap-2">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const active =
            pathname === menu.href || pathname.startsWith(`${menu.href}/`);

          return (
            <Link
              key={menu.href}
              href={menu.href}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-[1.5rem] px-2 py-3 text-xs font-black transition-all duration-300 ${
                active
                  ? "bg-[#123c8c] text-white shadow-xl shadow-blue-900/30"
                  : "text-slate-400 hover:bg-[#eaf1ff] hover:text-[#123c8c]"
              }`}
            >
              {active && (
                <span className="absolute -top-3 h-1.5 w-10 rounded-full bg-[#7dbbff]" />
              )}

              <Icon size={24} strokeWidth={2.7} />
              <span>{menu.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}