import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";
<<<<<<< HEAD
import { verifyToken } from "@/lib/auth";
import {
  findDemoUserById,
  isDatabaseUnavailable,
  updateDemoUserProfile,
} from "@/lib/demoStore";

function isSchemaMigrationMissing(error: unknown) {
  const message = String(error || "").toLowerCase();
  return (
    message.includes("unknown column") || message.includes("doesn't exist")
  );
}

async function resolveSessionUserId() {
  const cookieStore = await cookies();
  const token = cookieStore.get("faceattend_token")?.value;

  if (!token) {
    return { ok: false as const, status: 401, message: "Belum login" };
  }

  const payload = await verifyToken(token);
  return { ok: true as const, userId: payload.id };
}
=======
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6

export const runtime = "nodejs";

async function getUserIdFromRequest(req: NextRequest) {
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

  return userId;
}

export async function GET(req: NextRequest) {
  try {
<<<<<<< HEAD
    const session = await resolveSessionUserId();
    if (!session.ok) {
      return NextResponse.json(
        { success: false, message: session.message },
        { status: session.status },
      );
    }

    if (
      session.userId.startsWith("ADM-DEMO-") ||
      session.userId.startsWith("EMP-DEMO-")
    ) {
      const demoUser = findDemoUserById(session.userId);
      if (demoUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            department: demoUser.department,
            phone: demoUser.phone,
            profile_photo_url: demoUser.profile_photo_url,
            city_id: demoUser.city_id,
            village_id: demoUser.village_id,
            status: demoUser.status,
            must_change_password: demoUser.must_change_password,
          },
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.userId,
=======
    const userId = await getUserIdFromRequest(req);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
      },
      select: {
        id: true,
        employee_code: true,
        name: true,
        email: true,
        role: true,
<<<<<<< HEAD
        department: true,
        phone: true,
        city_id: true,
        village_id: true,
=======
        phone: true,
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
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
<<<<<<< HEAD
        { success: false, message: "User tidak ditemukan" },
        { status: 404 },
=======
        {
          error: "User tidak ditemukan.",
        },
        { status: 404 }
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
      );
    }

    let profile_photo_url: string | null = null;

    try {
      const profileRows = await prisma.$queryRaw<
        Array<{ profile_photo_url: string | null }>
      >`
        SELECT profile_photo_url
        FROM users
        WHERE id = ${session.userId}
        LIMIT 1
      `;

      profile_photo_url = profileRows[0]?.profile_photo_url || null;
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
<<<<<<< HEAD
    if (isDatabaseUnavailable(error)) {
      try {
        const cookieStore = await cookies();
        const token = cookieStore.get("faceattend_token")?.value;

        if (!token) {
          return NextResponse.json(
            { success: false, message: "Belum login" },
            { status: 401 },
          );
        }

        const payload = await verifyToken(token);
        const user = findDemoUserById(payload.id);

        if (user) {
          return NextResponse.json({
            success: true,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              department: user.department,
              phone: user.phone,
              profile_photo_url: user.profile_photo_url,
              city_id: user.city_id,
              village_id: user.village_id,
              status: user.status,
              must_change_password: user.must_change_password,
            },
          });
        }
      } catch {
        // Fallback below.
      }
    }

    return NextResponse.json(
      { success: false, message: "Session tidak valid" },
      { status: 401 },
=======
    console.error("ME_ERROR:", error);

    return NextResponse.json(
      {
        error: "Gagal mengambil data user.",
      },
      { status: 401 }
>>>>>>> 8cad75293f1c832e003d778cff628420e55012a6
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await resolveSessionUserId();
    if (!session.ok) {
      return NextResponse.json(
        { success: false, message: session.message },
        { status: session.status },
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

    if (!payload.name || !payload.email) {
      return NextResponse.json(
        { success: false, message: "Nama dan email wajib diisi" },
        { status: 400 },
      );
    }

    if (
      session.userId.startsWith("ADM-DEMO-") ||
      session.userId.startsWith("EMP-DEMO-")
    ) {
      const result = updateDemoUserProfile(session.userId, payload);

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
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
          department: result.user.department,
          phone: result.user.phone,
          profile_photo_url: result.user.profile_photo_url,
          city_id: result.user.city_id,
          village_id: result.user.village_id,
          status: result.user.status,
        },
      });
    }

    const existing = await prisma.user.findFirst({
      where: {
        email: payload.email,
        NOT: {
          id: session.userId,
        },
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
      where: { id: session.userId },
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        city_id: true,
        village_id: true,
        status: true,
      },
    });

    let profile_photo_url: string | null = null;

    try {
      await prisma.$executeRaw`
        UPDATE users
        SET profile_photo_url = ${payload.profilePhotoUrl || null}
        WHERE id = ${session.userId}
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
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Gagal memperbarui profil" },
      { status: 500 },
    );
  }
}
