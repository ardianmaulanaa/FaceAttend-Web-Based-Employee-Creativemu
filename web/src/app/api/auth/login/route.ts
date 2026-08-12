import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createToken, verifyPassword } from "@/lib/auth";
import { isCreativemuEmail } from "@/lib/creativemu-email";
import { deactivateExpiredEmployee } from "@/lib/employment-period";

const LOGIN_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = 5;

type LoginAttempt = {
  attempt_count: number | bigint;
  reset_at: Date | string;
};

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

function getRateLimitKeys(req: Request, email: string) {
  return [getRateLimitKey(req, email), `email:${email}`];
}

function getRetryAfterSeconds(resetAt: number) {
  return Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
}

function toTime(value: Date | string) {
  return value instanceof Date ? value.getTime() : new Date(value).getTime();
}

let ensureLoginRateLimitsPromise: Promise<boolean> | null = null;

async function ensureLoginRateLimitsTable() {
  ensureLoginRateLimitsPromise ??= (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS login_rate_limits (
          rate_limit_key VARCHAR(255) PRIMARY KEY,
          attempt_count INT NOT NULL DEFAULT 1,
          reset_at DATETIME(3) NOT NULL,
          created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      return true;
    } catch (error) {
      console.warn("ENSURE_LOGIN_RATE_LIMITS_TABLE_WARN:", error);
      return false;
    }
  })();

  const ok = await ensureLoginRateLimitsPromise;
  if (!ok) ensureLoginRateLimitsPromise = null;
  return ok;
}

async function getActiveAttempt(key: string) {
  try {
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
  } catch (error) {
    const isMissingTable =
      String(error).includes("1146") ||
      String(error).toLowerCase().includes("doesn't exist");

    if (isMissingTable) {
      await ensureLoginRateLimitsTable();
    } else {
      console.warn("GET_ACTIVE_LOGIN_ATTEMPT_WARN:", error);
    }
    return null;
  }
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

async function getRateLimitedRetryAfter(keys: string[]) {
  const retryAfterValues = await Promise.all(keys.map(isRateLimited));
  const activeRetryAfterValues = retryAfterValues.filter(
    (value): value is number => value !== null,
  );

  if (activeRetryAfterValues.length === 0) return null;

  return Math.max(...activeRetryAfterValues);
}

async function recordFailedLogin(key: string) {
  const resetAt = new Date(Date.now() + LOGIN_RATE_LIMIT_WINDOW_MS);

  try {
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
  } catch (error) {
    const isMissingTable =
      String(error).includes("1146") ||
      String(error).toLowerCase().includes("doesn't exist");

    if (isMissingTable) {
      await ensureLoginRateLimitsTable();
      try {
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
      } catch (retryError) {
        console.warn("RECORD_FAILED_LOGIN_RETRY_WARN:", retryError);
      }
    } else {
      console.warn("RECORD_FAILED_LOGIN_WARN:", error);
    }
  }
}

async function clearFailedLogin(key: string) {
  try {
    await prisma.$executeRaw`
      DELETE FROM login_rate_limits
      WHERE rate_limit_key = ${key}
    `;
  } catch (error) {
    console.warn("CLEAR_FAILED_LOGIN_WARN:", error);
  }
}

async function recordFailedLogins(keys: string[]) {
  await Promise.all(keys.map(recordFailedLogin));
}

async function clearFailedLogins(keys: string[]) {
  await Promise.all(keys.map(clearFailedLogin));
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
    const rateLimitKeys = getRateLimitKeys(req, normalizedEmail || "unknown");

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

    const retryAfterSeconds = await getRateLimitedRetryAfter(rateLimitKeys);

    if (retryAfterSeconds) {
      return rateLimitResponse(retryAfterSeconds);
    }

    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        role: true,
        status: true,
        employment_end_date: true,
      },
    });

    if (!user) {
      await recordFailedLogins(rateLimitKeys);

      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    if (await deactivateExpiredEmployee(user)) {
      return NextResponse.json(
        {
          success: false,
          message: "Masa kerja akun sudah berakhir. Akun otomatis nonaktif.",
        },
        { status: 403 }
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
      await recordFailedLogins(rateLimitKeys);

      return NextResponse.json(
        { success: false, message: "Email atau password salah" },
        { status: 401 }
      );
    }

    await clearFailedLogins(rateLimitKeys);

    const token = await createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const role = String(user.role || "").toLowerCase();
    const redirectTo =
      role === "admin" || role === "owner" ? "/admin/dasbor" : "/beranda";

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

    response.cookies.set("presensi_token", token, {
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
      { success: false, message: "Terjadi kesalahan server saat login." },
      { status: 500 }
    );
  }
}
