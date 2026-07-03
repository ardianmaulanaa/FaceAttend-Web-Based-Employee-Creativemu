import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

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

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(req);
    const { id } = await context.params;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");

    const attendance = await prisma.attendance.findFirst({
      where: {
        id,
        user_id: userId,
      },
      select: {
        check_in_photo: true,
        check_out_photo: true,
        check_in_photo_mime: true,
        check_out_photo_mime: true,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Data absensi tidak ditemukan." },
        { status: 404 }
      );
    }

    const photo =
      type === "check-out"
        ? attendance.check_out_photo
        : attendance.check_in_photo;

    const mime =
      type === "check-out"
        ? attendance.check_out_photo_mime
        : attendance.check_in_photo_mime;

    if (!photo || !mime) {
      return NextResponse.json(
        { message: "Foto absensi tidak tersedia." },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(photo), {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("ATTENDANCE_PHOTO_ERROR:", error);

    return NextResponse.json(
      {
        message: "Gagal mengambil foto absensi.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}