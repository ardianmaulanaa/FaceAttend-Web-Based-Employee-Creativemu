import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  tone?: "blue" | "orange" | "green" | "red";
  icon?: LucideIcon;
};

const toneClass = {
  blue: {
    border: "border-blue-100",
    icon: "bg-[#eaf1ff] text-[#123c8c]",
    badge: "bg-[#123c8c]",
  },
  orange: {
    border: "border-orange-100",
    icon: "bg-orange-50 text-orange-600",
    badge: "bg-orange-500",
  },
  green: {
    border: "border-emerald-100",
    icon: "bg-emerald-50 text-emerald-600",
    badge: "bg-emerald-500",
  },
  red: {
    border: "border-red-100",
    icon: "bg-red-50 text-red-600",
    badge: "bg-red-500",
  },
};

export default function StatCard({
  label,
  value,
  description,
  tone = "blue",
  icon: Icon,
}: StatCardProps) {
  const style = toneClass[tone];

  return (
    <div
      className={`relative overflow-hidden rounded-[2rem] border ${style.border} bg-white p-4 shadow-lg shadow-slate-200/60`}
    >
      <div
        className={`absolute right-5 top-5 h-2.5 w-2.5 rounded-full ${style.badge}`}
      />

      <div className="flex items-start gap-4">
        {Icon ? (
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.icon}`}
          >
            <Icon size={22} strokeWidth={2.6} />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>

          <h3 className="mt-2 truncate text-xl font-black tracking-tight text-slate-950">
            {value}
          </h3>

          {description ? (
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              {description}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}