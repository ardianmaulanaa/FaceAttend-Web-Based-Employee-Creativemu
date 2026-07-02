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
<<<<<<< HEAD
      <div
        className={[
          withBottomPadding ? "pb-28 md:pb-8" : "",
          variant === "admin" ? "md:pl-64" : "",
        ].join(" ")}
      >
        {children}
      </div>
=======
      <div className={paddingClass}>{children}</div>
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
    </main>
  );
}
