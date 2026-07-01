import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { isDatabaseUnavailable, saveDemoCheckOut } from "@/lib/demoStore";

export async function POST(req: Request) {
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

    if (payload.role !== "employee") {
      return NextResponse.json(
        { success: false, message: "Hanya karyawan yang dapat check-out" },
        { status: 403 },
      );
    }

    const {
      imageDataUrl,
      latitude,
      longitude,
      notes,
    }: {
      imageDataUrl?: string;
      latitude?: number;
      longitude?: number;
      notes?: string;
    } = await req.json();

    if (!imageDataUrl) {
      return NextResponse.json(
        { success: false, message: "Foto check-out wajib diisi" },
        { status: 400 },
      );
    }

    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return NextResponse.json(
        { success: false, message: "Latitude dan longitude wajib diisi" },
        { status: 400 },
      );
    }

    const todayDate = new Date(new Date().toISOString().slice(0, 10));
    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_attendance_date: {
          employee_id: payload.id,
          attendance_date: todayDate,
        },
      },
    });

    if (!existing?.check_in_time) {
      return NextResponse.json(
        { success: false, message: "Anda belum check-in hari ini" },
        { status: 400 },
      );
    }

    if (existing.check_out_time) {
      return NextResponse.json(
        { success: false, message: "Check-out hari ini sudah tercatat" },
        { status: 409 },
      );
    }

    const attendance = await prisma.attendance.update({
      where: {
        employee_id_attendance_date: {
          employee_id: payload.id,
          attendance_date: todayDate,
        },
      },
      data: {
        check_out_time: new Date(),
        check_out_photo_url: imageDataUrl,
        check_out_latitude: latitude,
        check_out_longitude: longitude,
        notes: notes?.trim() ? notes.trim().slice(0, 255) : existing.notes,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Check-out berhasil disimpan",
      data: {
        id: attendance.id,
        attendanceDate: attendance.attendance_date,
        checkOutTime: attendance.check_out_time,
        checkOutLatitude: attendance.check_out_latitude,
        checkOutLongitude: attendance.check_out_longitude,
      },
    });
  } catch (error) {
    console.error(error);

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
        const body = await req.json();
        const imageDataUrl = String(body.imageDataUrl || "");
        const latitude = Number(body.latitude);
        const longitude = Number(body.longitude);
        const notes = String(body.notes || "");

        if (
          !imageDataUrl ||
          Number.isNaN(latitude) ||
          Number.isNaN(longitude)
        ) {
          return NextResponse.json(
            { success: false, message: "Data check-out tidak lengkap" },
            { status: 400 },
          );
        }

        const result = saveDemoCheckOut({
          employeeId: payload.id,
          imageDataUrl,
          latitude,
          longitude,
          notes,
        });

        if (!result.ok && result.reason === "missing-checkin") {
          return NextResponse.json(
            { success: false, message: "Anda belum check-in hari ini" },
            { status: 400 },
          );
        }

        if (!result.ok && result.reason === "already-checkout") {
          return NextResponse.json(
            { success: false, message: "Check-out hari ini sudah tercatat" },
            { status: 409 },
          );
        }

        if (!result.ok) {
          return NextResponse.json(
            { success: false, message: "Gagal menyimpan check-out" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message: "Check-out berhasil disimpan (demo mode)",
          data: {
            id: result.record.id,
            attendanceDate: result.record.attendance_date,
            checkOutTime: result.record.check_out_time,
            checkOutLatitude: result.record.check_out_latitude,
            checkOutLongitude: result.record.check_out_longitude,
          },
        });
      } catch {
        // Fallback to generic error response below.
      }
    }

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat check-out" },
      { status: 500 },
    );
  }
}
