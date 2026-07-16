import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner";

const VIEW_ROLES: AllowedRole[] = ["owner"];
const MANAGE_ROLES: AllowedRole[] = ["owner"];

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
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const officeId = searchParams.get("office_id") || "all";
    const departmentId = searchParams.get("department_id") || "all";

    const units = await prisma.unit.findMany({
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
                    department: {
                      is: {
                        name: {
                          contains: search,
                        },
                      },
                    },
                  },
                  {
                    department: {
                      is: {
                        office: {
                          is: {
                            name: {
                              contains: search,
                            },
                          },
                        },
                      },
                    },
                  },
                  {
                    department: {
                      is: {
                        office: {
                          is: {
                            address: {
                              contains: search,
                            },
                          },
                        },
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
          officeId !== "all"
            ? officeId === "none"
              ? {
                  department: {
                    is: {
                      office_id: null,
                    },
                  },
                }
              : {
                  department: {
                    is: {
                      office_id: officeId,
                    },
                  },
                }
            : {},
          departmentId !== "all"
            ? departmentId === "none"
              ? {
                  department_id: null,
                }
              : {
                  department_id: departmentId,
                }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        department_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        department: {
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
      orderBy: [
        {
          department: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    const departments = await prisma.department.findMany({
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
      orderBy: [
        {
          office: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
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
      departments,
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
          message:
            "Akses ditolak. Hanya owner yang dapat menambah unit.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!officeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi unit wajib dipilih.",
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

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        name: true,
        office_id: true,
        status: true,
        office: {
          select: {
            id: true,
            name: true,
            status: true,
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
        { status: 404 }
      );
    }

    if (department.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi tidak aktif. Pilih divisi aktif.",
        },
        { status: 400 }
      );
    }

    if (!department.office_id || !department.office) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Divisi ini belum terhubung ke kantor. Edit divisi terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    if (department.office_id !== officeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi tidak sesuai dengan kantor yang dipilih.",
        },
        { status: 400 }
      );
    }

    if (department.office.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor dari divisi ini tidak aktif.",
        },
        { status: 400 }
      );
    }

    const duplicate = await prisma.unit.findFirst({
      where: {
        department_id: departmentId,
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
          message: "Nama unit sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

    const unit = await prisma.unit.create({
      data: {
        name,
        department_id: departmentId,
        status,
      },
      select: {
        id: true,
        name: true,
        department_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        department: {
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
      message: "Unit berhasil dibuat.",
      unit,
    });
  } catch (error) {
    console.error("POST /api/admin/units error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama unit sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

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
          message:
            "Akses ditolak. Hanya owner yang dapat mengubah unit.",
        },
        { status: 403 }
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
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
          message: "Kantor wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!departmentId) {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi unit wajib dipilih.",
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

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        name: true,
        office_id: true,
        status: true,
        office: {
          select: {
            id: true,
            name: true,
            status: true,
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
        { status: 404 }
      );
    }

    if (department.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi tidak aktif. Pilih divisi aktif.",
        },
        { status: 400 }
      );
    }

    if (!department.office_id || !department.office) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Divisi ini belum terhubung ke kantor. Edit divisi terlebih dahulu.",
        },
        { status: 400 }
      );
    }

    if (department.office_id !== officeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi tidak sesuai dengan kantor yang dipilih.",
        },
        { status: 400 }
      );
    }

    if (department.office.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor dari divisi ini tidak aktif.",
        },
        { status: 400 }
      );
    }

    const duplicate = await prisma.unit.findFirst({
      where: {
        department_id: departmentId,
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
          message: "Nama unit sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

    const unit = await prisma.unit.update({
      where: {
        id,
      },
      data: {
        name,
        department_id: departmentId,
        status,
      },
      select: {
        id: true,
        name: true,
        department_id: true,
        status: true,
        created_at: true,
        updated_at: true,
        department: {
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
      message: "Unit berhasil diperbarui.",
      unit,
    });
  } catch (error) {
    console.error("PATCH /api/admin/units error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama unit sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

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
          message:
            "Akses ditolak. Hanya owner yang dapat menghapus unit.",
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
            positions: true,
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

    if (unit._count.users > 0 || unit._count.positions > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unit tidak bisa dihapus karena masih memiliki jabatan atau karyawan. Ubah status menjadi Nonaktif.",
        },
        { status: 400 }
      );
    }

    await prisma.unit.delete({
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