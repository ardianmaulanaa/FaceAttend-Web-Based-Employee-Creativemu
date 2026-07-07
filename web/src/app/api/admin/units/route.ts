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

function getPrismaCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code?: string }).code;
  }

  return undefined;
}

function isPrismaForeignKeyError(error: unknown) {
  return getPrismaCode(error) === "P2003";
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
        { status: 403 }
      );
    }

    const search = req.nextUrl.searchParams.get("search") || "";
    const status = req.nextUrl.searchParams.get("status") || "all";
    const office = req.nextUrl.searchParams.get("office") || "all";

    const units = await db.unit.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  {
                    name: {
                      contains: search,
                    },
                  },
                  {
                    office: {
                      name: {
                        contains: search,
                      },
                    },
                  },
                  {
                    office: {
                      address: {
                        contains: search,
                      },
                    },
                  },
                ],
              }
            : {},
          status !== "all"
            ? {
                status,
              }
            : {},
          office !== "all"
            ? office === "none"
              ? {
                  office_id: null,
                }
              : {
                  office_id: office,
                }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        office_id: true,
        office: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
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
      units,
      offices,
    });
  } catch (error) {
    console.error("GET /api/admin/units error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal mengambil data unit.",
      },
      { status: 500 }
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
          message: "Akses ditolak. Hanya owner atau admin yang dapat menambah unit.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!officeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor unit wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama unit wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status unit tidak valid.",
        },
        { status: 400 }
      );
    }

    const office = await prisma.officeLocation.findUnique({
      where: {
        id: officeId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!office || office.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor tidak ditemukan atau tidak aktif.",
        },
        { status: 404 }
      );
    }

    const duplicate = await prisma.unit.findFirst({
      where: {
        office_id: officeId,
        name,
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama unit sudah ada di kantor yang dipilih.",
        },
        { status: 409 }
      );
    }

    const unit = await db.unit.create({
      data: {
        name,
        office_id: officeId,
        status,
      },
      select: {
        id: true,
        name: true,
        office_id: true,
        office: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
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
      success: true,
      message: "Unit berhasil dibuat.",
      unit,
    });
  } catch (error) {
    console.error("POST /api/admin/units error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menambahkan unit.",
      },
      { status: 500 }
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
          message: "Akses ditolak. Hanya owner atau admin yang dapat mengubah unit.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID unit wajib dikirim.",
        },
        { status: 400 }
      );
    }

    if (!officeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor unit wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama unit wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status unit tidak valid.",
        },
        { status: 400 }
      );
    }

    const existingUnit = await prisma.unit.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingUnit) {
      return NextResponse.json(
        {
          success: false,
          message: "Unit tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    const office = await prisma.officeLocation.findUnique({
      where: {
        id: officeId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!office || office.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor tidak ditemukan atau tidak aktif.",
        },
        { status: 404 }
      );
    }

    const duplicate = await prisma.unit.findFirst({
      where: {
        office_id: officeId,
        name,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicate) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama unit sudah ada di kantor yang dipilih.",
        },
        { status: 409 }
      );
    }

    const unit = await db.unit.update({
      where: {
        id,
      },
      data: {
        name,
        office_id: officeId,
        status,
      },
      select: {
        id: true,
        name: true,
        office_id: true,
        office: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
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
      success: true,
      message: "Unit berhasil diperbarui.",
      unit,
    });
  } catch (error) {
    console.error("PATCH /api/admin/units error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui unit.",
      },
      { status: 500 }
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
          message: "Akses ditolak. Hanya owner atau admin yang dapat menghapus unit.",
        },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID unit wajib dikirim.",
        },
        { status: 400 }
      );
    }

    const unit = await db.unit.findUnique({
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
          success: false,
          message: "Unit tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (unit._count.users > 0 || unit._count.departments > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unit tidak bisa dihapus karena masih memiliki divisi atau karyawan. Ubah status menjadi Nonaktif.",
        },
        { status: 400 }
      );
    }

    await db.unit.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Unit berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/units error:", error);

    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unit tidak bisa dihapus karena masih memiliki relasi. Ubah status menjadi Nonaktif.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menghapus unit.",
      },
      { status: 500 }
    );
  }
}
