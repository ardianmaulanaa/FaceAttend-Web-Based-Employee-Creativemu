import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import {
  IDENTITY_VALIDATION,
  assertDigitRange,
} from "@/lib/identity-validation";

export const runtime = "nodejs";

type AllowedRole = "admin" | "owner";
type AccountRole = "admin" | "employee";

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
  jabatan: {
    select: jabatanSelect,
  },
} as const;

const employeeSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  employee_type: true,
  phone: true,
  status: true,
  employment_status: true,
  employment_start_date: true,
  employment_end_date: true,
  birth_place: true,
  birth_date: true,
  bank_account_number: true,
  nik: true,
  profile_photo: true,
  jabatan_id: true,
  department_id: true,
  position_id: true,
  shift_id: true,
  registered_office_id: true,
  npwp_number: true,
  ptkp_status: true,
  base_salary: true,
  created_at: true,
  updated_at: true,
  jabatan: {
    select: jabatanSelect,
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
    { status }
  );
}

function normalizeOptionalText(value: unknown) {
  const text = String(value || "").trim();

  return text || null;
}

function normalizeOptionalDate(value: unknown, label = "Tanggal") {
  const text = String(value || "").trim();

  if (!text) return null;

  const date = new Date(`${text}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${label} tidak valid.`);
  }

  return date;
}

function normalizeAccountRole(value: unknown): AccountRole {
  const role = String(value || "employee").trim().toLowerCase();

  if (role === "admin") return "admin";
  if (role === "employee" || role === "user") return "employee";

  throw new Error("Role akun tidak valid.");
}

function ensureValidEmploymentPeriod(
  startDate: Date | null,
  endDate: Date | null,
) {
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new Error("Tanggal mulai masa kerja tidak boleh melewati tanggal akhir.");
  }
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

async function validateEmployeeHierarchy(params: {
  registeredOfficeId: string;
  departmentId: string;
  jabatanId: string;
  positionId: string;
  shiftId: string;
}) {
  const { registeredOfficeId, departmentId, jabatanId, positionId, shiftId } =
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

  const position = await prisma.position.findUnique({
    where: {
      id: positionId,
    },
    select: {
      id: true,
      jabatan_id: true,
      status: true,
    },
  });

  if (!position || position.status !== "active") {
    throw new Error("Posisi tidak ditemukan atau tidak aktif.");
  }

  if (position.jabatan_id !== jabatanId) {
    throw new Error("Posisi tidak sesuai dengan jabatan yang dipilih.");
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

    const jabatans = await prisma.jabatan.findMany({
      select: jabatanSelect,
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

    const totalStatuses = await prisma.employmentStatus.count();
    if (totalStatuses === 0) {
      const defaultStatuses = ["Tetap", "Kontrak", "Magang", "Freelance"];
      await Promise.all(
        defaultStatuses.map((name) =>
          prisma.employmentStatus.upsert({
            where: { name },
            update: {},
            create: { name, status: "active" },
          })
        )
      );
    }

    const employmentStatuses = await prisma.employmentStatus.findMany({
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
      jabatans,
      positions,
      shifts,
      employmentStatuses,
    });
  } catch (error) {
    console.error("GET /api/employees error:", error);

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal mengambil data karyawan."),
      },
      { status: getApiErrorStatus(error) }
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
        "Akses ditolak. Hanya admin yang dapat menambah akun.",
        403
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = normalizeAccountRole(body.role || body.account_role);
    const phone = String(body.phone || "").trim();
    const password = String(
      body.password || body.temporaryPassword || body.temp_password || ""
    ).trim();

    const employeeType = String(body.employee_type || "utama").trim();
    const status = String(body.status || "active").trim();
    const employmentStatus = normalizeOptionalText(body.employment_status);
    const employmentStartDate = normalizeOptionalDate(
      body.employment_start_date,
      "Tanggal mulai masa kerja"
    );
    const employmentEndDate = normalizeOptionalDate(
      body.employment_end_date,
      "Tanggal akhir masa kerja"
    );
    const birthPlace = normalizeOptionalText(body.birth_place);
    const birthDate = normalizeOptionalDate(body.birth_date, "Tanggal lahir");
    const bankAccountNumber = normalizeOptionalText(
      body.bank_account_number || body.no_rekening
    );
    const nik = normalizeOptionalText(body.nik);

    const registeredOfficeId = String(
      body.registered_office_id || body.office_id || ""
    ).trim();
    const departmentId = String(body.department_id || "").trim();
    const jabatanId = String(body.jabatan_id || "").trim();
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
      !jabatanId ||
      !positionId ||
      !shiftId
    ) {
      return jsonError(
        "Kantor, divisi, jabatan, posisi, dan shift wajib dipilih."
      );
    }

    if (!["utama", "magang"].includes(employeeType)) {
      return jsonError("Tipe karyawan tidak valid.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status karyawan tidak valid.");
    }

    assertDigitRange(phone || null, IDENTITY_VALIDATION.phone);
    assertDigitRange(bankAccountNumber, IDENTITY_VALIDATION.bankAccount);
    assertDigitRange(nik, IDENTITY_VALIDATION.nik);
    ensureValidEmploymentPeriod(employmentStartDate, employmentEndDate);

    await validateEmployeeHierarchy({
      registeredOfficeId,
      departmentId,
      jabatanId,
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

    const passwordHash = await bcrypt.hash(password, 10);

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role,
        employee_type: employeeType,
        phone: phone || null,
        status,
        employment_status: employmentStatus,
        employment_start_date: employmentStartDate,
        employment_end_date: employmentEndDate,
        birth_place: birthPlace,
        birth_date: birthDate,
        bank_account_number: bankAccountNumber,
        nik,
        registered_office_id: registeredOfficeId,
        department_id: departmentId,
        jabatan_id: jabatanId,
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
      message: role === "admin" ? "Admin berhasil ditambahkan." : "Karyawan berhasil ditambahkan.",
      employee,
    });
  } catch (error) {
    console.error("POST /api/employees error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Email sudah digunakan.", 409);
    }

    if (
      error instanceof Error &&
      (error.message.includes("hanya dapat diisi angka") ||
        error.message.includes("harus berupa angka") ||
        error.message.includes("digit") ||
        error.message.includes("Role akun") ||
        error.message.includes("Tanggal") ||
        error.message.includes("masa kerja"))
    ) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal menambahkan karyawan."),
      },
      { status: getApiErrorStatus(error) }
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
        "Akses ditolak. Hanya admin yang dapat mengubah akun.",
        403
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const role = normalizeAccountRole(body.role || body.account_role);
    const phone = String(body.phone || "").trim();
    const password = String(
      body.password || body.temporaryPassword || body.temp_password || ""
    ).trim();

    const employeeType = String(body.employee_type || "utama").trim();
    const status = String(body.status || "active").trim();
    const employmentStatus = normalizeOptionalText(body.employment_status);
    const employmentStartDate = normalizeOptionalDate(
      body.employment_start_date,
      "Tanggal mulai masa kerja"
    );
    const employmentEndDate = normalizeOptionalDate(
      body.employment_end_date,
      "Tanggal akhir masa kerja"
    );
    const birthPlace = normalizeOptionalText(body.birth_place);
    const birthDate = normalizeOptionalDate(body.birth_date, "Tanggal lahir");
    const bankAccountNumber = normalizeOptionalText(
      body.bank_account_number || body.no_rekening
    );
    const nik = normalizeOptionalText(body.nik);

    const registeredOfficeId = String(
      body.registered_office_id || body.office_id || ""
    ).trim();
    const departmentId = String(body.department_id || "").trim();
    const jabatanId = String(body.jabatan_id || "").trim();
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
      !jabatanId ||
      !positionId ||
      !shiftId
    ) {
      return jsonError(
        "Kantor, divisi, jabatan, posisi, dan shift wajib dipilih."
      );
    }

    if (!["utama", "magang"].includes(employeeType)) {
      return jsonError("Tipe karyawan tidak valid.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status karyawan tidak valid.");
    }

    assertDigitRange(phone || null, IDENTITY_VALIDATION.phone);
    assertDigitRange(bankAccountNumber, IDENTITY_VALIDATION.bankAccount);
    assertDigitRange(nik, IDENTITY_VALIDATION.nik);
    ensureValidEmploymentPeriod(employmentStartDate, employmentEndDate);

    const existingEmployee = await prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (
      !existingEmployee ||
      !["admin", "employee", "owner"].includes(
        String(existingEmployee.role || "").toLowerCase(),
      )
    ) {
      return jsonError("Akun tidak ditemukan.", 404);
    }

    await validateEmployeeHierarchy({
      registeredOfficeId,
      departmentId,
      jabatanId,
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

    const updateData: {
      name: string;
      email: string;
      role: string;
      phone: string | null;
      employee_type: string;
      status: string;
      employment_status: string | null;
      employment_start_date: Date | null;
      employment_end_date: Date | null;
      birth_place: string | null;
      birth_date: Date | null;
      bank_account_number: string | null;
      nik: string | null;
      registered_office_id: string;
      department_id: string;
      jabatan_id: string;
      position_id: string;
      shift_id: string;
      npwp_number: string | null;
      ptkp_status: string | null;
      base_salary: number | null;
      password_hash?: string;
    } = {
      name,
      email,
      role,
      phone: phone || null,
      employee_type: employeeType,
      status,
      employment_status: employmentStatus,
      employment_start_date: employmentStartDate,
      employment_end_date: employmentEndDate,
      birth_place: birthPlace,
      birth_date: birthDate,
      bank_account_number: bankAccountNumber,
      nik,
      registered_office_id: registeredOfficeId,
      department_id: departmentId,
      jabatan_id: jabatanId,
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
      message: "Akun berhasil diperbarui.",
      employee,
    });
  } catch (error) {
    console.error("PATCH /api/employees error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError("Email sudah digunakan.", 409);
    }

    if (
      error instanceof Error &&
      (error.message.includes("hanya dapat diisi angka") ||
        error.message.includes("harus berupa angka") ||
        error.message.includes("digit") ||
        error.message.includes("Role akun") ||
        error.message.includes("Tanggal") ||
        error.message.includes("masa kerja"))
    ) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal memperbarui karyawan."),
      },
      { status: getApiErrorStatus(error) }
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
        "Akses ditolak. Hanya admin yang dapat menghapus akun.",
        403
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return jsonError("ID karyawan wajib dikirim.");
    }

    if (currentUser.id === id) {
      return jsonError("Akun yang sedang login tidak bisa menghapus dirinya sendiri.", 400);
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

    if (!employee || String(employee.role || "").toLowerCase() !== "employee") {
      return jsonError("Akun tidak ditemukan.", 404);
    }

    await prisma.$transaction(async (tx) => {
      const payrolls = await tx.payroll.findMany({
        where: { user_id: id },
        select: { id: true },
      });
      const payrollIds = payrolls.map((payroll) => payroll.id);

      if (payrollIds.length > 0) {
        await tx.payrollItem.deleteMany({
          where: {
            payroll_id: {
              in: payrollIds,
            },
          },
        });
      }

      await tx.payroll.deleteMany({
        where: { user_id: id },
      });

      await tx.adminNotification.deleteMany({
        where: { user_id: id },
      });

      await tx.employeeVisit.deleteMany({
        where: { user_id: id },
      });

      await tx.attendanceMonthlySummary.deleteMany({
        where: { user_id: id },
      });

      await tx.leaveRequest.deleteMany({
        where: { user_id: id },
      });

      await tx.wfhRequest.updateMany({
        where: { approved_by_id: id },
        data: { approved_by_id: null },
      });

      await tx.wfhRequest.deleteMany({
        where: { user_id: id },
      });

      await tx.announcement.updateMany({
        where: { author_id: id },
        data: { author_id: null },
      });

      await tx.attendance.deleteMany({
        where: { user_id: id },
      });

      await tx.user.delete({
        where: {
          id,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Akun dan data terkait berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/employees error:", error);

    if (isPrismaForeignKeyError(error)) {
      return jsonError(
        "Karyawan tidak bisa dihapus karena masih memiliki relasi data lain.",
        400
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal menghapus karyawan."),
      },
      { status: getApiErrorStatus(error) }
    );
  }
}
