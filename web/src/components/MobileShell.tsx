"use client";

import { ReactNode } from "react";

type MobileShellProps = {
  children: ReactNode;
  variant?: "employee" | "admin" | "auth";
  withBottomPadding?: boolean;
  className?: string;
};

export default function MobileShell({
  children,
  variant = "employee",
  withBottomPadding = true,
  className = "",
}: MobileShellProps) {
  const bottomPaddingClass = withBottomPadding ? "pb-24 md:pb-0" : "";

  const backgroundGlow =
    variant === "admin"
      ? "from-[#f6f8ff] via-white to-[#eef4ff]"
      : "from-white via-[#f8fbff] to-[#eef4ff]";

  return (
    <div
      className={`relative min-h-dvh overflow-hidden bg-gradient-to-br ${backgroundGlow} ${bottomPaddingClass} ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat opacity-[0.075] blur-[2px] md:h-[760px] md:w-[760px] lg:h-[860px] lg:w-[860px]"
          style={{
            backgroundImage: "url('/images/creativemu-logo/creativemu.png')",
          }}
        />

        <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/20 blur-3xl md:h-[820px] md:w-[820px]" />
      </div>

      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}
