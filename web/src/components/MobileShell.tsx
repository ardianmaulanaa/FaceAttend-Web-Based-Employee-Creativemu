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
    auth: "min-h-screen w-full bg-[#f6f8ff]",
    employee: "min-h-screen w-full bg-[#f6f8ff]",
    admin: "min-h-screen w-full bg-[#f6f8ff]",
  };

  return (
    <main className={shellClass[variant]}>
      <div
        className={[
          withBottomPadding ? "pb-28 md:pb-8" : "",
          variant === "admin" ? "md:pl-64" : "",
        ].join(" ")}
      >
        {children}
      </div>
    </main>
  );
}
