import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { isDatabaseUnavailable, saveDemoCheckOut } from "@/lib/demoStore";

type WorkMode = "onsite" | "wfh";

<<<<<<< HEAD
const MAIN_LOCATIONS = [
  {
    name: "Creativemu HQ",
    latitude: -6.9004,
    longitude: 107.6207,
    allowedRadiusMeters: 350,
  },
  {
    name: "Creativemu Branch",
    latitude: -7.3095,
    longitude: 112.7378,
    allowedRadiusMeters: 350,
  },
];
=======
const MAX_GPS_ACCURACY_METERS = 100;

type ParsedAttendanceBody = {
  photoBuffer: Buffer | null;
  photoMime: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
};

type GeoPoint = {
  lat: number;
  lng: number;
};

type OfficeGeofence = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

<<<<<<< HEAD
function distanceMeters(
  pointA: { latitude: number; longitude: number },
  pointB: { latitude: number; longitude: number },
) {
  const earthRadius = 6371000;
  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLon = toRadians(pointB.longitude - pointA.longitude);
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function resolveMainLocation(latitude: number, longitude: number) {
  const nearest = MAIN_LOCATIONS.map((location) => ({
    ...location,
    distance: distanceMeters(
      { latitude, longitude },
      { latitude: location.latitude, longitude: location.longitude },
    ),
  })).sort((a, b) => a.distance - b.distance)[0];
=======
function getTodayDateOnly() {
  const now = new Date();

  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6

  if (!nearest || nearest.distance > nearest.allowedRadiusMeters) {
    return null;
  }

  return nearest;
}

function buildAttendanceNote(payload: {
  workMode: WorkMode;
  locationName?: string;
  notes?: string;
}) {
  const tags = [`mode=${payload.workMode}`];

<<<<<<< HEAD
  if (payload.locationName) {
    tags.push(`location=${payload.locationName}`);
  }

  if (payload.notes?.trim()) {
    tags.push(`note=${payload.notes.trim().slice(0, 120)}`);
  }

  return tags.join(" | ").slice(0, 255);
=======
  return {
    buffer: Buffer.from(arrayBuffer),
    mime: file.type || "image/jpeg",
  };
}

function getDistanceInMeters(from: GeoPoint, to: GeoPoint) {
  const earthRadius = 6371000;

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;

  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function findNearestValidOffice(
  userLocation: GeoPoint,
  offices: OfficeGeofence[]
) {
  const validOffices = offices
    .map((office) => {
      const distance = getDistanceInMeters(userLocation, {
        lat: office.latitude,
        lng: office.longitude,
      });

      return {
        office,
        distance,
        isWithinRadius: distance <= office.radius_meters,
      };
    })
    .filter((item) => item.isWithinRadius)
    .sort((a, b) => a.distance - b.distance);

  return validOffices[0] ?? null;
}

async function parseAttendanceBody(
  req: NextRequest
): Promise<ParsedAttendanceBody> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();

    const photo =
      formData.get("photo") ||
      formData.get("photoDataUrl") ||
      formData.get("checkOutPhoto") ||
      formData.get("image");

    const latitude = toNumber(
      formData.get("latitude") ?? formData.get("checkOutLatitude")
    );

    const longitude = toNumber(
      formData.get("longitude") ?? formData.get("checkOutLongitude")
    );

    const accuracy = toNumber(
      formData.get("accuracy") ?? formData.get("checkOutAccuracy")
    );

    if (photo instanceof File) {
      const result = await fileToBuffer(photo);

      return {
        photoBuffer: result.buffer,
        photoMime: result.mime,
        latitude,
        longitude,
        accuracy,
      };
    }

    if (typeof photo === "string") {
      const result = dataUrlToBuffer(photo);

      return {
        photoBuffer: result.buffer,
        photoMime: result.mime,
        latitude,
        longitude,
        accuracy,
      };
    }

    return {
      photoBuffer: null,
      photoMime: "image/jpeg",
      latitude,
      longitude,
      accuracy,
    };
  }

  const body = await req.json();

  const photoDataUrl =
    typeof body.photo === "string"
      ? body.photo
      : typeof body.photoDataUrl === "string"
        ? body.photoDataUrl
        : typeof body.checkOutPhoto === "string"
          ? body.checkOutPhoto
          : typeof body.image === "string"
            ? body.image
            : null;

  const latitude = toNumber(
    body.latitude ?? body.checkOutLatitude ?? body.location?.latitude
  );

  const longitude = toNumber(
    body.longitude ?? body.checkOutLongitude ?? body.location?.longitude
  );

  const accuracy = toNumber(
    body.accuracy ?? body.checkOutAccuracy ?? body.location?.accuracy
  );

  if (!photoDataUrl) {
    return {
      photoBuffer: null,
      photoMime: "image/jpeg",
      latitude,
      longitude,
      accuracy,
    };
  }

  const result = dataUrlToBuffer(photoDataUrl);

  return {
    photoBuffer: result.buffer,
    photoMime: result.mime,
    latitude,
    longitude,
    accuracy,
  };
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("faceattend_token")?.value;

<<<<<<< HEAD
    if (!token) {
=======
    const { photoBuffer, photoMime, latitude, longitude, accuracy } =
      await parseAttendanceBody(req);

    if (!photoBuffer) {
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    const payload = await verifyToken(token);

    if (payload.role !== "employee") {
      return NextResponse.json(
        { success: false, message: "Hanya karyawan yang dapat check-out" },
        { status: 403 },
      );
    }

<<<<<<< HEAD
    const {
      imageDataUrl,
      latitude,
      longitude,
      workMode,
      notes,
    }: {
      imageDataUrl?: string;
      latitude?: number;
      longitude?: number;
      workMode?: WorkMode;
      notes?: string;
    } = await req.json();
    const effectiveMode: WorkMode = workMode === "wfh" ? "wfh" : "onsite";
    let matchedLocationName: string | null = null;
=======
    if (accuracy === null) {
      return NextResponse.json(
        { error: "Akurasi GPS check-out wajib dikirim." },
        { status: 400 }
      );
    }

    if (accuracy > MAX_GPS_ACCURACY_METERS) {
      return NextResponse.json(
        {
          error: `Akurasi GPS terlalu rendah. Maksimal ±${MAX_GPS_ACCURACY_METERS} meter.`,
          accuracy,
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        registered_office_id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Data user tidak ditemukan." },
        { status: 404 }
      );
    }

    const offices = await prisma.officeLocation.findMany({
      where: {
        status: "active",
      },
      select: {
        id: true,
        name: true,
        latitude: true,
        longitude: true,
        radius_meters: true,
      },
    });

    if (offices.length === 0) {
      return NextResponse.json(
        { error: "Belum ada data kantor aktif untuk validasi GPS." },
        { status: 400 }
      );
    }

    const matchedOffice = findNearestValidOffice(
      {
        lat: latitude,
        lng: longitude,
      },
      offices
    );

    if (!matchedOffice) {
      return NextResponse.json(
        {
          error: "Lokasi kamu berada di luar radius semua kantor aktif.",
          latitude,
          longitude,
          accuracy,
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const today = getTodayDateOnly();
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6

    if (!imageDataUrl) {
      return NextResponse.json(
        { success: false, message: "Foto check-out wajib diisi" },
        { status: 400 },
      );
    }

    if (
      effectiveMode === "onsite" &&
      (typeof latitude !== "number" || typeof longitude !== "number")
    ) {
      return NextResponse.json(
        { success: false, message: "Latitude dan longitude wajib diisi" },
        { status: 400 },
      );
    }

    if (effectiveMode === "onsite") {
      const matched = resolveMainLocation(
        latitude as number,
        longitude as number,
      );

      if (!matched) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Anda berada di luar radius lokasi utama Creativemu (HQ/Branch)",
          },
          { status: 400 },
        );
      }

      matchedLocationName = matched.name;
    }

    const todayDate = new Date(new Date().toISOString().slice(0, 10));
    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_attendance_date: {
          employee_id: payload.id,
          attendance_date: todayDate,
        },
      },
    });

    if (!existing?.check_in_time) {
      return NextResponse.json(
        { success: false, message: "Anda belum check-in hari ini" },
        { status: 400 },
      );
    }

    if (
      ["leave", "permission", "sick"].includes(String(existing.status || ""))
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Hari ini tercatat sebagai cuti/sakit sehingga tidak perlu check-out",
        },
        { status: 400 },
      );
    }

    if (existing.check_out_time) {
      return NextResponse.json(
        { success: false, message: "Check-out hari ini sudah tercatat" },
        { status: 409 },
      );
    }

    const attendance = await prisma.attendance.update({
      where: {
        employee_id_attendance_date: {
          employee_id: payload.id,
          attendance_date: todayDate,
        },
      },
      data: {
<<<<<<< HEAD
        check_out_time: new Date(),
        check_out_photo_url: imageDataUrl,
        check_out_latitude: effectiveMode === "onsite" ? latitude : null,
        check_out_longitude: effectiveMode === "onsite" ? longitude : null,
        notes: buildAttendanceNote({
          workMode: effectiveMode,
          locationName: matchedLocationName || undefined,
          notes,
        }),
=======
        check_out_time: now,
        check_out_photo: photoBuffer,
        check_out_photo_mime: photoMime,

        check_out_latitude: latitude,
        check_out_longitude: longitude,
        check_out_accuracy: accuracy,
        check_out_distance: matchedOffice.distance,
        check_out_within_radius: true,
        check_out_office_id: matchedOffice.office.id,

        registered_office_id:
          attendance.registered_office_id ?? user.registered_office_id,

        work_minutes: workMinutes,
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
      },
    });

    return NextResponse.json({
      success: true,
<<<<<<< HEAD
      message: "Check-out berhasil disimpan",
      data: {
        id: attendance.id,
        attendanceDate: attendance.attendance_date,
        checkOutTime: attendance.check_out_time,
        checkOutLatitude: attendance.check_out_latitude,
        checkOutLongitude: attendance.check_out_longitude,
      },
=======
      message: "Check-out berhasil.",
      attendanceId: updatedAttendance.id,
      office: {
        id: matchedOffice.office.id,
        name: matchedOffice.office.name,
        distance: Math.round(matchedOffice.distance),
        radius: matchedOffice.office.radius_meters,
      },
      gps: {
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
      },
      workMinutes,
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
    });
  } catch (error) {
    console.error(error);

    if (isDatabaseUnavailable(error)) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("faceattend_token")?.value;

        if (!token) {
          return NextResponse.json(
            { success: false, message: "Belum login" },
            { status: 401 },
          );
        }

        const payload = await verifyToken(token);
        const body = await req.json();
        const workMode: WorkMode = body.workMode === "wfh" ? "wfh" : "onsite";
        const imageDataUrl = String(body.imageDataUrl || "");
        const latitude = Number(body.latitude);
        const longitude = Number(body.longitude);
        const notes = String(body.notes || "");
        let workLocationName: string | undefined;

        if (!imageDataUrl) {
          return NextResponse.json(
            { success: false, message: "Foto check-out wajib diisi" },
            { status: 400 },
          );
        }

        if (workMode === "onsite") {
          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return NextResponse.json(
              { success: false, message: "Latitude dan longitude wajib diisi" },
              { status: 400 },
            );
          }

          const matched = resolveMainLocation(latitude, longitude);
          if (!matched) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Anda berada di luar radius lokasi utama Creativemu (HQ/Branch)",
              },
              { status: 400 },
            );
          }
          workLocationName = matched.name;
        }

        const result = saveDemoCheckOut({
          employeeId: payload.id,
          imageDataUrl,
          latitude,
          longitude,
          notes: buildAttendanceNote({
            workMode,
            locationName: workLocationName,
            notes,
          }),
          workMode,
          workLocationName,
        });

        if (!result.ok && result.reason === "missing-checkin") {
          return NextResponse.json(
            { success: false, message: "Anda belum check-in hari ini" },
            { status: 400 },
          );
        }

        if (!result.ok && result.reason === "already-checkout") {
          return NextResponse.json(
            { success: false, message: "Check-out hari ini sudah tercatat" },
            { status: 409 },
          );
        }

        if (!result.ok && result.reason === "leave-day") {
          return NextResponse.json(
            {
              success: false,
              message:
                "Hari ini tercatat sebagai cuti/sakit sehingga tidak perlu check-out",
            },
            { status: 400 },
          );
        }

        if (!result.ok) {
          return NextResponse.json(
            { success: false, message: "Gagal menyimpan check-out" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Check-out berhasil disimpan (demo mode)",
          data: {
            id: result.record.id,
            attendanceDate: result.record.attendance_date,
            checkOutTime: result.record.check_out_time,
            checkOutLatitude: result.record.check_out_latitude,
            checkOutLongitude: result.record.check_out_longitude,
          },
        });
      } catch {
        // Fallback to generic error response below.
      }
    }

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat check-out" },
      { status: 500 },
    );
  }
}
