import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma as prismaClient } from "@/lib/prisma";
const prisma = prismaClient as any;

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";

const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs"];
const MANAGE_ROLES: AllowedRole[] = ["owner", "admin"];

const defaultShifts = [
  {
    name: "UTAMA",
    tolerance_minutes: 3,
    status: "active",
  },
  {
    name: "MAGANG",
    tolerance_minutes: 0,
    status: "active",
  },
  {
    name: "SHIFT PAGI",
    tolerance_minutes: 5,
    status: "active",
  },
  {
    name: "SHIFT SIANG",
    tolerance_minutes: 5,
    status: "active",
  },
];

async function ensureDefaultShifts() {
  for (const shift of defaultShifts) {
    await prisma.shift.upsert({
      where: {
        name: shift.name,
      },
      update: {},
      create: shift,
    });
  }
}

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

function generateEmployeeCode() {
  const randomNumber = Math.floor(1000 + Math.random() * 9000);
  const timestamp = Date.now().toString().slice(-5);

  return `EMP-${timestamp}${randomNumber}`;
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

async function validateEmployeeStructure({
  registeredOfficeId,
  unitId,
  departmentId,
  positionId,
  shiftId,
}: {
  registeredOfficeId: string;
  unitId: string;
  departmentId: string;
  positionId: string;
  shiftId: string;
}) {
  const office = await prisma.officeLocation.findUnique({
    where: {
      id: registeredOfficeId,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!office || office.status !== "active") {
    return {
      ok: false,
      status: 404,
      message: "Kantor terdaftar tidak ditemukan atau tidak aktif.",
    };
  }

  const unit = await prisma.unit.findUnique({
    where: {
      id: unitId,
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
        },
      },
    },
  });

  if (!unit || unit.status !== "active") {
    return {
      ok: false,
      status: 404,
      message: "Unit tidak ditemukan atau tidak aktif.",
    };
  }

  if (!unit.office_id) {
    return {
      ok: false,
      status: 400,
      message:
        "Unit ini belum terhubung ke kantor. Edit data unit terlebih dahulu dan pilih kantor pemilik unit.",
    };
  }

  if (unit.office_id !== registeredOfficeId) {
    return {
      ok: false,
      status: 400,
      message: `Unit "${unit.name}" tidak sesuai dengan kantor "${office.name}".`,
    };
  }

  const department = await prisma.department.findUnique({
    where: {
      id: departmentId,
    },
    select: {
      id: true,
      name: true,
      unit_id: true,
      status: true,
    },
  });

  if (!department || department.status !== "active") {
    return {
      ok: false,
      status: 404,
      message: "Divisi tidak ditemukan atau tidak aktif.",
    };
  }

  if (department.unit_id !== unitId) {
    return {
      ok: false,
      status: 400,
      message: "Divisi tidak sesuai dengan unit yang dipilih.",
    };
  }

  const position = await prisma.position.findUnique({
    where: {
      id: positionId,
    },
    select: {
      id: true,
      name: true,
      department_id: true,
      status: true,
    },
  });

  if (!position || position.status !== "active") {
    return {
      ok: false,
      status: 404,
      message: "Jabatan tidak ditemukan atau tidak aktif.",
    };
  }

  if (position.department_id !== departmentId) {
    return {
      ok: false,
      status: 400,
      message: "Jabatan tidak sesuai dengan divisi yang dipilih.",
    };
  }

  const shift = await prisma.shift.findUnique({
    where: {
      id: shiftId,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!shift || shift.status !== "active") {
    return {
      ok: false,
      status: 404,
      message: "Shift tidak ditemukan atau tidak aktif.",
    };
  }

  return {
    ok: true,
    status: 200,
    message: "Valid.",
  };
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

    await ensureDefaultShifts();

    const employees = await prisma.user.findMany({
      where: {
        role: "employee",
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        created_at: true,

        unit: {
          select: {
            id: true,
            name: true,
            office_id: true,
            office: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        department: {
          select: {
            id: true,
            name: true,
            unit_id: true,
            unit: {
              select: {
                id: true,
                name: true,
                office_id: true,
                office: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },

        position: {
          select: {
            id: true,
            name: true,
            department_id: true,
            department: {
              select: {
                id: true,
                name: true,
                unit_id: true,
                unit: {
                  select: {
                    id: true,
                    name: true,
                    office_id: true,
                    office: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
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
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius_meters: true,
            status: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const units = await prisma.unit.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        office_id: true,
        office: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
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
            office_id: true,
            office: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const positions = await prisma.position.findMany({
      select: {
        id: true,
        name: true,
        department_id: true,
        status: true,
        department: {
          select: {
            id: true,
            name: true,
            unit_id: true,
            unit: {
              select: {
                id: true,
                name: true,
                office_id: true,
                office: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
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

    const offices = await prisma.officeLocation.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
        radius_meters: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      data: employees,
      units,
      departments,
      positions,
      shifts,
      offices: offices.map((office: any) => ({
        id: office.id,
        name: office.name,
        address: office.address,
        latitude: Number(office.latitude),
        longitude: Number(office.longitude),
        radius_meters: Number(office.radius_meters),
        status: office.status,
      })),
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);

    return NextResponse.json(
      {
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
      return NextResponse.json(
        {
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat register employee.",
        },
        { status: 403 }
      );
    }

    await ensureDefaultShifts();

    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const temporaryPassword = String(body.temporaryPassword || "");
    const unitId = String(body.unit_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const positionId = String(body.position_id || "").trim();
    const shiftId = String(body.shift_id || "").trim();
    const registeredOfficeId = String(body.registered_office_id || "").trim();
    const status = String(body.status || "active");

    if (
      !name ||
      !email ||
      !temporaryPassword ||
      !registeredOfficeId ||
      !unitId ||
      !departmentId ||
      !positionId ||
      !shiftId
    ) {
      return NextResponse.json(
        {
          message:
            "Nama, email, password, kantor, unit, divisi, jabatan, dan shift wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status tidak valid.",
        },
        { status: 400 }
      );
    }

    if (temporaryPassword.length < 8) {
      return NextResponse.json(
        {
          message: "Temporary password minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Email sudah digunakan.",
        },
        { status: 409 }
      );
    }

    const structureValidation = await validateEmployeeStructure({
      registeredOfficeId,
      unitId,
      departmentId,
      positionId,
      shiftId,
    });

    if (!structureValidation.ok) {
      return NextResponse.json(
        {
          message: structureValidation.message,
        },
        { status: structureValidation.status }
      );
    }

    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const employee = await prisma.user.create({
      data: {
        employee_code: generateEmployeeCode(),
        name,
        email,
        password_hash: hashedPassword,
        role: "employee",
        status,
        unit_id: unitId,
        department_id: departmentId,
        position_id: positionId,
        shift_id: shiftId,
        registered_office_id: registeredOfficeId,
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        created_at: true,

        unit: {
          select: {
            id: true,
            name: true,
            office_id: true,
            office: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        department: {
          select: {
            id: true,
            name: true,
            unit_id: true,
            unit: {
              select: {
                id: true,
                name: true,
                office_id: true,
                office: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },

        position: {
          select: {
            id: true,
            name: true,
            department_id: true,
            department: {
              select: {
                id: true,
                name: true,
                unit_id: true,
                unit: {
                  select: {
                    id: true,
                    name: true,
                    office_id: true,
                    office: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
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
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius_meters: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Employee berhasil dibuat.",
      data: employee,
    });
  } catch (error) {
    console.error("POST /api/employees error:", error);

    return NextResponse.json(
      {
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
      return NextResponse.json(
        {
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat mengubah employee.",
        },
        { status: 403 }
      );
    }

    await ensureDefaultShifts();

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const temporaryPassword = String(body.temporaryPassword || "");
    const unitId = String(body.unit_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const positionId = String(body.position_id || "").trim();
    const shiftId = String(body.shift_id || "").trim();
    const registeredOfficeId = String(body.registered_office_id || "").trim();
    const status = String(body.status || "active");

    if (!id) {
      return NextResponse.json(
        {
          message: "ID employee wajib dikirim.",
        },
        { status: 400 }
      );
    }

    if (
      !name ||
      !email ||
      !registeredOfficeId ||
      !unitId ||
      !departmentId ||
      !positionId ||
      !shiftId
    ) {
      return NextResponse.json(
        {
          message: "Nama, email, kantor, unit, divisi, jabatan, dan shift wajib diisi.",
        },
        { status: 400 }
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status tidak valid.",
        },
        { status: 400 }
      );
    }

    if (temporaryPassword && temporaryPassword.length < 8) {
      return NextResponse.json(
        {
          message: "Temporary password minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        {
          message: "Employee tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (employee.role !== "employee") {
      return NextResponse.json(
        {
          message: "Data ini bukan employee.",
        },
        { status: 400 }
      );
    }

    const duplicateEmail = await prisma.user.findFirst({
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

    if (duplicateEmail) {
      return NextResponse.json(
        {
          message: "Email sudah digunakan oleh user lain.",
        },
        { status: 409 }
      );
    }

    const structureValidation = await validateEmployeeStructure({
      registeredOfficeId,
      unitId,
      departmentId,
      positionId,
      shiftId,
    });

    if (!structureValidation.ok) {
      return NextResponse.json(
        {
          message: structureValidation.message,
        },
        { status: structureValidation.status }
      );
    }

    const passwordData = temporaryPassword
      ? {
          password_hash: await bcrypt.hash(temporaryPassword, 10),
        }
      : {};

    const updatedEmployee = await prisma.user.update({
      where: {
        id,
      },
      data: {
        name,
        email,
        status,
        unit_id: unitId,
        department_id: departmentId,
        position_id: positionId,
        shift_id: shiftId,
        registered_office_id: registeredOfficeId,
        ...passwordData,
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        created_at: true,

        unit: {
          select: {
            id: true,
            name: true,
            office_id: true,
            office: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        department: {
          select: {
            id: true,
            name: true,
            unit_id: true,
            unit: {
              select: {
                id: true,
                name: true,
                office_id: true,
                office: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },

        position: {
          select: {
            id: true,
            name: true,
            department_id: true,
            department: {
              select: {
                id: true,
                name: true,
                unit_id: true,
                unit: {
                  select: {
                    id: true,
                    name: true,
                    office_id: true,
                    office: {
                      select: {
                        id: true,
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
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
          select: {
            id: true,
            name: true,
            address: true,
            latitude: true,
            longitude: true,
            radius_meters: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Employee berhasil diperbarui.",
      data: updatedEmployee,
    });
  } catch (error) {
    console.error("PATCH /api/employees error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal memperbarui employee.",
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
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat menghapus employee.",
        },
        { status: 403 }
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          message: "ID employee wajib dikirim.",
        },
        { status: 400 }
      );
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        {
          message: "Tidak bisa menghapus akun sendiri.",
        },
        { status: 400 }
      );
    }

    const employee = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
        name: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        {
          message: "Employee tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (employee.role !== "employee") {
      return NextResponse.json(
        {
          message: "Data ini bukan employee.",
        },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      message: "Employee berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/employees error:", error);

    if (isPrismaForeignKeyError(error)) {
      return NextResponse.json(
        {
          message:
            "Employee tidak bisa dihapus karena sudah memiliki data relasi seperti absensi/cuti. Ubah status menjadi Inactive.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menghapus employee.",
      },
      { status: 500 }
    );
  }
}