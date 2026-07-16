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

    const departments = await prisma.department.findMany({
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
                      is: {
                        name: {
                          contains: search,
                        },
                      },
                    },
                  },
                  {
                    office: {
                      is: {
                        address: {
                          contains: search,
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
                  office_id: null,
                }
              : {
                  office_id: officeId,
                }
            : {},
        ],
      },
      select: {
        id: true,
        name: true,
        office_id: true,
        shift_id: true,
        salary_calculation: true,
        status: true,
        created_at: true,
        updated_at: true,
        office: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
            units: true,
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
      departments,
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
            "Akses ditolak. Hanya owner yang dapat menambah divisi.",
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
          message: "Kantor divisi wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status divisi tidak valid.",
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
        name: true,
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

    const duplicate = await prisma.department.findFirst({
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
          message: "Nama divisi sudah ada pada kantor yang dipilih.",
        },
        { status: 409 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        office_id: officeId,
        status,
      },
      select: {
        id: true,
        name: true,
        office_id: true,
        shift_id: true,
        salary_calculation: true,
        status: true,
        created_at: true,
        updated_at: true,
        office: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
            units: true,
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
          message: "Nama divisi sudah ada pada kantor yang dipilih.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menambahkan divisi.",
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
            "Akses ditolak. Hanya owner yang dapat mengubah divisi.",
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
          message: "ID divisi wajib dikirim.",
        },
        { status: 400 }
      );
    }

    if (!officeId) {
      return NextResponse.json(
        {
          success: false,
          message: "Kantor divisi wajib dipilih.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama divisi wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Status divisi tidak valid.",
        },
        { status: 400 }
      );
    }

    const existingDepartment = await prisma.department.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        {
          success: false,
          message: "Divisi tidak ditemukan.",
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
        name: true,
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

    const duplicate = await prisma.department.findFirst({
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
          message: "Nama divisi sudah ada pada kantor yang dipilih.",
        },
        { status: 409 }
      );
    }

    const department = await prisma.department.update({
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
        shift_id: true,
        salary_calculation: true,
        status: true,
        created_at: true,
        updated_at: true,
        office: {
          select: {
            id: true,
            name: true,
            address: true,
            status: true,
          },
        },
        _count: {
          select: {
            users: true,
            units: true,
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
          message: "Nama divisi sudah ada pada kantor yang dipilih.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui divisi.",
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
            "Akses ditolak. Hanya owner yang dapat menghapus divisi.",
        },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "ID divisi wajib dikirim.",
        },
        { status: 400 }
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
            units: true,
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

    if (department._count.users > 0 || department._count.units > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Divisi tidak bisa dihapus karena masih memiliki unit atau karyawan. Ubah status menjadi Nonaktif.",
        },
        { status: 400 }
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
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menghapus divisi.",
      },
      { status: 500 }
    );
  }
}