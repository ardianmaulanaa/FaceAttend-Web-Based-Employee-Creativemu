import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { Buffer } from "node:buffer";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type ParsedAttendanceBody = {
  photoBuffer: Buffer | null;
  photoMime: string;
  latitude: number | null;
  longitude: number | null;
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
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function toNumber(value: unknown) {
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
      formData.get("latitude") || formData.get("checkOutLatitude")
    );

    const longitude = toNumber(
      formData.get("longitude") || formData.get("checkOutLongitude")
    );

    if (photo instanceof File) {
      const result = await fileToBuffer(photo);

      return {
        photoBuffer: result.buffer,
        photoMime: result.mime,
        latitude,
        longitude,
      };
    }

    if (typeof photo === "string") {
      const result = dataUrlToBuffer(photo);

      return {
        photoBuffer: result.buffer,
        photoMime: result.mime,
        latitude,
        longitude,
      };
    }

    return {
      photoBuffer: null,
      photoMime: "image/jpeg",
      latitude,
      longitude,
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

  if (!photoDataUrl) {
    return {
      photoBuffer: null,
      photoMime: "image/jpeg",
      latitude,
      longitude,
    };
  }

  const result = dataUrlToBuffer(photoDataUrl);

  return {
    photoBuffer: result.buffer,
    photoMime: result.mime,
    latitude,
    longitude,
  };
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    const { photoBuffer, photoMime, latitude, longitude } =
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
        work_minutes: workMinutes,
      },
    });

    return NextResponse.json({
  success: true,
  message: "Check-out berhasil.",
  attendanceId: updatedAttendance.id,
});
  } catch (error) {
    console.error("CHECK_OUT_ERROR:", error);

    return NextResponse.json(
      { error: "Gagal melakukan check-out." },
      { status: 500 }
    );
  }
}