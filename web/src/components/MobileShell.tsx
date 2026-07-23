"use client";

import { ReactNode } from "react";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";

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
  const companyLogo = useCompanyLogo();
  const bottomPaddingClass = withBottomPadding ? "pb-24 md:pb-0" : "";

  const backgroundGlow =
    variant === "admin"
      ? "from-[#f6f8ff] via-white to-[#eef4ff] dark:from-[#0d1117] dark:via-[#161b22] dark:to-[#0d1117]"
      : "from-white via-[#f8fbff] to-[#eef4ff] dark:from-[#0d1117] dark:via-[#090c10] dark:to-[#0d1117]";

  return (
    <div
      className={`relative min-h-dvh overflow-x-hidden bg-gradient-to-br ${backgroundGlow} ${bottomPaddingClass} ${className}`}
    >
      {/* Decorative Glow Circles and Watermark behind content (z-0) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <div
          className="universal-watermark absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 bg-contain bg-center bg-no-repeat blur-[2px] md:h-[440px] md:w-[440px] lg:h-[520px] lg:w-[520px]"
          style={{
            backgroundImage: `url('${companyLogo}')`,
          }}
        />
        <div className="absolute left-1/2 top-1/2 h-[620px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/20 dark:bg-blue-900/5 blur-3xl md:h-[820px] md:w-[820px]" />
      </div>

      <div className="relative z-10 min-h-dvh">{children}</div>
    </div>
  );
}

