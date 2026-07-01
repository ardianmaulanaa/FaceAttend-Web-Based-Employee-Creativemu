import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { Buffer } from "node:buffer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

async function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;

  if (!token) {
    throw new Error("Token login tidak ditemukan.");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET belum ada di file .env");
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const { payload } = await jwtVerify(token, secret);

  const userId =
    (payload.id as string | undefined) ||
    (payload.userId as string | undefined) ||
    (payload.sub as string | undefined);

  if (!userId) {
    throw new Error("User ID tidak ditemukan di token.");
  }

  return userId;
}

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

function dataUrlToBuffer(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    return {
      buffer: Buffer.from(dataUrl, "base64"),
      mime: "image/jpeg",
    };
  }

  return {
    buffer: Buffer.from(match[2], "base64"),
    mime: match[1],
  };
}

async function fileToBuffer(file: File) {
  const arrayBuffer = await file.arrayBuffer();

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
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const { photoBuffer, photoMime, latitude, longitude, accuracy } =
      await parseAttendanceBody(req);

    if (!photoBuffer) {
      return NextResponse.json(
        { error: "Foto check-out wajib dikirim." },
        { status: 400 }
      );
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json(
        { error: "Lokasi GPS check-out wajib dikirim." },
        { status: 400 }
      );
    }

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

    const attendance = await prisma.attendance.findFirst({
      where: {
        user_id: userId,
        attendance_date: today,
      },
    });

    if (!attendance || !attendance.check_in_time) {
      return NextResponse.json(
        { error: "Kamu belum melakukan check-in hari ini." },
        { status: 400 }
      );
    }

    if (attendance.check_out_time) {
      return NextResponse.json(
        { error: "Kamu sudah melakukan check-out hari ini." },
        { status: 400 }
      );
    }

    const workMinutes = Math.max(
      0,
      Math.floor((now.getTime() - attendance.check_in_time.getTime()) / 60000)
    );

    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
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
      },
    });

    return NextResponse.json({
      success: true,
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
    });
  } catch (error) {
    console.error("CHECK_OUT_ERROR:", error);

    return NextResponse.json(
      { error: "Gagal melakukan check-out." },
      { status: 500 }
    );
  }
}