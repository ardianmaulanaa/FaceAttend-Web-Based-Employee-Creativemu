"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  Home,
  ScanFace,
  UserRound,
  type LucideIcon,
} from "lucide-react";

type BottomNavProps = {
  variant?: "employee" | "admin";
};

type MenuItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const menus: MenuItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/attendance", label: "Attend", icon: ScanFace },
  { href: "/history", label: "History", icon: History },
  { href: "/profile", label: "Profile", icon: UserRound },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function isActive(pathname: string, href: string) {
  if (href === "/home") return pathname === "/" || pathname === "/home";

  if (href === "/history") {
    return pathname === "/history" || pathname.startsWith("/history/");
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  active,
  Icon,
}: {
  href: string;
  label: string;
  active: boolean;
  Icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "relative flex h-[4.05rem] flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[11px] font-black transition-all duration-300 active:scale-[0.96]",
        active
          ? "bg-[#123c8c] text-white shadow-xl shadow-blue-900/25"
          : "text-slate-400 hover:bg-[#f6f8ff] hover:text-[#123c8c]"
      )}
    >
      {active ? (
        <span className="absolute -top-1.5 h-1.5 w-11 rounded-full bg-blue-300" />
      ) : null}

      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-xl transition",
          active ? "bg-white/15" : "bg-transparent"
        )}
      >
        <Icon
          size={24}
          strokeWidth={active ? 2.8 : 2.5}
          className={active ? "text-white" : "text-slate-400"}
        />
      </div>

      <span className="leading-none">{label}</span>
    </Link>
  );
}

export default function BottomNav({ variant = "employee" }: BottomNavProps) {
  const pathname = usePathname();

  if (variant === "admin") return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="h-[calc(5.8rem+env(safe-area-inset-bottom))] shrink-0 md:hidden"
      />

      <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[32rem] -translate-x-1/2 md:hidden">
        <div className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 px-2.5 py-2.5 shadow-2xl shadow-slate-400/25 backdrop-blur-2xl">
          <div className="grid grid-cols-4 gap-2">
            {menus.map((menu) => (
              <NavItem
                key={menu.href}
                href={menu.href}
                label={menu.label}
                Icon={menu.icon}
                active={isActive(pathname, menu.href)}
              />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}
