import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import {
  findDemoUserById,
  isDatabaseUnavailable,
  updateDemoUserProfile,
} from "@/lib/demoStore";

<<<<<<< HEAD
=======
<<<<<<< HEAD
>>>>>>> 288ff78a93f501f36015c7a4e22e640f8d5ccbda
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET belum diatur di .env");
  }

  return new TextEncoder().encode(secret);
}

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
  return payload ? payload.id : null;
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

async function getTokenFromCookie() {
  const cookieStore = await cookies();

  return (
    cookieStore.get("token")?.value ||
    cookieStore.get("auth_token")?.value ||
    cookieStore.get("authToken")?.value ||
    cookieStore.get("faceattend_token")?.value ||
    ""
  );
}

async function getUserIdFromToken() {
  const token = await getTokenFromCookie();

  if (!token) {
    return null;
  }

  const { payload } = await jwtVerify(token, getJwtSecret());

  const userId =
    payload.id ||
    payload.userId ||
    payload.user_id ||
    payload.sub ||
    null;

  if (!userId) {
    return null;
  }

  return String(userId);
}
<<<<<<< HEAD
=======

=======
>>>>>>> d41006d0c75ea82b0aa138e4a625ca0bac30762c
>>>>>>> 288ff78a93f501f36015c7a4e22e640f8d5ccbda
function serializeOffice(
  office:
    | {
        id: string;
        name: string;
        address: string | null;
        latitude: unknown;
        longitude: unknown;
        radius_meters: number;
      }
    | null
    | undefined
) {
  if (!office) return null;

  return {
    id: office.id,
    name: office.name,
    address: office.address,
    latitude: Number(office.latitude),
    longitude: Number(office.longitude),
    radius_meters: Number(office.radius_meters),
  };
}

export async function GET(req: NextRequest) {
  try {
    const authUser = await requireAuth(req);

    if (isDemoUserId(authUser.id)) {
      const demoUser = findDemoUserById(authUser.id);

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
<<<<<<< HEAD
      where: {
        id: authUser.id,
      },
=======
<<<<<<< HEAD
      where: { id: userId },
=======
      where: {
        id: authUser.id,
      },
>>>>>>> d41006d0c75ea82b0aa138e4a625ca0bac30762c
>>>>>>> 288ff78a93f501f36015c7a4e22e640f8d5ccbda
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        status: true,
        profile_photo: true,

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
            },
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
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User tidak ditemukan.",
          error: "User tidak ditemukan.",
        },
        {
          status: 404,
        }
      );
    }

    let profile_photo_url = user.profile_photo;

    try {
      const profileRows = await prisma.$queryRaw<
        Array<{ profile_photo_url: string | null }>
      >`
        SELECT profile_photo_url
        FROM users
        WHERE id = ${authUser.id}
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
        id: user.id,
        employee_code: user.employee_code,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        status: user.status,
        profile_photo: user.profile_photo,

        unit: user.unit,
        department: user.department,
        position: user.position,
        shift: user.shift,

        registered_office: serializeOffice(user.registered_office),
      },
    });
  } catch (error) {
    console.error("AUTH_ME_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal mengambil data user."),
        error: getApiErrorMessage(error, "Gagal mengambil data user."),
      },
      {
        status: getApiErrorStatus(error),
      }
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
