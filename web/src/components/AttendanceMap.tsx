"use client";

import { useMemo } from "react";
import { MapPin, Navigation, ShieldCheck, TriangleAlert } from "lucide-react";
import { getDistanceInMeters, type GeoPoint, type OfficeGeofence } from "@/lib/geo";

type AttendanceMapProps = {
  userLocation: GeoPoint;
  userAccuracy: number;
  offices: OfficeGeofence[];
  matchedOfficeId: string | null;
};

function formatDistance(distance: number) {
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }

  return `${(distance / 1000).toFixed(2)} km`;
}

export default function AttendanceMap({
  userLocation,
  userAccuracy,
  offices,
  matchedOfficeId,
}: AttendanceMapProps) {
  const nearestOffices = useMemo(() => {
    return offices
      .map((office) => ({
        office,
        distance: getDistanceInMeters(userLocation, {
          lat: office.latitude,
          lng: office.longitude,
        }),
      }))
      .sort((left, right) => left.distance - right.distance)
      .slice(0, 3);
  }, [offices, userLocation]);

  const matchedOffice = offices.find((office) => office.id === matchedOfficeId);
  const accuracyAllowed = userAccuracy <= 100;

  return (
    <section className="rounded-[2rem] border border-blue-100 bg-[#f8fbff] p-5 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
            Lokasi Absensi
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-950">
            Peta validasi GPS
          </h3>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
            Sistem mencocokkan titik kamu dengan radius kantor aktif.
          </p>
        </div>

        <div className={`rounded-2xl px-4 py-3 text-xs font-black ${accuracyAllowed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {accuracyAllowed ? "Akurasi aman" : "Akurasi perlu diperbaiki"}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-white bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Latitude</p>
          <p className="mt-2 text-sm font-black text-slate-900">{userLocation.lat.toFixed(6)}</p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Longitude</p>
          <p className="mt-2 text-sm font-black text-slate-900">{userLocation.lng.toFixed(6)}</p>
        </div>

        <div className="rounded-3xl border border-white bg-white p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Accuracy</p>
          <p className="mt-2 text-sm font-black text-slate-900">±{Math.round(userAccuracy)} meter</p>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[1.7rem] border border-blue-100 bg-white">
        <div className="grid min-h-[240px] gap-0 md:grid-cols-[1.1fr_0.9fr]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(18,60,140,0.18),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(59,130,246,0.16),transparent_22%),linear-gradient(135deg,#eaf1ff_0%,#f8fbff_60%,#ffffff_100%)] p-6">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,60,140,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(18,60,140,0.06)_1px,transparent_1px)] bg-[size:28px_28px] opacity-60" />

            <div className="relative flex h-full items-center justify-center">
              <div className="absolute h-52 w-52 rounded-full border border-[#123c8c]/15" />
              <div className="absolute h-36 w-36 rounded-full border border-[#123c8c]/20" />

              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#123c8c] text-white shadow-2xl shadow-blue-300/40 ring-8 ring-white">
                <Navigation size={32} strokeWidth={2.4} />
              </div>

              {matchedOffice ? (
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-emerald-100 bg-emerald-50/95 p-4 text-emerald-700 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Lokasi cocok</p>
                      <p className="mt-1 text-sm font-semibold leading-6">
                        {matchedOffice.name} berada dalam radius absensi.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-amber-100 bg-amber-50/95 p-4 text-amber-700 shadow-sm backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                      <p className="text-sm font-black">Belum cocok</p>
                      <p className="mt-1 text-sm font-semibold leading-6">
                        Titik kamu belum masuk radius kantor aktif.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 p-5 md:p-6">
            <div className="flex items-center gap-2 text-[#123c8c]">
              <MapPin size={18} />
              <p className="text-xs font-black uppercase tracking-[0.22em]">Kantor Terdekat</p>
            </div>

            {nearestOffices.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-blue-100 bg-[#f8fbff] p-4 text-sm font-semibold text-slate-500">
                Belum ada kantor aktif untuk divalidasi.
              </div>
            ) : (
              nearestOffices.map(({ office, distance }) => {
                const isMatched = office.id === matchedOfficeId;

                return (
                  <div
                    key={office.id}
                    className={`rounded-2xl border p-4 ${isMatched ? "border-emerald-100 bg-emerald-50" : "border-blue-100 bg-white"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{office.name}</p>
                        <p className="mt-1 text-sm font-semibold text-slate-500">
                          Radius {office.radius_meters} m
                        </p>
                      </div>

                      <span className={`rounded-full px-3 py-1 text-[11px] font-black ${isMatched ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {formatDistance(distance)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

  async function handleAttendance(action: AttendanceAction) {
    try {
      setLoading(true);
      setStatusTitle("Processing");
      setStatusText("Mengambil foto dan lokasi GPS...");

      if (!streamRef.current) {
        await startCamera();
      }

      const photo = await capturePhoto();

      setStatusTitle("Getting GPS");
      setStatusText("Mengambil lokasi GPS dengan akurasi terbaik...");

      const position = await getCurrentLocation();

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const accuracy = position.coords.accuracy;

      setLastLatitude(latitude);
      setLastLongitude(longitude);
      setLastAccuracy(accuracy);

      const formData = new FormData();
      formData.append("photo", photo);
      formData.append("latitude", String(latitude));
      formData.append("longitude", String(longitude));
      formData.append("accuracy", String(accuracy));

      if (action === "check-in") {
        formData.append("checkInLatitude", String(latitude));
        formData.append("checkInLongitude", String(longitude));
        formData.append("checkInAccuracy", String(accuracy));
      }

      if (action === "check-out") {
        formData.append("checkOutLatitude", String(latitude));
        formData.append("checkOutLongitude", String(longitude));
        formData.append("checkOutAccuracy", String(accuracy));
      }

      const response = await fetch(`/api/attendance/${action}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setStatusTitle("Attendance Failed");
        setStatusText(data.error || data.message || "Absensi gagal.");
        alert(data.error || data.message || "Absensi gagal.");
        return;
      }

      const officeName = data.office?.name;
      const distance = data.office?.distance;
      const radius = data.office?.radius;

      setStatusTitle("Attendance Success");
      setStatusText(
        officeName
          ? `${data.message} Lokasi valid di ${officeName}. Jarak ${distance} meter dari kantor, radius ${radius} meter. Akurasi GPS ±${Math.round(
              accuracy
            )} meter.`
          : `${data.message || "Absensi berhasil."} Akurasi GPS ±${Math.round(
              accuracy
            )} meter.`
      );

      alert(data.message || "Absensi berhasil.");
    } catch (error) {
      console.error("ATTENDANCE_ERROR", error);

      setStatusTitle("Attendance Failed");
      setStatusText(
        "Gagal melakukan absensi. Pastikan kamera dan lokasi GPS diizinkan."
      );
      alert(
        "Gagal melakukan absensi. Pastikan kamera dan lokasi GPS diizinkan."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <MobileShell variant="employee">
      <AppHeader
        title="Photo Attendance"
        subtitle="Ambil foto dan lokasi GPS untuk check-in atau check-out"
        rightLabel={cameraReady ? "CAM ON" : "CAM OFF"}
      />

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-6 md:px-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-16">
        <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
                Camera
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Attendance Capture
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Foto akan disimpan sebagai bukti absensi.
              </p>
            </div>

            <span
              className={`rounded-full px-4 py-2 text-xs font-black ${
                cameraReady
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {cameraReady ? "Camera Active" : "Camera Off"}
            </span>
          </div>

          <div className="relative overflow-hidden rounded-[1.7rem] bg-slate-950 shadow-inner">
            <div className="aspect-[4/3]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover transition ${
                  cameraReady ? "opacity-100" : "opacity-0"
                }`}
              />

              <div className="pointer-events-none absolute inset-6 rounded-[1.4rem] border border-white/15" />

              <div className="pointer-events-none absolute left-7 top-7 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-blue-300" />
              <div className="pointer-events-none absolute right-7 top-7 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-blue-300" />
              <div className="pointer-events-none absolute bottom-7 left-7 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-blue-300" />
              <div className="pointer-events-none absolute bottom-7 right-7 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-blue-300" />

              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-white">
                  <div>
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10 backdrop-blur-xl">
                      <Camera size={42} />
                    </div>

                    <p className="mt-5 text-sm font-black text-white">
                      Camera Preview
                    </p>

                    <p className="mt-1 text-xs font-semibold leading-5 text-slate-400">
                      Kamera sedang mati. Klik tombol aktifkan kamera.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <canvas ref={canvasRef} className="hidden" />

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              onClick={toggleCamera}
              type="button"
              className="rounded-2xl border border-blue-200 bg-[#f8fbff] px-5 py-4 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition hover:bg-[#eef5ff] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <Power size={18} />
                {cameraReady ? "Matikan Kamera" : "Aktifkan Kamera"}
              </span>
            </button>

            <button
              onClick={startCamera}
              type="button"
              className="rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition hover:bg-[#0f3274] active:scale-[0.98]"
            >
              <span className="flex items-center justify-center gap-2">
                <RotateCcw size={18} />
                Restart Camera
              </span>
            </button>
          </div>

          {lastPhotoUrl && (
            <div className="mt-5 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-4">
              <div className="mb-3 flex items-center gap-2">
                <ImageUp size={18} className="text-[#123c8c]" />
                <p className="text-sm font-black text-slate-950">
                  Foto Terakhir
                </p>
              </div>

              <img
                src={lastPhotoUrl}
                alt="Last attendance capture"
                className="h-36 w-36 rounded-2xl object-cover shadow-md"
              />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[2rem] bg-[#123c8c] text-white shadow-2xl shadow-blue-900/20">
            <div className="relative p-6 md:p-8">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-white/10" />
              <div className="absolute -bottom-20 right-10 h-40 w-40 rounded-full bg-blue-300/10" />

              <div className="relative flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                  <ShieldCheck size={29} strokeWidth={2.6} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-100">
                    Attendance Proof
                  </p>
                  <h2 className="mt-1 text-3xl font-black tracking-tight">
                    {cameraReady ? "Ready to Capture" : "Camera Standby"}
                  </h2>
                </div>
              </div>

              <p className="relative mt-5 text-sm leading-7 text-blue-100">
                Sistem akan menyimpan foto, waktu, koordinat GPS, akurasi GPS,
                dan radius kantor sebagai bukti check-in atau check-out
                karyawan.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              disabled={loading}
              onClick={() => handleAttendance("check-in")}
              className="rounded-2xl bg-[#123c8c] px-5 py-4 text-sm font-black text-white shadow-lg shadow-blue-900/25 transition hover:bg-[#0f3274] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {loading ? "Processing..." : "Check-in"}
              </span>
            </button>

            <button
              disabled={loading}
              onClick={() => handleAttendance("check-out")}
              className="rounded-2xl border border-blue-200 bg-[#f8fbff] px-5 py-4 text-sm font-black text-[#123c8c] shadow-lg shadow-slate-200/60 transition hover:bg-[#eef5ff] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : null}
                {loading ? "Processing..." : "Check-out"}
              </span>
            </button>
          </div>

          <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-2xl shadow-slate-300/30 backdrop-blur-xl md:p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-[#123c8c]">
              Verification Status
            </p>

            <div className="mt-4 flex items-start gap-4 rounded-3xl border border-blue-100 bg-[#f6f8ff] p-5">
              <CheckCircle2
                size={24}
                className="mt-0.5 shrink-0 text-[#123c8c]"
              />

              <div>
                <h3 className="font-black text-slate-950">{statusTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {statusText}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-blue-100 bg-white p-5">
                <Clock3 size={22} className="text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  Jam Kerja
                </p>
                <p className="mt-1 text-sm text-slate-500">08:00 - 17:00</p>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-white p-5">
                <MapPin size={22} className="text-[#123c8c]" />
                <p className="mt-3 text-sm font-black text-slate-950">
                  GPS Location
                </p>

                {lastLatitude !== null && lastLongitude !== null ? (
                  <div className="mt-1 space-y-1 text-sm text-slate-500">
                    <p>Lat: {lastLatitude.toFixed(6)}</p>
                    <p>Lng: {lastLongitude.toFixed(6)}</p>
                    <p>
                      Accuracy:{" "}
                      {lastAccuracy !== null
                        ? `±${Math.round(lastAccuracy)} meter`
                        : "-"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">
                    Diminta saat absen
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </MobileShell>
  );
}