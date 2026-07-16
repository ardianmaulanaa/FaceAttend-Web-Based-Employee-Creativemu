import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner";

const VIEW_ROLES: AllowedRole[] = ["owner"];
const MANAGE_ROLES: AllowedRole[] = ["owner"];

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

const unitSelect = {
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
  unit_id: true,
  status: true,
  created_at: true,
  updated_at: true,
  unit: {
    select: unitSelect,
  },
  _count: {
    select: {
      users: true,
    },
  },
} as const;

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
  unitId: string;
}) {
  const { officeId, departmentId, unitId } = params;

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

  const unit = await prisma.unit.findUnique({
    where: {
      id: unitId,
    },
    select: {
      id: true,
      department_id: true,
      status: true,
    },
  });

  if (!unit || unit.status !== "active") {
    throw new Error("Unit tidak ditemukan atau tidak aktif.");
  }

  if (unit.department_id !== departmentId) {
    throw new Error("Unit tidak sesuai dengan divisi yang dipilih.");
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

    const units = await prisma.unit.findMany({
      select: unitSelect,
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
      units,
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
        "Akses ditolak. Hanya owner yang dapat menambah jabatan.",
        403,
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!officeId) return jsonError("Kantor wajib dipilih.");
    if (!departmentId) return jsonError("Divisi wajib dipilih.");
    if (!unitId) return jsonError("Unit wajib dipilih.");
    if (!name) return jsonError("Nama jabatan wajib diisi.");

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status jabatan tidak valid.");
    }

    await validatePositionHierarchy({
      officeId,
      departmentId,
      unitId,
    });

    const existingPosition = await prisma.position.findFirst({
      where: {
        name,
        unit_id: unitId,
      },
      select: {
        id: true,
      },
    });

    if (existingPosition) {
      return jsonError("Nama jabatan sudah digunakan pada unit ini.", 409);
    }

    const position = await prisma.position.create({
      data: {
        name,
        unit_id: unitId,
        status,
      },
      select: positionSelect,
    });

    return NextResponse.json({
      success: true,
      message: "Jabatan berhasil ditambahkan.",
      position,
    });
  } catch (error) {
    console.error("POST /api/admin/positions error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Nama jabatan sudah digunakan.", 409);
    }

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Relasi kantor, divisi, atau unit tidak valid. Pilih ulang data jabatan.",
        400,
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menambahkan jabatan.",
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
        "Akses ditolak. Hanya owner yang dapat mengubah jabatan.",
        403,
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const officeId = String(body.office_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const status = String(body.status || "active").trim();

    if (!id) return jsonError("ID jabatan wajib dikirim.");
    if (!officeId) return jsonError("Kantor wajib dipilih.");
    if (!departmentId) return jsonError("Divisi wajib dipilih.");
    if (!unitId) return jsonError("Unit wajib dipilih.");
    if (!name) return jsonError("Nama jabatan wajib diisi.");

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status jabatan tidak valid.");
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
      return jsonError("Jabatan tidak ditemukan.", 404);
    }

    await validatePositionHierarchy({
      officeId,
      departmentId,
      unitId,
    });

    const duplicatePosition = await prisma.position.findFirst({
      where: {
        name,
        unit_id: unitId,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicatePosition) {
      return jsonError("Nama jabatan sudah digunakan pada unit ini.", 409);
    }

    const position = await prisma.position.update({
      where: {
        id,
      },
      data: {
        name,
        unit_id: unitId,
        status,
      },
      select: positionSelect,
    });

    return NextResponse.json({
      success: true,
      message: "Jabatan berhasil diperbarui.",
      position,
    });
  } catch (error) {
    console.error("PATCH /api/admin/positions error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Nama jabatan sudah digunakan.", 409);
    }

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Relasi kantor, divisi, atau unit tidak valid. Pilih ulang data jabatan.",
        400,
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui jabatan.",
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
        "Akses ditolak. Hanya owner yang dapat menghapus jabatan.",
        403,
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return jsonError("ID jabatan wajib dikirim.");
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
      return jsonError("Jabatan tidak ditemukan.", 404);
    }

    if ((position._count?.users || 0) > 0) {
      return jsonError(
        "Jabatan ini masih digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
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
      message: "Jabatan berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/positions error:", error);

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Jabatan tidak bisa dihapus karena masih memiliki relasi data lain. Ubah status menjadi Nonaktif.",
        400,
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menghapus jabatan.",
      },
      { status: 500 },
    );
  }
}
