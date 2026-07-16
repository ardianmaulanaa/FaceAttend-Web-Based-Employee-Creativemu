import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
import { getAuditLogs } from "@/lib/jsonDb";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";
const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs"];

async function getCurrentUser(req: NextRequest) {
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

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  return user;
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !VIEW_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return NextResponse.json(
        {
          message: "Akses ditolak.",
        },
        { status: 403 }
      );
    }

    const logs = await getAuditLogs();

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error) {
    console.error("GET_AUDIT_LOGS_ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal mengambil audit logs.",
      },
      { status: 500 }
    );
  }
}
