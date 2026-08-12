import { NextResponse } from "next/server";

import { getAppThemeSettings } from "@/lib/app-theme";

export const runtime = "nodejs";

export async function GET() {
  try {
    const theme = await getAppThemeSettings();

    return NextResponse.json({
      success: true,
      theme,
    });
  } catch (error) {
    console.error("GET /api/app-theme error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil warna aplikasi.",
      },
      {
        status: 500,
      },
    );
  }
}
