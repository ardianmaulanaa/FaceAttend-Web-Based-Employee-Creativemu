type MobileShellProps = {
  children: React.ReactNode;
  withBottomPadding?: boolean;
  variant?: "auth" | "employee" | "admin";
  className?: string;
  contentClassName?: string;
};

function cn(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export default function MobileShell({
  children,
  withBottomPadding = true,
  variant = "employee",
  className,
  contentClassName,
}: MobileShellProps) {
  const shellClass = {
    auth: "min-h-dvh w-full overflow-x-hidden bg-[#f6f8ff] text-slate-950",
    employee: "min-h-dvh w-full overflow-x-hidden bg-[#f6f8ff] text-slate-950",
    admin: "min-h-dvh w-full overflow-x-hidden bg-[#f6f8ff] text-slate-950",
  };

  const paddingClass = withBottomPadding ? "pb-28 md:pb-8" : "";

  return (
    <main className={cn(shellClass[variant], className)}>
      <div className={cn(paddingClass, variant === "admin" ? "md:pl-64" : "", contentClassName)}>
        {children}
      </div>
    </main>
  );
}
