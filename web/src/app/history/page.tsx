"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock3,
  ImageIcon,
  Loader2,
  MapPin,
  Search,
  Timer,
} from "lucide-react";
import dynamic from "next/dynamic";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

const AttendanceMap = dynamic(() => import("@/components/AttendanceMap"), {
  ssr: false,
});

type Attendance = {
  id: string;

  attendanceDate: string;

  scheduledCheckIn: string | null;
  scheduledCheckOut: string | null;

  checkInTime: string | null;
  checkOutTime: string | null;

  checkInPhoto: string | null;
  checkOutPhoto: string | null;

  checkInLatitude: number | null;
  checkInLongitude: number | null;

  checkOutLatitude: number | null;
  checkOutLongitude: number | null;

  lateMinutes: number;
  earlyLeaveMinutes: number;
  workMinutes: number;

  status: "PENDING" | "CHECKED_IN" | "CHECKED_OUT";
  rawStatus: string;
  checkInStatus: string | null;
  checkOutStatus: string | null;

  note: string | null;
};

const months = [
  { value: 1, label: "Januari" },
  { value: 2, label: "Februari" },
  { value: 3, label: "Maret" },
  { value: 4, label: "April" },
  { value: 5, label: "Mei" },
  { value: 6, label: "Juni" },
  { value: 7, label: "Juli" },
  { value: 8, label: "Agustus" },
  { value: 9, label: "September" },
  { value: 10, label: "Oktober" },
  { value: 11, label: "November" },
  { value: 12, label: "Desember" },
];

function formatDate(date: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function formatTime(date: string | null) {
  if (!date) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatWorkMinutes(minutes: number) {
  if (!minutes) return "-";

  const hours = Math.floor(minutes / 60);
  const restMinutes = minutes % 60;

  if (hours <= 0) return `${restMinutes} menit`;

  return `${hours} jam ${restMinutes} menit`;
}

function hasLocation(latitude: number | null, longitude: number | null) {
  return typeof latitude === "number" && typeof longitude === "number";
}

function getStatusLabel(status: Attendance["status"]) {
  if (status === "CHECKED_OUT") return "Completed";
  if (status === "CHECKED_IN") return "Checked-in";
  return "Pending";
}

function getStatusClass(status: Attendance["status"]) {
  if (status === "CHECKED_OUT") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "CHECKED_IN") {
    return "bg-blue-50 text-[#123c8c] ring-blue-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function PhotoPreview({
  photo,
  label,
}: {
  photo: string | null;
  label: string;
}) {
  if (!photo) {
    return (
      <div className="flex h-28 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/70 text-xs font-bold text-slate-400">
        Foto belum ada
      </div>
    );
  }

  return (
    <a
      href={photo}
      target="_blank"
      rel="noreferrer"
      className="group block overflow-hidden rounded-2xl border border-blue-100 bg-white"
    >
      <div className="relative h-28 w-full overflow-hidden">
        <img
          src={photo}
          alt={label}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex items-center gap-2 px-3 py-2 text-xs font-black text-[#123c8c]">
        <ImageIcon size={15} />
        {label}
      </div>
    </a>
  );
}

function LocationPreview({
  latitude,
  longitude,
  label,
}: {
  latitude: number | null;
  longitude: number | null;
  label: string;
}) {
  if (!hasLocation(latitude, longitude)) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-4 text-xs font-bold text-slate-400">
        Lokasi belum tersedia
      </div>
    );
  }

  const lat = latitude as number;
  const lng = longitude as number;

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white">
      <div className="flex items-center justify-between gap-3 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <MapPin size={17} className="shrink-0 text-[#123c8c]" />
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-slate-900">
              {label}
            </p>
            <p className="truncate text-[11px] font-semibold text-slate-400">
              {lat.toFixed(6)}, {lng.toFixed(6)}
            </p>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 rounded-full bg-[#eaf1ff] px-3 py-2 text-[11px] font-black text-[#123c8c]"
        >
          Buka
        </a>
      </div>

      <div className="h-40 overflow-hidden border-t border-blue-50">
        <AttendanceMap latitude={lat} longitude={lng} label={label} />
      </div>
    </div>
  );
}

function AttendanceSection({
  title,
  time,
  photo,
  latitude,
  longitude,
  locationLabel,
}: {
  title: string;
  time: string | null;
  photo: string | null;
  latitude: number | null;
  longitude: number | null;
  locationLabel: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-blue-50 bg-[#f7faff] p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#123c8c] shadow-sm">
          <Clock3 size={21} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>
          <p className="text-xl font-black text-slate-950">
            {formatTime(time)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <PhotoPreview photo={photo} label={`Lihat foto ${title}`} />

        <LocationPreview
          latitude={latitude}
          longitude={longitude}
          label={locationLabel}
        />
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const now = new Date();

  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(false);

  const years = Array.from(
    { length: 6 },
    (_, index) => now.getFullYear() - index
  );

  async function fetchHistory(selectedMonth = month, selectedYear = year) {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/history?month=${selectedMonth}&year=${selectedYear}`
      );

      const contentType = response.headers.get("content-type");

      if (!contentType?.includes("application/json")) {
        throw new Error(
          "Response dari API bukan JSON. Pastikan src/app/api/history/route.ts sudah benar."
        );
      }

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || data.message || "Gagal mengambil riwayat.");
        return;
      }

      setAttendances(data.attendances || []);
    } catch (error) {
      console.error("FETCH_HISTORY_ERROR:", error);
      alert("Gagal mengambil riwayat absensi.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="History"
        subtitle="Riwayat absensi karyawan"
        rightLabel={`${
          months.find((item) => item.value === month)?.label
        } ${year}`}
      />

      <section className="mx-auto max-w-7xl px-5 pb-28 pt-6 md:px-10 lg:px-16">
        <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
              <CalendarDays size={23} />
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Filter Riwayat
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Pilih bulan dan tahun absensi.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <select
              value={month}
              onChange={(event) => setMonth(Number(event.target.value))}
              className="h-14 rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
            >
              {months.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(event) => setYear(Number(event.target.value))}
              className="h-14 rounded-2xl border border-blue-100 bg-[#f8fbff] px-5 text-sm font-bold text-slate-700 outline-none transition focus:border-[#123c8c] focus:ring-4 focus:ring-blue-100"
            >
              {years.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <button
              onClick={() => fetchHistory(month, year)}
              disabled={loading}
              className="h-14 rounded-2xl bg-[#123c8c] px-7 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Search size={18} />
                )}
                {loading ? "Loading..." : "Terapkan"}
              </span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-bold text-slate-600 shadow-lg">
              <Loader2 size={20} className="animate-spin text-[#123c8c]" />
              Mengambil riwayat absensi...
            </div>
          </div>
        ) : attendances.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-blue-100 bg-white p-8 text-center shadow-xl shadow-slate-300/30">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#eaf1ff] text-[#123c8c]">
              <CalendarDays size={30} />
            </div>

            <p className="mt-5 text-lg font-black text-slate-950">
              Belum ada riwayat absensi
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Tidak ada data absensi pada bulan dan tahun yang dipilih.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            {attendances.map((attendance) => (
              <article
                key={attendance.id}
                className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-xl shadow-slate-300/30"
              >
                <div className="border-b border-blue-50 bg-gradient-to-br from-white to-[#f4f7ff] p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                        Attendance Record
                      </p>
                      <h2 className="mt-2 text-xl font-black leading-tight text-slate-950">
                        {formatDate(attendance.attendanceDate)}
                      </h2>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-black ring-1 ${getStatusClass(
                        attendance.status
                      )}`}
                    >
                      {getStatusLabel(attendance.status)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] font-black uppercase text-slate-400">
                        Work Time
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm font-black text-slate-900">
                        <Timer size={16} className="text-[#123c8c]" />
                        {formatWorkMinutes(attendance.workMinutes)}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] font-black uppercase text-slate-400">
                        Late
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {attendance.lateMinutes || 0} menit
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white p-3 shadow-sm">
                      <p className="text-[11px] font-black uppercase text-slate-400">
                        Early
                      </p>
                      <p className="mt-2 text-sm font-black text-slate-900">
                        {attendance.earlyLeaveMinutes || 0} menit
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2">
                  <AttendanceSection
                    title="Check-in"
                    time={attendance.checkInTime}
                    photo={attendance.checkInPhoto}
                    latitude={attendance.checkInLatitude}
                    longitude={attendance.checkInLongitude}
                    locationLabel="Lokasi check-in"
                  />

                  <AttendanceSection
                    title="Check-out"
                    time={attendance.checkOutTime}
                    photo={attendance.checkOutPhoto}
                    latitude={attendance.checkOutLatitude}
                    longitude={attendance.checkOutLongitude}
                    locationLabel="Lokasi check-out"
                  />
                </div>

                {attendance.note && (
                  <div className="px-5 pb-5">
                    <div className="rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                      {attendance.note}
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <BottomNav />
    </MobileShell>
  );
}