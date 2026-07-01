import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  addDemoEmployee,
  isDatabaseUnavailable,
  listDemoUsers,
  removeDemoEmployee,
  updateDemoEmployee,
} from "@/lib/demoStore";

const useDemoDataByDefault = process.env.NODE_ENV !== "production";

type PayrollMethodPayload = {
  bankName: string;
  cardType: string;
  accountNumber: string;
  accountHolderName: string;
  expiryMonth?: string;
  expiryYear?: string;
};

type DbUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  employee_category: string;
  department: string | null;
  position: string | null;
  phone: string | null;
  profile_photo_url: string | null;
  payout_label: string | null;
  account_holder_name: string | null;
  payout_contact_email: string | null;
  payout_phone_number: string | null;
  payroll_status: string | null;
  status: string;
  must_change_password: boolean;
  created_at: Date;
};

type DbPayrollMethodRow = {
  id: string;
  user_id: string;
  bank_name: string;
  card_type: string;
  account_number: string;
  account_holder_name: string;
  expiry_month: string | null;
  expiry_year: string | null;
  created_at: Date;
};

function generateTemporaryPassword() {
  return `Welcome${Math.floor(100000 + Math.random() * 900000)}!`;
}

function isSchemaMigrationMissing(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("unknown column") || message.includes("doesn't exist")
  );
}

function normalizePayrollMethods(payload: unknown): PayrollMethodPayload[] {
  if (!Array.isArray(payload)) return [];

  return payload
    .map((item) => ({
      bankName: String((item as PayrollMethodPayload).bankName || "").trim(),
      cardType: String(
        (item as PayrollMethodPayload).cardType || "Debit",
      ).trim(),
      accountNumber: String(
        (item as PayrollMethodPayload).accountNumber || "",
      ).trim(),
      accountHolderName: String(
        (item as PayrollMethodPayload).accountHolderName || "",
      ).trim(),
      expiryMonth: String(
        (item as PayrollMethodPayload).expiryMonth || "",
      ).trim(),
      expiryYear: String(
        (item as PayrollMethodPayload).expiryYear || "",
      ).trim(),
    }))
    .filter((item) => item.bankName && item.accountNumber);
}

function mapDemoUsers() {
  return listDemoUsers().map((item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    role: item.role,
    employee_category: item.employee_category,
    department: item.department,
    position: item.position,
    phone: item.phone,
    profile_photo_url: item.profile_photo_url,
    payroll_methods: item.payroll_methods,
    payroll_status: item.payroll_status,
    status: item.status,
    must_change_password: item.must_change_password,
    created_at: item.created_at,
  }));
}

async function getDbEmployees() {
  let users: DbUserRow[] = [];

  try {
    users = await prisma.$queryRaw<DbUserRow[]>`
      SELECT
        id,
        name,
        email,
        role,
        employee_category,
        department,
        position,
        phone,
        profile_photo_url,
        payout_label,
        account_holder_name,
        payout_contact_email,
        payout_phone_number,
        COALESCE(NULLIF(payout_label, ''), 'unpaid') AS payroll_status,
        status,
        must_change_password,
        created_at
      FROM users
      ORDER BY created_at DESC
    `;
  } catch (error) {
    if (!isSchemaMigrationMissing(error)) {
      throw error;
    }

    // Compatibility path before migration has been applied.
    users = await prisma.$queryRaw<DbUserRow[]>`
      SELECT
        id,
        name,
        email,
        role,
        employee_category,
        department,
        position,
        phone,
        NULL AS profile_photo_url,
        payout_label,
        account_holder_name,
        payout_contact_email,
        payout_phone_number,
        COALESCE(NULLIF(payout_label, ''), 'unpaid') AS payroll_status,
        status,
        must_change_password,
        created_at
      FROM users
      ORDER BY created_at DESC
    `;
  }

  let methods: DbPayrollMethodRow[] = [];

  try {
    methods = await prisma.$queryRaw<DbPayrollMethodRow[]>`
      SELECT
        id,
        user_id,
        bank_name,
        card_type,
        account_number,
        account_holder_name,
        expiry_month,
        expiry_year,
        created_at
      FROM payroll_methods
      ORDER BY created_at DESC
    `;
  } catch (error) {
    if (!isSchemaMigrationMissing(error)) {
      throw error;
    }
  }

  const byUserId = new Map<string, DbPayrollMethodRow[]>();
  for (const method of methods) {
    const current = byUserId.get(method.user_id) || [];
    current.push(method);
    byUserId.set(method.user_id, current);
  }

  return users.map((user) => ({
    ...user,
    payroll_methods: (byUserId.get(user.id) || []).map((method) => ({
      id: method.id,
      bankName: method.bank_name,
      cardType: method.card_type,
      accountNumber: method.account_number,
      accountHolderName: method.account_holder_name,
      expiryMonth: method.expiry_month || "",
      expiryYear: method.expiry_year || "",
    })),
  }));
}

async function persistDbPayrollMethods(
  userId: string,
  methods: PayrollMethodPayload[],
) {
  await prisma.$executeRaw`DELETE FROM payroll_methods WHERE user_id = ${userId}`;

  for (const method of methods) {
    await prisma.$executeRaw`
      INSERT INTO payroll_methods (
        id,
        user_id,
        bank_name,
        card_type,
        account_number,
        account_holder_name,
        expiry_month,
        expiry_year,
        created_at
      ) VALUES (
        ${randomUUID()},
        ${userId},
        ${method.bankName},
        ${method.cardType || "Debit"},
        ${method.accountNumber},
        ${method.accountHolderName || ""},
        ${method.expiryMonth || null},
        ${method.expiryYear || null},
        NOW(3)
      )
    `;
  }
}

export async function GET() {
  if (useDemoDataByDefault) {
    return NextResponse.json({
      success: true,
      data: mapDemoUsers(),
    });
  }

  try {
    const employees = await getDbEmployees();

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error(error);

    if (isDatabaseUnavailable(error)) {
      return NextResponse.json({
        success: true,
        data: mapDemoUsers(),
      });
    }

    return NextResponse.json(
      { success: false, message: "Gagal mengambil data karyawan" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const body = await req.json();

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

  if (useDemoDataByDefault) {
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

  try {
    if (!payload.name || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Nama dan email wajib diisi" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 409 },
      );
    }

    const generatedPassword = generateTemporaryPassword();
    const password_hash = await hashPassword(generatedPassword);

    const employee = await prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        password_hash,
        role: payload.role === "admin" ? "admin" : "employee",
        employee_category:
          payload.employeeCategory === "magang" ? "magang" : "tetap",
        department: payload.department || null,
        position: payload.position || null,
        phone: payload.phone || null,
        payout_label: payload.payrollStatus === "paid" ? "paid" : "unpaid",
        account_holder_name: null,
        payout_contact_email: payload.email,
        payout_phone_number: payload.phone || null,
        account_number: null,
        expiry_month: null,
        expiry_year: null,
        cvc: null,
        status: payload.status || "active",
        must_change_password: true,
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
      if (payload.profilePhotoUrl) {
        await prisma.$executeRaw`
          UPDATE users
          SET profile_photo_url = ${payload.profilePhotoUrl}
          WHERE id = ${employee.id}
        `;
      }

      await persistDbPayrollMethods(employee.id, payload.payrollMethods);
    } catch (extraError) {
      if (!isSchemaMigrationMissing(extraError)) {
        throw extraError;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Karyawan berhasil ditambahkan",
        data: {
          ...employee,
          profile_photo_url: payload.profilePhotoUrl || null,
          payroll_status: payload.payrollStatus === "paid" ? "paid" : "unpaid",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

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
      { success: false, message: "Gagal menambahkan karyawan" },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request) {
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

    if (user.role === "admin") {
      return NextResponse.json(
        { success: false, message: "Akun admin tidak dapat dihapus" },
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
