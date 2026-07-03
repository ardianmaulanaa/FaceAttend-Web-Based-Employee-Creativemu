"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  ExternalLink,
  ImageIcon,
  Loader2,
  MapPin,
  Navigation,
  ShieldCheck,
  Timer,
  type LucideIcon,
} from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import MobileShell from "@/components/MobileShell";

type LocationData = {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  distance: number | null;
  withinRadius: boolean;
};

type AttendanceDetail = {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: string;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  workMinutes: number;
  hasCheckInPhoto: boolean;
  hasCheckOutPhoto: boolean;
  checkInLocation: LocationData;
  checkOutLocation: LocationData;
};

function formatMinutes(minutes: number) {
  if (!minutes || minutes <= 0) return "0 menit";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0 && remainingMinutes > 0) {
    return `${hours} jam ${remainingMinutes} menit`;
  }

  if (hours > 0) {
    return `${hours} jam`;
  }

  return `${remainingMinutes} menit`;
}

function formatDateLabel(date: string) {
  if (!date) return "-";

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return date;

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function getStatusStyle(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("terlambat")) {
    return "bg-orange-50 text-orange-700 ring-orange-100";
  }

  if (normalizedStatus.includes("pulang cepat")) {
    return "bg-amber-50 text-amber-700 ring-amber-100";
  }

  if (normalizedStatus.includes("cuti")) {
    return "bg-purple-50 text-purple-700 ring-purple-100";
  }

  if (normalizedStatus.includes("sakit")) {
    return "bg-rose-50 text-rose-700 ring-rose-100";
  }

  if (normalizedStatus.includes("tidak")) {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-100";
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-3xl border border-blue-100 bg-[#f8fbff] p-4 md:p-5">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          <Icon size={22} strokeWidth={2.6} />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>

          <h3 className="mt-1 truncate text-lg font-black text-slate-950 md:text-xl">
            {value}
          </h3>

          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function PhotoCard({
  title,
  subtitle,
  imageUrl,
  isAvailable,
}: {
  title: string;
  subtitle: string;
  imageUrl: string;
  isAvailable: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white">
      <div className="flex items-center justify-between gap-4 border-b border-blue-50 p-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <Camera size={23} strokeWidth={2.6} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
              {title}
            </p>

            <h3 className="mt-1 truncate text-lg font-black text-slate-950">
              {subtitle}
            </h3>
          </div>
        </div>

        <div
          className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${
            isAvailable
              ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
              : "bg-slate-50 text-slate-500 ring-slate-100"
          }`}
        >
          {isAvailable ? "Tersedia" : "Kosong"}
        </div>
      </div>

      <div className="p-5">
        {isAvailable ? (
          <div className="overflow-hidden rounded-3xl bg-slate-100">
            <img
              src={imageUrl}
              alt={subtitle}
              className="h-72 w-full object-cover md:h-80"
            />
          </div>
        ) : (
          <div className="flex h-72 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] p-6 text-center md:h-80">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400">
              <ImageIcon size={30} strokeWidth={2.4} />
            </div>

            <h4 className="mt-4 text-base font-black text-slate-700">
              Foto belum tersedia
            </h4>

            <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-slate-400">
              Foto absensi belum tersimpan pada data ini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LocationCard({
  title,
  location,
}: {
  title: string;
  location: LocationData;
}) {
  const [address, setAddress] = useState("");
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);

  const hasLocation =
    location.latitude !== null && location.longitude !== null;

  const mapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
    : "#";

  useEffect(() => {
    async function getAddress() {
      if (!hasLocation) return;

      try {
        setIsLoadingAddress(true);

        const response = await fetch(
          `/api/geocode/reverse?lat=${location.latitude}&lon=${location.longitude}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setAddress("Alamat lokasi tidak berhasil ditemukan.");
          return;
        }

        const data = await response.json();

        setAddress(data.address || "Alamat lokasi tidak ditemukan.");
      } catch (error) {
        console.error("Gagal mengambil alamat:", error);
        setAddress("Alamat lokasi tidak berhasil ditemukan.");
      } finally {
        setIsLoadingAddress(false);
      }
    }

    getAddress();
  }, [hasLocation, location.latitude, location.longitude]);

  return (
    <div className="rounded-[2rem] border border-blue-100 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <MapPin size={23} strokeWidth={2.6} />
          </div>

          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
              GPS Location
            </p>

            <h3 className="mt-1 truncate text-lg font-black text-slate-950">
              {title}
            </h3>
          </div>
        </div>

        {hasLocation ? (
          <div
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-black ring-1 ${
              location.withinRadius
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-red-50 text-red-700 ring-red-100"
            }`}
          >
            {location.withinRadius ? "Dalam radius" : "Di luar radius"}
          </div>
        ) : null}
      </div>

      {hasLocation ? (
        <div className="mt-5 space-y-4">
          <div className="rounded-3xl bg-[#f8fbff] p-5">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Perkiraan Alamat Terdekat
            </p>

            <p className="mt-3 text-sm font-bold leading-7 text-slate-700">
              {isLoadingAddress
                ? "Mencari alamat terdekat..."
                : address || "Alamat sedang dimuat..."}
            </p>
          </div>

          <div
            className={`rounded-3xl p-5 ${
              location.withinRadius
                ? "bg-emerald-50 text-emerald-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <p className="text-sm font-black">
              {location.withinRadius
                ? "Karyawan berada di dalam radius kantor saat absensi."
                : "Karyawan berada di luar radius kantor saat absensi."}
            </p>

            <div className="mt-3 grid gap-2 text-sm font-semibold opacity-90">
              <p>Latitude: {location.latitude}</p>
              <p>Longitude: {location.longitude}</p>
              <p>
                Akurasi:{" "}
                {location.accuracy !== null
                  ? `±${Math.round(location.accuracy)} meter`
                  : "-"}
              </p>
              <p>
                Jarak:{" "}
                {location.distance !== null
                  ? `${Math.round(location.distance)} meter`
                  : "-"}
              </p>
            </div>
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white transition active:scale-[0.98]"
          >
            <Navigation size={18} strokeWidth={2.6} />
            Buka Lokasi di Google Maps
            <ExternalLink size={16} strokeWidth={2.6} />
          </a>
        </div>
      ) : (
        <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400">
            <MapPin size={30} strokeWidth={2.4} />
          </div>

          <h4 className="mt-4 text-base font-black text-slate-700">
            Lokasi belum tersedia
          </h4>

          <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-slate-400">
            Data lokasi belum tersimpan untuk absensi ini.
          </p>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="h-44 animate-pulse rounded-[2rem] bg-[#f8fbff]" />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-28 animate-pulse rounded-3xl bg-[#f8fbff]" />
        <div className="h-28 animate-pulse rounded-3xl bg-[#f8fbff]" />
        <div className="h-28 animate-pulse rounded-3xl bg-[#f8fbff]" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[2rem] bg-[#f8fbff]" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-[#f8fbff]" />
      </div>
    </div>
  );
}

export default function HistoryDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [attendance, setAttendance] = useState<AttendanceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getDetail() {
      try {
        const response = await fetch(`/api/attendance/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setAttendance(null);
          return;
        }

        const data = await response.json();
        setAttendance(data);
      } catch (error) {
        console.error("Gagal mengambil detail absensi:", error);
        setAttendance(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      getDetail();
    }
  }, [id]);

  return (
    <MobileShell variant="employee" withBottomPadding={false}>
      <div className="hidden md:block">
        <AppHeader
          title="Attendance Detail"
          subtitle="Foto dan lokasi GPS absensi"
          rightLabel="Detail"
          variant="employee"
        />
      </div>

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff] pb-28 text-slate-950">
        <section className="mx-auto max-w-7xl px-5 pt-7 md:hidden">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-[#123c8c]">
                FaceAttend
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-[#073456]">
                Detail Presensi
              </h1>

              <p className="mt-2 text-sm font-bold text-slate-500">
                Foto, waktu, dan lokasi absensi.
              </p>
            </div>

            <Link
              href="/history"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] text-white ring-1 ring-[#123c8c] active:scale-[0.96]"
              aria-label="Kembali"
            >
              <ChevronLeft size={25} strokeWidth={2.8} />
            </Link>
          </div>
        </section>

        <section className="mx-auto hidden max-w-7xl px-10 pt-8 md:block lg:px-16">
          <div className="relative overflow-hidden rounded-[2.2rem] bg-[#123c8c] p-8 text-white">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
            <div className="absolute bottom-[-7rem] right-24 h-60 w-60 rounded-full bg-blue-300/10" />

            <div className="relative z-10 flex items-center justify-between gap-8">
              <div className="flex items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.6rem] bg-white/15 text-white ring-1 ring-white/20">
                  <ShieldCheck size={38} strokeWidth={2.5} />
                </div>

                <div>
                  <h1 className="text-4xl font-black tracking-tight">
                    Detail Presensi
                  </h1>

                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-blue-100">
                    Lihat bukti presensi berupa status kehadiran, foto
                    check-in, foto check-out, lokasi GPS, dan durasi kerja.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                      Detail
                    </span>

                    {attendance?.date ? (
                      <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/20">
                        {formatDateLabel(attendance.date)}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              <Link
                href="/history"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white/80 ring-1 ring-white/20 active:scale-[0.96]"
                aria-label="Kembali"
              >
                <ChevronLeft size={30} strokeWidth={2.6} />
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl rounded-t-[2.5rem] bg-white px-5 pb-10 pt-8 md:mt-8 md:rounded-[2.5rem] md:px-8 lg:px-10">
          {isLoading ? (
            <LoadingSkeleton />
          ) : !attendance ? (
            <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
                <AlertCircle size={32} strokeWidth={2.5} />
              </div>

              <h2 className="mt-5 text-2xl font-black text-slate-950">
                Data absensi tidak ditemukan
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
                Data absensi ini tidak tersedia, sudah dihapus, atau tidak
                sesuai dengan akun yang sedang login.
              </p>

              <Link
                href="/history"
                className="mt-6 inline-flex rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white"
              >
                Kembali ke Riwayat
              </Link>
            </div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-[2rem] bg-[#123c8c] p-6 text-white md:p-8">
                <div className="absolute -right-16 -top-20 h-60 w-60 rounded-full bg-white/10" />
                <div className="absolute bottom-[-7rem] right-24 h-56 w-56 rounded-full bg-blue-300/10" />

                <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-100 ring-1 ring-white/15">
                      <ShieldCheck size={16} />
                      Attendance Record
                    </div>

                    <h2 className="mt-5 text-3xl font-black capitalize tracking-tight md:text-5xl">
                      {formatDateLabel(attendance.date)}
                    </h2>

                    <div
                      className={`mt-5 inline-flex rounded-full px-4 py-2 text-sm font-black ring-1 ${getStatusStyle(
                        attendance.status
                      )}`}
                    >
                      {attendance.status}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl bg-white/15 p-5 ring-1 ring-white/15">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                        Check-in
                      </p>

                      <p className="mt-2 text-3xl font-black">
                        {attendance.checkIn}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-white/15 p-5 ring-1 ring-white/15">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                        Check-out
                      </p>

                      <p className="mt-2 text-3xl font-black">
                        {attendance.checkOut}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-3">
                <MetricCard
                  label="Work Time"
                  value={formatMinutes(attendance.workMinutes)}
                  description="Total durasi kerja tercatat"
                  icon={Timer}
                />

                <MetricCard
                  label="Late"
                  value={formatMinutes(attendance.lateMinutes)}
                  description="Keterlambatan check-in"
                  icon={Clock3}
                />

                <MetricCard
                  label="Early Leave"
                  value={formatMinutes(attendance.earlyLeaveMinutes)}
                  description="Pulang lebih awal"
                  icon={CheckCircle2}
                />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <PhotoCard
                  title="Check-in Photo"
                  subtitle="Foto absensi masuk"
                  imageUrl={`/api/attendance/${attendance.id}/photo?type=check-in`}
                  isAvailable={attendance.hasCheckInPhoto}
                />

                <PhotoCard
                  title="Check-out Photo"
                  subtitle="Foto absensi pulang"
                  imageUrl={`/api/attendance/${attendance.id}/photo?type=check-out`}
                  isAvailable={attendance.hasCheckOutPhoto}
                />
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <LocationCard
                  title="Lokasi Check-in"
                  location={attendance.checkInLocation}
                />

                <LocationCard
                  title="Lokasi Check-out"
                  location={attendance.checkOutLocation}
                />
              </div>
            </>
          )}
        </section>

        <BottomNav />
      </main>
    </MobileShell>
  );
}