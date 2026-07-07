import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const db = prisma as any;

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

  const user = await db.user.findUnique({
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

function getPrismaCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code?: string }).code;
  }

  return undefined;
}

function isPrismaForeignKeyError(error: unknown) {
  return getPrismaCode(error) === "P2003";
}

function isPrismaUniqueError(error: unknown) {
  return getPrismaCode(error) === "P2002";
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
          success: false,
          message: "Akses ditolak.",
        },
        { status: 403 },
      );
    }

    const departments = await db.department.findMany({
      select: {
        id: true,
        name: true,
        unit_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        unit: {
          select: {
            id: true,
            name: true,
            office_id: true,
            status: true,
            office: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            positions: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const units = await db.unit.findMany({
      select: {
        id: true,
        name: true,
        office_id: true,
        status: true,
        office: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const offices = await prisma.officeLocation.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      departments,
      units,
      offices,
    });
  } catch (error) {
    console.error("GET /api/admin/departments error:", error);

    return NextResponse.json(
      {
        success: false,
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
          success: false,
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat menambah divisi.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!unitId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unit divisi wajib dipilih.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status divisi tidak valid.",
        },
        { status: 400 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: {
        id: unitId,
      },
      select: {
        id: true,
        status: true,
        office_id: true,
      },
    });

    if (!unit || unit.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Unit tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

    if (!unit.office_id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unit ini belum terhubung ke kantor. Edit unit terlebih dahulu dan pilih kantor pemilik unit.",
        },
        { status: 400 },
      );
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        unit_id: unitId,
        name,
      },
      select: {
        id: true,
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi sudah ada pada unit yang dipilih.",
        },
        { status: 409 },
      );
    }

    const department = await db.department.create({
      data: {
        name,
        unit_id: unitId,
        status,
      },
      select: {
        id: true,
        name: true,
        unit_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        unit: {
          select: {
            id: true,
            name: true,
            office_id: true,
            status: true,
            office: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            positions: true,
          },
        },
      },
    });
 
    return NextResponse.json({
      success: true,
      message: "Divisi berhasil dibuat.",
      department,
    });
  } catch (error) {
    console.error("POST /api/admin/departments error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi sudah ada pada unit yang dipilih.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menambahkan divisi.",
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
          success: false,
          message: "Akses ditolak. Hanya owner atau admin yang dapat mengubah divisi.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID divisi wajib dikirim.",
        },
        { status: 400 },
      );
    }

    if (!unitId) {
      return NextResponse.json(
        {
          success: false,
          message: "Unit divisi wajib dipilih.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status divisi tidak valid.",
        },
        { status: 400 },
      );
    }

    const currentDepartment = await prisma.department.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!currentDepartment) {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { id: true, status: true, office_id: true },
    });

    if (!unit || unit.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Unit tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

    if (!unit.office_id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unit ini belum terhubung ke kantor. Edit unit terlebih dahulu dan pilih kantor pemilik unit.",
        },
        { status: 400 },
      );
    }

    const existingDepartment = await prisma.department.findFirst({
      where: {
        unit_id: unitId,
        name,
        NOT: { id },
      },
      select: { id: true },
    });

    if (existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi sudah ada pada unit yang dipilih.",
        },
        { status: 409 },
      );
    }

    const department = await prisma.department.update({
      where: { id },
      data: {
        name,
        unit_id: unitId,
        status,
      },
      select: {
        id: true,
        name: true,
        unit_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        unit: {
          select: {
            id: true,
            name: true,
            office_id: true,
            status: true,
            office: {
              select: {
                id: true,
                name: true,
                address: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
            positions: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Divisi berhasil diperbarui.",
      department,
    });
  } catch (error) {
    console.error("PATCH /api/admin/departments error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi sudah ada pada unit yang dipilih.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Gagal memperbarui divisi.",
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
              success: false,
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
              success: false,
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
                positions: true,
              },
            },
          },
        });

        if (!department) {
          return NextResponse.json(
            {
              success: false,
              message: "Divisi tidak ditemukan.",
            },
            { status: 404 },
          );
        }

        if (department._count.users > 0 || department._count.positions > 0) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Divisi tidak bisa dihapus karena masih memiliki jabatan atau karyawan. Ubah status menjadi Nonaktif.",
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
          success: true,
          message: "Divisi berhasil dihapus.",
        });
      } catch (error) {
        console.error("DELETE /api/admin/departments error:", error);

        if (isPrismaForeignKeyError(error)) {
          return NextResponse.json(
            {
              success: false,
              message:
                "Divisi tidak bisa dihapus karena masih memiliki relasi. Ubah status menjadi Nonaktif.",
            },
            { status: 400 },
          );
        }

        return NextResponse.json(
          {
            success: false,
            message:
              error instanceof Error ? error.message : "Gagal menghapus divisi.",
          },
          { status: 500 },
        );
      }
    }
