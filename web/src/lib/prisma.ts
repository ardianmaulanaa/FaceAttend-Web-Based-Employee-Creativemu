import "dotenv/config";

import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function getDatabaseConfig(connectionLimit: number) {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL belum diatur. Tambahkan DATABASE_URL ke .env atau environment hosting.",
    );
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error("Format DATABASE_URL tidak valid.");
  }

  if (
    parsedUrl.protocol !== "mysql:" &&
    parsedUrl.protocol !== "mariadb:"
  ) {
    throw new Error(
      `Protocol DATABASE_URL tidak didukung: ${parsedUrl.protocol}. Gunakan mysql:// atau mariadb://`,
    );
  }

  const host = parsedUrl.hostname;
  const port = Number(parsedUrl.port || 3306);
  const user = decodeURIComponent(parsedUrl.username);
  const password = decodeURIComponent(parsedUrl.password);
  const database = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, ""));

  if (!host) {
    throw new Error("Host database tidak ditemukan di DATABASE_URL.");
  }

  if (!user) {
    throw new Error("Username database tidak ditemukan di DATABASE_URL.");
  }

  if (!database) {
    throw new Error("Nama database tidak ditemukan di DATABASE_URL.");
  }

  const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
  const isLocalDatabase = localHosts.has(host.toLowerCase());
  const sslAccept = (
    parsedUrl.searchParams.get("sslaccept") || ""
  ).toLowerCase();
  const sslValue = (parsedUrl.searchParams.get("ssl") || "").toLowerCase();
  const sslMode = (parsedUrl.searchParams.get("sslmode") || "").toLowerCase();
  const envSsl = (process.env.DATABASE_SSL || "").toLowerCase();
  const envRejectUnauthorized = (
    process.env.DATABASE_SSL_REJECT_UNAUTHORIZED || ""
  ).toLowerCase();
  const sslDisabled =
    sslValue === "false" ||
    sslValue === "0" ||
    sslMode === "disabled" ||
    sslMode === "disable" ||
    envSsl === "false" ||
    envSsl === "0";

  const useTls =
    !sslDisabled &&
    (envSsl === "true" ||
      envSsl === "1" ||
      sslAccept === "strict" ||
      sslValue === "true" ||
      sslMode === "required" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-identity" ||
      (!isLocalDatabase && process.env.DATABASE_SSL_AUTO === "true"));

  const rejectUnauthorized = envRejectUnauthorized !== "false";

  return {
    host,
    port,
    user,
    password: password || undefined,
    database,
    connectionLimit,
    connectTimeout: 20_000,
    ...(useTls
      ? {
          ssl: {
            minVersion: "TLSv1.2" as const,
            rejectUnauthorized,
          },
        }
      : {}),
  };
}

const configuredConnectionLimit = Number(
  process.env.DATABASE_CONNECTION_LIMIT || "5",
);

const connectionLimit =
  Number.isFinite(configuredConnectionLimit) && configuredConnectionLimit > 0
    ? configuredConnectionLimit
    : 5;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaMariaDb;
};

if (!globalForPrisma.prismaAdapter) {
  globalForPrisma.prismaAdapter = new PrismaMariaDb(
    getDatabaseConfig(connectionLimit),
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: globalForPrisma.prismaAdapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
