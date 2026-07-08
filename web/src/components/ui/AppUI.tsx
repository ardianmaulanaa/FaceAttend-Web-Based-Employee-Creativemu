"use client";

import type React from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost" | "soft";
type Size = "sm" | "md" | "lg";

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const buttonVariantClass: Record<Variant, string> = {
  primary:
    "bg-[#123c8c] text-white shadow-lg shadow-blue-900/20 hover:bg-[#0f347a]",
  secondary:
    "border border-blue-100 bg-white text-[#123c8c] shadow-sm hover:bg-blue-50",
  danger: "bg-rose-50 text-rose-600 ring-1 ring-rose-100 hover:bg-rose-100",
  ghost: "bg-transparent text-[#123c8c] hover:bg-blue-50",
  soft: "bg-[#eaf1ff] text-[#123c8c] ring-1 ring-blue-100 hover:bg-blue-100",
};

const buttonSizeClass: Record<Size, string> = {
  sm: "min-h-10 rounded-xl px-4 py-2 text-xs",
  md: "min-h-12 rounded-2xl px-5 py-3 text-sm",
  lg: "min-h-14 rounded-2xl px-6 py-4 text-base",
};

type AppButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  full?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  loading?: boolean;
  loadingText?: string;
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
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-black transition duration-200 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60",
        buttonVariantClass[variant],
        buttonSizeClass[size],
        full && "w-full",
        loading && "scale-[0.99]",
        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        leftIcon
      )}

      <span>{loading ? loadingText : children}</span>

      {!loading ? rightIcon : null}
    </button>
  );
}

type AppIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "md" | "lg";
};

export function AppIconButton({
  children,
  className,
  variant = "soft",
  size = "md",
  disabled,
  ...props
}: AppIconButtonProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-black transition active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-60",
        buttonVariantClass[variant],
        size === "lg" ? "h-14 w-14 rounded-2xl" : "h-12 w-12 rounded-2xl",
        className,
      )}
      {...props}
    >
      {children}
    </button>
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

      <select
        suppressHydrationWarning
        value={value ?? ""}
        className={cn(
          "mt-2 min-h-12 w-full rounded-2xl border border-blue-100 bg-[#f8fbff] px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60",
          error &&
            "border-red-200 bg-red-50 focus:border-red-400 focus:ring-red-100",
          className,
        )}
        {...props}
      >
        {children}
      </select>

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
};

export function AppClickableCard({
  children,
  className,
  padding = "md",
  disabled,
  ...props
}: AppClickableCardProps) {
  return (
    <button
      disabled={disabled}
      className={cn(
        "w-full rounded-[2rem] border border-blue-100 bg-white text-left shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        padding === "sm" && "p-4",
        padding === "md" && "p-5",
        padding === "lg" && "p-6 md:p-8",
        className,
      )}
      {...props}
    >
      {children}
    </button>
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
  return (
    <div className="flex items-center justify-center gap-2 rounded-[2rem] border border-blue-100 bg-white px-5 py-12 text-sm font-bold text-slate-500">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#123c8c] border-t-transparent" />
      {text}
    </div>
  );
}
