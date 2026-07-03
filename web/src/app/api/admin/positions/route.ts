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
          message: "Akses ditolak.",
        },
        { status: 403 },
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const departmentId = searchParams.get("department_id") || "all";

    const positions = await prisma.position.findMany({
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
                        unit: {
                          is: {
                            name: {
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
            status: true,
            unit_id: true,
            unit: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
        _count: {
          select: {
            users: true,
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
        unit_id: true,
        status: true,
        unit: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: [
        {
          unit: {
            name: "asc",
          },
        },
        {
          name: "asc",
        },
      ],
    });

    return NextResponse.json({
      positions,
      departments,
    });
  } catch (error) {
    console.error("GET /api/admin/positions error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data jabatan.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat menambah jabatan.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const status = String(body.status || "active");

    if (!name) {
      return NextResponse.json(
        {
          message: "Nama jabatan wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!departmentId) {
      return NextResponse.json(
        {
          message: "Divisi jabatan wajib dipilih.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status jabatan tidak valid.",
        },
        { status: 400 },
      );
    }

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        status: true,
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

    if (department.status !== "active") {
      return NextResponse.json(
        {
          message: "Divisi tidak aktif. Pilih divisi aktif.",
        },
        { status: 400 },
      );
    }

    const existingPosition = await prisma.position.findFirst({
      where: {
        name,
        department_id: departmentId,
      },
      select: {
        id: true,
      },
    });

    if (existingPosition) {
      return NextResponse.json(
        {
          message: "Nama jabatan sudah digunakan pada divisi yang sama.",
        },
        { status: 409 },
      );
    }

    const position = await prisma.position.create({
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
            status: true,
            unit_id: true,
            unit: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
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
      message: "Jabatan berhasil ditambahkan.",
      position,
    });
  } catch (error) {
    console.error("POST /api/admin/positions error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          message: "Nama jabatan sudah digunakan pada divisi yang sama.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal menambah data jabatan.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat mengubah jabatan.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const status = String(body.status || "active");

    if (!id) {
      return NextResponse.json(
        {
          message: "ID jabatan wajib dikirim.",
        },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          message: "Nama jabatan wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!departmentId) {
      return NextResponse.json(
        {
          message: "Divisi jabatan wajib dipilih.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status jabatan tidak valid.",
        },
        { status: 400 },
      );
    }

    const currentPosition = await prisma.position.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!currentPosition) {
      return NextResponse.json(
        {
          message: "Jabatan tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
      select: {
        id: true,
        status: true,
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

    if (department.status !== "active") {
      return NextResponse.json(
        {
          message: "Divisi tidak aktif. Pilih divisi aktif.",
        },
        { status: 400 },
      );
    }

    const existingPosition = await prisma.position.findFirst({
      where: {
        name,
        department_id: departmentId,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingPosition) {
      return NextResponse.json(
        {
          message:
            "Nama jabatan sudah digunakan oleh jabatan lain pada divisi yang sama.",
        },
        { status: 409 },
      );
    }

    const position = await prisma.position.update({
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
            status: true,
            unit_id: true,
            unit: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
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
      message: "Jabatan berhasil diperbarui.",
      position,
    });
  } catch (error) {
    console.error("PATCH /api/admin/positions error:", error);

    if (isPrismaUniqueError(error)) {
      return NextResponse.json(
        {
          message: "Nama jabatan sudah digunakan pada divisi yang sama.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui data jabatan.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat menghapus jabatan.",
        },
        { status: 403 },
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          message: "ID jabatan wajib dikirim.",
        },
        { status: 400 },
      );
    }

    const position = await prisma.position.findUnique({
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

    if (!position) {
      return NextResponse.json(
        {
          message: "Jabatan tidak ditemukan.",
        },
        { status: 404 },
      );
    }

    if (position._count.users > 0) {
      return NextResponse.json(
        {
          message:
            "Jabatan tidak bisa dihapus karena masih digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
        },
        { status: 400 },
      );
    }

    await prisma.position.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Jabatan berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/positions error:", error);

    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json(
        {
          message:
            "Jabatan tidak bisa dihapus karena masih memiliki relasi dengan data lain. Ubah status menjadi Nonaktif.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menghapus jabatan.",
      },
      { status: 500 },
    );
  }
}