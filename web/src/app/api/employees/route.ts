import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import {
  CREATIVEMU_EMAIL_EXAMPLE,
  isCreativemuEmail,
  isValidEmailFormat,
} from "@/lib/creativemu-email";
import {
  IDENTITY_VALIDATION,
  assertDigitRange,
} from "@/lib/identity-validation";
import {
  ensureWfhQuotaColumn,
  isMissingWfhQuotaColumnError,
} from "@/lib/wfh-quota-schema";
import {
  ensureAnnualLeaveQuotaColumn,
  isMissingAnnualLeaveQuotaColumnError,
} from "@/lib/annual-leave-quota-schema";
import { normalizeBankCode } from "@/lib/bank-options";

export const runtime = "nodejs";

type AllowedRole = "admin" | "owner";
type AccountRole = "admin" | "employee";

const VIEW_ROLES: AllowedRole[] = ["admin", "owner"];
const MANAGE_ROLES: AllowedRole[] = ["admin", "owner"];

function createStatusCode(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 50);
}

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

// Select khusus GET /api/employees. Hanya ambil field yang dipakai di halaman
// daftar karyawan dan foreign key mentah. Relasi dirakit manual setelah query
// agar Prisma tidak membuat query relasi seperti IN (NULL).
const employeeListSelect = {
  id: true,
  employee_code: true,
  name: true,
  email: true,
  role: true,
  status: true,
  employment_status: true,
  employment_start_date: true,
  employment_end_date: true,
  birth_place: true,
  birth_date: true,
  bank_code: true,
  bank_account_number: true,
  nik: true,
  profile_photo: true,
  created_at: true,
  jabatan_id: true,
  department_id: true,
  position_id: true,
  shift_id: true,
  registered_office_id: true,
} as const;

const departmentListSelect = {
  id: true,
  name: true,
  office_id: true,
  status: true,
} as const;

const jabatanListSelect = {
  id: true,
  name: true,
  department_id: true,
  status: true,
} as const;

const positionListSelect = {
  id: true,
  name: true,
  jabatan_id: true,
  status: true,
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
  employment_status: true,
  employment_start_date: true,
  employment_end_date: true,
  birth_place: true,
  birth_date: true,
  bank_code: true,
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
    { status },
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
  const role = String(value || "employee")
    .trim()
    .toLowerCase();

  if (role === "admin") return "admin";
  if (role === "employee" || role === "user") return "employee";

  throw new Error("Role akun tidak valid.");
}

function normalizeNonNegativeInteger(value: unknown, label: string) {
  const text = String(value ?? "").trim();

  if (!text) return 0;

  const numberValue = Number(text);

  if (!Number.isInteger(numberValue) || numberValue < 0) {
    throw new Error(`${label} harus berupa angka 0 atau lebih.`);
  }

  return numberValue;
}

function ensureValidEmploymentPeriod(
  startDate: Date | null,
  endDate: Date | null,
) {
  if (startDate && endDate && startDate.getTime() > endDate.getTime()) {
    throw new Error(
      "Tanggal mulai masa kerja tidak boleh melewati tanggal akhir.",
    );
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

function getUniqueEmployeeMessage(error: unknown) {
  const target =
    typeof error === "object" && error !== null && "meta" in error
      ? (error as { meta?: { target?: string[] | string } }).meta?.target
      : undefined;
  const columns = Array.isArray(target) ? target : target ? [target] : [];

  if (columns.some((column) => String(column).includes("employee_code"))) {
    return "No induk karyawan sudah digunakan.";
  }

  return "Email sudah digunakan.";
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
      status: true,
    },
  });

  if (!department || department.status !== "active") {
    throw new Error("Divisi tidak ditemukan atau tidak aktif.");
  }

  const jabatan = await prisma.jabatan.findUnique({
    where: {
      id: jabatanId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!jabatan || jabatan.status !== "active") {
    throw new Error("Jabatan tidak ditemukan atau tidak aktif.");
  }

  const position = await prisma.position.findUnique({
    where: {
      id: positionId,
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!position || position.status !== "active") {
    throw new Error("Posisi tidak ditemukan atau tidak aktif.");
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
    throw new Error("Shift tidak ditemukan atau tidak aktif.");
  }

  return {
    shift,
  };
}

async function getWfhQuotaByUserId(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, number>();
  if (!(await ensureWfhQuotaColumn())) return new Map<string, number>();

  const placeholders = userIds.map(() => "?").join(", ");
  let rows: Array<{ id: string; wfh_quota_monthly: number | null }> = [];

  try {
    rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; wfh_quota_monthly: number | null }>
    >(
      `SELECT id, COALESCE(wfh_quota_monthly, 0) AS wfh_quota_monthly FROM users WHERE id IN (${placeholders})`,
      ...userIds,
    );
  } catch (error) {
    if (!isMissingWfhQuotaColumnError(error)) throw error;
  }

  return new Map(
    rows.map((row) => [
      row.id,
      Math.max(0, Number(row.wfh_quota_monthly || 0)),
    ]),
  );
}

async function getAnnualLeaveQuotaByUserId(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, number>();
  if (!(await ensureAnnualLeaveQuotaColumn())) return new Map<string, number>();

  const placeholders = userIds.map(() => "?").join(", ");
  let rows: Array<{ id: string; annual_leave_quota: number | null }> = [];

  try {
    rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; annual_leave_quota: number | null }>
    >(
      `SELECT id, COALESCE(annual_leave_quota, 12) AS annual_leave_quota FROM users WHERE id IN (${placeholders})`,
      ...userIds,
    );
  } catch (error) {
    if (!isMissingAnnualLeaveQuotaColumnError(error)) throw error;
  }

  return new Map(
    rows.map((row) => [
      row.id,
      Math.max(0, Number(row.annual_leave_quota ?? 12)),
    ]),
  );
}

async function attachWfhQuotaToEmployees<
  T extends { id: string; [key: string]: unknown },
>(employees: T[]) {
  const userIds = employees.map((employee) => employee.id);
  const [wfhQuotaByUserId, annualLeaveQuotaByUserId] = await Promise.all([
    getWfhQuotaByUserId(userIds),
    getAnnualLeaveQuotaByUserId(userIds),
  ]);

  return employees.map((employee) => ({
    ...employee,
    bank_code:
      typeof employee.bank_code === "string" ? employee.bank_code : null,
    wfh_quota_monthly: wfhQuotaByUserId.get(employee.id) || 0,
    annual_leave_quota: annualLeaveQuotaByUserId.get(employee.id) ?? 12,
  }));
}

async function updateEmployeeWfhQuota(userId: string, quota: number) {
  if (!(await ensureWfhQuotaColumn())) return;

  try {
    await prisma.$executeRawUnsafe(
      "UPDATE users SET wfh_quota_monthly = ? WHERE id = ?",
      quota,
      userId,
    );
  } catch (error) {
    if (!isMissingWfhQuotaColumnError(error)) throw error;
  }
}

async function updateEmployeeAnnualLeaveQuota(userId: string, quota: number) {
  if (!(await ensureAnnualLeaveQuotaColumn())) return;

  try {
    await prisma.$executeRawUnsafe(
      "UPDATE users SET annual_leave_quota = ? WHERE id = ?",
      quota,
      userId,
    );
  } catch (error) {
    if (!isMissingAnnualLeaveQuotaColumnError(error)) throw error;
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

    // Jangan menjalankan ensureDefaultShifts() di setiap GET.
    // Data default sebaiknya dibuat lewat seed/migration.
    // Semua query master yang tidak saling bergantung dijalankan paralel.
    const [
      employees,
      officesRaw,
      departmentsRaw,
      jabatanRaw,
      positionsRaw,
      shifts,
      employmentStatuses,
    ] = await Promise.all([
      prisma.user.findMany({
        where: {
          role: "employee",
        },
        select: employeeListSelect,
        orderBy: {
          created_at: "desc",
        },
      }),
      prisma.officeLocation.findMany({
        select: officeSelect,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.department.findMany({
        select: departmentListSelect,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.jabatan.findMany({
        select: jabatanListSelect,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.position.findMany({
        select: positionListSelect,
        orderBy: {
          name: "asc",
        },
      }),
      prisma.shift.findMany({
        select: {
          id: true,
          name: true,
          tolerance_minutes: true,
          status: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.employmentStatus.findMany({
        where: {
          NOT: {
            name: "Utama",
          },
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    // Rakitan relasi dilakukan di memory. ID null tidak pernah dikirim ke
    // Prisma sebagai `in: [null]`, sehingga query IN (NULL) dari endpoint ini hilang.
    const officeById = new Map(officesRaw.map((office) => [office.id, office]));

    const departments = departmentsRaw.map((department) => ({
      ...department,
      office: department.office_id
        ? officeById.get(department.office_id) || null
        : null,
    }));
    const departmentById = new Map(
      departments.map((department) => [department.id, department]),
    );

    const jabatan = jabatanRaw.map((item) => ({
      ...item,
      department: item.department_id
        ? departmentById.get(item.department_id) || null
        : null,
    }));
    const jabatanById = new Map(jabatan.map((item) => [item.id, item]));

    const positions = positionsRaw.map((position) => ({
      ...position,
      jabatan: position.jabatan_id
        ? jabatanById.get(position.jabatan_id) || null
        : null,
    }));
    const positionById = new Map(
      positions.map((position) => [position.id, position]),
    );
    const shiftById = new Map(shifts.map((shift) => [shift.id, shift]));

    const employeesWithRelations = employees.map((employee) => ({
      ...employee,
      jabatan: employee.jabatan_id
        ? jabatanById.get(employee.jabatan_id) || null
        : null,
      department: employee.department_id
        ? departmentById.get(employee.department_id) || null
        : null,
      position: employee.position_id
        ? positionById.get(employee.position_id) || null
        : null,
      shift: employee.shift_id
        ? shiftById.get(employee.shift_id) || null
        : null,
      registered_office: employee.registered_office_id
        ? officeById.get(employee.registered_office_id) || null
        : null,
    }));

    const employeesWithWfhQuota = await attachWfhQuotaToEmployees(
      employeesWithRelations,
    );

    return NextResponse.json({
      success: true,
      employees: employeesWithWfhQuota,
      offices: officesRaw,
      officeLocations: officesRaw,
      departments,
      jabatan,
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
      { status: getApiErrorStatus(error) },
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
        403,
      );
    }

    const body = await req.json();

    const name = String(body.name || "").trim();
    const employeeCode = normalizeOptionalText(
      body.employee_code || body.employeeCode || body.no_induk_karyawan,
    );
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const role = normalizeAccountRole(body.role || body.account_role);
    const phone = String(body.phone || "").trim();
    const password = String(
      body.password || body.temporaryPassword || body.temp_password || "",
    ).trim();

    const employeeType = String(body.employee_type || "utama").trim();
    const status = String(body.status || "active").trim();
    const employmentStatus = normalizeOptionalText(body.employment_status);
    const employmentStartDate = normalizeOptionalDate(
      body.employment_start_date,
      "Tanggal mulai masa kerja",
    );
    const employmentEndDate = normalizeOptionalDate(
      body.employment_end_date,
      "Tanggal akhir masa kerja",
    );
    const birthPlace = normalizeOptionalText(body.birth_place);
    const birthDate = normalizeOptionalDate(body.birth_date, "Tanggal lahir");
    const bankCode = normalizeBankCode(body.bank_code || body.bankCode);
    const bankAccountNumber = normalizeOptionalText(
      body.bank_account_number || body.no_rekening,
    );
    const nik = normalizeOptionalText(body.nik);

    const registeredOfficeId = String(
      body.registered_office_id || body.office_id || "",
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
    const wfhQuotaMonthly = normalizeNonNegativeInteger(
      body.wfh_quota_monthly ?? body.wfhQuotaMonthly ?? body.wfh_quota,
      "Kuota WFH",
    );
    const annualLeaveQuota = normalizeNonNegativeInteger(
      body.annual_leave_quota ??
        body.annualLeaveQuota ??
        body.leave_quota ??
        12,
      "Kuota Cuti Tahunan",
    );

    if (!name) return jsonError("Nama karyawan wajib diisi.");
    if (!email) return jsonError("Email karyawan wajib diisi.");
    if (!password) return jsonError("Password karyawan wajib diisi.");
    if (!isValidEmailFormat(email)) {
      return jsonError(
        `Format email tidak valid. Contoh: ${CREATIVEMU_EMAIL_EXAMPLE}.`,
      );
    }
    if (!isCreativemuEmail(email)) {
      return jsonError(
        "Email akun wajib menggunakan domain resmi @creativemu.id.",
        403,
      );
    }

    if (
      !registeredOfficeId ||
      !departmentId ||
      !jabatanId ||
      !positionId ||
      !shiftId
    ) {
      return jsonError(
        "Kantor, divisi, jabatan, posisi, dan shift wajib dipilih.",
      );
    }

    if (!["utama", "magang"].includes(employeeType)) {
      return jsonError("Tipe karyawan tidak valid.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status karyawan tidak valid.");
    }

    const { shift } = await validateEmployeeHierarchy({
      registeredOfficeId,
      departmentId,
      jabatanId,
      positionId,
      shiftId,
    });

    const isPrimaryShift = shift.name.trim().toLowerCase() === "utama";
    const normalizedEmploymentEndDate = isPrimaryShift
      ? null
      : employmentEndDate;
    const normalizedEmploymentStatus =
      employmentStatus?.trim().toLowerCase() === "utama"
        ? null
        : employmentStatus;

    assertDigitRange(phone || null, IDENTITY_VALIDATION.phone);
    assertDigitRange(bankAccountNumber, IDENTITY_VALIDATION.bankAccount);
    assertDigitRange(nik, IDENTITY_VALIDATION.nik);
    ensureValidEmploymentPeriod(
      employmentStartDate,
      normalizedEmploymentEndDate,
    );

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
        employee_code: employeeCode,
        name,
        email,
        password_hash: passwordHash,
        role,
        employee_type: employeeType,
        phone: phone || null,
        status,
        employment_status: normalizedEmploymentStatus,
        employment_start_date: employmentStartDate,
        employment_end_date: normalizedEmploymentEndDate,
        birth_place: birthPlace,
        birth_date: birthDate,
        bank_code: bankCode || null,
        bank_account_number: bankAccountNumber,
        nik,
        registered_office_id: registeredOfficeId || null,
        department_id: departmentId || null,
        jabatan_id: jabatanId || null,
        position_id: positionId || null,
        shift_id: shiftId,
        npwp_number: npwpNumber,
        ptkp_status: ptkpStatus,
        base_salary: baseSalary,
      },
      select: employeeSelect,
    });
    await updateEmployeeWfhQuota(employee.id, wfhQuotaMonthly);
    await updateEmployeeAnnualLeaveQuota(employee.id, annualLeaveQuota);
    const [employeeWithWfhQuota] = await attachWfhQuotaToEmployees([employee]);

    return NextResponse.json({
      success: true,
      message:
        role === "admin"
          ? "Admin berhasil ditambahkan."
          : "Karyawan berhasil ditambahkan.",
      employee: employeeWithWfhQuota,
    });
  } catch (error) {
    console.error("POST /api/employees error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError(getUniqueEmployeeMessage(error), 409);
    }

    const message =
      error instanceof Error ? error.message : "Gagal menambahkan karyawan.";
    return jsonError(message, 400);
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
        403,
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim();
    const employeeCode = normalizeOptionalText(
      body.employee_code || body.employeeCode || body.no_induk_karyawan,
    );
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const role = normalizeAccountRole(body.role || body.account_role);
    const phone = String(body.phone || "").trim();
    const password = String(
      body.password || body.temporaryPassword || body.temp_password || "",
    ).trim();

    const employeeType = String(body.employee_type || "utama").trim();
    const status = String(body.status || "active").trim();
    const employmentStatus = normalizeOptionalText(body.employment_status);
    const employmentStartDate = normalizeOptionalDate(
      body.employment_start_date,
      "Tanggal mulai masa kerja",
    );
    const employmentEndDate = normalizeOptionalDate(
      body.employment_end_date,
      "Tanggal akhir masa kerja",
    );
    const birthPlace = normalizeOptionalText(body.birth_place);
    const birthDate = normalizeOptionalDate(body.birth_date, "Tanggal lahir");
    const bankCode = normalizeBankCode(body.bank_code || body.bankCode);
    const bankAccountNumber = normalizeOptionalText(
      body.bank_account_number || body.no_rekening,
    );
    const nik = normalizeOptionalText(body.nik);

    const registeredOfficeId = String(
      body.registered_office_id || body.office_id || "",
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
    const wfhQuotaMonthly = normalizeNonNegativeInteger(
      body.wfh_quota_monthly ?? body.wfhQuotaMonthly ?? body.wfh_quota,
      "Kuota WFH",
    );
    const annualLeaveQuota = normalizeNonNegativeInteger(
      body.annual_leave_quota ??
        body.annualLeaveQuota ??
        body.leave_quota ??
        12,
      "Kuota Cuti Tahunan",
    );

    if (!id) return jsonError("ID karyawan wajib dikirim.");
    if (!name) return jsonError("Nama karyawan wajib diisi.");
    if (!email) return jsonError("Email karyawan wajib diisi.");
    if (!isValidEmailFormat(email)) {
      return jsonError(
        `Format email tidak valid. Contoh: ${CREATIVEMU_EMAIL_EXAMPLE}.`,
      );
    }
    if (!isCreativemuEmail(email)) {
      return jsonError(
        "Email akun wajib menggunakan domain resmi @creativemu.id.",
        403,
      );
    }

    if (
      !registeredOfficeId ||
      !departmentId ||
      !jabatanId ||
      !positionId ||
      !shiftId
    ) {
      return jsonError(
        "Kantor, divisi, jabatan, posisi, dan shift wajib dipilih.",
      );
    }

    if (!["utama", "magang"].includes(employeeType)) {
      return jsonError("Tipe karyawan tidak valid.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status karyawan tidak valid.");
    }

    if (password && password.length < 8) {
      return jsonError("Password baru minimal 8 karakter.");
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

    if (
      !existingEmployee ||
      !["admin", "employee", "owner"].includes(
        String(existingEmployee.role || "").toLowerCase(),
      )
    ) {
      return jsonError("Akun tidak ditemukan.", 404);
    }

    const { shift } = await validateEmployeeHierarchy({
      registeredOfficeId,
      departmentId,
      jabatanId,
      positionId,
      shiftId,
    });

    const isPrimaryShift = shift.name.trim().toLowerCase() === "utama";
    const normalizedEmploymentEndDate = isPrimaryShift
      ? null
      : employmentEndDate;
    const normalizedEmploymentStatus =
      employmentStatus?.trim().toLowerCase() === "utama"
        ? null
        : employmentStatus;

    assertDigitRange(phone || null, IDENTITY_VALIDATION.phone);
    assertDigitRange(bankAccountNumber, IDENTITY_VALIDATION.bankAccount);
    assertDigitRange(nik, IDENTITY_VALIDATION.nik);
    ensureValidEmploymentPeriod(
      employmentStartDate,
      normalizedEmploymentEndDate,
    );

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
      employee_code: string | null;
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
      bank_code: string | null;
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
      employee_code: employeeCode,
      email,
      role,
      phone: phone || null,
      employee_type: employeeType,
      status,
      employment_status: normalizedEmploymentStatus,
      employment_start_date: employmentStartDate,
      employment_end_date: normalizedEmploymentEndDate,
      birth_place: birthPlace,
      birth_date: birthDate,
      bank_code: bankCode || null,
      bank_account_number: bankAccountNumber,
      nik,
      registered_office_id: registeredOfficeId || null,
      department_id: departmentId || null,
      jabatan_id: jabatanId || null,
      position_id: positionId || null,
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
    await updateEmployeeWfhQuota(employee.id, wfhQuotaMonthly);
    await updateEmployeeAnnualLeaveQuota(employee.id, annualLeaveQuota);
    const [employeeWithWfhQuota] = await attachWfhQuotaToEmployees([employee]);

    return NextResponse.json({
      success: true,
      message: "Akun berhasil diperbarui.",
      employee: employeeWithWfhQuota,
    });
  } catch (error) {
    console.error("PATCH /api/employees error:", error);

    if (isPrismaUniqueError(error)) {
      return jsonError(getUniqueEmployeeMessage(error), 409);
    }

    const message =
      error instanceof Error ? error.message : "Gagal memperbarui karyawan.";
    return jsonError(message, 400);
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
        403,
      );
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return jsonError("ID karyawan wajib dikirim.");
    }

    if (currentUser.id === id) {
      return jsonError(
        "Akun yang sedang login tidak bisa menghapus dirinya sendiri.",
        400,
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

    if (!employee || String(employee.role || "").toLowerCase() !== "employee") {
      return jsonError("Akun tidak ditemukan.", 404);
    }

    await prisma.$transaction(async (tx) => {
      const attendances = await tx.attendance.findMany({
        where: { user_id: id },
        select: { id: true },
      });
      const attendanceIds = attendances.map((attendance) => attendance.id);

      const wfhRequests = await tx.wfhRequest.findMany({
        where: {
          OR: [{ user_id: id }, { approved_by_id: id }],
        },
        select: { id: true },
      });
      const wfhRequestIds = wfhRequests.map((request) => request.id);

      const payrolls = await tx.payroll.findMany({
        where: { user_id: id },
        select: { id: true },
      });
      const payrollIds = payrolls.map((payroll) => payroll.id);

      await tx.wfhRequest.updateMany({
        where: { approved_by_id: id },
        data: { approved_by_id: null },
      });

      await tx.announcement.updateMany({
        where: { author_id: id },
        data: { author_id: null },
      });

      if (attendanceIds.length > 0) {
        await tx.adminNotification.updateMany({
          where: {
            attendance_id: {
              in: attendanceIds,
            },
          },
          data: { attendance_id: null },
        });

        await tx.employeeVisit.updateMany({
          where: {
            attendance_id: {
              in: attendanceIds,
            },
          },
          data: { attendance_id: null },
        });
      }

      if (wfhRequestIds.length > 0) {
        await tx.attendance.updateMany({
          where: {
            wfh_request_id: {
              in: wfhRequestIds,
            },
          },
          data: { wfh_request_id: null },
        });
      }

      if (payrollIds.length > 0) {
        await tx.payrollItem.deleteMany({
          where: {
            payroll_id: {
              in: payrollIds,
            },
          },
        });
      }

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

      await tx.attendance.deleteMany({
        where: { user_id: id },
      });

      await tx.wfhRequest.deleteMany({
        where: { user_id: id },
      });

      await tx.payroll.deleteMany({
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
        "Karyawan tidak bisa dihapus karena masih memiliki relasi data lain. Pastikan migration production sudah dijalankan.",
        400,
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal menghapus karyawan."),
      },
      { status: getApiErrorStatus(error) },
    );
  }
}
