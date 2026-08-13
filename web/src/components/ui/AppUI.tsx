"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type React from "react";
import { useSiteLogo } from "@/hooks/useSiteLogo";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "soft";
type Size = "sm" | "md" | "lg";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--app-primary,#123c8c)] text-white shadow-lg shadow-blue-900/20 hover:bg-[var(--app-primary-hover,#0f347a)]",
  secondary:
    "border border-blue-100 bg-white text-[var(--app-primary-text,#123c8c)] shadow-sm hover:bg-[var(--app-primary-soft,#eaf1ff)]",
  danger: "bg-rose-50 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-100",
  ghost: "bg-transparent text-[var(--app-primary-text,#123c8c)] hover:bg-[var(--app-primary-soft,#eaf1ff)]",
  soft: "bg-[var(--app-primary-soft,#eaf1ff)] text-[var(--app-primary-text,#123c8c)] ring-1 ring-blue-100 hover:bg-[var(--app-primary-subtle,#f8fbff)]",
};

const buttonSizeClass: Record<Size, string> = {
  sm: "min-h-10 rounded-xl px-4 py-2 text-xs",
  md: "min-h-12 rounded-2xl px-5 py-3 text-sm",
  lg: "min-h-14 rounded-2xl px-6 py-4 text-base",
};

type PressAnimationOptions = {
  duration?: number;
  actionDelayMs?: number;
};

function usePressAnimation<T extends HTMLElement>(
  onClick?: React.MouseEventHandler<T>,
  disabled?: boolean,
  options?: PressAnimationOptions,
) {
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const actionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const duration = options?.duration ?? 260;
  const actionDelayMs = options?.actionDelayMs ?? 0;

  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, []);

  function handleClick(event: React.MouseEvent<T>) {
    if (disabled) return;

    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }

    setIsAnimating(false);

    requestAnimationFrame(() => {
      setIsAnimating(true);
    });

    animationTimeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
    }, duration);

    if (!onClick) return;

    if (actionDelayMs > 0) {
      actionTimeoutRef.current = setTimeout(() => {
        onClick(event);
      }, actionDelayMs);

      return;
    }

    onClick(event);
  }

  return {
    isAnimating,
    handleClick,
  };
}

function AppInteractionStyles() {
  return (
    <style>{`
      @keyframes appSoftPress {
        0% {
          transform: scale(1);
        }

        50% {
          transform: scale(0.985);
        }

        100% {
          transform: scale(1);
        }
      }

      @keyframes appSoftIconPress {
        0% {
          transform: scale(1);
        }

        50% {
          transform: scale(0.94);
        }

        100% {
          transform: scale(1);
        }
      }

      @keyframes appSoftShine {
        0% {
          transform: translateX(-120%);
          opacity: 0;
        }

        45% {
          opacity: 0.9;
        }

        100% {
          transform: translateX(120%);
          opacity: 0;
        }
      }

      @keyframes appPageEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes appSkeletonEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes appModalBackdropEnter {
        0% {
          opacity: 0;
        }

        100% {
          opacity: 1;
        }
      }

      @keyframes appModalPanelEnter {
        0% {
          opacity: 0;
          transform: translateY(16px) scale(0.985);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes appFormRevealEnter {
        0% {
          opacity: 0;
          transform: translateY(8px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes appBrandLoaderPulse {
        0%,
        100% {
          transform: scale(0.96);
          opacity: 0.82;
        }

        50% {
          transform: scale(1);
          opacity: 1;
        }
      }

      @keyframes appBrandLoaderScan {
        0%,
        100% {
          transform: translateY(-1.35rem);
          opacity: 0;
        }

        18%,
        82% {
          opacity: 1;
        }

        50% {
          transform: translateY(1.35rem);
          opacity: 1;
        }
      }

      .app-button-press-active {
        animation: appSoftPress 260ms ease-out;
      }

      .app-icon-press-active {
        animation: appSoftIconPress 260ms ease-out;
      }

      .app-button-shine-active {
        animation: appSoftShine 360ms ease-out;
      }

      .app-page-enter {
        animation: appPageEnter 320ms ease-out both;
        transform-origin: top center;
      }

      .app-page-fade {
        animation: appPageEnter 260ms ease-out both;
        transform-origin: top center;
      }

      .app-skeleton-enter {
        animation: appSkeletonEnter 260ms ease-out both;
        transform-origin: top center;
      }

      .app-modal-backdrop-enter {
        animation: appModalBackdropEnter 180ms ease-out both;
      }

      .app-modal-panel-enter {
        animation: appModalPanelEnter 260ms ease-out both;
        transform-origin: center bottom;
      }

      .app-form-reveal-enter {
        animation: appFormRevealEnter 240ms ease-out both;
      }

      .app-brand-loader-pulse {
        animation: appBrandLoaderPulse 1.9s ease-in-out infinite;
      }

      .app-brand-loader-scan {
        animation: appBrandLoaderScan 2.15s ease-in-out infinite;
      }

      .app-field-smooth {
        transition:
          border-color 180ms ease,
          background-color 180ms ease,
          box-shadow 180ms ease;
      }

      @media (prefers-reduced-motion: reduce) {
        .app-button-press-active,
        .app-icon-press-active,
        .app-button-shine-active,
        .app-page-enter,
        .app-page-fade,
        .app-skeleton-enter,
        .app-modal-backdrop-enter,
        .app-modal-panel-enter,
        .app-form-reveal-enter,
        .app-brand-loader-pulse,
        .app-brand-loader-scan {
          animation: none !important;
        }
      }
    `}</style>
  );
}

type AppButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
  pressAnimation?: boolean;
  iconAnimation?: boolean;
  actionDelayMs?: number;
};

export function AppButton({
  children,
  className,
  variant = "primary",
  size = "md",
  full = false,
  leftIcon,
  rightIcon,
  disabled,
  loading = false,
  loadingText = "Memuat...",
  pressAnimation = false,
  iconAnimation = false,
  actionDelayMs = 0,
  onClick,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  const { isAnimating, handleClick } = usePressAnimation<HTMLButtonElement>(
    onClick,
    isDisabled,
    {
      duration: 260,
      actionDelayMs,
    },
  );

  return (
    <>
      <AppInteractionStyles />

      <button
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap overflow-hidden font-black transition duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
          buttonVariantClass[variant],
          buttonSizeClass[size],
          full && "w-full",
          loading && "scale-[0.99]",
          pressAnimation && isAnimating && "app-button-press-active",
          className,
        )}
        {...props}
      >
        {pressAnimation ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0",
              isAnimating && "app-button-shine-active",
            )}
          />
        ) : null}

        {loading ? (
          <span className="relative z-10 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : leftIcon ? (
          <span
            className={cn(
              "relative z-10 inline-flex items-center justify-center",
              iconAnimation && isAnimating && "app-icon-press-active",
            )}
          >
            {leftIcon}
          </span>
        ) : null}

        <span className="relative z-10 inline-flex flex-row items-center justify-center gap-2 whitespace-nowrap">
          {loading ? loadingText : children}
        </span>

        {!loading && rightIcon ? (
          <span
            className={cn(
              "relative z-10 inline-flex items-center justify-center",
              iconAnimation && isAnimating && "app-icon-press-active",
            )}
          >
            {rightIcon}
          </span>
        ) : null}
      </button>
    </>
  );
}

type AppIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "lg";
  pressAnimation?: boolean;
  actionDelayMs?: number;
};

export function AppIconButton({
  children,
  className,
  variant = "soft",
  size = "md",
  disabled,
  pressAnimation = true,
  actionDelayMs = 0,
  onClick,
  ...props
}: AppIconButtonProps) {
  const { isAnimating, handleClick } = usePressAnimation<HTMLButtonElement>(
    onClick,
    disabled,
    {
      duration: 260,
      actionDelayMs,
    },
  );

  return (
    <>
      <AppInteractionStyles />

      <button
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative inline-flex shrink-0 items-center justify-center overflow-hidden font-black transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
          buttonVariantClass[variant],
          size === "lg" ? "h-14 w-14 rounded-2xl" : "h-12 w-12 rounded-2xl",
          pressAnimation && isAnimating && "app-button-press-active",
          className,
        )}
        {...props}
      >
        {pressAnimation ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0",
              isAnimating && "app-button-shine-active",
            )}
          />
        ) : null}

        <span
          className={cn(
            "relative z-10 inline-flex items-center justify-center",
            pressAnimation && isAnimating && "app-icon-press-active",
          )}
        >
          {children}
        </span>
      </button>
    </>
  );
}

type AppAnimatedActionButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    icon?: React.ReactNode;
    title: string;
    subtitle?: string;
    loading?: boolean;
    loadingTitle?: string;
    full?: boolean;
    fullOnMobile?: boolean;
    actionDelayMs?: number;
  };

export function AppAnimatedActionButton({
  icon,
  title,
  subtitle,
  loading = false,
  loadingTitle = "Opening...",
  full = false,
  fullOnMobile = true,
  disabled,
  className,
  actionDelayMs = 120,
  onClick,
  ...props
}: AppAnimatedActionButtonProps) {
  const isDisabled = disabled || loading;

  const { isAnimating, handleClick } = usePressAnimation<HTMLButtonElement>(
    onClick,
    isDisabled,
    {
      duration: 280,
      actionDelayMs,
    },
  );

  return (
    <>
      <AppInteractionStyles />

      <button
        disabled={isDisabled}
        onClick={handleClick}
        className={cn(
          "group relative inline-flex items-center justify-center gap-4 overflow-hidden rounded-[1.8rem] bg-white px-6 py-5 text-[#123c8c] shadow-2xl shadow-blue-950/20 ring-1 ring-white/70 transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-50 hover:shadow-blue-950/25 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80",
          full && "w-full",
          fullOnMobile && "w-full md:w-auto",
          !full && !fullOnMobile && "w-auto",
          isAnimating && "app-button-press-active",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-blue-100/60 to-transparent opacity-0",
            isAnimating && "app-button-shine-active",
          )}
        />

        <span
          className={cn(
            "relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-[1.4rem] bg-[#eaf1ff] transition-all duration-200 group-hover:bg-[#123c8c] group-hover:text-white",
            isAnimating && "app-icon-press-active bg-[#123c8c] text-white",
          )}
        >
          {loading ? (
            <span className="relative z-10 h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <span className="relative z-10 inline-flex items-center justify-center">
              {icon}
            </span>
          )}
        </span>

        <span className="relative z-10 text-left">
          <span className="block text-xl font-black leading-none tracking-tight">
            {loading || isAnimating ? loadingTitle : title}
          </span>

          {subtitle ? (
            <span className="mt-1 block text-xs font-bold text-[#123c8c]/70">
              {subtitle}
            </span>
          ) : null}
        </span>
      </button>
    </>
  );
}

type AppInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function AppInput({ label, error, className, ...props }: AppInputProps) {
  return (
    <label className="block">
      {label ? (
        <span className="text-sm font-black text-slate-700">{label}</span>
      ) : null}

      <input
        suppressHydrationWarning
        className={cn(
          "mt-2 min-h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60",
          error &&
            "border-red-200 bg-red-50 focus:border-red-400 focus:ring-red-100",
          className,
        )}
        {...props}
      />

      {error ? (
        <span className="mt-2 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type AppTextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function AppTextarea({
  label,
  error,
  className,
  ...props
}: AppTextareaProps) {
  return (
    <label className="block">
      {label ? (
        <span className="text-sm font-black text-slate-700">{label}</span>
      ) : null}

      <textarea
        suppressHydrationWarning
        className={cn(
          "mt-2 min-h-28 w-full resize-none rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-4 text-sm font-bold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60",
          error &&
            "border-red-200 bg-red-50 focus:border-red-400 focus:ring-red-100",
          className,
        )}
        {...props}
      />

      {error ? (
        <span className="mt-2 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type AppSelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
};

export function AppSelect({
  label,
  error,
  className,
  children,
  value,
  ...props
}: AppSelectProps) {
  return (
    <label className="block">
      {label ? (
        <span className="text-sm font-black text-slate-700">{label}</span>
      ) : null}

      <div className="relative mt-2">
        <select
          suppressHydrationWarning
          value={value ?? ""}
          className={cn(
            "min-h-12 w-full appearance-none rounded-2xl border border-blue-100 bg-[#f8fbff] pl-4 pr-10 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer",
            error &&
              "border-red-200 bg-red-50 focus:border-red-400 focus:ring-red-100",
            className,
          )}
          {...props}
        >
          {children}
        </select>

        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {error ? (
        <span className="mt-2 block text-xs font-bold text-red-600">
          {error}
        </span>
      ) : null}
    </label>
  );
}

type AppCardProps = React.HTMLAttributes<HTMLDivElement> & {
  padding?: "sm" | "md" | "lg";
};

export function AppCard({
  children,
  className,
  padding = "md",
  ...props
}: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/60",
        padding === "sm" && "p-4",
        padding === "md" && "p-5",
        padding === "lg" && "p-6 md:p-8",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

type AppClickableCardProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  padding?: "sm" | "md" | "lg";
  pressAnimation?: boolean;
  actionDelayMs?: number;
};

export function AppClickableCard({
  children,
  className,
  padding = "md",
  disabled,
  pressAnimation = true,
  actionDelayMs = 0,
  onClick,
  ...props
}: AppClickableCardProps) {
  const { isAnimating, handleClick } = usePressAnimation<HTMLButtonElement>(
    onClick,
    disabled,
    {
      duration: 260,
      actionDelayMs,
    },
  );

  return (
    <>
      <AppInteractionStyles />

      <button
        disabled={disabled}
        onClick={handleClick}
        className={cn(
          "relative w-full overflow-hidden rounded-[2rem] border border-blue-100 bg-white text-left shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
          padding === "sm" && "p-4",
          padding === "md" && "p-5",
          padding === "lg" && "p-6 md:p-8",
          pressAnimation && isAnimating && "app-button-press-active",
          className,
        )}
        {...props}
      >
        {pressAnimation ? (
          <span
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/70 to-transparent opacity-0",
              isAnimating && "app-button-shine-active",
            )}
          />
        ) : null}

        <span className="relative z-10 block">{children}</span>
      </button>
    </>
  );
}

type AppBadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "blue" | "green" | "yellow" | "red" | "gray";
};

export function AppBadge({
  children,
  className,
  variant = "blue",
  ...props
}: AppBadgeProps) {
  const variantClass = {
    blue: "bg-blue-50 text-[#123c8c] ring-blue-100",
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    yellow: "bg-amber-50 text-amber-700 ring-amber-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    gray: "bg-slate-100 text-slate-600 ring-slate-200",
  };

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black ring-1",
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

type AppSectionHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
};

export function AppSectionHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: AppSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow ? (
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#123c8c]">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
          {title}
        </h2>

        {subtitle ? (
          <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
            {subtitle}
          </p>
        ) : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

type AppEmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description?: string;
};

export function AppEmptyState({
  icon,
  title,
  description,
}: AppEmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-blue-100 bg-[#f8fbff] px-5 py-12 text-center">
      {icon ? (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          {icon}
        </div>
      ) : null}

      <p className="mt-4 text-sm font-black text-slate-600">{title}</p>

      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
          {description}
        </p>
      ) : null}
    </div>
  );
}

type AppLoadingStateProps = {
  text?: string;
};

export function AppLoadingState({
  text = "Memuat data...",
}: AppLoadingStateProps) {
  const logoSrc = useSiteLogo();
  return (
    <>
      <AppInteractionStyles />

      <div className="flex min-h-48 flex-col items-center justify-center rounded-[2rem] border border-blue-100 bg-white px-5 py-12 text-center text-sm font-bold text-slate-500 shadow-lg shadow-slate-200/50">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] border border-blue-100 bg-[#f8fbff] shadow-inner">
          <span className="app-brand-loader-scan pointer-events-none absolute left-3 right-3 top-1/2 z-20 h-0.5 bg-gradient-to-r from-transparent via-[#ff8a00] to-transparent shadow-[0_0_12px_rgba(255,138,0,0.62)]" />
          <Image
            src={logoSrc}
            alt=""
            aria-hidden="true"
            width={56}
            height={56}
            unoptimized
            className="app-brand-loader-pulse h-14 w-14 object-contain"
          />
        </div>

        <p className="mt-4 text-sm font-black text-slate-600">{text}</p>
      </div>
    </>
  );
}

type AppModalMotionProps = React.HTMLAttributes<HTMLDivElement> & {
  align?: "center" | "bottom";
};

export function AppModalMotion({
  children,
  className,
  align = "center",
  ...props
}: AppModalMotionProps) {
  return (
    <>
      <AppInteractionStyles />

      <div
        className={cn(
          "app-modal-backdrop-enter fixed inset-0 z-[80] flex bg-transparent px-4 pb-4",
          align === "center" &&
            "items-end justify-center md:items-center md:pb-0",
          align === "bottom" && "items-end justify-center",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

type AppModalPanelProps = React.HTMLAttributes<HTMLDivElement>;

export function AppModalPanel({
  children,
  className,
  ...props
}: AppModalPanelProps) {
  return (
    <>
      <AppInteractionStyles />

      <div
        className={cn(
          "app-modal-panel-enter max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl shadow-slate-950/30 md:p-7",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

type AppFormRevealProps = React.HTMLAttributes<HTMLDivElement> & {
  delay?: number;
};

export function AppFormReveal({
  children,
  className,
  delay = 0,
  style,
  ...props
}: AppFormRevealProps) {
  return (
    <>
      <AppInteractionStyles />

      <div
        className={cn("app-form-reveal-enter", className)}
        style={{
          animationDelay: `${delay}ms`,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

type AppPageTransitionProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "enter" | "fade";
};

export function AppPageTransition({
  children,
  className,
  variant = "enter",
  ...props
}: AppPageTransitionProps) {
  return (
    <>
      <AppInteractionStyles />

      <div
        className={cn(
          variant === "enter" && "app-page-enter",
          variant === "fade" && "app-page-fade",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

type AppPageSkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "profile" | "cards";
};

export function AppPageSkeleton({
  className,
  variant = "profile",
  ...props
}: AppPageSkeletonProps) {
  if (variant === "cards") {
    return (
      <>
        <AppInteractionStyles />

        <div
          className={cn("app-skeleton-enter space-y-5", className)}
          {...props}
        >
          <div className="h-44 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60" />

          <div className="grid gap-5 md:grid-cols-3">
            <div className="h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60" />
            <div className="h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60" />
            <div className="h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60" />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="h-96 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60" />
            <div className="h-96 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60" />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppInteractionStyles />

      <div
        className={cn("app-skeleton-enter mt-6 space-y-6", className)}
        {...props}
      >
        <section className="overflow-hidden rounded-[2.2rem] border border-blue-100 bg-white shadow-2xl shadow-slate-300/30">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="bg-[#123c8c] p-7 md:p-8">
              <div className="h-28 w-28 animate-pulse rounded-[2rem] bg-white/20" />

              <div className="mt-6 h-4 w-40 animate-pulse rounded-full bg-white/20" />
              <div className="mt-4 h-10 w-64 max-w-full animate-pulse rounded-2xl bg-white/20" />

              <div className="mt-5 flex gap-2">
                <div className="h-8 w-20 animate-pulse rounded-full bg-white/20" />
                <div className="h-8 w-24 animate-pulse rounded-full bg-white/20" />
              </div>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-7">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[1.6rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-[#eaf1ff]" />

                    <div className="min-w-0 flex-1">
                      <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                      <div className="mt-3 h-5 w-36 animate-pulse rounded-full bg-slate-100" />
                      <div className="mt-3 h-3 w-44 max-w-full animate-pulse rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-300/30 md:p-6">
          <div className="h-4 w-40 animate-pulse rounded-full bg-blue-100" />
          <div className="mt-3 h-7 w-72 max-w-full animate-pulse rounded-2xl bg-slate-100" />

          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[1.6rem] border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50"
              >
                <div className="h-12 w-12 animate-pulse rounded-2xl bg-[#eaf1ff]" />
                <div className="mt-4 h-3 w-24 animate-pulse rounded-full bg-slate-100" />
                <div className="mt-3 h-5 w-40 max-w-full animate-pulse rounded-full bg-slate-100" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
