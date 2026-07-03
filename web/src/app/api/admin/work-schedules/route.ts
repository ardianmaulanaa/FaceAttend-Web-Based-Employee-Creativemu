import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type AllowedRole = "owner" | "admin" | "cs";

const VIEW_ROLES: AllowedRole[] = ["owner", "admin", "cs"];
const MANAGE_ROLES: AllowedRole[] = ["owner", "admin"];

const dayOrder = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

type DayKey = (typeof dayOrder)[number];

const defaultShifts = [
  {
    name: "UTAMA",
    tolerance_minutes: 3,
    status: "active",
  },
  {
    name: "MAGANG",
    tolerance_minutes: 0,
    status: "active",
  },
  {
    name: "SHIFT PAGI",
    tolerance_minutes: 5,
    status: "active",
  },
  {
    name: "SHIFT SIANG",
    tolerance_minutes: 5,
    status: "active",
  },
];

function getDefaultTimeByShift(shiftName: string) {
  const name = shiftName.toUpperCase();

  if (name.includes("MAGANG")) {
    return {
      checkIn: "09:00",
      checkOut: "16:00",
    };
  }

  if (name.includes("PAGI")) {
    return {
      checkIn: "07:00",
      checkOut: "15:00",
    };
  }

  if (name.includes("SIANG")) {
    return {
      checkIn: "13:00",
      checkOut: "21:00",
    };
  }

  return {
    checkIn: "08:00",
    checkOut: "17:00",
  };
}

function isValidTime(value: unknown) {
  if (typeof value !== "string") return false;
  return /^\d{2}:\d{2}$/.test(value);
}

function isValidDay(value: unknown): value is DayKey {
  return typeof value === "string" && dayOrder.includes(value as DayKey);
}

function sortShifts<T extends { name: string }>(shifts: T[]) {
  const order = ["UTAMA", "MAGANG", "SHIFT PAGI", "SHIFT SIANG"];

  return [...shifts].sort((a, b) => {
    const aIndex = order.indexOf(a.name.toUpperCase());
    const bIndex = order.indexOf(b.name.toUpperCase());

    if (aIndex === -1 && bIndex === -1) {
      return a.name.localeCompare(b.name);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}

async function getCurrentUser(req: NextRequest) {
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

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!user) {
    throw new Error("User tidak ditemukan.");
  }

  return user;
}

async function ensureDefaultShifts() {
  await Promise.all(
    defaultShifts.map((shift) =>
      prisma.shift.upsert({
        where: {
          name: shift.name,
        },
        update: {},
        create: shift,
      }),
    ),
  );
}

async function ensureDefaultWorkSchedules() {
  const shifts = await prisma.shift.findMany({
    select: {
      id: true,
      name: true,
    },
  });

  const operations = [];

  for (const shift of shifts) {
    const defaultTime = getDefaultTimeByShift(shift.name);

    for (const day of dayOrder) {
      const isWeekend = day === "SATURDAY" || day === "SUNDAY";

      operations.push(
        prisma.workSchedule.upsert({
          where: {
            shift_id_day_of_week: {
              shift_id: shift.id,
              day_of_week: day,
            },
          },
          update: {},
          create: {
            shift_id: shift.id,
            day_of_week: day,
            is_work_day: !isWeekend,
            check_in_time: defaultTime.checkIn,
            check_out_time: defaultTime.checkOut,
          },
        }),
      );
    }
  }

  await Promise.all(operations);
}

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser(req);

    if (
      currentUser.status !== "active" ||
      !VIEW_ROLES.includes(currentUser.role as AllowedRole)
    ) {
      return NextResponse.json(
        {
          message: "Akses ditolak.",
        },
        { status: 403 },
      );
    }

    await ensureDefaultShifts();
    await ensureDefaultWorkSchedules();

    const shifts = await prisma.shift.findMany({
      select: {
        id: true,
        name: true,
        tolerance_minutes: true,
        status: true,
        work_schedules: {
          select: {
            id: true,
            shift_id: true,
            day_of_week: true,
            is_work_day: true,
            check_in_time: true,
            check_out_time: true,
          },
        },
      },
    });

    return NextResponse.json({
      shifts: sortShifts(shifts),
    });
  } catch (error) {
    console.error("GET /api/admin/work-schedules error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil jadwal kerja.",
      },
      { status: 500 },
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
      return NextResponse.json(
        {
          message:
            "Akses ditolak. Hanya owner atau admin yang dapat mengubah jam kerja.",
        },
        { status: 403 },
      );
    }

    const body = await req.json();
    const schedules = body.schedules;

    if (!Array.isArray(schedules)) {
      return NextResponse.json(
        {
          message: "Format schedules tidak valid.",
        },
        { status: 400 },
      );
    }

    const operations = [];

    for (const scheduleGroup of schedules) {
      const shiftId = String(scheduleGroup.shift_id || "");
      const days = scheduleGroup.days;

      if (!shiftId) {
        return NextResponse.json(
          {
            message: "Shift ID wajib dikirim.",
          },
          { status: 400 },
        );
      }

      const shift = await prisma.shift.findUnique({
        where: {
          id: shiftId,
        },
        select: {
          id: true,
        },
      });

      if (!shift) {
        return NextResponse.json(
          {
            message: "Shift tidak ditemukan.",
          },
          { status: 404 },
        );
      }

      if (!Array.isArray(days)) {
        return NextResponse.json(
          {
            message: "Data hari kerja tidak valid.",
          },
          { status: 400 },
        );
      }

      for (const day of days) {
        if (!isValidDay(day.day_of_week)) {
          return NextResponse.json(
            {
              message: "Hari kerja tidak valid.",
            },
            { status: 400 },
          );
        }

        const isWorkDay = Boolean(day.is_work_day);

        const checkInTime = isWorkDay
          ? String(day.check_in_time || "")
          : null;

        const checkOutTime = isWorkDay
          ? String(day.check_out_time || "")
          : null;

        if (isWorkDay && !isValidTime(checkInTime)) {
          return NextResponse.json(
            {
              message: `Jam masuk untuk ${day.day_of_week} tidak valid.`,
            },
            { status: 400 },
          );
        }

        if (isWorkDay && !isValidTime(checkOutTime)) {
          return NextResponse.json(
            {
              message: `Jam pulang untuk ${day.day_of_week} tidak valid.`,
            },
            { status: 400 },
          );
        }

        operations.push(
          prisma.workSchedule.upsert({
            where: {
              shift_id_day_of_week: {
                shift_id: shiftId,
                day_of_week: day.day_of_week,
              },
            },
            update: {
              is_work_day: isWorkDay,
              check_in_time: checkInTime,
              check_out_time: checkOutTime,
            },
            create: {
              shift_id: shiftId,
              day_of_week: day.day_of_week,
              is_work_day: isWorkDay,
              check_in_time: checkInTime,
              check_out_time: checkOutTime,
            },
          }),
        );
      }
    }

    await prisma.$transaction(operations);

    return NextResponse.json({
      message: "Jadwal kerja berhasil disimpan.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/work-schedules error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan jadwal kerja.",
      },
      { status: 500 },
    );
  }
}