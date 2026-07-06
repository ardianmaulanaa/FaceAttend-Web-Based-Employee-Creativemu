import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { canViewAdminPanel } from "@/lib/adminAccess";

export const runtime = "nodejs";

function getJakartaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function toDateOnly(dateKey: string) {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

function toNumber(value: FormDataEntryValue | null) {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

async function fileToBuffer(value: FormDataEntryValue | null) {
  if (!(value instanceof File)) return { buffer: null, mime: "image/jpeg" };
  return {
    buffer: Buffer.from(await value.arrayBuffer()),
    mime: value.type || "image/jpeg",
  };
}

async function getPayload(req: NextRequest) {
  const token = req.cookies.get("faceattend_token")?.value;
  if (!token) throw new Error("Belum login.");
  return verifyToken(token);
}

function formatTime(date?: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload(req);
    const url = new URL(req.url);
    const scope = String(url.searchParams.get("scope") || "employee");
    const todayOnly = url.searchParams.get("today") === "1";

    const where: {
      user_id?: string;
      visit_date?: Date;
    } = {};

    if (scope === "employee") {
      where.user_id = payload.id;
    } else if (!canViewAdminPanel(payload.role)) {
      return NextResponse.json({ success: false, message: "Akses ditolak." }, { status: 403 });
    }

    if (todayOnly) {
      where.visit_date = toDateOnly(getJakartaDateKey());
    }

    const visits = await prisma.employeeVisit.findMany({
      where,
      orderBy: { created_at: "desc" },
      take: 50,
      select: {
        id: true,
        visit_date: true,
        title: true,
        client_name: true,
        address: true,
        latitude: true,
        longitude: true,
        accuracy: true,
        start_time: true,
        end_time: true,
        note: true,
        status: true,
        visit_photo_mime: true,
        user: {
          select: {
            id: true,
            name: true,
            employee_code: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      visits: visits.map((visit) => ({
        id: visit.id,
        title: visit.title,
        clientName: visit.client_name,
        address: visit.address,
        latitude: visit.latitude,
        longitude: visit.longitude,
        accuracy: visit.accuracy,
        startTime: formatTime(visit.start_time),
        endTime: formatTime(visit.end_time),
        note: visit.note,
        status: visit.status,
        hasPhoto: Boolean(visit.visit_photo_mime),
        photoUrl: visit.visit_photo_mime ? `/api/visits/${visit.id}/photo` : null,
        employee: {
          id: visit.user.id,
          name: visit.user.name,
          employeeCode: visit.user.employee_code,
          department: visit.user.department?.name || null,
        },
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Gagal mengambil bukti kunjungan." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload(req);

    if (payload.role !== "employee") {
      return NextResponse.json({ success: false, message: "Hanya karyawan yang dapat mengirim bukti kunjungan." }, { status: 403 });
    }

    const formData = await req.formData();
    const title = String(formData.get("title") || "Kunjungan kerja").trim();
    const clientName = String(formData.get("clientName") || "").trim();
    const address = String(formData.get("address") || "").trim();
    const note = String(formData.get("note") || "").trim();
    const latitude = toNumber(formData.get("latitude"));
    const longitude = toNumber(formData.get("longitude"));
    const accuracy = toNumber(formData.get("accuracy"));
    const { buffer, mime } = await fileToBuffer(formData.get("photo"));

    if (!title) {
      return NextResponse.json({ success: false, message: "Judul kunjungan wajib diisi." }, { status: 400 });
    }

    if (latitude === null || longitude === null) {
      return NextResponse.json({ success: false, message: "Lokasi GPS bukti kunjungan wajib dikirim." }, { status: 400 });
    }

    if (!buffer) {
      return NextResponse.json({ success: false, message: "Foto bukti kunjungan wajib dikirim." }, { status: 400 });
    }

    const todayDate = toDateOnly(getJakartaDateKey());
    const attendance = await prisma.attendance.findFirst({
      where: { user_id: payload.id, attendance_date: todayDate },
      select: { id: true },
      orderBy: { created_at: "desc" },
    });

    const visit = await prisma.employeeVisit.create({
      data: {
        user_id: payload.id,
        attendance_id: attendance?.id || null,
        visit_date: todayDate,
        title: title.slice(0, 150),
        client_name: clientName || null,
        address: address || null,
        latitude,
        longitude,
        accuracy,
        start_time: new Date(),
        note: note || null,
        status: "completed",
        visit_photo: buffer,
        visit_photo_mime: mime,
      },
      select: { id: true },
    });

    if (attendance?.id) {
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: { is_visit: true, work_mode: "visit" },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Bukti kunjungan berhasil disimpan.",
      visit,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Gagal menyimpan bukti kunjungan." },
      { status: 500 },
    );
  }
}