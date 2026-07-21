import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { verifyPassword } from "@/lib/auth";
import { getApiErrorMessage, getApiErrorStatus } from "@/lib/api-errors";

export const runtime = "nodejs";

type AnyBody = Record<string, unknown>;

const oldPasswordKeys = [
  "oldPassword",
  "old_password",
  "currentPassword",
  "current_password",
  "passwordLama",
  "password_lama",
  "kataSandiLama",
  "kata_sandi_lama",
  "old",
  "current",
  "oldPass",
  "old_pass",
];

const newPasswordKeys = [
  "newPassword",
  "new_password",
  "passwordBaru",
  "password_baru",
  "kataSandiBaru",
  "kata_sandi_baru",
  "new",
  "newPass",
  "new_pass",
];

const confirmPasswordKeys = [
  "confirmPassword",
  "confirm_password",
  "confirmNewPassword",
  "confirm_new_password",
  "konfirmasiPassword",
  "konfirmasi_password",
  "konfirmasiKataSandi",
  "konfirmasi_kata_sandi",
  "passwordConfirmation",
  "password_confirmation",
  "confirm",
  "confirmation",
  "confirmPass",
  "confirm_pass",
];

async function getUserIdFromRequest(req: NextRequest) {
  const authUser = await requireAuth(req);

  return authUser.id;
}

function normalizeKey(key: string) {
  return key.replace(/[_\-\s]/g, "").toLowerCase();
}

function findText(body: unknown, keys: string[]) {
  const targets = new Set(keys.map(normalizeKey));

  function walk(value: unknown): string {
    if (!value || typeof value !== "object") return "";

    for (const [key, item] of Object.entries(value as AnyBody)) {
      if (targets.has(normalizeKey(key))) {
        if (typeof item === "string") return item.trim();
        if (typeof item === "number") return String(item);
      }

      if (item && typeof item === "object") {
        const nested = walk(item);
        if (nested) return nested;
      }
    }

    return "";
  }

  return walk(body);
}

function getBodyKeys(body: unknown) {
  const keys: string[] = [];

  function walk(value: unknown, prefix = "") {
    if (!value || typeof value !== "object") return;

    for (const [key, item] of Object.entries(value as AnyBody)) {
      const nextKey = prefix ? `${prefix}.${key}` : key;
      keys.push(nextKey);

      if (item && typeof item === "object" && !(item instanceof File)) {
        walk(item, nextKey);
      }
    }
  }

  walk(body);

  return keys;
}

async function readRequestBody(req: NextRequest): Promise<AnyBody> {
  const contentType = req.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const body: AnyBody = {};

    formData.forEach((value, key) => {
      if (typeof value === "string") {
        body[key] = value;
      }
    });

    return body;
  }

  const text = await req.text();

  if (!text.trim()) {
    return {};
  }

  try {
    return JSON.parse(text) as AnyBody;
  } catch {
    return {};
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    const body = await readRequestBody(req);

    const oldPassword = findText(body, oldPasswordKeys);
    const newPassword = findText(body, newPasswordKeys);
    const confirmPassword = findText(body, confirmPasswordKeys);

    if (!oldPassword || !newPassword || !confirmPassword) {
      console.log("CHANGE_PASSWORD_BODY_KEYS:", getBodyKeys(body));

      return NextResponse.json(
        {
          success: false,
          message:
            "Kata sandi lama, kata sandi baru, dan konfirmasi wajib diisi.",
          receivedKeys: getBodyKeys(body),
        },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          message: "Kata sandi baru minimal 8 karakter.",
        },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Konfirmasi kata sandi baru tidak sama.",
        },
        { status: 400 }
      );
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        {
          success: false,
          message: "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        status: true,
        password_hash: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Data user tidak ditemukan.",
        },
        { status: 404 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        {
          success: false,
          message: "Akun kamu sedang tidak aktif.",
        },
        { status: 403 }
      );
    }

    const isOldPasswordValid = await verifyPassword(
      oldPassword,
      user.password_hash
    );

    if (!isOldPasswordValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Kata sandi lama salah.",
        },
        { status: 401 }
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password_hash: hashedPassword,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Kata sandi berhasil diubah.",
    });
  } catch (error) {
    console.error("CHANGE_PASSWORD_ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: getApiErrorMessage(error, "Gagal mengubah kata sandi."),
      },
      { status: getApiErrorStatus(error) }
    );
  }
}

export async function POST(req: NextRequest) {
  return PATCH(req);
}
