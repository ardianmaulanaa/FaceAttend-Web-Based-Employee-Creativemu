"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock3,
  ExternalLink,
  ImageIcon,
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

function getStatusStyle(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("terlambat")) {
    return "bg-orange-50 text-orange-700 ring-orange-100";
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
    <div className="rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          <Icon size={22} strokeWidth={2.6} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>

          <h3 className="mt-1 text-xl font-black text-slate-950">{value}</h3>

          <p className="mt-1 text-xs font-bold text-slate-500">
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
    <div className="overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/60">
      <div className="flex items-center justify-between gap-4 border-b border-blue-50 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <Camera size={23} strokeWidth={2.6} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
              {title}
            </p>

            <h3 className="mt-1 text-lg font-black text-slate-950">
              {subtitle}
            </h3>
          </div>
        </div>

        {isAvailable ? (
          <div className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
            Tersedia
          </div>
        ) : (
          <div className="rounded-full bg-slate-50 px-3 py-2 text-xs font-black text-slate-500 ring-1 ring-slate-100">
            Kosong
          </div>
        )}
      </div>

      <div className="p-5">
        {isAvailable ? (
          <div className="overflow-hidden rounded-3xl bg-slate-100">
            <img
              src={imageUrl}
              alt={subtitle}
              className="h-80 w-full object-cover transition duration-300 hover:scale-[1.03]"
            />
          </div>
        ) : (
          <div className="flex h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
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
    <div className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <MapPin size={23} strokeWidth={2.6} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
              GPS Location
            </p>

            <h3 className="mt-1 text-lg font-black text-slate-950">
              {title}
            </h3>
          </div>
        </div>

        {hasLocation && (
          <div
            className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${
              location.withinRadius
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-red-50 text-red-700 ring-red-100"
            }`}
          >
            {location.withinRadius ? "Dalam radius" : "Di luar radius"}
          </div>
        )}
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
          </div>

          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition active:scale-[0.98]"
          >
            <Navigation size={18} strokeWidth={2.6} />
            Buka Lokasi di Google Maps
            <ExternalLink size={16} strokeWidth={2.6} />
          </a>
        </div>
      ) : (
        <div className="mt-5 flex min-h-52 flex-col items-center justify-center rounded-3xl border border-dashed border-blue-100 bg-[#f8fbff] p-6 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white text-slate-400 shadow-sm">
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
      <div className="h-44 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60" />
        <div className="h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60" />
        <div className="h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-96 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60" />
        <div className="h-96 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60" />
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
    <MobileShell variant="employee">
      <AppHeader
        title="Attendance Detail"
        subtitle="Foto dan lokasi GPS absensi"
        rightLabel="Detail"
      />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        

        {isLoading ? (
          <LoadingSkeleton />
        ) : !attendance ? (
          <div className="rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Data absensi tidak ditemukan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
              Data absensi ini tidak tersedia, sudah dihapus, atau tidak sesuai
              dengan akun yang sedang login.
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
            <div className="relative overflow-hidden rounded-[2rem] bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-8">
              <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-100 ring-1 ring-white/15">
                    <ShieldCheck size={16} />
                    Attendance Record
                  </div>

                  <h2 className="mt-5 text-3xl font-black capitalize tracking-tight md:text-5xl">
                    {attendance.date}
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
                  <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                      Check-in
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {attendance.checkIn}
                    </p>
                  </div>

                  <div className="rounded-3xl bg-white/10 p-5 ring-1 ring-white/15">
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

            <div className="grid gap-5 md:grid-cols-3">
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

            <div className="grid gap-5 lg:grid-cols-2">
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

            <div className="grid gap-5 lg:grid-cols-2">
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
    </MobileShell>
  );
}