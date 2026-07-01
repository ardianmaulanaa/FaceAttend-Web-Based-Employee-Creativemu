"use client";

import { CalendarDays, Clock3, MapPin } from "lucide-react";
import { useMemo } from "react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

export default function HistoryPage() {
  const { authUser, state } = useAppData();

  const histories = useMemo(() => {
    if (!authUser) return [];
    return state.attendance.filter((item) => item.employeeId === authUser.id);
  }, [authUser, state.attendance]);

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="History"
        subtitle="Riwayat absensi karyawan"
        rightLabel={authUser?.id || "EMP"}
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
            sistem absensi, termasuk bukti foto dan GPS.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {histories.map((item) => (
            <div
              key={item.id}
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
                      : item.status === "WFH"
                        ? "bg-amber-50 text-amber-700"
                        : item.status === "Cuti"
                          ? "bg-violet-50 text-violet-700"
                          : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-600">
                  Mode: {item.workMode || "onsite"}
                </span>
                {item.leaveType && (
                  <span className="rounded-full bg-[#eaf1ff] px-3 py-1 text-[11px] font-black text-[#123c8c]">
                    Surat: {item.leaveType}
                  </span>
                )}
              </div>

              <div className="mt-5 grid gap-3">
                <div className="flex items-center gap-3 rounded-2xl bg-[#f6f8ff] p-4">
                  <Clock3 size={21} className="text-[#123c8c]" />
                  <div>
                    <p className="text-xs font-bold text-slate-500">Check-in</p>
                    <p className="text-sm font-black text-slate-950">
                      {item.checkIn || "-"}
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
                      {item.checkOut || "-"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f6f8ff] p-4">
                  <div className="mb-2 flex items-center gap-2 text-[#123c8c]">
                    <MapPin size={18} />
                    <p className="text-xs font-black uppercase tracking-[0.18em]">
                      GPS
                    </p>
                  </div>

                  <p className="text-xs font-semibold text-slate-600">
                    Check-in: {item.checkInLatitude ?? "-"},{" "}
                    {item.checkInLongitude ?? "-"}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">
                    Check-out: {item.checkOutLatitude ?? "-"},{" "}
                    {item.checkOutLongitude ?? "-"}
                  </p>
                </div>

                {(item.checkInPhotoUrl || item.checkOutPhotoUrl) && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl bg-[#f6f8ff] p-3">
                      <p className="mb-2 text-xs font-bold text-slate-500">
                        Foto Check-in
                      </p>
                      {item.checkInPhotoUrl ? (
                        <img
                          src={item.checkInPhotoUrl}
                          alt="Foto check-in"
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <p className="text-xs font-semibold text-slate-500">
                          Belum ada foto
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#f6f8ff] p-3">
                      <p className="mb-2 text-xs font-bold text-slate-500">
                        Foto Check-out
                      </p>
                      {item.checkOutPhotoUrl ? (
                        <img
                          src={item.checkOutPhotoUrl}
                          alt="Foto check-out"
                          className="h-28 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <p className="text-xs font-semibold text-slate-500">
                          Belum ada foto
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {item.leaveLetterUrl && (
                  <div className="rounded-2xl border border-blue-100 bg-white p-4">
                    <p className="text-xs font-bold text-slate-500">
                      Surat Cuti/Sakit
                    </p>
                    <a
                      href={item.leaveLetterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex rounded-xl bg-[#123c8c] px-3 py-1.5 text-xs font-black text-white"
                    >
                      Lihat Surat
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}

          {histories.length === 0 && (
            <div className="rounded-3xl border border-white/70 bg-white/90 p-6 text-sm font-semibold text-slate-500 shadow-xl shadow-slate-300/30 backdrop-blur-xl">
              Belum ada riwayat absensi.
            </div>
          )}
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}
