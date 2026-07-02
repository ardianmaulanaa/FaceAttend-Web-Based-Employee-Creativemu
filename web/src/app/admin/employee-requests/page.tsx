"use client";

import { useMemo } from "react";
import { FileText, ShieldAlert } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";
import { useAppData } from "@/context/AppDataContext";

export default function AdminEmployeeRequestsPage() {
  const { state, resolveAttendanceOverrideRequest } = useAppData();

  const leaveRequests = useMemo(
    () =>
      state.attendance
        .filter((item) => item.workMode === "cuti")
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.attendance],
  );

  const overrideRequests = useMemo(
    () =>
      [...state.overrideRequests].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    [state.overrideRequests],
  );

  return (
    <MobileShell variant="admin">
      <AppHeader
        title="Pengajuan Karyawan"
        subtitle="Kelola pengajuan override dan cuti/sakit"
        variant="admin"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-xl shadow-slate-300/30">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
            Request Center
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
            Persetujuan Pengajuan Karyawan
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Modul ini memisahkan pengajuan override absensi dan pengajuan
            cuti/sakit agar proses persetujuan lebih cepat.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center gap-2 text-[#123c8c]">
              <ShieldAlert size={18} />
              <h3 className="text-lg font-black text-slate-950">
                Override Absensi
              </h3>
            </div>

            {overrideRequests.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Belum ada pengajuan override.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {overrideRequests.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-blue-100 bg-[#f6f8ff] p-3"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {item.employeeName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {item.date} • {item.type} • {item.reason}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          item.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : item.status === "rejected"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {item.status}
                      </span>

                      {item.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              resolveAttendanceOverrideRequest(
                                item.id,
                                "approved",
                              )
                            }
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-black text-white"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              resolveAttendanceOverrideRequest(
                                item.id,
                                "rejected",
                              )
                            }
                            className="rounded-lg bg-rose-600 px-2.5 py-1 text-[11px] font-black text-white"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/90 p-5 shadow-xl shadow-slate-300/30">
            <div className="flex items-center gap-2 text-[#123c8c]">
              <FileText size={18} />
              <h3 className="text-lg font-black text-slate-950">
                Pengajuan Cuti/Sakit
              </h3>
            </div>

            {leaveRequests.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">
                Belum ada pengajuan cuti/sakit.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {leaveRequests.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-blue-100 bg-[#f6f8ff] p-3"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {item.employeeName}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      {item.date} • {item.leaveType || "cuti"}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">
                      Status: {item.status}
                    </p>
                    {item.leaveLetterUrl && (
                      <a
                        href={item.leaveLetterUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex rounded-lg bg-[#123c8c] px-2.5 py-1 text-[11px] font-black text-white"
                      >
                        Lihat Surat
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <BottomNav variant="admin" />
    </MobileShell>
  );
}
