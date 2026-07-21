"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarCheck,
  History,
  Home,
  Megaphone,
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
  { href: "/home", label: "Beranda", icon: Home },
  { href: "/attendance", label: "Presensi", icon: CalendarCheck },
  { href: "/pengumuman", label: "Pengumuman", icon: Megaphone },
  { href: "/history", label: "Riwayat", icon: History },
  { href: "/profile", label: "Profil", icon: UserRound },
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

function BottomNavMotionStyles() {
  return (
    <style>{`
      @keyframes bottomNavShellIn {
        0% {
          opacity: 0;
          transform: translateY(18px) scale(0.98);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes bottomNavActiveBar {
        0% {
          transform: scaleX(0.45);
        }

        100% {
          transform: scaleX(1);
        }
      }

      @keyframes bottomNavIconPop {
        0% {
          transform: scale(0.94);
        }

        60% {
          transform: scale(1.08);
        }

        100% {
          transform: scale(1);
        }
      }

      .bottom-nav-shell-in {
        animation: bottomNavShellIn 300ms ease-out both;
      }

      .bottom-nav-active-bar {
        transform-origin: center;
        animation: bottomNavActiveBar 220ms ease-out both;
      }

      .bottom-nav-icon-pop {
        animation: bottomNavIconPop 240ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .bottom-nav-shell-in,
        .bottom-nav-active-bar,
        .bottom-nav-icon-pop {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
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
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-[4.05rem] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-[1.25rem] text-[11px] font-black transition-all duration-300 active:scale-[0.96]",
        active
          ? "bg-[#123c8c] text-white shadow-xl shadow-blue-900/25"
          : "text-slate-400 hover:bg-[#f6f8ff] hover:text-[#123c8c]",
      )}
    >
      {active ? (
        <span className="bottom-nav-active-bar absolute -top-1.5 h-1.5 w-11 rounded-full bg-blue-300" />
      ) : null}

      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition duration-300",
          active ? "bottom-nav-icon-pop bg-white/15" : "bg-transparent",
        )}
      >
        <Icon
          size={24}
          strokeWidth={active ? 2.8 : 2.5}
          className={cn(
            "block shrink-0 transition duration-300",
            active ? "text-white" : "text-slate-400",
          )}
        />
      </div>

      <span className="block max-w-full truncate leading-none">{label}</span>
    </Link>
  );
}

export default function BottomNav({ variant = "employee" }: BottomNavProps) {
  const pathname = usePathname();

  if (variant === "admin") return null;

  return (
    <>
      <BottomNavMotionStyles />

      <div
        aria-hidden="true"
        className="h-[calc(5.8rem+env(safe-area-inset-bottom))] shrink-0 md:hidden"
      />

      <nav className="fixed bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-1/2 z-50 w-[calc(100%-2rem)] max-w-[35rem] -translate-x-1/2 md:hidden">
        <div className="bottom-nav-shell-in overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 px-2.5 py-2.5 shadow-2xl shadow-slate-400/25 backdrop-blur-2xl">
          <div className="grid w-full grid-cols-5 gap-1.5">
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
