import { CalendarDays, Clock3 } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const histories = [
  {
    date: "Senin, 29 Juni 2026",
    checkIn: "08:02",
    checkOut: "17:04",
    status: "Present",
  },
  {
    date: "Jumat, 26 Juni 2026",
    checkIn: "08:21",
    checkOut: "17:10",
    status: "Late",
  },
  {
    date: "Kamis, 25 Juni 2026",
    checkIn: "07:58",
    checkOut: "17:00",
    status: "Present",
  },
];

export default function HistoryPage() {
  return (
    <MobileShell variant="employee">
      <AppHeader
        title="History"
        subtitle="Riwayat absensi karyawan"
        rightLabel="EMP001"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl bg-[#123c8c] p-6 text-white shadow-xl shadow-blue-900/20 md:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
              <CalendarDays size={26} strokeWidth={2.6} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                Attendance Log
              </p>
              <h2 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                Riwayat Kehadiran
              </h2>
            </div>
          </div>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100">
            Pantau riwayat check-in dan check-out yang sudah tercatat pada
            sistem absensi.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {histories.map((item) => (
            <div
              key={item.date}
              className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                    {item.status}
                  </p>

                  <h3 className="mt-2 font-black text-slate-950">
                    {item.date}
                  </h3>
                </div>

                <span
                  className={`rounded-full px-3 py-1 text-xs font-black ${
                    item.status === "Present"
                      ? "bg-[#eaf1ff] text-[#123c8c]"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8ff] p-4">
                  <Clock3 size={21} className="text-[#123c8c]" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      Check-in
                    </p>
                    <p className="text-sm font-black text-slate-950">
                      {item.checkIn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8ff] p-4">
                  <Clock3 size={21} className="text-[#123c8c]" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">
                      Check-out
                    </p>
                    <p className="text-sm font-black text-slate-950">
                      {item.checkOut}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}