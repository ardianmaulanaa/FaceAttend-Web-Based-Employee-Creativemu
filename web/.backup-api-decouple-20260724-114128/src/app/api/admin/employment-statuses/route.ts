import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/api-auth";

export const runtime = "nodejs";

type AllowedRole = "admin" | "owner";

const VIEW_ROLES: AllowedRole[] = ["admin", "owner"];
const MANAGE_ROLES: AllowedRole[] = ["admin", "owner"];

const defaultStatuses = ["Tetap", "Kontrak", "Magang", "Freelance"];

function getCurrentUser(req: NextRequest) {
  return requireOwner(req);
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

async function ensureDefaultStatuses() {
  const count = await prisma.employmentStatus.count();
  if (count === 0) {
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
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !VIEW_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return jsonError("Akses ditolak.", 403);
    }

    await ensureDefaultStatuses();

    const statuses = await prisma.employmentStatus.findMany({
      orderBy: {
        created_at: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      statuses,
    });
  } catch (error) {
    console.error("GET /api/admin/employment-statuses error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Gagal mengambil data status kepegawaian.",
      500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !MANAGE_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return jsonError("Akses ditolak. Hanya admin yang dapat menambah status kepegawaian.", 403);
    }

    const body = await req.json();
    const name = String(body.name || "").trim();
    const status = String(body.status || "active").trim();

    if (!name) {
      return jsonError("Nama status kepegawaian wajib diisi.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status tidak valid.");
    }

    const newStatus = await prisma.employmentStatus.create({
      data: {
        name,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status kepegawaian berhasil ditambahkan.",
      status: newStatus,
    });
  } catch (error) {
    console.error("POST /api/admin/employment-statuses error:", error);
    if (isPrismaUniqueError(error)) {
      return jsonError("Nama status kepegawaian sudah digunakan.", 409);
    }
    return jsonError(
      error instanceof Error ? error.message : "Gagal menambahkan status kepegawaian.",
      500
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !MANAGE_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return jsonError("Akses ditolak. Hanya admin yang dapat mengubah status kepegawaian.", 403);
    }

    const body = await req.json();
    const id = String(body.id || "");
    const name = String(body.name || "").trim();
    const status = String(body.status || "active").trim();

    if (!id) {
      return jsonError("ID status kepegawaian wajib dikirim.");
    }

    if (!name) {
      return jsonError("Nama status kepegawaian wajib diisi.");
    }

    if (!["active", "inactive"].includes(status)) {
      return jsonError("Status tidak valid.");
    }

    const existing = await prisma.employmentStatus.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonError("Status kepegawaian tidak ditemukan.", 404);
    }

    const updated = await prisma.employmentStatus.update({
      where: { id },
      data: {
        name,
        status,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Status kepegawaian berhasil diperbarui.",
      status: updated,
    });
  } catch (error) {
    console.error("PATCH /api/admin/employment-statuses error:", error);
    if (isPrismaUniqueError(error)) {
      return jsonError("Nama status kepegawaian sudah digunakan.", 409);
    }
    return jsonError(
      error instanceof Error ? error.message : "Gagal memperbarui status kepegawaian.",
      500
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !MANAGE_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return jsonError("Akses ditolak. Hanya admin yang dapat menghapus status kepegawaian.", 403);
    }

    const id = req.nextUrl.searchParams.get("id") || "";

    if (!id) {
      return jsonError("ID status kepegawaian wajib dikirim.");
    }

    const existing = await prisma.employmentStatus.findUnique({
      where: { id },
    });

    if (!existing) {
      return jsonError("Status kepegawaian tidak ditemukan.", 404);
    }

    // Check if any employees are using this status name
    const employeeCount = await prisma.user.count({
      where: {
        employment_status: existing.name,
      },
    });

    if (employeeCount > 0) {
      return jsonError(
        "Status kepegawaian ini masih digunakan oleh karyawan. Ubah status menjadi Nonaktif jika tidak ingin digunakan.",
        400
      );
    }

    await prisma.employmentStatus.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Status kepegawaian berhasil dihapus.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/employment-statuses error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Gagal menghapus status kepegawaian.",
      500
    );
  }
}
