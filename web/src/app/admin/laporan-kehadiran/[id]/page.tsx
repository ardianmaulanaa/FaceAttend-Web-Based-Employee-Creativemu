"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  ImageIcon,
  Loader2,
  MapPin,
  Navigation,
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

  profilePhoto?: string | null;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  avatar_url?: string | null;
  image?: string | null;
  image_url?: string | null;

  checkOutWorkMode?: string | null;
  check_out_work_mode?: string | null;
  checkoutWorkMode?: string | null;
  checkOutWorkModeLabel?: string | null;

  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  proofPhoto: string | null;

  officeName: string | null;
  officeAddress: string | null;
  officeLatitude: number | null;
  officeLongitude: number | null;

  attendanceLatitude?: number | null;
  attendanceLongitude?: number | null;

  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInAccuracy?: number | null;

  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutAccuracy?: number | null;

  visitTitle?: string | null;
  visitClientName?: string | null;
  visitAddress?: string | null;
  visitNote?: string | null;

  checkOutVisitTitle?: string | null;
  checkOutVisitClientName?: string | null;
  checkOutVisitAddress?: string | null;
  checkOutVisitNote?: string | null;

  lateReason: string | null;
};

type AttendanceReportDetailResponse = {
  success: boolean;
  message?: string;
  report: AttendanceReportDetail | null;
};

type ReverseGeocodeResult = {
  displayName: string;
  shortName: string;
  placeName: string;
};

type ReverseGeocodeResponse = {
  success?: boolean;
  display_name?: string;
  displayName?: string;
  name?: string;
  placeName?: string;
  address?: Record<string, string | undefined>;
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

  if (
    normalized === "present" ||
    normalized === "hadir" ||
    normalized.includes("masuk kerja")
  ) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (
    normalized === "late" ||
    normalized === "terlambat" ||
    normalized.includes("cuti") ||
    normalized.includes("sakit") ||
    normalized.includes("izin") ||
    normalized.includes("tidak")
  ) {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

function normalizeMode(value?: string | null) {
  const normalized = String(value || "")
    .toLowerCase()
    .trim();

  if (normalized === "office" || normalized === "kantor") return "office";
  if (normalized === "wfh") return "wfh";
  if (normalized === "wfc") return "wfc";
  if (normalized === "visit" || normalized === "kunjungan") return "visit";

  return normalized;
}

function formatModeLabel(value?: string | null) {
  const mode = normalizeMode(value);

  if (mode === "office") return "Kantor";
  if (mode === "wfh") return "WFH";
  if (mode === "wfc") return "WFC";
  if (mode === "visit") return "Kunjungan";

  return value || "Kantor";
}

function getCheckOutMode(report: AttendanceReportDetail) {
  return (
    report.checkOutWorkMode ||
    report.check_out_work_mode ||
    report.checkoutWorkMode ||
    null
  );
}

function hasText(value?: string | null) {
  return Boolean(String(value || "").trim());
}

function normalizeProfilePhotoUrl(value?: string | null) {
  const raw = String(value || "").trim();

  if (!raw) return "";

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  if (raw.startsWith("/")) {
    return raw;
  }

  return `/${raw}`;
}

function getEmployeeProfilePhoto(report: AttendanceReportDetail) {
  return normalizeProfilePhotoUrl(
    report.profilePhoto ||
      report.profile_photo ||
      report.profile_photo_url ||
      report.photo_url ||
      report.avatar_url ||
      report.image ||
      report.image_url ||
      null,
  );
}

function getVisitTitle(report: AttendanceReportDetail) {
  return report.checkOutVisitTitle || report.visitTitle || null;
}

function getVisitClientName(report: AttendanceReportDetail) {
  return report.checkOutVisitClientName || report.visitClientName || null;
}

function getVisitAddress(report: AttendanceReportDetail) {
  return report.checkOutVisitAddress || report.visitAddress || null;
}

function getVisitNote(report: AttendanceReportDetail) {
  return report.checkOutVisitNote || report.visitNote || null;
}

function isLateReport(report: AttendanceReportDetail) {
  const status = String(report.status || "").toLowerCase();
  const label = String(report.statusLabel || "").toLowerCase();

  return (
    status.includes("late") ||
    status.includes("terlambat") ||
    label.includes("late") ||
    label.includes("terlambat") ||
    hasText(report.lateReason)
  );
}

function isCheckOutVisitReport(report: AttendanceReportDetail) {
  return normalizeMode(getCheckOutMode(report)) === "visit";
}

function hasVisitReport(report: AttendanceReportDetail) {
  const mainMode = normalizeMode(report.workMode);
  const label = String(report.workModeLabel || "").toLowerCase();

  return (
    mainMode === "visit" ||
    isCheckOutVisitReport(report) ||
    label.includes("visit") ||
    label.includes("kunjungan") ||
    hasText(getVisitTitle(report)) ||
    hasText(getVisitClientName(report)) ||
    hasText(getVisitAddress(report)) ||
    hasText(getVisitNote(report))
  );
}

function cleanAddressPart(value?: string | null) {
  return String(value || "").trim();
}

function buildNearestAddress(address?: Record<string, string | undefined>) {
  if (!address) return "";

  const place =
    cleanAddressPart(address.office) ||
    cleanAddressPart(address.company) ||
    cleanAddressPart(address.building) ||
    cleanAddressPart(address.amenity) ||
    cleanAddressPart(address.shop) ||
    cleanAddressPart(address.tourism) ||
    cleanAddressPart(address.name);

  const road =
    cleanAddressPart(address.road) ||
    cleanAddressPart(address.pedestrian) ||
    cleanAddressPart(address.footway) ||
    cleanAddressPart(address.path);

  const neighbourhood =
    cleanAddressPart(address.neighbourhood) ||
    cleanAddressPart(address.suburb) ||
    cleanAddressPart(address.hamlet) ||
    cleanAddressPart(address.village);

  const city =
    cleanAddressPart(address.city) ||
    cleanAddressPart(address.town) ||
    cleanAddressPart(address.county);

  const state = cleanAddressPart(address.state);
  const postcode = cleanAddressPart(address.postcode);

  return [place, road, neighbourhood, city, state, postcode]
    .filter(Boolean)
    .join(", ");
}

function extractPlaceName(data: ReverseGeocodeResponse) {
  const address = data.address || {};

  return (
    cleanAddressPart(data.placeName) ||
    cleanAddressPart(data.name) ||
    cleanAddressPart(address.office) ||
    cleanAddressPart(address.company) ||
    cleanAddressPart(address.building) ||
    cleanAddressPart(address.amenity) ||
    cleanAddressPart(address.shop) ||
    cleanAddressPart(address.tourism) ||
    cleanAddressPart(address.name)
  );
}

function normalizeReverseGeocode(data: ReverseGeocodeResponse) {
  const displayName =
    cleanAddressPart(data.displayName) ||
    cleanAddressPart(data.display_name) ||
    buildNearestAddress(data.address);

  const placeName = extractPlaceName(data);
  const shortName = buildNearestAddress(data.address) || displayName;

  return {
    displayName,
    shortName,
    placeName,
  };
}

async function reverseGeocode(
  latitude?: number | null,
  longitude?: number | null,
): Promise<ReverseGeocodeResult | null> {
  if (latitude === null || latitude === undefined) return null;
  if (longitude === null || longitude === undefined) return null;

  try {
    const response = await fetch(
      `/api/geocode/reverse?lat=${encodeURIComponent(
        latitude,
      )}&lon=${encodeURIComponent(longitude)}`,
      {
        method: "GET",
        cache: "no-store",
      },
    );

    const data = (await readJsonResponse(response)) as ReverseGeocodeResponse;

    if (!response.ok) return null;

    const normalized = normalizeReverseGeocode(data);

    if (!normalized.displayName && !normalized.shortName) return null;

    return normalized;
  } catch (error) {
    console.warn(
      "REVERSE_GEOCODE_WARNING:",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

function AttendanceDetailMotionStyles() {
  return (
    <style>{`
      @keyframes attendanceDetailEnter {
        0% {
          opacity: 0;
          transform: translateY(14px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes attendanceDetailRowEnter {
        0% {
          opacity: 0;
          transform: translateY(10px);
        }

        100% {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes attendanceDetailAvatarEnter {
        0% {
          opacity: 0;
          transform: translateY(8px) scale(0.94);
        }

        100% {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .attendance-detail-enter {
        animation: attendanceDetailEnter 320ms ease-out both;
      }

      .attendance-detail-row-enter {
        opacity: 0;
        animation: attendanceDetailRowEnter 300ms ease-out both;
      }

      .attendance-detail-avatar-enter {
        animation: attendanceDetailAvatarEnter 320ms ease-out both;
      }

      @media (prefers-reduced-motion: reduce) {
        .attendance-detail-enter,
        .attendance-detail-row-enter,
        .attendance-detail-avatar-enter {
          animation: none !important;
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `}</style>
  );
}

function PhotoCard({
  title,
  subtitle,
  imageUrl,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  imageUrl: string | null;
  delay?: number;
}) {
  return (
    <div
      className="attendance-detail-row-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-300/40"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="border-b border-blue-50 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
          {title}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
      </div>

      {imageUrl ? (
        <div className="bg-[#f8fbff] p-4">
          <div className="mx-auto max-w-[320px] overflow-hidden rounded-[1.3rem] bg-slate-950 shadow-lg shadow-slate-300/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

function EmployeeNotesSection({
  report,
  delay = 0,
}: {
  report: AttendanceReportDetail;
  delay?: number;
}) {
  const shouldShowLate = isLateReport(report);
  const shouldShowVisit = hasVisitReport(report);

  if (!shouldShowLate && !shouldShowVisit) return null;

  const visitTitle = getVisitTitle(report);
  const visitClientName = getVisitClientName(report);
  const visitAddress = getVisitAddress(report);
  const visitNote = getVisitNote(report);
  const isCheckoutVisit = isCheckOutVisitReport(report);
  const visitModeLabel = isCheckoutVisit
    ? "Kunjungan saat check-out"
    : "Kunjungan";

  return (
    <section
      className="attendance-detail-row-enter rounded-[1.7rem] border border-blue-100 bg-white p-4 shadow-xl shadow-slate-200/60 md:p-5"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
          <BriefcaseBusiness size={21} strokeWidth={2.7} />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#123c8c]">
            Keterangan Karyawan
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Catatan terlambat atau kunjungan dari karyawan.
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {shouldShowLate ? (
          <div className="attendance-detail-row-enter rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-amber-700 ring-1 ring-amber-100">
                <Clock3 size={21} strokeWidth={2.7} />
              </div>

              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-700">
                  Keterangan Terlambat
                </p>

                <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                  {report.lateReason?.trim() ||
                    "Belum ada alasan terlambat yang tersimpan."}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {shouldShowVisit ? (
          <div className="attendance-detail-row-enter rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-orange-600 ring-1 ring-orange-100">
                <BriefcaseBusiness size={21} strokeWidth={2.7} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-orange-600">
                    Keterangan Kunjungan
                  </p>

                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-orange-700 ring-1 ring-orange-100">
                    {visitModeLabel}
                  </span>
                </div>

                <p className="mt-2 text-sm font-black leading-6 text-slate-900">
                  {visitTitle || "Tujuan kunjungan belum diisi"}
                </p>

                <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-600 md:grid-cols-2">
                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-orange-100">
                    <span className="text-orange-600">PIC / Client: </span>
                    {visitClientName || "Belum diisi"}
                  </div>

                  <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-orange-100">
                    <span className="text-orange-600">Alamat: </span>
                    {visitAddress || "Belum diisi"}
                  </div>
                </div>

                {visitNote ? (
                  <div className="mt-2 rounded-xl bg-white px-3 py-2 text-xs font-bold leading-5 text-slate-600 ring-1 ring-orange-100">
                    <span className="text-orange-600">Catatan: </span>
                    {visitNote}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function GpsLocationCard({
  title,
  subtitle,
  latitude,
  longitude,
  accuracy,
  reverseResult,
  isLoadingAddress,
  delay = 0,
}: {
  title: string;
  subtitle: string;
  latitude?: number | null;
  longitude?: number | null;
  accuracy?: number | null;
  reverseResult: ReverseGeocodeResult | null;
  isLoadingAddress?: boolean;
  delay?: number;
}) {
  const hasGps =
    latitude !== null &&
    latitude !== undefined &&
    longitude !== null &&
    longitude !== undefined;

  const nearestLocation =
    reverseResult?.placeName ||
    reverseResult?.shortName ||
    reverseResult?.displayName ||
    "";

  const mainTitle = hasGps
    ? nearestLocation ||
      (isLoadingAddress
        ? "Mencari lokasi terdekat..."
        : "Lokasi terdekat belum terbaca")
    : "GPS belum tersedia";

  const description = hasGps
    ? reverseResult?.displayName ||
      reverseResult?.shortName ||
      (isLoadingAddress
        ? "Sistem sedang menerjemahkan koordinat GPS menjadi nama lokasi terdekat."
        : "Koordinat GPS berhasil disimpan, tetapi nama wilayah terdekat belum berhasil dibaca.")
    : subtitle;

  return (
    <div
      className="attendance-detail-row-enter rounded-[1.5rem] border border-blue-100 bg-white p-4 shadow-lg shadow-slate-200/50 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-300/40"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#123c8c]">
            <Navigation size={21} strokeWidth={2.6} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#123c8c]">
                {title}
              </p>

              {isLoadingAddress && hasGps ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-black text-[#123c8c] ring-1 ring-blue-100">
                  <Loader2 size={11} className="animate-spin" />
                  Membaca
                </span>
              ) : hasGps ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[9px] font-black text-emerald-700 ring-1 ring-emerald-100">
                  GPS Terbaca
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[9px] font-black text-slate-500 ring-1 ring-slate-200">
                  GPS Kosong
                </span>
              )}
            </div>

            <div className="mt-3 rounded-2xl bg-[#f8fbff] p-3 ring-1 ring-blue-50">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Lokasi Terdekat
              </p>

              <p className="mt-1.5 break-words text-sm font-black leading-5 text-slate-950">
                {mainTitle}
              </p>

              <p className="mt-1.5 line-clamp-2 break-words text-xs font-semibold leading-5 text-slate-500">
                {description}
              </p>
            </div>

            {hasGps ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-50 px-2.5 py-1.5 text-[11px] font-black text-slate-600 ring-1 ring-slate-100">
                  Akurasi:{" "}
                  {accuracy !== null && accuracy !== undefined
                    ? `±${Math.round(accuracy)} meter`
                    : "-"}
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {hasGps ? (
          <a
            href={`https://www.google.com/maps?q=${latitude},${longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-[#123c8c] px-4 py-2.5 text-xs font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
          >
            Buka Maps
          </a>
        ) : null}
      </div>
    </div>
  );
}

function OfficeLocationCard({
  report,
  delay = 0,
}: {
  report: AttendanceReportDetail;
  delay?: number;
}) {
  return (
    <div
      className="attendance-detail-row-enter rounded-[2rem] border border-blue-100 bg-white p-5 shadow-xl shadow-slate-200/60 transition duration-200 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-slate-300/40"
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
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

        {report.officeLatitude !== null && report.officeLongitude !== null ? (
          <a
            href={`https://www.google.com/maps?q=${report.officeLatitude},${report.officeLongitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-2xl bg-[#123c8c] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:bg-[#0f3274] active:scale-[0.98]"
          >
            Buka Maps
          </a>
        ) : null}
      </div>
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

  const [checkInAddress, setCheckInAddress] =
    useState<ReverseGeocodeResult | null>(null);
  const [checkOutAddress, setCheckOutAddress] =
    useState<ReverseGeocodeResult | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);

  const primaryCheckInPhoto =
    report?.checkInPhoto || report?.proofPhoto || null;

  const shouldShowOfficeLocation = useMemo(() => {
    if (!report) return false;

    const mode = normalizeMode(report.workMode);

    return mode === "office" || Boolean(report.officeName);
  }, [report]);

  async function getAttendanceDetail() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      setCheckInAddress(null);
      setCheckOutAddress(null);

      const response = await fetch(
        `/api/admin/attendance-reports/${encodeURIComponent(id)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      const data: AttendanceReportDetailResponse =
        await readJsonResponse(response);

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
          : "Gagal mengambil detail laporan.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (id) {
      void getAttendanceDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    async function loadGpsAddress() {
      if (!report) return;

      try {
        setIsAddressLoading(true);

        const [checkInResult, checkOutResult] = await Promise.all([
          reverseGeocode(report.checkInLatitude, report.checkInLongitude),
          reverseGeocode(report.checkOutLatitude, report.checkOutLongitude),
        ]);

        setCheckInAddress(checkInResult);
        setCheckOutAddress(checkOutResult);
      } finally {
        setIsAddressLoading(false);
      }
    }

    void loadGpsAddress();
  }, [report]);

  return (
    <MobileShell variant="admin" withBottomPadding={false}>
      <AttendanceDetailMotionStyles />

      <AppHeader
        title="Detail Kehadiran"
        subtitle="Foto bukti absen dan lokasi GPS"
        variant="admin"
      />

      <main className="min-h-dvh bg-gradient-to-br from-[#f6f8ff] via-white to-[#eef4ff]">
        <section className="mx-auto max-w-7xl space-y-6 px-5 py-6 md:px-10 lg:px-16">
          <button
            type="button"
            onClick={() => router.push("/admin/laporan-kehadiran")}
            className="attendance-detail-enter inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-[#123c8c] shadow-sm ring-1 ring-blue-100 transition hover:bg-[#f8fbff] active:scale-[0.98]"
          >
            <ArrowLeft size={18} strokeWidth={2.6} />
            Kembali ke Laporan
          </button>

          {isLoading ? (
            <div className="attendance-detail-enter flex min-h-[360px] items-center justify-center rounded-3xl border border-blue-100 bg-white">
              <div className="text-center">
                <Loader2 className="mx-auto animate-spin text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-600">
                  Mengambil detail kehadiran...
                </p>
              </div>
            </div>
          ) : errorMessage || !report ? (
            <div className="attendance-detail-enter rounded-3xl border border-red-100 bg-red-50 p-6 text-sm font-bold text-red-700">
              {errorMessage || "Detail laporan tidak ditemukan."}
            </div>
          ) : (
            <>
              <div className="attendance-detail-enter overflow-hidden rounded-[2rem] border border-blue-100 bg-white shadow-xl shadow-slate-300/30">
                <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
                  <div className="bg-[#123c8c] p-6 text-white md:p-8">
                    <div className="flex items-center gap-3">
                      <div className="attendance-detail-avatar-enter flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/15 ring-1 ring-white/20">
                        {getEmployeeProfilePhoto(report) ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={getEmployeeProfilePhoto(report)}
                              alt={report.employeeName}
                              className="h-full w-full object-cover"
                            />
                          </>
                        ) : (
                          <UserRound size={26} strokeWidth={2.6} />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="mt-1 truncate text-3xl font-black tracking-tight md:text-4xl">
                          {report.employeeName}
                        </h2>
                      </div>
                    </div>

                    <p
                      className="attendance-detail-row-enter mt-4 text-sm font-semibold text-blue-100"
                      style={{
                        animationDelay: "80ms",
                      }}
                    >
                      {report.employeeCode || ""}
                    </p>

                    <div
                      className="attendance-detail-row-enter mt-5 flex flex-wrap gap-2"
                      style={{
                        animationDelay: "120ms",
                      }}
                    >
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${getStatusStyle(
                          report.status,
                        )}`}
                      >
                        {report.statusLabel}
                      </span>

                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">
                        Check-in: {formatModeLabel(report.workMode)}
                      </span>

                      {getCheckOutMode(report) ? (
                        <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">
                          Check-out: {formatModeLabel(getCheckOutMode(report))}
                        </span>
                      ) : null}

                      {isAddressLoading ? (
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-black text-white ring-1 ring-white/20">
                          <Loader2 size={13} className="animate-spin" />
                          Membaca alamat GPS
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4 md:p-6">
                    <div
                      className="attendance-detail-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                      style={{
                        animationDelay: "70ms",
                      }}
                    >
                      <CalendarDays size={20} className="text-[#123c8c]" />
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Tanggal
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {report.dateLabel}
                      </p>
                    </div>

                    <div
                      className="attendance-detail-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                      style={{
                        animationDelay: "110ms",
                      }}
                    >
                      <Clock3 size={20} className="text-[#123c8c]" />
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Masuk
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {report.checkIn}
                      </p>
                    </div>

                    <div
                      className="attendance-detail-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                      style={{
                        animationDelay: "150ms",
                      }}
                    >
                      <Clock3 size={20} className="text-[#123c8c]" />
                      <p className="mt-3 text-xs font-bold text-slate-500">
                        Keluar
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        {report.checkOut}
                      </p>
                    </div>

                    <div
                      className="attendance-detail-row-enter rounded-2xl border border-blue-100 bg-[#f8fbff] p-4"
                      style={{
                        animationDelay: "190ms",
                      }}
                    >
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

              <EmployeeNotesSection report={report} delay={80} />

              <div className="grid gap-6 lg:grid-cols-2">
                <GpsLocationCard
                  title="Lokasi GPS Check-in"
                  subtitle="GPS check-in belum tersedia pada laporan ini."
                  latitude={report.checkInLatitude ?? report.attendanceLatitude}
                  longitude={
                    report.checkInLongitude ?? report.attendanceLongitude
                  }
                  accuracy={report.checkInAccuracy}
                  reverseResult={checkInAddress}
                  isLoadingAddress={isAddressLoading}
                  delay={110}
                />

                <GpsLocationCard
                  title="Lokasi GPS Check-out"
                  subtitle="GPS check-out belum tersedia pada laporan ini."
                  latitude={report.checkOutLatitude}
                  longitude={report.checkOutLongitude}
                  accuracy={report.checkOutAccuracy}
                  reverseResult={checkOutAddress}
                  isLoadingAddress={isAddressLoading}
                  delay={150}
                />
              </div>

              {shouldShowOfficeLocation ? (
                <OfficeLocationCard report={report} delay={180} />
              ) : null}

              <div className="grid gap-6 lg:grid-cols-2">
                <PhotoCard
                  title="Foto Check-in"
                  subtitle={`${report.employeeName} • ${report.dateLabel}`}
                  imageUrl={primaryCheckInPhoto}
                  delay={210}
                />

                <PhotoCard
                  title="Foto Check-out"
                  subtitle={`${report.employeeName} • ${report.dateLabel}`}
                  imageUrl={report.checkOutPhoto}
                  delay={250}
                />
              </div>
            </>
          )}
        </section>
      </main>
    </MobileShell>
  );
}
