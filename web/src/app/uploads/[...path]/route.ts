import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path || [];

    if (pathSegments.length === 0) {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    // Sanitize path to prevent directory traversal
    const safePathSegments = pathSegments.map((segment) =>
      segment.replace(/(\.\.[\/\\])+/g, "").replace(/[\/\\]/g, "")
    );

    const filePath = path.join(
      process.cwd(),
      "public",
      "uploads",
      ...safePathSegments
    );

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    if (!stat.isFile()) {
      return new NextResponse("Invalid file", { status: 400 });
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";
    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": stat.size.toString(),
        "Content-Disposition": `inline; filename="${path.basename(filePath)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("SERVE_UPLOADED_FILE_ERROR:", error);
    return new NextResponse("Gagal memuat file", { status: 500 });
  }
}
