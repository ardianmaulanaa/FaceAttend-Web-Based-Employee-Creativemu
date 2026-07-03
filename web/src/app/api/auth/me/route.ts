import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  findDemoUserById,
  isDatabaseUnavailable,
  updateDemoUserProfile,
} from "@/lib/demoStore";

export const runtime = "nodejs";

function isSchemaMigrationMissing(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("unknown column") || message.includes("doesn't exist")
  );
}

async function getUserIdFromRequest(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  return payload.id;
}

function buildDemoUserPayload(
  user: NonNullable<ReturnType<typeof findDemoUserById>>,
) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    status: user.status,
    department: user.department,
    city_id: user.city_id,
    village_id: user.village_id,
    profile_photo_url: user.profile_photo_url,
    must_change_password: user.must_change_password,
  };
}

function isDemoUserId(userId: string) {
  return userId.includes("-DEMO-");
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    if (isDemoUserId(userId)) {
      const demoUser = findDemoUserById(userId);

      if (!demoUser) {
        return NextResponse.json(
          { success: false, message: "User tidak ditemukan" },
          { status: 404 },
        );
      }

      return NextResponse.json({
        success: true,
        user: buildDemoUserPayload(demoUser),
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        profile_photo: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        position: {
          select: {
            id: true,
            name: true,
          },
        },
        shift: {
          select: {
            id: true,
            name: true,
            tolerance_minutes: true,
            work_schedules: {
              select: {
                day_of_week: true,
                is_work_day: true,
                check_in_time: true,
                check_out_time: true,
              },
              orderBy: {
                day_of_week: "asc",
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    let profile_photo_url = user.profile_photo;

    try {
      const profileRows = await prisma.$queryRaw<
        Array<{ profile_photo_url: string | null }>
      >`
        SELECT profile_photo_url
        FROM users
        WHERE id = ${userId}
        LIMIT 1
      `;

      profile_photo_url =
        profileRows[0]?.profile_photo_url ?? user.profile_photo;
    } catch (error) {
      if (!isSchemaMigrationMissing(error)) {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        ...user,
        profile_photo_url,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { success: false, message: "Database tidak tersedia" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Session tidak valid" },
      { status: 401 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Belum login" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const payload = {
      name: String(body.name || "").trim(),
      email: String(body.email || "")
        .trim()
        .toLowerCase(),
      phone: String(body.phone || "").trim(),
      profilePhotoUrl: String(body.profilePhotoUrl || "").trim(),
    };
    const profilePhotoForLegacyColumn =
      payload.profilePhotoUrl.length <= 255 ? payload.profilePhotoUrl : "";

    if (!payload.name || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Nama dan email wajib diisi" },
        { status: 400 },
      );
    }

    if (isDemoUserId(userId)) {
      const result = updateDemoUserProfile(userId, payload);

      if (!result.ok) {
        return NextResponse.json(
          {
            success: false,
            message:
              result.reason === "email-exists"
                ? "Email sudah digunakan"
                : "User tidak ditemukan",
          },
          { status: result.reason === "email-exists" ? 409 : 404 },
        );
      }

      return NextResponse.json({
        success: true,
        message: "Profil berhasil diperbarui (demo mode)",
        user: buildDemoUserPayload(result.user),
      });
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: payload.email,
        NOT: { id: userId },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email sudah digunakan" },
        { status: 409 },
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        profile_photo: profilePhotoForLegacyColumn || null,
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        profile_photo: true,
      },
    });

    let profile_photo_url = user.profile_photo;

    try {
      await prisma.$executeRaw`
        UPDATE users
        SET profile_photo_url = ${payload.profilePhotoUrl || null}
        WHERE id = ${userId}
      `;
      profile_photo_url = payload.profilePhotoUrl || null;
    } catch (error) {
      if (!isSchemaMigrationMissing(error)) {
        throw error;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diperbarui",
      user: {
        ...user,
        profile_photo_url,
      },
    });
  } catch (error) {
    if (isDatabaseUnavailable(error)) {
      return NextResponse.json(
        { success: false, message: "Database tidak tersedia" },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Gagal memperbarui profil" },
      { status: 500 },
    );
  }
}
