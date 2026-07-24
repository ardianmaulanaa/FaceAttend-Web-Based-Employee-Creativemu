import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/api-auth";

export const runtime = "nodejs";

type AllowedRole = "admin" | "owner";

const VIEW_ROLES: AllowedRole[] = ["admin", "owner"];
const MANAGE_ROLES: AllowedRole[] = ["admin", "owner"];

function getCurrentUser(req: NextRequest) {
  return requireOwner(req);
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

    const jabatans = await prisma.jabatan.findMany({
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
      jabatans,
      departments,
      offices,
    });
  } catch (error) {
    console.error("GET /api/admin/jabatans error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal mengambil data jabatan.",
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
            "Akses ditolak. Hanya admin yang dapat menambah jabatan.",
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
          message: "Divisi jabatan wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama jabatan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status jabatan tidak valid.",
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

    const duplicate = await prisma.jabatan.findFirst({
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
          message: "Nama jabatan sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

    const jabatan = await prisma.jabatan.create({
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
      message: "Jabatan berhasil dibuat.",
      jabatan,
    });
  } catch (error) {
    console.error("POST /api/admin/jabatans error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama jabatan sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menambahkan jabatan.",
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
            "Akses ditolak. Hanya admin yang dapat mengubah jabatan.",
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
          message: "ID jabatan wajib dikirim.",
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
          message: "Divisi jabatan wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama jabatan wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status jabatan tidak valid.",
        },
        { status: 400 }
      );
    }

    const existingJabatan = await prisma.jabatan.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingJabatan) {
      return NextResponse.json(
        {
          success: false,
          message: "Jabatan tidak ditemukan.",
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

    const duplicate = await prisma.jabatan.findFirst({
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
          message: "Nama jabatan sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

    const jabatan = await prisma.jabatan.update({
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
      message: "Jabatan berhasil diperbarui.",
      jabatan,
    });
  } catch (error) {
    console.error("PATCH /api/admin/jabatans error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama jabatan sudah ada pada divisi yang dipilih.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui jabatan.",
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
            "Akses ditolak. Hanya admin yang dapat menghapus jabatan.",
        },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID jabatan wajib dikirim.",
        },
        { status: 400 }
      );
    }

    const jabatan = await prisma.jabatan.findUnique({
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

    if (!jabatan) {
      return NextResponse.json(
        {
          success: false,
          message: "Jabatan tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (jabatan._count.users > 0 || jabatan._count.positions > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Jabatan tidak bisa dihapus karena masih memiliki posisi atau karyawan. Ubah status menjadi Nonaktif.",
        },
        { status: 400 }
      );
    }

    await prisma.jabatan.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Jabatan berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/jabatans error:", error);

    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Jabatan tidak bisa dihapus karena masih memiliki relasi. Ubah status menjadi Nonaktif.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menghapus jabatan.",
      },
      { status: 500 }
    );
  }
}
