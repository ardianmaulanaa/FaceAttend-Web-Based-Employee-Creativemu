import { NextRequest, NextResponse } from "next/server";

import {
  DEFAULT_APP_THEME,
  getAppThemeSettings,
  normalizeAppThemeSettings,
  updateAppThemeSettings,
} from "@/lib/app-theme";
import { requireOwnerUser } from "@/lib/api-auth";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    {
      status,
    },
  );
}

export async function GET(req: NextRequest) {
  try {
    await requireOwnerUser(req);

    const theme = await getAppThemeSettings();

    return NextResponse.json({
      success: true,
      theme,
      defaultTheme: DEFAULT_APP_THEME,
    });
  } catch (error) {
    console.error("GET /api/admin/app-theme error:", error);

    return jsonError("Gagal mengambil warna aplikasi.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireOwnerUser(req);

    const body = (await req.json()) as Record<string, unknown>;
    const theme = await updateAppThemeSettings(normalizeAppThemeSettings(body));

    return NextResponse.json({
      success: true,
      message: "Warna aplikasi berhasil diperbarui.",
      theme,
      defaultTheme: DEFAULT_APP_THEME,
    });
  } catch (error) {
    console.error("POST /api/admin/app-theme error:", error);

    return jsonError("Gagal memperbarui warna aplikasi.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireOwnerUser(req);

    const theme = await updateAppThemeSettings(DEFAULT_APP_THEME);

    return NextResponse.json({
      success: true,
      message: "Warna aplikasi berhasil dikembalikan ke default.",
      theme,
      defaultTheme: DEFAULT_APP_THEME,
    });
  } catch (error) {
    console.error("DELETE /api/admin/app-theme error:", error);

    return jsonError("Gagal mengembalikan warna aplikasi.", 500);
  }
}
