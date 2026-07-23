import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type OfficeBody = {
  id?: string;
  name?: string;
  address?: string;
  phone?: string;
  postal_code?: string;
  postalCode?: string;
  logo_url?: string;
  logoUrl?: string;
  latitude?: string | number;
  longitude?: string | number;
  radius_meters?: string | number;
  radiusMeters?: string | number;
  status?: string;
};

async function getAdminFromRequest(req: NextRequest) {
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

  const role = String(payload.role || "");

  if (!userId) {
    throw new Error("User ID tidak ditemukan di token.");
  }

  if (role !== "owner" && role !== "admin") {
    throw new Error("Akses hanya untuk admin & owner.");
  }

  return userId;
}

function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeStatus(value: unknown) {
  return String(value || "active").toLowerCase() === "inactive"
    ? "inactive"
    : "active";
}

function validateOfficeBody(body: OfficeBody) {
  const name = String(body.name || "").trim();
  const address = String(body.address || "").trim();
  const phone = String(body.phone || "").trim();
  const postal_code = String(body.postal_code || body.postalCode || "").trim();
  const logo_url = String(body.logo_url || body.logoUrl || "").trim();
  const latitude = toNumber(body.latitude);
  const longitude = toNumber(body.longitude);
  const radius = toNumber(body.radius_meters ?? body.radiusMeters);
  const status = normalizeStatus(body.status);

  if (!name) {
    return {
      error: "Nama kantor wajib diisi.",
      data: null,
    };
  }

  if (latitude === null || longitude === null) {
    return {
      error: "Latitude dan longitude wajib diisi dengan angka valid.",
      data: null,
    };
  }

  if (radius === null || radius <= 0) {
    return {
      error: "Radius kantor wajib diisi dengan angka lebih dari 0.",
      data: null,
    };
  }

  return {
    error: "",
    data: {
      name,
      address: address || null,
      phone: phone || null,
      postal_code: postal_code || null,
      logo_url: logo_url || null,
      latitude,
    },
  };
}

async function ensureOfficeColumnsExist() {
  const db = prisma as any;
  const tables = ["OfficeLocation", "office_locations", "officelocation"];
  for (const table of tables) {
    try {
      await db.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`phone\` VARCHAR(50) NULL`);
    } catch {}
    try {
      await db.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`postal_code\` VARCHAR(20) NULL`);
    } catch {}
    try {
      await db.$executeRawUnsafe(`ALTER TABLE \`${table}\` ADD COLUMN \`logo_url\` LONGTEXT NULL`);
    } catch {}
  }
}

const fullOfficeSelect = {
  id: true,
  name: true,
  address: true,
  phone: true,
  postal_code: true,
  logo_url: true,
  latitude: true,
  longitude: true,
  radius_meters: true,
  status: true,
};

const basicOfficeSelect = {
  id: true,
  name: true,
  address: true,
  latitude: true,
  longitude: true,
  radius_meters: true,
  status: true,
};

export async function GET(req: NextRequest) {
  try {
    await getAdminFromRequest(req);
    await ensureOfficeColumnsExist();

    let offices;
    try {
      offices = await (prisma as any).officeLocation.findMany({
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: fullOfficeSelect,
      });
    } catch {
      offices = await (prisma as any).officeLocation.findMany({
        orderBy: [{ status: "asc" }, { name: "asc" }],
        select: basicOfficeSelect,
      });
    }

    return NextResponse.json({
      success: true,
      offices,
    });
  } catch (error) {
    console.error("GET_ADMIN_OFFICES_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Gagal mengambil data kantor.",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await getAdminFromRequest(req);
    await ensureOfficeColumnsExist();

    const body = (await req.json()) as OfficeBody;
    const result = validateOfficeBody(body);

    if (!result.data) {
      return NextResponse.json(
        {
          success: false,
          message: result.error,
        },
        { status: 400 }
      );
    }

    let office;
    try {
      office = await (prisma as any).officeLocation.create({
        data: {
          id: crypto.randomUUID(),
          ...result.data,
        },
        select: fullOfficeSelect,
      });
    } catch {
      const { phone, postal_code, logo_url, ...basicData } = result.data as any;
      office = await (prisma as any).officeLocation.create({
        data: {
          id: crypto.randomUUID(),
          ...basicData,
        },
        select: basicOfficeSelect,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Kantor berhasil ditambahkan.",
      office,
    });
  } catch (error) {
    console.error("CREATE_ADMIN_OFFICE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal menambahkan kantor.",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await getAdminFromRequest(req);
    await ensureOfficeColumnsExist();

    const body = (await req.json()) as OfficeBody;
    const result = validateOfficeBody(body);

    if (!result.data) {
      return NextResponse.json(
        {
          success: false,
          message: result.error,
        },
        { status: 400 }
      );
    }

    let officeId = body.id;
    if (!officeId) {
      try {
        const firstOffice = await (prisma as any).officeLocation.findFirst({
          select: { id: true },
        });
        officeId = firstOffice?.id;
      } catch {
        officeId = undefined;
      }
    }

    let office;
    if (officeId) {
      try {
        office = await (prisma as any).officeLocation.update({
          where: { id: officeId },
          data: result.data,
          select: fullOfficeSelect,
        });
      } catch {
        const { phone, postal_code, logo_url, ...basicData } = result.data as any;
        office = await (prisma as any).officeLocation.update({
          where: { id: officeId },
          data: basicData,
          select: basicOfficeSelect,
        });
      }
    } else {
      try {
        office = await (prisma as any).officeLocation.create({
          data: {
            id: crypto.randomUUID(),
            ...result.data,
          },
          select: fullOfficeSelect,
        });
      } catch {
        const { phone, postal_code, logo_url, ...basicData } = result.data as any;
        office = await (prisma as any).officeLocation.create({
          data: {
            id: crypto.randomUUID(),
            ...basicData,
          },
          select: basicOfficeSelect,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Profil perusahaan berhasil diperbarui.",
      office,
    });
  } catch (error) {
    console.error("PATCH_ADMIN_OFFICE_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Gagal memperbarui kantor.",
      },
      { status: 500 }
    );
  }
}