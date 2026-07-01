"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  UserRound,
  LayoutDashboard,
  Layers3,
  UsersRound,
  Wallet,
  Megaphone,
  LogOut,
} from "lucide-react";

type BottomNavProps = {
  variant?: "employee" | "admin";
};

const employeeMenus = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/attendance", label: "Attend", icon: ClipboardList },
  { href: "/salary", label: "Salary", icon: Wallet },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/announcements", label: "Info", icon: Megaphone },
];

const adminMenus = [
  { href: "/admin/dashboard", label: "Dash", icon: LayoutDashboard },
  { href: "/admin/employees", label: "Staff", icon: UsersRound },
  { href: "/admin/master-data", label: "Master", icon: Layers3 },
  { href: "/admin/reports", label: "Reports", icon: ClipboardList },
  { href: "/login", label: "Logout", icon: LogOut },
];

export default function BottomNav({ variant = "employee" }: BottomNavProps) {
  const pathname = usePathname();
  const menus = variant === "admin" ? adminMenus : employeeMenus;

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full px-4 pb-4 md:hidden">
      <div className="mx-auto max-w-[430px] rounded-[2rem] border border-white/70 bg-white/90 p-2 shadow-2xl shadow-slate-300/70 backdrop-blur-2xl">
        <div className="grid grid-cols-5 gap-1">
          {menus.map((menu) => {
            const active = pathname === menu.href;
            const Icon = menu.icon;

            return (
              <Link
                key={menu.href}
                href={menu.href}
                className={`group relative flex flex-col items-center justify-center rounded-[1.4rem] px-2 py-3 text-[11px] transition-all duration-300 active:scale-[0.96] ${
                  active
                    ? "bg-[#123c8c] text-white shadow-lg shadow-blue-900/25"
                    : "text-slate-400 hover:bg-slate-100 hover:text-[#123c8c]"
                }`}
              >
                {active && (
                  <span className="absolute -top-1 h-1 w-7 rounded-full bg-blue-300" />
                )}

                <Icon
                  size={21}
                  strokeWidth={active ? 2.8 : 2.2}
                  className={`transition-all duration-300 ${
                    active ? "scale-110" : "group-hover:-translate-y-0.5"
                  }`}
                />

                <span className="mt-1 font-black">{menu.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
