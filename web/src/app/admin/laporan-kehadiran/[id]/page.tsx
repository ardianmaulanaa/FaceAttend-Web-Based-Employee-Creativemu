"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ImageIcon,
  Loader2,
  MapPin,
  UserRound,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import MobileShell from "@/components/MobileShell";

type AttendanceReportDetail = {
  id: string;
  employeeName: string;
  employeeCode: string | null;
  date: string;
  dateLabel: string;
  checkIn: string;
  checkOut: string;
  duration: string;
  status: string;
  statusLabel: string;
  workMode: string;
  workModeLabel: string;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  proofPhoto: string | null;
  officeName: string | null;
  officeAddress: string | null;
  officeLatitude: number | null;
  officeLongitude: number | null;
  lateReason: string | null;
};

type AttendanceReportDetailResponse = {
  success: boolean;
  message?: string;
  report: AttendanceReportDetail | null;
};

async function readJsonResponse(response: Response) {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error("Response API bukan JSON.");
  }
}

function getStatusStyle(status: string) {
  const normalized = String(status || "").toLowerCase();

  if (normalized === "present" || normalized === "hadir") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (normalized === "late" || normalized === "terlambat") {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (normalized === "cuti") {
    return "bg-blue-50 text-[#123c8c] ring-blue-100";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function PhotoCard({
  title,
  subtitle,
  imageUrl,
}: {
  title: string;
  subtitle: string;
  imageUrl: string | null;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/60">
      <div className="border-b border-blue-50 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
          {title}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>

      {imageUrl ? (
        <div className="bg-[#f8fbff] p-4">
          <div className="mx-auto max-w-[320px] overflow-hidden rounded-[1.3rem] bg-slate-950 shadow-lg shadow-slate-300/40">
            <img
              src={imageUrl}
              alt={title}
              className="block h-auto max-h-[480px] w-full object-cover"
            />
          </div>
        </div>
      ) : (
        <div className="flex min-h-[230px] flex-col items-center justify-center bg-[#f8fbff] p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <ImageIcon size={32} strokeWidth={2.6} />
          </div>

          <p className="mt-4 text-sm font-black text-slate-500">
            Foto belum tersedia.
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminAttendanceReportDetailPage() {
  const router = useRouter();
  const params = useParams();

  const id = String(params.id || "");

  const [report, setReport] = useState<AttendanceReportDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function getAttendanceDetail() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await fetch(
        `/api/admin/attendance-reports/${encodeURIComponent(id)}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data: AttendanceReportDetailResponse = await readJsonResponse(
        response
      );

      if (!response.ok || !data.success || !data.report) {
        setReport(null);
        setErrorMessage(data.message || "Detail laporan tidak ditemukan.");
        return;
      }

      setReport(data.report);
    } catch (error) {
      console.error("GET_ATTENDANCE_DETAIL_ERROR:", error);

      setReport(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil detail laporan."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      getAttendanceDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const primaryCheckInPhoto = report?.checkInPhoto || report?.proofPhoto || null;

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AppHeader
        title="Detail Kehadiran"
        subtitle="Foto bukti absen dan lokasi kantor"
        variant="admin"
      />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <button
            type="button"
            onClick={() => router.push("/admin/laporan-kehadiran")}
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#123c8c] shadow-sm ring-1 ring-blue-100 transition active:scale-[0.98]"
          >
            <ArrowLeft size={18} strokeWidth={2.6} />
            Kembali ke Laporan
          </button>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-blue-100 bg-white">
              <div className="text-center">
                <Loader2 className="mx-auto animate-spin text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-600">
                  Mengambil detail kehadiran...
                </p>
              </div>
            </div>
          ) : errorMessage || !report ? (
            <div className="rounded-3xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
              {errorMessage || "Detail laporan tidak ditemukan."}
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
                <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="bg-[#123c8c] p-6 text-white md:p-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                        <UserRound size={25} strokeWidth={2.6} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-blue-100">
                          Employee Attendance
                        </p>

                        <h2 className="mt-1 truncate text-3xl font-black tracking-tight md:text-4xl">
                          {report.employeeName}
                        </h2>
                      </div>
                    </div>

                    <p className="mt-4 text-sm font-semibold text-blue-100">
                      {report.employeeCode || "-"}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
                          report.status
                        )}`}
                      >
                        {report.statusLabel}
                      </span>

                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">
                        {report.workModeLabel}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4 md:p-6">
                    <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                      <CalendarDays size={20} className="text-[#123c8c]" />
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Tanggal
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {report.dateLabel}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                      <Clock3 size={20} className="text-[#123c8c]" />
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Masuk
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {report.checkIn}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                      <Clock3 size={20} className="text-[#123c8c]" />
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Keluar
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {report.checkOut}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-100 bg-[#f8fbff] p-4">
                      <Clock3 size={20} className="text-[#123c8c]" />
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Durasi
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {report.duration}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
                      <MapPin size={24} strokeWidth={2.6} />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
                        Lokasi Kantor
                      </p>

                      <p className="mt-2 text-base font-black text-slate-950">
                        {report.officeName || "Kantor belum terdaftar"}
                      </p>

                      <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                        {report.officeAddress || "Alamat kantor belum tersedia."}
                      </p>
                    </div>
                  </div>

                  {report.officeLatitude && report.officeLongitude ? (
                    <a
                      href={`https://www.google.com/maps?q=${report.officeLatitude},${report.officeLongitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98]"
                    >
                      Buka Maps
                    </a>
                  ) : null}
                </div>
              </div>

              {report.lateReason ? (
                <div className="rounded-[2rem] border border-amber-100 bg-amber-50 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-700">
                    Alasan Terlambat
                  </p>

                  <p className="mt-2 text-sm font-semibold leading-7 text-amber-800">
                    {report.lateReason}
                  </p>
                </div>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                <PhotoCard
                  title="Foto Check-in"
                  subtitle={`${report.employeeName} • ${report.dateLabel}`}
                  imageUrl={primaryCheckInPhoto}
                />

                <PhotoCard
                  title="Foto Check-out"
                  subtitle={`${report.employeeName} • ${report.dateLabel}`}
                  imageUrl={report.checkOutPhoto}
                />
              </div>
            </>
          )}
        </section>
      </main>
    </MobileShell>
  );
}