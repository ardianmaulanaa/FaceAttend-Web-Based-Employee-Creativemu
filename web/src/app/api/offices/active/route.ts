import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export const runtime = "nodejs";

const db = prisma as any;

export async function GET(req: NextRequest) {
  try {
    await requireAuth(req);

    const offices = await db.officeLocation.findMany({
      where: {
        status: "active",
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        radius_meters: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      offices,
    });
  } catch (error) {
    console.error("GET_ACTIVE_OFFICES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal mengambil data kantor."),
      },
      { status: getApiErrorStatus(error) },
    );
  }
}
