"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
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

type LocationValue =
  | string
  | null
  | undefined
  | {
      latitude?: number | string | null;
      longitude?: number | string | null;
      lat?: number | string | null;
      lon?: number | string | null;
      lng?: number | string | null;
      accuracy?: number | string | null;
      distance?: number | string | null;
      withinRadius?: boolean | null;
      within_radius?: boolean | null;
      check_in_within_radius?: boolean | null;
      check_out_within_radius?: boolean | null;

      displayName?: string | null;
      display_name?: string | null;
      shortName?: string | null;
      short_name?: string | null;
      placeName?: string | null;
      place_name?: string | null;
      name?: string | null;

      road?: string | null;
      pedestrian?: string | null;
      footway?: string | null;
      path?: string | null;
      neighbourhood?: string | null;
      suburb?: string | null;
      village?: string | null;
      town?: string | null;
      city?: string | null;
      county?: string | null;
      municipality?: string | null;
      state_district?: string | null;
      state?: string | null;
      postcode?: string | null;
      country?: string | null;
      country_code?: string | null;

      address?: Record<string, unknown> | string | null;
      [key: string]: unknown;
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
  checkInLocation: LocationValue;
  checkOutLocation: LocationValue;
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
  const normalizedStatus = String(status || "").toLowerCase();

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

function cleanText(value: unknown) {
  return String(value || "").trim();
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function getObjectLocation(location: LocationValue) {
  if (!location || typeof location !== "object") return null;

  return location;
}

function getNestedAddress(location: LocationValue) {
  const objectLocation = getObjectLocation(location);

  if (!objectLocation) return null;

  const address = objectLocation.address;

  if (!address) return null;

  if (typeof address === "string") {
    return {
      displayName: address,
    } as Record<string, unknown>;
  }

  if (typeof address === "object") {
    return address as Record<string, unknown>;
  }

  return null;
}

function getLocationCoordinate(location: LocationValue, type: "lat" | "lng") {
  const objectLocation = getObjectLocation(location);

  if (!objectLocation) return null;

  if (type === "lat") {
    return toNumber(objectLocation.latitude ?? objectLocation.lat);
  }

  return toNumber(
    objectLocation.longitude ?? objectLocation.lng ?? objectLocation.lon,
  );
}

function getLocationWithinRadius(location: LocationValue) {
  const objectLocation = getObjectLocation(location);

  if (!objectLocation) return null;

  const value =
    objectLocation.withinRadius ??
    objectLocation.within_radius ??
    objectLocation.check_in_within_radius ??
    objectLocation.check_out_within_radius;

  if (typeof value === "boolean") return value;

  return null;
}

function formatAddressFromObject(value: Record<string, unknown>) {
  const displayName =
    cleanText(value.displayName) ||
    cleanText(value.display_name) ||
    cleanText(value.shortName) ||
    cleanText(value.short_name) ||
    cleanText(value.placeName) ||
    cleanText(value.place_name);

  if (displayName) return displayName;

  const place =
    cleanText(value.name) ||
    cleanText(value.office) ||
    cleanText(value.company) ||
    cleanText(value.building) ||
    cleanText(value.amenity) ||
    cleanText(value.shop) ||
    cleanText(value.tourism);

  const road =
    cleanText(value.road) ||
    cleanText(value.pedestrian) ||
    cleanText(value.footway) ||
    cleanText(value.path);

  const area =
    cleanText(value.neighbourhood) ||
    cleanText(value.suburb) ||
    cleanText(value.village);

  const city =
    cleanText(value.city) ||
    cleanText(value.town) ||
    cleanText(value.county) ||
    cleanText(value.municipality) ||
    cleanText(value.state_district);

  const state = cleanText(value.state);
  const postcode = cleanText(value.postcode);
  const country = cleanText(value.country);

  return [place, road, area, city, state, postcode, country]
    .filter(Boolean)
    .join(", ");
}

function formatLocationText(location: LocationValue) {
  if (!location) return "";

  if (typeof location === "string") {
    return location.trim();
  }

  if (typeof location === "object") {
    const directAddress = formatAddressFromObject(
      location as Record<string, unknown>,
    );

    if (directAddress) return directAddress;

    const nestedAddress = getNestedAddress(location);

    if (nestedAddress) {
      return formatAddressFromObject(nestedAddress);
    }
  }

  return "";
}

function HistoryDetailMotionStyles() {
  return (
    <style>{`
      @keyframes historyDetailEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes historyDetailRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes historyDetailIconPop {
        0% {
          opacity: 0;
          transform: scale(0.92) translateY(8px);
        }

        100% {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }

      @keyframes historyDetailImageEnter {
        0% {
          opacity: 0;
          transform: scale(1.025);
        }

        100% {
          opacity: 1;
          transform: scale(1);
        }
      }

      .history-detail-enter {
        animation: historyDetailEnter 340ms ease-out both;
      }

      .history-detail-row-enter {
        opacity: 0;
        animation: historyDetailRowEnter 300ms ease-out both;
      }

      .history-detail-icon-pop {
        animation: historyDetailIconPop 280ms ease-out both;
      }

      .history-detail-image-enter {
        animation: historyDetailImageEnter 420ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .history-detail-enter,
        .history-detail-row-enter,
        .history-detail-icon-pop,
        .history-detail-image-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

function MetricCard({
  label,
  value,
  description,
  icon: Icon,
  delay = "0ms",
}: {
  label: string;
  value: string;
  description: string;
  icon: LucideIcon;
  delay?: string;
}) {
  return (
    <div
      className="history-detail-row-enter rounded-3xl border border-blue-100 bg-white p-5 shadow-lg shadow-slate-200/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center gap-4">
        <div className="history-detail-icon-pop flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          <Icon size={22} strokeWidth={2.6} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
            {label}
          </p>

          <h3 className="mt-1 text-xl font-black text-slate-950">{value}</h3>

          <p className="mt-1 text-xs font-bold text-slate-500">{description}</p>
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
  delay = "0ms",
}: {
  title: string;
  subtitle: string;
  imageUrl: string;
  isAvailable: boolean;
  delay?: string;
}) {
  return (
    <div
      className="history-detail-row-enter min-w-0"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="history-detail-icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <Camera size={23} strokeWidth={2.6} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
              {title}
            </p>

            <h3 className="mt-1 text-base font-black text-slate-950">
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

      <div className="mt-4">
        {isAvailable ? (
          <div className="overflow-hidden rounded-2xl bg-slate-100">
            <img
              src={imageUrl}
              alt={subtitle}
              className="history-detail-image-enter h-60 w-full object-cover transition duration-300 hover:scale-[1.02] md:h-72"
            />
          </div>
        ) : (
          <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl bg-slate-50 p-6 text-center md:min-h-72">
            <div className="history-detail-icon-pop flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
              <ImageIcon size={30} strokeWidth={2.4} />
            </div>

            <h4 className="mt-4 text-base font-black text-slate-700">
              Foto belum tersedia
            </h4>

            <p className="mt-2 max-w-xs text-sm font-semibold leading-6 text-slate-400">
              Foto presensi belum tersimpan pada data ini.
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
  delay = "0ms",
}: {
  title: string;
  location: LocationValue;
  delay?: string;
}) {
  const latitude = getLocationCoordinate(location, "lat");
  const longitude = getLocationCoordinate(location, "lng");
  const withinRadius = getLocationWithinRadius(location);
  const locationText = formatLocationText(location);

  const hasCoordinate = latitude !== null && longitude !== null;
  const hasAddress = Boolean(locationText);

  const mapsUrl = hasCoordinate
    ? `https://www.google.com/maps?q=${latitude},${longitude}`
    : "#";

  return (
    <div
      className="history-detail-row-enter min-w-0"
      style={{ animationDelay: delay }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="history-detail-icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <MapPin size={23} strokeWidth={2.6} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
              Lokasi GPS
            </p>

            <h3 className="mt-1 text-base font-black text-slate-950">
              {title}
            </h3>
          </div>
        </div>

        {withinRadius !== null ? (
          <div
            className={`rounded-full px-3 py-2 text-xs font-black ring-1 ${
              withinRadius
                ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                : "bg-red-50 text-red-700 ring-red-100"
            }`}
          >
            {withinRadius ? "Dalam radius" : "Di luar radius"}
          </div>
        ) : hasCoordinate || hasAddress ? (
          <div className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 ring-1 ring-emerald-100">
            Tersimpan
          </div>
        ) : null}
      </div>

      {hasCoordinate || hasAddress ? (
        <div className="mt-4">
          {hasCoordinate ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#123c8c] px-4 py-3 text-sm font-black text-white shadow-md shadow-blue-900/15 transition hover:bg-[#0f3274] active:scale-[0.98] sm:w-auto"
            >
              <Navigation size={17} strokeWidth={2.6} />
              Buka Lokasi di Google Maps
              <ExternalLink size={15} strokeWidth={2.6} />
            </a>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div className="history-detail-icon-pop flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
            <MapPin size={22} strokeWidth={2.4} />
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-black text-slate-700">
              Lokasi belum tersedia
            </h4>

            <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-400">
              Data lokasi belum tersimpan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5">
      <div className="history-detail-enter h-44 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60" />

      <div className="grid gap-5 lg:grid-cols-3">
        <div
          className="history-detail-row-enter h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60"
          style={{ animationDelay: "60ms" }}
        />
        <div
          className="history-detail-row-enter h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60"
          style={{ animationDelay: "100ms" }}
        />
        <div
          className="history-detail-row-enter h-28 animate-pulse rounded-3xl bg-white shadow-lg shadow-slate-200/60"
          style={{ animationDelay: "140ms" }}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div
          className="history-detail-row-enter h-96 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60"
          style={{ animationDelay: "180ms" }}
        />
        <div
          className="history-detail-row-enter h-96 animate-pulse rounded-[2rem] bg-white shadow-lg shadow-slate-200/60"
          style={{ animationDelay: "220ms" }}
        />
      </div>
    </div>
  );
}

export default function HistoryDetailPage() {
  const params = useParams();
  const id = String(params.id || "");

  const [attendance, setAttendance] = useState<AttendanceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function getDetail() {
      try {
        setIsLoading(true);

        const response = await fetch(`/api/attendance/${id}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          setAttendance(null);
          return;
        }

        const data = (await response.json()) as AttendanceDetail;
        setAttendance(data);
      } catch (error) {
        console.error("Gagal mengambil detail presensi:", error);
        setAttendance(null);
      } finally {
        setIsLoading(false);
      }
    }

    if (id) {
      void getDetail();
    }
  }, [id]);

  return (
    <MobileShell variant="employee">
      <HistoryDetailMotionStyles />

      <AppHeader title="Detail Presensi" rightLabel="Detail" />

      <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
        <Link
          href="/history"
          className="history-detail-row-enter inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition hover:-translate-y-0.5 hover:bg-[#f8fbff] active:scale-[0.98]"
        >
          <ArrowLeft size={18} strokeWidth={2.7} />
          Kembali ke History
        </Link>

        {isLoading ? (
          <LoadingSkeleton />
        ) : !attendance ? (
          <div className="history-detail-enter rounded-[2rem] border border-red-100 bg-white p-8 text-center shadow-xl shadow-slate-200/60">
            <div className="history-detail-icon-pop mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-red-50 text-red-600">
              <AlertCircle size={32} strokeWidth={2.5} />
            </div>

            <h2 className="mt-5 text-2xl font-black text-slate-950">
              Data presensi tidak ditemukan
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm font-semibold leading-6 text-slate-500">
              Data presensi ini tidak tersedia, sudah dihapus, atau tidak sesuai
              dengan akun yang sedang login.
            </p>

            <Link
              href="/history"
              className="mt-6 inline-flex rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white transition hover:bg-[#0f3274] active:scale-[0.98]"
            >
              Kembali ke Riwayat
            </Link>
          </div>
        ) : (
          <>
            <div className="history-detail-enter relative overflow-hidden rounded-[2rem] bg-[#123c8c] p-6 text-white shadow-2xl shadow-blue-900/25 md:p-8">
              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="history-detail-row-enter inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-blue-100 ring-1 ring-white/15">
                    <ShieldCheck size={16} />
                    Catatan Presensi
                  </div>

                  <h2
                    className="history-detail-row-enter mt-5 text-3xl font-black capitalize tracking-tight md:text-5xl"
                    style={{ animationDelay: "80ms" }}
                  >
                    {attendance.date}
                  </h2>

                  <div
                    className={`history-detail-row-enter mt-5 inline-flex rounded-full px-4 py-2 text-sm font-black ring-1 ${getStatusStyle(
                      attendance.status,
                    )}`}
                    style={{ animationDelay: "120ms" }}
                  >
                    {attendance.status}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div
                    className="history-detail-row-enter rounded-3xl bg-white/10 p-5 ring-1 ring-white/15"
                    style={{ animationDelay: "160ms" }}
                  >
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-100">
                      Check-in
                    </p>

                    <p className="mt-2 text-3xl font-black">
                      {attendance.checkIn}
                    </p>
                  </div>

                  <div
                    className="history-detail-row-enter rounded-3xl bg-white/10 p-5 ring-1 ring-white/15"
                    style={{ animationDelay: "200ms" }}
                  >
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
                label="Waktu Kerja"
                value={formatMinutes(attendance.workMinutes)}
                description="Total durasi kerja tercatat"
                icon={Timer}
                delay="60ms"
              />

              <MetricCard
                label="Terlambat"
                value={formatMinutes(attendance.lateMinutes)}
                description="Keterlambatan check-in"
                icon={Clock3}
                delay="100ms"
              />

              <MetricCard
                label="Pulang Cepat"
                value={formatMinutes(attendance.earlyLeaveMinutes)}
                description="Pulang lebih awal"
                icon={CheckCircle2}
                delay="140ms"
              />
            </div>

            <section className="history-detail-row-enter rounded-[1.75rem] bg-white p-5 shadow-lg shadow-slate-200/50">
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-4">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                  Dokumentasi
                </p>
                <h3 className="text-xl font-black text-slate-950">
                  Foto Presensi
                </h3>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                <PhotoCard
                  title="Foto Check-in"
                  subtitle="Foto presensi masuk"
                  imageUrl={`/api/attendance/${attendance.id}/photo?type=check-in`}
                  isAvailable={attendance.hasCheckInPhoto}
                  delay="180ms"
                />

                <PhotoCard
                  title="Foto Check-out"
                  subtitle="Foto presensi pulang"
                  imageUrl={`/api/attendance/${attendance.id}/photo?type=check-out`}
                  isAvailable={attendance.hasCheckOutPhoto}
                  delay="220ms"
                />
              </div>
            </section>

            <section className="history-detail-row-enter rounded-2xl bg-white p-4 shadow-md shadow-slate-200/40 md:p-5">
              <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#123c8c]">
                  GPS
                </p>
                <h3 className="text-lg font-black text-slate-950">
                  Lokasi Presensi
                </h3>
              </div>

              <div className="mt-4 grid gap-4 divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
                <LocationCard
                  title="Lokasi Check-in"
                  location={attendance.checkInLocation}
                  delay="260ms"
                />

                <div className="pt-4 lg:pl-4 lg:pt-0">
                  <LocationCard
                    title="Lokasi Check-out"
                    location={attendance.checkOutLocation}
                    delay="300ms"
                  />
                </div>
              </div>
            </section>
          </>
        )}
      </section>

      <BottomNav />
    </MobileShell>
  );
}
