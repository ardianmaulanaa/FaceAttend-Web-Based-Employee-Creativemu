import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";

const ALLOWED_EMAIL_DOMAIN = "@creativemu.co.id";
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

// Global in-memory cache for rate limits
const rateLimitCache = new Map<string, { attempt_count: number; reset_at: number }>();

async function getActiveAttempt(key: string) {
  const attempt = rateLimitCache.get(key);
  if (!attempt) return null;

  if (attempt.reset_at <= Date.now()) {
    rateLimitCache.delete(key);
    return null;
  }

  return attempt;
}

async function isRateLimited(key: string) {
  const attempt = await getActiveAttempt(key);

  if (
    !attempt ||
    attempt.attempt_count < LOGIN_RATE_LIMIT_MAX_ATTEMPTS
  ) {
    return null;
  }

  return getRetryAfterSeconds(attempt.reset_at);
}

async function recordFailedLogin(key: string) {
  const now = Date.now();
  const attempt = rateLimitCache.get(key);

  if (attempt && attempt.reset_at > now) {
    attempt.attempt_count += 1;
  } else {
    rateLimitCache.set(key, {
      attempt_count: 1,
      reset_at: now + LOGIN_RATE_LIMIT_WINDOW_MS,
    });
  }
}

async function clearFailedLogin(key: string) {
  rateLimitCache.delete(key);
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
    }
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

    let user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (!user && normalizedEmail.endsWith("@creativemu.co.id")) {
      const fallbackEmail = normalizedEmail.replace("@creativemu.co.id", "@creativemu.com");
      user = await prisma.user.findUnique({
        where: {
          email: fallbackEmail,
        },
      });
    }

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
