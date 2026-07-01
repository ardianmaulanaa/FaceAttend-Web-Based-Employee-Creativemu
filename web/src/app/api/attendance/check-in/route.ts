import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { isDatabaseUnavailable, saveDemoCheckIn } from "@/lib/demoStore";

type WorkMode = "onsite" | "wfh" | "cuti";
type LeaveType = "cuti" | "sakit";

const MAIN_LOCATIONS = [
  {
    name: "Creativemu HQ",
    latitude: -6.9004,
    longitude: 107.6207,
    allowedRadiusMeters: 350,
  },
  {
    name: "Creativemu Branch",
    latitude: -7.3095,
    longitude: 112.7378,
    allowedRadiusMeters: 350,
  },
];

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function distanceMeters(
  pointA: { latitude: number; longitude: number },
  pointB: { latitude: number; longitude: number },
) {
  const earthRadius = 6371000;
  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLon = toRadians(pointB.longitude - pointA.longitude);
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function resolveMainLocation(latitude: number, longitude: number) {
  const nearest = MAIN_LOCATIONS.map((location) => ({
    ...location,
    distance: distanceMeters(
      { latitude, longitude },
      { latitude: location.latitude, longitude: location.longitude },
    ),
  })).sort((a, b) => a.distance - b.distance)[0];

  if (!nearest || nearest.distance > nearest.allowedRadiusMeters) {
    return null;
  }

  return nearest;
}

function buildAttendanceNote(payload: {
  workMode: WorkMode;
  leaveType?: LeaveType;
  locationName?: string;
  notes?: string;
}) {
  const tags = [`mode=${payload.workMode}`];

  if (payload.leaveType) {
    tags.push(`leave=${payload.leaveType}`);
  }

  if (payload.locationName) {
    tags.push(`location=${payload.locationName}`);
  }

  if (payload.notes?.trim()) {
    tags.push(`note=${payload.notes.trim().slice(0, 120)}`);
  }

  return tags.join(" | ").slice(0, 255);
}

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
        { success: false, message: "Hanya karyawan yang dapat check-in" },
        { status: 403 },
      );
    }

    const {
      imageDataUrl,
      latitude,
      longitude,
      workMode,
      leaveType,
      leaveLetterDataUrl,
      notes,
    }: {
      imageDataUrl?: string;
      latitude?: number;
      longitude?: number;
      workMode?: WorkMode;
      leaveType?: LeaveType;
      leaveLetterDataUrl?: string;
      notes?: string;
    } = await req.json();

    const effectiveMode: WorkMode =
      workMode === "wfh" || workMode === "cuti" ? workMode : "onsite";
    let matchedLocationName: string | null = null;

    if (effectiveMode === "cuti") {
      if (!leaveType || (leaveType !== "cuti" && leaveType !== "sakit")) {
        return NextResponse.json(
          {
            success: false,
            message: "Jenis surat wajib dipilih (cuti atau sakit)",
          },
          { status: 400 },
        );
      }

      if (!leaveLetterDataUrl) {
        return NextResponse.json(
          { success: false, message: "Surat cuti/sakit wajib diunggah" },
          { status: 400 },
        );
      }
    }

    if (effectiveMode !== "cuti" && !imageDataUrl) {
      return NextResponse.json(
        { success: false, message: "Foto check-in wajib diisi" },
        { status: 400 },
      );
    }

    if (
      effectiveMode === "onsite" &&
      (typeof latitude !== "number" || typeof longitude !== "number")
    ) {
      return NextResponse.json(
        { success: false, message: "Latitude dan longitude wajib diisi" },
        { status: 400 },
      );
    }

    if (effectiveMode === "onsite") {
      const matched = resolveMainLocation(Number(latitude), Number(longitude));

      if (!matched) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Anda berada di luar radius lokasi utama Creativemu (HQ/Branch)",
          },
          { status: 400 },
        );
      }

      matchedLocationName = matched.name;
    }

    const todayDate = new Date(new Date().toISOString().slice(0, 10));
    const now = new Date();

    const existing = await prisma.attendance.findUnique({
      where: {
        employee_id_attendance_date: {
          employee_id: payload.id,
          attendance_date: todayDate,
        },
      },
    });

    if (
      existing?.check_in_time ||
      ["leave", "permission", "sick"].includes(String(existing?.status || ""))
    ) {
      return NextResponse.json(
        { success: false, message: "Check-in hari ini sudah tercatat" },
        { status: 409 },
      );
    }

    const attendanceNote = buildAttendanceNote({
      workMode: effectiveMode,
      leaveType,
      locationName: matchedLocationName || undefined,
      notes,
    });

    const attendance =
      effectiveMode === "cuti"
        ? existing
          ? await prisma.attendance.update({
              where: {
                employee_id_attendance_date: {
                  employee_id: payload.id,
                  attendance_date: todayDate,
                },
              },
              data: {
                check_in_time: null,
                check_out_time: null,
                check_in_photo_url: leaveLetterDataUrl,
                check_out_photo_url: null,
                check_in_latitude: null,
                check_in_longitude: null,
                check_out_latitude: null,
                check_out_longitude: null,
                status: leaveType === "sakit" ? "sick" : "permission",
                notes: attendanceNote,
              },
            })
          : await prisma.attendance.create({
              data: {
                employee_id: payload.id,
                attendance_date: todayDate,
                check_in_photo_url: leaveLetterDataUrl,
                status: leaveType === "sakit" ? "sick" : "permission",
                notes: attendanceNote,
              },
            })
        : existing
          ? await prisma.attendance.update({
              where: {
                employee_id_attendance_date: {
                  employee_id: payload.id,
                  attendance_date: todayDate,
                },
              },
              data: {
                check_in_time: now,
                check_in_photo_url: imageDataUrl,
                check_in_latitude: effectiveMode === "onsite" ? latitude : null,
                check_in_longitude:
                  effectiveMode === "onsite" ? longitude : null,
                notes: attendanceNote,
              },
            })
          : await prisma.attendance.create({
              data: {
                employee_id: payload.id,
                attendance_date: todayDate,
                check_in_time: now,
                check_in_photo_url: imageDataUrl,
                check_in_latitude: effectiveMode === "onsite" ? latitude : null,
                check_in_longitude:
                  effectiveMode === "onsite" ? longitude : null,
                notes: attendanceNote,
              },
            });

    return NextResponse.json({
      success: true,
      message:
        effectiveMode === "cuti"
          ? "Pengajuan cuti/sakit berhasil disimpan"
          : "Check-in berhasil disimpan",
      data: {
        id: attendance.id,
        attendanceDate: attendance.attendance_date,
        checkInTime: attendance.check_in_time,
        checkInLatitude: attendance.check_in_latitude,
        checkInLongitude: attendance.check_in_longitude,
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
        const workMode: WorkMode =
          body.workMode === "wfh" || body.workMode === "cuti"
            ? body.workMode
            : "onsite";
        const imageDataUrl = String(body.imageDataUrl || "");
        const leaveType: LeaveType | undefined =
          body.leaveType === "cuti" || body.leaveType === "sakit"
            ? body.leaveType
            : undefined;
        const leaveLetterDataUrl = String(body.leaveLetterDataUrl || "");
        const latitude = Number(body.latitude);
        const longitude = Number(body.longitude);
        const notes = String(body.notes || "");
        let workLocationName: string | undefined;

        if (workMode === "cuti" && (!leaveType || !leaveLetterDataUrl)) {
          return NextResponse.json(
            { success: false, message: "Surat cuti/sakit wajib diunggah" },
            { status: 400 },
          );
        }

        if (workMode !== "cuti" && !imageDataUrl) {
          return NextResponse.json(
            { success: false, message: "Foto check-in wajib diisi" },
            { status: 400 },
          );
        }

        if (workMode === "onsite") {
          if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
            return NextResponse.json(
              { success: false, message: "Latitude dan longitude wajib diisi" },
              { status: 400 },
            );
          }

          const matched = resolveMainLocation(latitude, longitude);
          if (!matched) {
            return NextResponse.json(
              {
                success: false,
                message:
                  "Anda berada di luar radius lokasi utama Creativemu (HQ/Branch)",
              },
              { status: 400 },
            );
          }
          workLocationName = matched.name;
        }

        const result = saveDemoCheckIn({
          employeeId: payload.id,
          imageDataUrl: workMode === "cuti" ? undefined : imageDataUrl,
          latitude,
          longitude,
          notes: buildAttendanceNote({
            workMode,
            leaveType,
            locationName: workLocationName,
            notes,
          }),
          workMode,
          leaveType,
          leaveLetterDataUrl: leaveLetterDataUrl || undefined,
          workLocationName,
        });

        if (!result.ok && result.reason === "already-checkin") {
          return NextResponse.json(
            { success: false, message: "Check-in hari ini sudah tercatat" },
            { status: 409 },
          );
        }

        if (!result.ok && result.reason === "missing-leave-document") {
          return NextResponse.json(
            { success: false, message: "Surat cuti/sakit wajib diunggah" },
            { status: 400 },
          );
        }

        if (!result.ok) {
          return NextResponse.json(
            { success: false, message: "Gagal menyimpan check-in" },
            { status: 500 },
          );
        }

        return NextResponse.json({
          success: true,
          message:
            workMode === "cuti"
              ? "Pengajuan cuti/sakit berhasil disimpan (demo mode)"
              : "Check-in berhasil disimpan (demo mode)",
          data: {
            id: result.record.id,
            attendanceDate: result.record.attendance_date,
            checkInTime: result.record.check_in_time,
            checkInLatitude: result.record.check_in_latitude,
            checkInLongitude: result.record.check_in_longitude,
          },
        });
      } catch {
        // Fallback to generic error response below.
      }
    }

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat check-in" },
      { status: 500 },
    );
  }
}
