import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id: userId } = await requireAuth(req);
    const { id } = await context.params;

    const { searchParams } = new URL(req.url);
    const rawType = String(searchParams.get("type") || "check-in").toLowerCase();
    const isCheckOut = rawType === "check-out" || rawType === "checkout";

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
        check_in_photo_url: true,
        check_out_photo_url: true,
      },
    });

    if (!attendance) {
      return NextResponse.json(
        { message: "Data absensi tidak ditemukan." },
        { status: 404 },
      );
    }

    const photoUrl = isCheckOut
      ? attendance.check_out_photo_url
      : attendance.check_in_photo_url;

    if (photoUrl) {
      return NextResponse.redirect(photoUrl, 307);
    }

    const photo = isCheckOut
      ? attendance.check_out_photo
      : attendance.check_in_photo;

    const mime = isCheckOut
      ? attendance.check_out_photo_mime
      : attendance.check_in_photo_mime;

    if (!photo) {
      return NextResponse.json(
        { message: "Foto absensi tidak tersedia." },
        { status: 404 },
      );
    }

    return new NextResponse(new Uint8Array(photo), {
      headers: {
        "Content-Type": mime || "image/jpeg",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("ATTENDANCE_PHOTO_ERROR:", error);

    return NextResponse.json(
      {
        message: getApiErrorMessage(error, "Gagal mengambil foto absensi."),
      },
      { status: getApiErrorStatus(error) },
    );
  }
}
