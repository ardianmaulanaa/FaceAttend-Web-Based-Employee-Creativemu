import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";

const LOGIN_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

type LoginAttempt = {
  attempt_count: number | bigint;
  reset_at: Date | string;
};

function isCreativemuEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  return (
    normalized.endsWith("@creativemu.co.id") ||
    normalized.endsWith("@creativemu.com")
  );
}

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function getRateLimitKey(req: Request, email: string) {
  return `${getClientIp(req)}:${email}`;
}

function getRetryAfterSeconds(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}

function toTime(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

async function getActiveAttempt(key: string) {
  const rows = await prisma.$queryRaw<LoginAttempt[]>`
    SELECT attempt_count, reset_at
    FROM login_rate_limits
    WHERE rate_limit_key = ${key}
    LIMIT 1
  `;

  const attempt = rows[0];

  if (!attempt) return null;

  if (toTime(attempt.reset_at) <= Date.now()) {
    await clearFailedLogin(key);
    return null;
  }

  return attempt;
}

async function isRateLimited(key: string) {
  const attempt = await getActiveAttempt(key);

  if (
    !attempt ||
    Number(attempt.attempt_count) < LOGIN_RATE_LIMIT_MAX_ATTEMPTS
  ) {
    return null;
  }

  return getRetryAfterSeconds(toTime(attempt.reset_at));
}

async function recordFailedLogin(key: string) {
  const resetAt = new Date(Date.now() + LOGIN_RATE_LIMIT_WINDOW_MS);

  await prisma.$executeRaw`
    INSERT INTO login_rate_limits (
      rate_limit_key,
      attempt_count,
      reset_at,
      created_at,
      updated_at
    )
    VALUES (${key}, 1, ${resetAt}, NOW(3), NOW(3))
    ON DUPLICATE KEY UPDATE
      attempt_count = IF(reset_at <= NOW(3), 1, attempt_count + 1),
      reset_at = IF(reset_at <= NOW(3), VALUES(reset_at), reset_at),
      updated_at = NOW(3)
  `;
}

async function clearFailedLogin(key: string) {
  await prisma.$executeRaw`
    DELETE FROM login_rate_limits
    WHERE rate_limit_key = ${key}
  `;
}

function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      success: false,
      message: "Tunggu 1 menit hingga kamu bisa mencoba kembali.",
      retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedPassword = String(password || "");
    const rateLimitKey = getRateLimitKey(req, normalizedEmail || "unknown");

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        { success: false, message: "Email dan password wajib diisi" },
        { status: 400 }
      );
    }

    if (!isCreativemuEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          success: false,
          message: "Login hanya dapat menggunakan email resmi Creativemu.",
        },
        { status: 403 }
      );
    }

    const retryAfterSeconds = await isRateLimited(rateLimitKey);

    if (retryAfterSeconds) {
      return rateLimitResponse(retryAfterSeconds);
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user) {
      await recordFailedLogin(rateLimitKey);

      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (user.status !== "active") {
      return NextResponse.json(
        { success: false, message: "Akun tidak aktif" },
        { status: 403 }
      );
    }

    const isValidPassword = await verifyPassword(
      normalizedPassword,
      user.password_hash
    );

    if (!isValidPassword) {
      await recordFailedLogin(rateLimitKey);

      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    await clearFailedLogin(rateLimitKey);

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const redirectTo = user.role === "owner" ? "/admin/dashboard" : "/home";

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil",
      redirectTo,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });

    response.cookies.set("faceattend_token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN_ERROR:", error);

    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
