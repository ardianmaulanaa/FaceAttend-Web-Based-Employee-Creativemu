import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";

const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs"];
const MANAGE_ROLES: AllowedRole[] = ["owner", "admin"];

const defaultShifts = [
  {
    name: "UTAMA",
    tolerance_minutes: 3,
    status: "active",
  },
  {
    name: "MAGANG",
    tolerance_minutes: 0,
    status: "active",
  },
  {
    name: "SHIFT PAGI",
    tolerance_minutes: 5,
    status: "active",
  },
  {
    name: "SHIFT SIANG",
    tolerance_minutes: 5,
    status: "active",
  },
];

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

function sortShifts<T extends { name: string }>(shifts: T[]) {
  const order = ["UTAMA", "MAGANG", "SHIFT PAGI", "SHIFT SIANG"];

  return [...shifts].sort((a, b) => {
    const aIndex = order.indexOf(a.name.toUpperCase());
    const bIndex = order.indexOf(b.name.toUpperCase());

    if (aIndex === -1 && bIndex === -1) {
      return a.name.localeCompare(b.name);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}

async function ensureDefaultShifts() {
  await Promise.all(
    defaultShifts.map((shift) =>
      prisma.shift.upsert({
        where: {
          name: shift.name,
        },
        update: {},
        create: shift,
      }),
    ),
  );
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
        { status: 403 },
      );
    }

    await ensureDefaultShifts();

    const shifts = await prisma.shift.findMany({
      select: {
        id: true,
        name: true,
        tolerance_minutes: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      shifts: sortShifts(shifts),
    });
  } catch (error) {
    console.error("GET /api/admin/shifts error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data shift.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !MANAGE_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return NextResponse.json(
        {
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat mengubah shift.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const id = String(body.id || "");
    const toleranceMinutes = Number(body.tolerance_minutes ?? 0);
    const status = String(body.status || "active");

    if (!id) {
      return NextResponse.json(
        {
          message: "ID shift wajib dikirim.",
        },
        { status: 400 },
      );
    }

    if (Number.isNaN(toleranceMinutes) || toleranceMinutes < 0) {
      return NextResponse.json(
        {
          message: "Toleransi telat tidak valid.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status shift hanya boleh active atau inactive.",
        },
        { status: 400 },
      );
    }

    const existingShift = await prisma.shift.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingShift) {
      return NextResponse.json(
        {
          message: "Shift tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const shift = await prisma.shift.update({
      where: {
        id,
      },
      data: {
        tolerance_minutes: toleranceMinutes,
        status,
      },
      select: {
        id: true,
        name: true,
        tolerance_minutes: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      message: "Shift berhasil diperbarui.",
      shift,
    });
  } catch (error) {
    console.error("PATCH /api/admin/shifts error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui data shift.",
      },
      { status: 500 },
    );
  }
}