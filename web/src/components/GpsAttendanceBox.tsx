"use client";

import dynamic from "next/dynamic";
import { MapPin, Navigation, RefreshCw, ShieldCheck, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  findNearestValidOffice,
  isGpsAccuracyAllowed,
  type OfficeGeofence,
} from "@/lib/geo";

const AttendanceMap = dynamic(() => import("@/components/AttendanceMap"), {
  ssr: false,
});

type UserLocation = {
  lat: number;
  lng: number;
  accuracy: number;
};

export default function GpsAttendanceBox() {
  const [offices, setOffices] = useState<OfficeGeofence[]>([]);
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadOffices() {
      try {
        const response = await fetch("/api/offices/active");
        const result = await response.json();

        if (result.success) {
          setOffices(result.offices);
        }
      } catch (error) {
        console.error(error);
      }
    }

    loadOffices();
  }, []);

  const matchedOffice = useMemo(() => {
    if (!location) return null;

    return findNearestValidOffice(
      {
        lat: location.lat,
        lng: location.lng,
      },
      offices
    );
  }, [location, offices]);

  const isAccuracyAllowed = location
    ? isGpsAccuracyAllowed(location.accuracy, 100)
    : false;

  const canAttend = Boolean(location && matchedOffice && isAccuracyAllowed);

  function getCurrentLocation() {
    setErrorMessage("");

    if (!navigator.geolocation) {
      setErrorMessage("Browser kamu tidak mendukung GPS.");
      return;
    }

    setIsLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });

        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);

        if (error.code === error.PERMISSION_DENIED) {
          setErrorMessage("Izin lokasi ditolak. Aktifkan izin lokasi di browser.");
          return;
        }

        if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMessage("Lokasi tidak tersedia. Coba aktifkan GPS/WiFi.");
          return;
        }

        if (error.code === error.TIMEOUT) {
          setErrorMessage("GPS terlalu lama merespons. Coba ulangi.");
          return;
        }

        setErrorMessage("Gagal mengambil lokasi.");
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  return (
    <section className="rounded-[2rem] border border-blue-100 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-blue-800">
            GPS Attendance
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            Validasi Lokasi Absensi
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Ambil lokasi karyawan dan cocokkan dengan radius kantor aktif.
          </p>
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-900 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-900/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
          {isLoading ? "Mengambil..." : "Ambil GPS"}
        </button>
      </div>

      {errorMessage ? (
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          <TriangleAlert className="mt-0.5 h-5 w-5" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {location ? (
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Latitude
            </p>
            <p className="mt-2 text-sm font-black text-slate-900">
              {location.lat.toFixed(6)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Longitude
            </p>
            <p className="mt-2 text-sm font-black text-slate-900">
              {location.lng.toFixed(6)}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Accuracy
            </p>
            <p className="mt-2 text-sm font-black text-slate-900">
              ± {Math.round(location.accuracy)} meter
            </p>
          </div>
        </div>
      ) : null}

      {location ? (
        <div className="mb-4">
          <AttendanceMap
            userLocation={{
              lat: location.lat,
              lng: location.lng,
            }}
            userAccuracy={location.accuracy}
            offices={offices}
            matchedOfficeId={matchedOffice?.office.id ?? null}
          />
        </div>
      ) : null}

      {location ? (
        <div
          className={`rounded-2xl border p-4 ${
            canAttend
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700"
          }`}
        >
          <div className="flex items-start gap-3">
            {canAttend ? (
              <ShieldCheck className="mt-0.5 h-5 w-5" />
            ) : (
              <MapPin className="mt-0.5 h-5 w-5" />
            )}

            <div>
              <p className="font-black">
                {canAttend
                  ? "Lokasi valid, karyawan boleh absen."
                  : "Lokasi belum valid untuk absen."}
              </p>

              <p className="mt-1 text-sm font-semibold">
                {matchedOffice
                  ? `Terdeteksi di ${matchedOffice.office.name}, jarak ${Math.round(
                      matchedOffice.distance
                    )} meter dari titik kantor.`
                  : "Lokasi kamu di luar radius semua kantor aktif."}
              </p>

              {!isAccuracyAllowed ? (
                <p className="mt-1 text-sm font-semibold">
                  Akurasi GPS terlalu besar. Maksimal disarankan ±100 meter.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}