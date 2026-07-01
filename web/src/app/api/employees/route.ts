import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  addDemoEmployee,
  isDatabaseUnavailable,
  listDemoUsers,
} from "@/lib/demoStore";

const useDemoDataByDefault = process.env.NODE_ENV !== "production";

export async function GET() {
  if (useDemoDataByDefault) {
    const employees = listDemoUsers().map((item) => ({
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role,
      department: item.department,
      position: item.position,
      phone: item.phone,
      status: item.status,
      must_change_password: item.must_change_password,
      created_at: item.created_at,
    }));

    return NextResponse.json({
      success: true,
      data: employees,
    });
  }

  try {
    const employees = await prisma.user.findMany({
      orderBy: {
        created_at: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        status: true,
        must_change_password: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    console.error(error);

    if (isDatabaseUnavailable(error)) {
      const employees = listDemoUsers().map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        role: item.role,
        department: item.department,
        position: item.position,
        phone: item.phone,
        status: item.status,
        must_change_password: item.must_change_password,
        created_at: item.created_at,
      }));

      return NextResponse.json({
        success: true,
        data: employees,
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

  if (useDemoDataByDefault) {
    const employee = addDemoEmployee({
      name: String(body.name || "").trim(),
      email: String(body.email || "").trim(),
      temporaryPassword: String(body.temporaryPassword || ""),
      department: String(body.department || "").trim(),
      position: String(body.position || "").trim(),
      phone: String(body.phone || "").trim(),
      role: String(body.role || "employee"),
      status: String(body.status || "active"),
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
          department: employee.department,
          position: employee.position,
          phone: employee.phone,
          status: employee.status,
          must_change_password: employee.must_change_password,
          created_at: employee.created_at,
        },
      },
      { status: 201 },
    );
  }

  try {
    const {
      name,
      email,
      temporaryPassword,
      department,
      position,
      phone,
      role,
      status,
    } = body;

    if (!name || !email || !temporaryPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama, email, dan temporary password wajib diisi",
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Email sudah terdaftar" },
        { status: 409 },
      );
    }

    const password_hash = await hashPassword(temporaryPassword);
    const resolvedRole = role === "admin" ? "admin" : "employee";

    const employee = await prisma.user.create({
      data: {
        name,
        email,
        password_hash,
        role: resolvedRole,
        department: department || null,
        position: position || null,
        phone: phone || null,
        status: status || "active",
        must_change_password: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        status: true,
        must_change_password: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Karyawan berhasil ditambahkan",
        data: employee,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    if (isDatabaseUnavailable(error)) {
      const employee = addDemoEmployee({
        name: String(body.name || "").trim(),
        email: String(body.email || "").trim(),
        temporaryPassword: String(body.temporaryPassword || ""),
        department: String(body.department || "").trim(),
        position: String(body.position || "").trim(),
        phone: String(body.phone || "").trim(),
        role: String(body.role || "employee"),
        status: String(body.status || "active"),
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
            department: employee.department,
            position: employee.position,
            phone: employee.phone,
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
