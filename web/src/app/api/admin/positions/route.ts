import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";

const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs"];
const MANAGE_ROLES: AllowedRole[] = ["owner", "admin"];

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
  unit: {
    select: unitSelect,
  },
} as const;

const employeeSelect = {
  id: true,
  employee_code: true,
  name: true,
  email: true,
  role: true,
  employee_type: true,
  phone: true,
  status: true,
  profile_photo: true,
  unit_id: true,
  department_id: true,
  position_id: true,
  shift_id: true,
  registered_office_id: true,
  npwp_number: true,
  ptkp_status: true,
  base_salary: true,
  created_at: true,
  updated_at: true,
  unit: {
    select: unitSelect,
  },
  department: {
    select: departmentSelect,
  },
  position: {
    select: positionSelect,
  },
  shift: {
    select: {
      id: true,
      name: true,
      tolerance_minutes: true,
      status: true,
    },
  },
  registered_office: {
    select: officeSelect,
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
    { status }
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

async function ensureDefaultShifts() {
  const totalShifts = await prisma.shift.count();

  if (totalShifts > 0) return;

  await prisma.shift.createMany({
    data: [
      {
        name: "Utama",
        tolerance_minutes: 15,
        status: "active",
      },
      {
        name: "Magang",
        tolerance_minutes: 15,
        status: "active",
      },
      {
        name: "Shift A",
        tolerance_minutes: 10,
        status: "active",
      },
      {
        name: "Shift B",
        tolerance_minutes: 10,
        status: "active",
      },
    ],
    skipDuplicates: true,
  });
}

async function generateEmployeeCode() {
  const totalEmployees = await prisma.user.count({
    where: {
      role: "employee",
    },
  });

  for (let index = totalEmployees + 1; index < totalEmployees + 1000; index++) {
    const code = `EMP${String(index).padStart(4, "0")}`;

    const existing = await prisma.user.findUnique({
      where: {
        employee_code: code,
      },
      select: {
        id: true,
      },
    });

    if (!existing) return code;
  }

  return `EMP${Date.now()}`;
}

async function validateEmployeeHierarchy(params: {
  registeredOfficeId: string;
  departmentId: string;
  unitId: string;
  positionId: string;
  shiftId: string;
}) {
  const { registeredOfficeId, departmentId, unitId, positionId, shiftId } =
    params;

  const office = await prisma.officeLocation.findUnique({
    where: {
      id: registeredOfficeId,
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

  if (department.office_id !== registeredOfficeId) {
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

  const position = await prisma.position.findUnique({
    where: {
      id: positionId,
    },
    select: {
      id: true,
      unit_id: true,
      status: true,
    },
  });

  if (!position || position.status !== "active") {
    throw new Error("Jabatan tidak ditemukan atau tidak aktif.");
  }

  if (position.unit_id !== unitId) {
    throw new Error("Jabatan tidak sesuai dengan unit yang dipilih.");
  }

  const shift = await prisma.shift.findUnique({
    where: {
      id: shiftId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!shift || shift.status !== "active") {
    throw new Error("Shift tidak ditemukan atau tidak aktif.");
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

    await ensureDefaultShifts();

    const employees = await prisma.user.findMany({
      where: {
        role: "employee",
      },
      select: employeeSelect,
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

    const positions = await prisma.position.findMany({
      select: positionSelect,
      orderBy: {
        name: "asc",
      },
    });

    const shifts = await prisma.shift.findMany({
      select: {
        id: true,
        name: true,
        tolerance_minutes: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      employees,
      offices,
      officeLocations: offices,
      departments,
      units,
      positions,
      shifts,
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data karyawan.",
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
      return jsonError(
        "Akses ditolak. Hanya owner atau admin yang dapat menambah karyawan.",
        403
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(
      body.password || body.temporaryPassword || body.temp_password || ""
    ).trim();

    const employeeCode = String(body.employee_code || "").trim();
    const employeeType = String(body.employee_type || "utama").trim();
    const status = String(body.status || "active").trim();

    const registeredOfficeId = String(
      body.registered_office_id || body.office_id || ""
    ).trim();
    const departmentId = String(body.department_id || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const positionId = String(body.position_id || "").trim();
    const shiftId = String(body.shift_id || "").trim();

    const npwpNumber = body.npwp_number
      ? String(body.npwp_number).trim()
      : null;
    const ptkpStatus = body.ptkp_status
      ? String(body.ptkp_status).trim()
      : null;
    const baseSalary =
      body.base_salary !== undefined &&
      body.base_salary !== null &&
      String(body.base_salary).trim() !== ""
        ? Number(body.base_salary)
        : null;

    if (!name) return jsonError("Nama karyawan wajib diisi.");
    if (!email) return jsonError("Email karyawan wajib diisi.");
    if (!password) return jsonError("Password karyawan wajib diisi.");

    if (
      !registeredOfficeId ||
      !departmentId ||
      !unitId ||
      !positionId ||
      !shiftId
    ) {
      return jsonError(
        "Kantor, divisi, unit, jabatan, dan shift wajib dipilih."
      );
    }

    if (!["utama", "magang"].includes(employeeType)) {
      return jsonError("Tipe karyawan tidak valid.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status karyawan tidak valid.");
    }

    await validateEmployeeHierarchy({
      registeredOfficeId,
      departmentId,
      unitId,
      positionId,
      shiftId,
    });

    const existingEmail = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingEmail) {
      return jsonError("Email sudah digunakan.", 409);
    }

    if (employeeCode) {
      const existingCode = await prisma.user.findUnique({
        where: {
          employee_code: employeeCode,
        },
        select: {
          id: true,
        },
      });

      if (existingCode) {
        return jsonError("Kode karyawan sudah digunakan.", 409);
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const finalEmployeeCode = employeeCode || (await generateEmployeeCode());

    const employee = await prisma.user.create({
      data: {
        employee_code: finalEmployeeCode,
        name,
        email,
        password_hash: passwordHash,
        role: "employee",
        employee_type: employeeType,
        phone: phone || null,
        status,
        registered_office_id: registeredOfficeId,
        department_id: departmentId,
        unit_id: unitId,
        position_id: positionId,
        shift_id: shiftId,
        npwp_number: npwpNumber,
        ptkp_status: ptkpStatus,
        base_salary: baseSalary,
      },
      select: employeeSelect,
    });

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil ditambahkan.",
      employee,
    });
  } catch (error) {
    console.error("POST /api/employees error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Email atau kode karyawan sudah digunakan.", 409);
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal menambahkan karyawan.",
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
      return jsonError(
        "Akses ditolak. Hanya owner atau admin yang dapat mengubah karyawan.",
        403
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const phone = String(body.phone || "").trim();
    const password = String(
      body.password || body.temporaryPassword || body.temp_password || ""
    ).trim();

    const employeeCode = String(body.employee_code || "").trim();
    const employeeType = String(body.employee_type || "utama").trim();
    const status = String(body.status || "active").trim();

    const registeredOfficeId = String(
      body.registered_office_id || body.office_id || ""
    ).trim();
    const departmentId = String(body.department_id || "").trim();
    const unitId = String(body.unit_id || "").trim();
    const positionId = String(body.position_id || "").trim();
    const shiftId = String(body.shift_id || "").trim();

    const npwpNumber = body.npwp_number
      ? String(body.npwp_number).trim()
      : null;
    const ptkpStatus = body.ptkp_status
      ? String(body.ptkp_status).trim()
      : null;
    const baseSalary =
      body.base_salary !== undefined &&
      body.base_salary !== null &&
      String(body.base_salary).trim() !== ""
        ? Number(body.base_salary)
        : null;

    if (!id) return jsonError("ID karyawan wajib dikirim.");
    if (!name) return jsonError("Nama karyawan wajib diisi.");
    if (!email) return jsonError("Email karyawan wajib diisi.");

    if (
      !registeredOfficeId ||
      !departmentId ||
      !unitId ||
      !positionId ||
      !shiftId
    ) {
      return jsonError(
        "Kantor, divisi, unit, jabatan, dan shift wajib dipilih."
      );
    }

    if (!["utama", "magang"].includes(employeeType)) {
      return jsonError("Tipe karyawan tidak valid.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status karyawan tidak valid.");
    }

    const existingEmployee = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingEmployee || existingEmployee.role !== "employee") {
      return jsonError("Karyawan tidak ditemukan.", 404);
    }

    await validateEmployeeHierarchy({
      registeredOfficeId,
      departmentId,
      unitId,
      positionId,
      shiftId,
    });

    const existingEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id,
        },
      },
      select: {
        id: true,
      },
    });

    if (existingEmail) {
      return jsonError("Email sudah digunakan oleh user lain.", 409);
    }

    if (employeeCode) {
      const existingCode = await prisma.user.findFirst({
        where: {
          employee_code: employeeCode,
          NOT: {
            id,
          },
        },
        select: {
          id: true,
        },
      });

      if (existingCode) {
        return jsonError("Kode karyawan sudah digunakan oleh user lain.", 409);
      }
    }

    const updateData: {
      employee_code?: string | null;
      name: string;
      email: string;
      phone: string | null;
      employee_type: string;
      status: string;
      registered_office_id: string;
      department_id: string;
      unit_id: string;
      position_id: string;
      shift_id: string;
      npwp_number: string | null;
      ptkp_status: string | null;
      base_salary: number | null;
      password_hash?: string;
    } = {
      employee_code: employeeCode || null,
      name,
      email,
      phone: phone || null,
      employee_type: employeeType,
      status,
      registered_office_id: registeredOfficeId,
      department_id: departmentId,
      unit_id: unitId,
      position_id: positionId,
      shift_id: shiftId,
      npwp_number: npwpNumber,
      ptkp_status: ptkpStatus,
      base_salary: baseSalary,
    };

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const employee = await prisma.user.update({
      where: {
        id,
      },
      data: updateData,
      select: employeeSelect,
    });

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil diperbarui.",
      employee,
    });
  } catch (error) {
    console.error("PATCH /api/employees error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Email atau kode karyawan sudah digunakan.", 409);
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui karyawan.",
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
      return jsonError(
        "Akses ditolak. Hanya owner atau admin yang dapat menghapus karyawan.",
        403
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return jsonError("ID karyawan wajib dikirim.");
    }

    const employee = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        name: true,
        _count: {
          select: {
            attendances: true,
            leave_requests: true,
            visits: true,
            payrolls: true,
          },
        },
      },
    });

    if (!employee || employee.role !== "employee") {
      return jsonError("Karyawan tidak ditemukan.", 404);
    }

    const hasRelations =
      employee._count.attendances > 0 ||
      employee._count.leave_requests > 0 ||
      employee._count.visits > 0 ||
      employee._count.payrolls > 0;

    if (hasRelations) {
      return jsonError(
        "Karyawan tidak bisa dihapus karena sudah memiliki data absensi, cuti, kunjungan, atau payroll. Ubah status menjadi Nonaktif.",
        400
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/employees error:", error);

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Karyawan tidak bisa dihapus karena masih memiliki relasi data lain. Ubah status menjadi Nonaktif.",
        400
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menghapus karyawan.",
      },
      { status: 500 }
    );
  }
}