import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";

const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs"];
const MANAGE_ROLES: AllowedRole[] = ["owner", "admin"];

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
    where: {
      id: userId,
    },
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

function canAccess(role: string, roles: AllowedRole[]) {
  return roles.includes(role.toLowerCase() as AllowedRole);
}

function isPrismaForeignKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2003"
  );
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !canAccess(currentUser.role, VIEW_ROLES)
    ) {
      return NextResponse.json(
        {
          message: "Akses ditolak.",
        },
        { status: 403 },
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";

    const units = await prisma.unit.findMany({
      where: {
        AND: [
          search
            ? {
                name: {
                  contains: search,
                },
              }
            : {},
          status !== "all"
            ? {
                status,
              }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      units,
    });
  } catch (error) {
    console.error("GET /api/admin/units error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal mengambil data unit.",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !canAccess(currentUser.role, MANAGE_ROLES)
    ) {
      return NextResponse.json(
        {
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat menambah unit.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const status = String(body.status || "active");

    if (!name) {
      return NextResponse.json(
        {
          message: "Nama unit wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status unit tidak valid.",
        },
        { status: 400 },
      );
    }

    const existingUnit = await prisma.unit.findFirst({
      where: {
        name,
      },
      select: {
        id: true,
      },
    });

    if (existingUnit) {
      return NextResponse.json(
        {
          message: "Nama unit sudah digunakan.",
        },
        { status: 409 },
      );
    }

    const unit = await prisma.unit.create({
      data: {
        name,
        status,
      },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Unit berhasil ditambahkan.",
      unit,
    });
  } catch (error) {
    console.error("POST /api/admin/units error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menambah data unit.",
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
      !canAccess(currentUser.role, MANAGE_ROLES)
    ) {
      return NextResponse.json(
        {
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat mengubah unit.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const status = String(body.status || "active");

    if (!id) {
      return NextResponse.json(
        {
          message: "ID unit wajib dikirim.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          message: "Nama unit wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status unit tidak valid.",
        },
        { status: 400 },
      );
    }

    const currentUnit = await prisma.unit.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!currentUnit) {
      return NextResponse.json(
        {
          message: "Unit tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const existingUnit = await prisma.unit.findFirst({
      where: {
        name,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingUnit) {
      return NextResponse.json(
        {
          message: "Nama unit sudah digunakan oleh unit lain.",
        },
        { status: 409 },
      );
    }

    const unit = await prisma.unit.update({
      where: {
        id,
      },
      data: {
        name,
        status,
      },
      select: {
        id: true,
        name: true,
        status: true,
        created_at: true,
        updated_at: true,
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Unit berhasil diperbarui.",
      unit,
    });
  } catch (error) {
    console.error("PATCH /api/admin/units error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui data unit.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !canAccess(currentUser.role, MANAGE_ROLES)
    ) {
      return NextResponse.json(
        {
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat menghapus unit.",
        },
        { status: 403 },
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          message: "ID unit wajib dikirim.",
        },
        { status: 400 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
            departments: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json(
        {
          message: "Unit tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    if (unit._count.users > 0 || unit._count.departments > 0) {
      return NextResponse.json(
        {
          message:
            "Unit tidak bisa dihapus karena masih memiliki divisi atau karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
        },
        { status: 400 },
      );
    }

    await prisma.unit.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Unit berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/units error:", error);

    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json(
        {
          message:
            "Unit tidak bisa dihapus karena masih memiliki relasi dengan data lain. Ubah status menjadi Nonaktif.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menghapus unit.",
      },
      { status: 500 },
    );
  }
}