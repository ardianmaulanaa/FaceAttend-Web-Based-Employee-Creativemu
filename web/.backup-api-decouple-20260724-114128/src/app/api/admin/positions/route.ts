import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/api-auth";

export const runtime = "nodejs";

type AllowedRole = "admin" | "owner";

const VIEW_ROLES: AllowedRole[] = ["admin", "owner"];
const MANAGE_ROLES: AllowedRole[] = ["admin", "owner"];

const officeSelect = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  radius_meters: true,
  status: true,
} as const;

const departmentSelect = {
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
} as const;

const jabatanSelect = {
  id: true,
  name: true,
  department_id: true,
  status: true,
  department: {
    select: departmentSelect,
  },
} as const;

const positionSelect = {
  id: true,
  name: true,
  jabatan_id: true,
  status: true,
  created_at: true,
  updated_at: true,
  jabatan: {
    select: jabatanSelect,
  },
  _count: {
    select: {
      users: true,
    },
  },
} as const;

function getCurrentUser(req: NextRequest) {
  return requireOwner(req);
}

function canAccess(role: string, roles: AllowedRole[]) {
  return roles.includes(role.toLowerCase() as AllowedRole);
}

function jsonError(message: string, status = 400) {
  return NextResponse.json(
    {
      success: false,
      message,
    },
    { status },
  );
}

function getPrismaCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    return (error as { code?: string }).code;
  }

  return undefined;
}

function isPrismaUniqueError(error: unknown) {
  return getPrismaCode(error) === "P2002";
}

function isPrismaForeignKeyError(error: unknown) {
  return getPrismaCode(error) === "P2003";
}

async function validatePositionHierarchy(params: {
  officeId: string;
  departmentId: string;
  jabatanId: string;
}) {
  const { officeId, departmentId, jabatanId } = params;

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
    throw new Error("Kantor tidak ditemukan atau tidak aktif.");
  }

  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
    select: {
      id: true,
      office_id: true,
      status: true,
    },
  });

  if (!department || department.status !== "active") {
    throw new Error("Divisi tidak ditemukan atau tidak aktif.");
  }

  if (department.office_id !== officeId) {
    throw new Error("Divisi tidak sesuai dengan kantor yang dipilih.");
  }

  const jabatan = await prisma.jabatan.findUnique({
    where: {
      id: jabatanId,
    },
    select: {
      id: true,
      department_id: true,
      status: true,
    },
  });

  if (!jabatan || jabatan.status !== "active") {
    throw new Error("Jabatan tidak ditemukan atau tidak aktif.");
  }

  if (jabatan.department_id !== departmentId) {
    throw new Error("Jabatan tidak sesuai dengan divisi yang dipilih.");
  }
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !canAccess(currentUser.role, VIEW_ROLES)
    ) {
      return jsonError("Akses ditolak.", 403);
    }

    const positions = await prisma.position.findMany({
      select: positionSelect,
      orderBy: {
        created_at: "desc",
      },
    });

    const offices = await prisma.officeLocation.findMany({
      select: officeSelect,
      orderBy: {
        name: "asc",
      },
    });

    const departments = await prisma.department.findMany({
      select: departmentSelect,
      orderBy: {
        name: "asc",
      },
    });

    const jabatans = await prisma.jabatan.findMany({
      select: jabatanSelect,
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      positions,
      data: positions,
      offices,
      departments,
      jabatans,
    });
  } catch (error) {
    console.error("GET /api/admin/positions error:", error);

    return NextResponse.json(
      {
        success: false,
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
      return jsonError(
        "Akses ditolak. Hanya admin yang dapat menambah posisi.",
        403,
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const jabatanId = String(body.jabatan_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!officeId) return jsonError("Kantor wajib dipilih.");
    if (!departmentId) return jsonError("Divisi wajib dipilih.");
    if (!jabatanId) return jsonError("Jabatan wajib dipilih.");
    if (!name) return jsonError("Nama posisi wajib diisi.");

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status posisi tidak valid.");
    }

    await validatePositionHierarchy({
      officeId,
      departmentId,
      jabatanId,
    });

    const existingPosition = await prisma.position.findFirst({
      where: {
        name,
        jabatan_id: jabatanId,
      },
      select: {
        id: true,
      },
    });

    if (existingPosition) {
      return jsonError("Nama posisi sudah digunakan pada jabatan ini.", 409);
    }

    const position = await prisma.position.create({
      data: {
        name,
        jabatan_id: jabatanId,
        status,
      },
      select: positionSelect,
    });

    return NextResponse.json({
      success: true,
      message: "Posisi berhasil ditambahkan.",
      position,
    });
  } catch (error) {
    console.error("POST /api/admin/positions error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Nama posisi sudah digunakan.", 409);
    }

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Relasi kantor, divisi, atau jabatan tidak valid. Pilih ulang data posisi.",
        400,
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menambahkan posisi.",
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
      return jsonError(
        "Akses ditolak. Hanya admin yang dapat mengubah posisi.",
        403,
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const jabatanId = String(body.jabatan_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!id) return jsonError("ID posisi wajib dikirim.");
    if (!officeId) return jsonError("Kantor wajib dipilih.");
    if (!departmentId) return jsonError("Divisi wajib dipilih.");
    if (!jabatanId) return jsonError("Jabatan wajib dipilih.");
    if (!name) return jsonError("Nama posisi wajib diisi.");

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status posisi tidak valid.");
    }

    const existingPosition = await prisma.position.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
      },
    });

    if (!existingPosition) {
      return jsonError("Posisi tidak ditemukan.", 404);
    }

    await validatePositionHierarchy({
      officeId,
      departmentId,
      jabatanId,
    });

    const duplicatePosition = await prisma.position.findFirst({
      where: {
        name,
        jabatan_id: jabatanId,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicatePosition) {
      return jsonError("Nama posisi sudah digunakan pada jabatan ini.", 409);
    }

    const position = await prisma.position.update({
      where: {
        id,
      },
      data: {
        name,
        jabatan_id: jabatanId,
        status,
      },
      select: positionSelect,
    });

    return NextResponse.json({
      success: true,
      message: "Posisi berhasil diperbarui.",
      position,
    });
  } catch (error) {
    console.error("PATCH /api/admin/positions error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Nama posisi sudah digunakan.", 409);
    }

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Relasi kantor, divisi, atau jabatan tidak valid. Pilih ulang data posisi.",
        400,
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui posisi.",
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
      return jsonError(
        "Akses ditolak. Hanya admin yang dapat menghapus posisi.",
        403,
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return jsonError("ID posisi wajib dikirim.");
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
      return jsonError("Posisi tidak ditemukan.", 404);
    }

    if ((position._count?.users || 0) > 0) {
      return jsonError(
        "Posisi ini masih digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
        400,
      );
    }

    await prisma.position.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Posisi berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/positions error:", error);

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Posisi tidak bisa dihapus karena masih memiliki relasi data lain. Ubah status menjadi Nonaktif.",
        400,
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menghapus posisi.",
      },
      { status: 500 },
    );
  }
}
