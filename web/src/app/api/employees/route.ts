import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
  }

  try {
    const employees = await getDbEmployees();

    return NextResponse.json({
      data: employees,
      units,
      departments,
      positions,
      shifts,
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({
        success: true,
        data: mapDemoUsers(),
      });
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data karyawan.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat register employee.",
        },
        { status: 403 },
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
    const status = String(body.status || "active");

    if (
      !name ||
      !email ||
      !temporaryPassword ||
      !unitId ||
      !departmentId ||
      !positionId ||
      !shiftId
    ) {
      return NextResponse.json(
        {
          message:
            "Nama, email, password, unit, divisi, jabatan, dan shift wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status tidak valid.",
        },
        { status: 400 },
      );
    }

    if (temporaryPassword.length < 8) {
      return NextResponse.json(
        {
          message: "Temporary password minimal 8 karakter.",
        },
        { status: 400 },
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
        { status: 409 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: {
        id: unitId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!unit || unit.status !== "active") {
      return NextResponse.json(
        {
          message: "Unit tidak ditemukan atau tidak aktif.",
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
        unit_id: true,
        status: true,
      },
    });

    if (!department || department.status !== "active") {
      return NextResponse.json(
        {
          message: "Divisi tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

    if (department.unit_id !== unitId) {
      return NextResponse.json(
        {
          message: "Divisi tidak sesuai dengan unit yang dipilih.",
        },
        { status: 400 },
      );
    }

    const position = await prisma.position.findUnique({
      where: {
        id: positionId,
      },
      select: {
        id: true,
        department_id: true,
        status: true,
      },
    });

    if (!position || position.status !== "active") {
      return NextResponse.json(
        {
          message: "Jabatan tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

    if (position.department_id !== departmentId) {
      return NextResponse.json(
        {
          message: "Jabatan tidak sesuai dengan divisi yang dipilih.",
        },
        { status: 400 },
      );
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
      return NextResponse.json(
        {
          message: "Shift tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
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
          },
        },

        department: {
          select: {
            id: true,
            name: true,
            unit_id: true,
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
      },
    });

    return NextResponse.json({
      message: "Employee berhasil dibuat.",
      data: employee,
    });
  } catch (error) {
    console.error("POST /api/employees error:", error);

    if (isDatabaseUnavailable(error)) {
      const employee = addDemoEmployee({
        name: payload.name,
        email: payload.email,
        temporaryPassword: generateTemporaryPassword(),
        department: payload.department,
        position: payload.position,
        phone: payload.phone,
        role: payload.role,
        employeeCategory: payload.employeeCategory,
        profilePhotoUrl: payload.profilePhotoUrl,
        payrollMethods: payload.payrollMethods,
        payrollStatus: payload.payrollStatus,
        status: payload.status,
      });

      if (!employee) {
        return NextResponse.json(
          { success: false, message: "Email sudah terdaftar" },
          { status: 409 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Karyawan berhasil ditambahkan (demo mode)",
          data: {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            role: employee.role,
            employee_category: employee.employee_category,
            department: employee.department,
            position: employee.position,
            phone: employee.phone,
            profile_photo_url: employee.profile_photo_url,
            payroll_status: employee.payroll_status,
            status: employee.status,
            must_change_password: employee.must_change_password,
            created_at: employee.created_at,
          },
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal menambahkan karyawan.",
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
            "Akses ditolak. Hanya owner atau admin yang dapat mengubah employee.",
        },
        { status: 403 },
      );
    }

    await ensureDefaultShifts();

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const unitId = String(body.unit_id || "").trim();
    const departmentId = String(body.department_id || "").trim();
    const positionId = String(body.position_id || "").trim();
    const shiftId = String(body.shift_id || "").trim();
    const status = String(body.status || "active");

    if (!id) {
      return NextResponse.json(
        {
          message: "ID employee wajib dikirim.",
        },
        { status: 400 },
      );
    }

    if (!name || !email || !unitId || !departmentId || !positionId || !shiftId) {
      return NextResponse.json(
        {
          message: "Nama, email, unit, divisi, jabatan, dan shift wajib diisi.",
        },
        { status: 400 },
      );
    }

    if (!["active", "inactive"].includes(status)) {
      return NextResponse.json(
        {
          message: "Status tidak valid.",
        },
        { status: 400 },
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
        { status: 404 },
      );
    }

    if (employee.role !== "employee") {
      return NextResponse.json(
        {
          message: "Data ini bukan employee.",
        },
        { status: 400 },
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
        { status: 409 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: {
        id: unitId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!unit || unit.status !== "active") {
      return NextResponse.json(
        {
          message: "Unit tidak ditemukan atau tidak aktif.",
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
        unit_id: true,
        status: true,
      },
    });

    if (!department || department.status !== "active") {
      return NextResponse.json(
        {
          message: "Divisi tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

    if (department.unit_id !== unitId) {
      return NextResponse.json(
        {
          message: "Divisi tidak sesuai dengan unit yang dipilih.",
        },
        { status: 400 },
      );
    }

    const position = await prisma.position.findUnique({
      where: {
        id: positionId,
      },
      select: {
        id: true,
        department_id: true,
        status: true,
      },
    });

    if (!position || position.status !== "active") {
      return NextResponse.json(
        {
          message: "Jabatan tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

    if (position.department_id !== departmentId) {
      return NextResponse.json(
        {
          message: "Jabatan tidak sesuai dengan divisi yang dipilih.",
        },
        { status: 400 },
      );
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
      return NextResponse.json(
        {
          message: "Shift tidak ditemukan atau tidak aktif.",
        },
        { status: 404 },
      );
    }

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
          },
        },

        department: {
          select: {
            id: true,
            name: true,
            unit_id: true,
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
            "Akses ditolak. Hanya owner atau admin yang dapat menghapus employee.",
        },
        { status: 403 },
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return NextResponse.json(
        {
          message: "ID employee wajib dikirim.",
        },
        { status: 400 },
      );
    }

    if (id === currentUser.id) {
      return NextResponse.json(
        {
          message: "Tidak bisa menghapus akun sendiri.",
        },
        { status: 400 },
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
        { status: 404 },
      );
    }

    if (employee.role !== "employee") {
      return NextResponse.json(
        {
          message: "Data ini bukan employee.",
        },
        { status: 400 },
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
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Gagal menghapus employee.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
  const role = await getActorRole();
  if (!role) {
    return NextResponse.json(
      { success: false, message: "Belum login" },
      { status: 401 },
    );
  }

  if (!canEditAdminData(role)) {
    return NextResponse.json(
      { success: false, message: "Role Anda hanya dapat melihat data." },
      { status: 403 },
    );
  }

  const body = await req.json();

  const id = String(body.id || "").trim();
  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID karyawan wajib diisi" },
      { status: 400 },
    );
  }

  if (useDemoDataByDefault) {
    const payload = {
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim(),
      department: String(body.department || "").trim(),
      position: String(body.position || "").trim(),
      phone: String(body.phone || "").trim(),
      role: String(body.role || "employee"),
      employeeCategory: String(body.employeeCategory || "tetap"),
      profilePhotoUrl: String(body.profilePhotoUrl || "").trim(),
      payrollMethods: normalizePayrollMethods(body.payrollMethods),
      payrollStatus: String(body.payrollStatus || "unpaid"),
      status: String(body.status || "active"),
    };

    const employee = updateDemoEmployee(id, payload);

    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil diperbarui (demo mode)",
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        employee_category: employee.employee_category,
        department: employee.department,
        position: employee.position,
        phone: employee.phone,
        profile_photo_url: employee.profile_photo_url,
        payroll_status: employee.payroll_status,
        status: employee.status,
        must_change_password: employee.must_change_password,
        created_at: employee.created_at,
      },
    });
  }

  try {
    const payload = {
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim(),
      department: String(body.department || "").trim(),
      position: String(body.position || "").trim(),
      phone: String(body.phone || "").trim(),
      employeeCategory: String(body.employeeCategory || "tetap"),
      profilePhotoUrl: String(body.profilePhotoUrl || "").trim(),
      payrollMethods: normalizePayrollMethods(body.payrollMethods),
      payrollStatus: String(body.payrollStatus || "unpaid"),
      status: String(body.status || "active"),
    };

    const employee = await prisma.user.update({
      where: { id },
      data: {
        name: payload.name || undefined,
        email: payload.email || undefined,
        role:
          payload.role === "owner"
            ? "owner"
            : payload.role === "admin"
              ? "admin"
              : payload.role === "cs"
                ? "cs"
                : "employee",
        employee_category:
          payload.employeeCategory === "magang" ? "magang" : "tetap",
        department: payload.department || null,
        position: payload.position || null,
        phone: payload.phone || null,
        payout_label: payload.payrollStatus === "paid" ? "paid" : "unpaid",
        account_holder_name: null,
        payout_contact_email: payload.email || null,
        payout_phone_number: payload.phone || null,
        account_number: null,
        expiry_month: null,
        expiry_year: null,
        status: payload.status || "active",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        employee_category: true,
        department: true,
        position: true,
        phone: true,
        payout_label: true,
        account_holder_name: true,
        payout_contact_email: true,
        payout_phone_number: true,
        payout_label: true,
        status: true,
        must_change_password: true,
        created_at: true,
      },
    });

    try {
      await prisma.$executeRaw`
        UPDATE users
        SET profile_photo_url = ${payload.profilePhotoUrl || null}
        WHERE id = ${id}
      `;

      await persistDbPayrollMethods(id, payload.payrollMethods);
    } catch (extraError) {
      if (!isSchemaMigrationMissing(extraError)) {
        throw extraError;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil diperbarui",
      data: {
        ...employee,
        profile_photo_url: payload.profilePhotoUrl || null,
        payroll_status: payload.payrollStatus === "paid" ? "paid" : "unpaid",
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal memperbarui karyawan" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: Request) {
  const role = await getActorRole();
  if (!role) {
    return NextResponse.json(
      { success: false, message: "Belum login" },
      { status: 401 },
    );
  }

  if (!canDeleteAdminData(role)) {
    return NextResponse.json(
      {
        success: false,
        message: "Hanya owner yang dapat menghapus akun.",
      },
      { status: 403 },
    );
  }

  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "").trim();

  if (!id) {
    return NextResponse.json(
      { success: false, message: "ID karyawan wajib diisi" },
      { status: 400 },
    );
  }

  if (useDemoDataByDefault) {
    const removed = removeDemoEmployee(id);

    if (!removed) {
      return NextResponse.json(
        {
          success: false,
          message: "Karyawan tidak ditemukan atau tidak dapat dihapus",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil dihapus (demo mode)",
    });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (user.role !== "employee") {
      return NextResponse.json(
        {
          success: false,
          message: "Akun owner/admin/cs tidak dapat dihapus",
        },
        { status: 400 },
      );
    }

    try {
      await prisma.$executeRaw`DELETE FROM payroll_methods WHERE user_id = ${id}`;
    } catch (extraError) {
      if (!isSchemaMigrationMissing(extraError)) {
        throw extraError;
      }
    }

    try {
      await prisma.$executeRaw`DELETE FROM attendances WHERE user_id = ${id}`;
    } catch {
      // Older schemas may not have attendance relation or table yet.
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Karyawan berhasil dihapus",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal menghapus karyawan" },
      { status: 500 },
    );
  }
}
