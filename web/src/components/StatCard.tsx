type StatCardProps = {
  label: string;
  value: string;
  description?: string;
  tone?: "blue" | "orange" | "green" | "red";
};

const toneClass = {
  blue: "from-[#123c8c] to-[#2563eb] text-white",
  orange: "from-[#1d4ed8] to-[#60a5fa] text-white",
  green: "from-[#0f3a7a] to-[#1e40af] text-white",
  red: "from-[#0f172a] to-[#123c8c] text-white",
};

export default function StatCard({
  label,
  value,
  description,
  tone = "blue",
}: StatCardProps) {
  return (
    <div
      className={`rounded-[2rem] bg-gradient-to-br ${toneClass[tone]} p-4 shadow-xl shadow-blue-900/15`}
    >
      <p className="text-xs font-bold text-blue-100">{label}</p>
      <h3 className="mt-3 text-3xl font-black tracking-tight">{value}</h3>
      {description && (
        <p className="mt-1 text-xs font-semibold text-blue-100">
          {description}
        </p>
      )}
    </div>
  );
}