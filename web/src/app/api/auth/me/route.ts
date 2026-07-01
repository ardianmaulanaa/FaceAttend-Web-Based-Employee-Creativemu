import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { findDemoUserById, isDatabaseUnavailable } from "@/lib/demoStore";

export async function GET() {
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

    if (
      payload.id.startsWith("ADM-DEMO-") ||
      payload.id.startsWith("EMP-DEMO-")
    ) {
      const demoUser = findDemoUserById(payload.id);
      if (demoUser) {
        return NextResponse.json({
          success: true,
          user: {
            id: demoUser.id,
            name: demoUser.name,
            email: demoUser.email,
            role: demoUser.role,
            department: demoUser.department,
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
        id: payload.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        city_id: true,
        village_id: true,
        status: true,
        must_change_password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
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
    );
  }
}
