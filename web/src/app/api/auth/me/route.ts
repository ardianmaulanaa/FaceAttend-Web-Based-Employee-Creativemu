import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({
      where: {
        id: authUser.id,
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

        jabatan: {
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

        jabatan: user.jabatan,
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
