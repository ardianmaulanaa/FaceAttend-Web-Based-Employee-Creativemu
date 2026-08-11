
import { NextRequest, NextResponse } from "next/server";

import { requireOwnerUser } from "@/lib/api-auth";
import { DEFAULT_SITE_TITLE } from "@/lib/site-logo-defaults";
import {
  getSiteLogoSettings,
  resetSiteLogoFileToDefault,
  updateSiteLogoFile,
  updateSiteTitle,
} from "@/lib/site-logo";

export const runtime = "nodejs";

const allowedMimeTypes = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/x-png",
  "image/webp",
  "image/svg+xml",
]);

const allowedExtensions = new Set(["png", "jpg", "jpeg", "webp", "svg"]);

function isAllowedFile(file: File): boolean {
  if (file.type && allowedMimeTypes.has(file.type.toLowerCase())) {
    return true;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return allowedExtensions.has(ext);
}

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

    const logo = await getSiteLogoSettings();

    return NextResponse.json({
      success: true,
      logo,
    });
  } catch (error) {
    console.error("GET /api/admin/site-logo error:", error);

    return jsonError("Gagal mengambil logo aplikasi.", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireOwnerUser(req);

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await req.json();

      if (typeof body.siteTitle === "string") {
        await updateSiteTitle(body.siteTitle);
        const logo = await getSiteLogoSettings();

        return NextResponse.json({
          success: true,
          message: "Nama aplikasi berhasil diperbarui.",
          logo,
        });
      }
    }

    const formData = await req.formData();
    const siteTitleVal = formData.get("siteTitle");

    if (typeof siteTitleVal === "string" && siteTitleVal.trim()) {
      await updateSiteTitle(siteTitleVal);
    }

    const file = formData.get("logo");

    if (!(file instanceof File)) {
      if (typeof siteTitleVal === "string" && siteTitleVal.trim()) {
        const logo = await getSiteLogoSettings();

        return NextResponse.json({
          success: true,
          message: "Pengaturan berhasil diperbarui.",
          logo,
        });
      }

      return jsonError("File logo wajib dipilih.", 400);
    }

    if (!isAllowedFile(file)) {
      return jsonError("Format logo harus PNG, JPG, WEBP, atau SVG.", 400);
    }

    if (file.size > 2 * 1024 * 1024) {
      return jsonError("Ukuran logo maksimal 2MB.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await updateSiteLogoFile(
      Uint8Array.from(buffer),
      file.type || "image/png",
      file.name,
    );
    const logo = await getSiteLogoSettings();

    return NextResponse.json({
      success: true,
      message: "Logo aplikasi berhasil diperbarui.",
      logo,
    });
  } catch (error) {
    console.error("POST /api/admin/site-logo error:", error);

    return jsonError("Gagal memperbarui logo aplikasi.", 500);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireOwnerUser(req);

    const target = req.nextUrl.searchParams.get("target");

    if (target === "title") {
      await updateSiteTitle(DEFAULT_SITE_TITLE);
    } else if (target === "logo") {
      await resetSiteLogoFileToDefault();
    } else {
      await resetSiteLogoFileToDefault();
      await updateSiteTitle(DEFAULT_SITE_TITLE);
    }

    const logo = await getSiteLogoSettings();

    return NextResponse.json({
      success: true,
      message: "Pengaturan berhasil dikembalikan ke default.",
      logo,
    });
  } catch (error) {
    console.error("DELETE /api/admin/site-logo error:", error);

    return jsonError("Gagal mengembalikan logo aplikasi.", 500);
  }
}
