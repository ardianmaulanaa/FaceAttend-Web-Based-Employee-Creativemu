import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const reports = [
  {
    name: "Muhammad Ardian Maulana",
    employeeId: "EMP001",
    date: "Senin, 29 Juni 2026",
    checkIn: "08:02",
    checkOut: "17:04",
    status: "Present",
  },
  {
    name: "Budi Santoso",
    employeeId: "EMP002",
    date: "Senin, 29 Juni 2026",
    checkIn: "08:21",
    checkOut: "17:10",
    status: "Late",
  },
  {
    name: "Siti Rahma",
    employeeId: "EMP003",
    date: "Senin, 29 Juni 2026",
    checkIn: "-",
    checkOut: "-",
    status: "Absent",
  },
];

export default function ReportsPage() {
  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Monitor Perusahaan"
        subtitle="Laporan absensi seluruh karyawan Creativemu"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-[2rem] bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20">
          <p className="text-sm font-bold text-blue-100">Attendance Report</p>

          <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
            Laporan Kehadiran Karyawan
          </h2>

          <p className="mt-3 text-sm leading-7 text-blue-100">
            Pantau data check-in, check-out, status hadir, terlambat, dan tidak
            hadir dari seluruh karyawan.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((item) => (
            <div
              key={`${item.employeeId}-${item.date}`}
              className="rounded-[2rem] border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/40 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black text-[#123c8c]">
                    {item.employeeId}
                  </p>

                  <h3 className="mt-1 font-black text-slate-950">
                    {item.name}
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">{item.date}</p>

                  <p className="mt-3 text-sm text-slate-500">
                    Check-in:{" "}
                    <span className="font-black text-slate-800">
                      {item.checkIn}
                    </span>
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    Check-out:{" "}
                    <span className="font-black text-slate-800">
                      {item.checkOut}
                    </span>
                  </p>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    item.status === "Present"
                      ? "bg-[#eaf1ff] text-[#123c8c]"
                      : item.status === "Late"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}