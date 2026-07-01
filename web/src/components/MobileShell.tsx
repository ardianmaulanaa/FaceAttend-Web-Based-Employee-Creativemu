type MobileShellProps = {
  children: React.ReactNode;
  withBottomPadding?: boolean;
  variant?: "auth" | "employee" | "admin";
};

export default function MobileShell({
  children,
  withBottomPadding = true,
  variant = "employee",
}: MobileShellProps) {
  const shellClass = {
    auth: "min-h-dvh w-full overflow-x-hidden bg-[#f6f8ff] text-slate-950",
    employee: "min-h-dvh w-full overflow-x-hidden bg-[#f6f8ff] text-slate-950",
    admin: "min-h-dvh w-full overflow-x-hidden bg-[#f6f8ff] text-slate-950",
  };

  const paddingClass = withBottomPadding
    ? variant === "admin"
      ? "pb-28 md:pb-8"
      : "pb-28 md:pb-8"
    : "";

  return (
    <main className={shellClass[variant]}>
      <div className={paddingClass}>{children}</div>
    </main>
  );
}