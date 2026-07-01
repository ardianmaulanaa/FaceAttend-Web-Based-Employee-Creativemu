import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listSalaryRecords, saveSalaryRecord } from "@/lib/salaryStore";
import { findDemoUserById, isDatabaseUnavailable } from "@/lib/demoStore";

async function getAuthPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get("faceattend_token")?.value;

  if (!token) {
    return null;
  }

  try {
    return await verifyToken(token);
  } catch {
    return null;
  }
}

export async function GET() {
  const authPayload = await getAuthPayload();

  if (!authPayload) {
    return NextResponse.json(
      { success: false, message: "Belum login" },
      { status: 401 },
    );
  }

  const records = listSalaryRecords();

  if (authPayload.role === "admin") {
    return NextResponse.json({
      success: true,
      records,
    });
  }

  const ownRecords = records.filter(
    (record) => record.employeeId === authPayload.id,
  );

  return NextResponse.json({
    success: true,
    records: ownRecords,
  });
}

export async function POST(req: Request) {
  const authPayload = await getAuthPayload();

  if (!authPayload) {
    return NextResponse.json(
      { success: false, message: "Belum login" },
      { status: 401 },
    );
  }

  if (authPayload.role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Hanya admin yang bisa memasukkan gaji." },
      { status: 403 },
    );
  }

  try {
    const body = await req.json();
    const employeeId = String(body.employeeId || "").trim();
    const month = String(body.month || "").trim();
    const note = String(body.note || "").trim();
    const amount = Number(body.amount);

    if (!employeeId || !month || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Employee, bulan, dan nominal gaji wajib diisi.",
        },
        { status: 400 },
      );
    }

    let employee = await prisma.user
      .findUnique({
        where: {
          id: employeeId,
        },
        select: {
          id: true,
          name: true,
          role: true,
        },
      })
      .catch((error) => {
        if (!isDatabaseUnavailable(error)) {
          throw error;
        }

        const demoUser = findDemoUserById(employeeId);
        if (!demoUser) return null;

        return {
          id: demoUser.id,
          name: demoUser.name,
          role: demoUser.role,
        };
      });

    if (!employee || employee.role !== "employee") {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan." },
        { status: 404 },
      );
    }

    const record = saveSalaryRecord({
      employeeId: employee.id,
      employeeName: employee.name,
      month,
      amount,
      note,
      createdByAdminId: authPayload.id,
    });

    return NextResponse.json(
      {
        success: true,
        message: `Gaji ${employee.name} berhasil disimpan.`,
        record,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan data gaji." },
      { status: 500 },
    );
  }
}
