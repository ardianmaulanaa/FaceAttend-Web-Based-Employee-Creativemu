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

function isPrismaUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2002"
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
    const unitId = searchParams.get("unit_id") || "all";

    const departments = await prisma.department.findMany({
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
          unitId !== "all"
            ? unitId === "none"
              ? {
                  unit_id: null,
                }
              : {
                  unit_id: unitId,
                }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        unit_id: true,
        shift_id: true,
        salary_calculation: true,
        status: true,
        created_at: true,
        updated_at: true,
        unit: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const units = await prisma.unit.findMany({
      select: {
        id: true,
        name: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      departments,
      units,
    });
  } catch (error) {
    console.error("GET /api/admin/departments error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data divisi.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat menambah divisi.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const status = String(body.status || "active");

    if (!name) {
      return NextResponse.json(
        {
          message: "Nama divisi wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status divisi tidak valid.",
        },
        { status: 400 },
      );
    }

    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: {
          id: unitId,
        },
        select: {
          id: true,
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
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        name,
        unit_id: unitId || null,
      },
      select: {
        id: true,
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          message: "Nama divisi sudah digunakan pada unit yang sama.",
        },
        { status: 409 },
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        unit_id: unitId || null,
        status,
      },
      select: {
        id: true,
        name: true,
        unit_id: true,
        shift_id: true,
        salary_calculation: true,
        status: true,
        created_at: true,
        updated_at: true,
        unit: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Divisi berhasil ditambahkan.",
      department,
    });
  } catch (error) {
    console.error("POST /api/admin/departments error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          message:
            "Nama divisi masih terbaca unik global. Pastikan @unique di field name sudah dihapus dan sudah menjalankan prisma db push.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal menambah data divisi.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat mengubah divisi.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const status = String(body.status || "active");

    if (!id) {
      return NextResponse.json(
        {
          message: "ID divisi wajib dikirim.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          message: "Nama divisi wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status divisi tidak valid.",
        },
        { status: 400 },
      );
    }

    const currentDepartment = await prisma.department.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!currentDepartment) {
      return NextResponse.json(
        {
          message: "Divisi tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: {
          id: unitId,
        },
        select: {
          id: true,
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
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        name,
        unit_id: unitId || null,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          message:
            "Nama divisi sudah digunakan oleh divisi lain pada unit yang sama.",
        },
        { status: 409 },
      );
    }

    const department = await prisma.department.update({
      where: {
        id,
      },
      data: {
        name,
        unit_id: unitId || null,
        status,
      },
      select: {
        id: true,
        name: true,
        unit_id: true,
        shift_id: true,
        salary_calculation: true,
        status: true,
        created_at: true,
        updated_at: true,
        unit: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Divisi berhasil diperbarui.",
      department,
    });
  } catch (error) {
    console.error("PATCH /api/admin/departments error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          message:
            "Nama divisi masih terbaca unik global. Pastikan @unique di field name sudah dihapus dan sudah menjalankan prisma db push.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui data divisi.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat menghapus divisi.",
        },
        { status: 403 },
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          message: "ID divisi wajib dikirim.",
        },
        { status: 400 },
      );
    }

    const department = await prisma.department.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        {
          message: "Divisi tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    if (department._count.users > 0) {
      return NextResponse.json(
        {
          message:
            "Divisi tidak bisa dihapus karena masih digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
        },
        { status: 400 },
      );
    }

    await prisma.department.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Divisi berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/departments error:", error);

    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json(
        {
          message:
            "Divisi tidak bisa dihapus karena masih memiliki relasi dengan data lain. Ubah status menjadi Nonaktif.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menghapus divisi.",
      },
      { status: 500 },
    );
  }
}