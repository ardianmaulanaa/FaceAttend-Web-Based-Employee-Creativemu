import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return new NextResponse("ID tidak valid.", { status: 400 });
    }

    const visit = await prisma.employeeVisit.findUnique({
      where: { id },
      select: {
        visit_photo: true,
        visit_photo_mime: true,
      },
    });

    if (!visit || !visit.visit_photo) {
      return new NextResponse("Foto tidak ditemukan.", { status: 404 });
    }

    return new NextResponse(Buffer.from(visit.visit_photo), {
      headers: {
        "Content-Type": visit.visit_photo_mime || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("GET_VISIT_PHOTO_ERROR", error);
    return new NextResponse("Gagal mengambil foto.", { status: 500 });
  }
}
