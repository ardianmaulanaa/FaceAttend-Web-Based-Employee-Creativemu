import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const lat = searchParams.get("lat");
    const lon = searchParams.get("lon") || searchParams.get("lng");

    if (!lat || !lon) {
      return NextResponse.json(
        {
          success: false,
          message: "Latitude dan longitude wajib diisi.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&zoom=18&addressdetails=1`,
      {
        method: "GET",
        headers: {
          "Accept-Language": "id",
          "User-Agent": "FaceAttend/1.0",
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: "Gagal mengambil alamat lokasi.",
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      address: data.display_name || "Alamat tidak ditemukan.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil alamat lokasi.",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}