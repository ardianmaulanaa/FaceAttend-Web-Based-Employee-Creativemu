import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

function getDatabaseConfig(connectionLimit: number) {
  if (process.env.DATABASE_URL) {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    const database = databaseUrl.pathname.replace(/^\//, "");
    const isRemoteTls =
      databaseUrl.hostname.includes("tidbcloud.com") ||
      databaseUrl.searchParams.get("ssl") === "true" ||
      databaseUrl.searchParams.get("sslaccept") === "strict";

    return {
      host: databaseUrl.hostname,
      port: Number(databaseUrl.port || 3306),
      user: decodeURIComponent(databaseUrl.username),
      password: decodeURIComponent(databaseUrl.password) || undefined,
      database: database || process.env.DATABASE_NAME || "faceattend_db",
      connectionLimit,
      ...(isRemoteTls ? { ssl: { rejectUnauthorized: true } } : {}),
    };
  }

  return {
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || undefined,
    database: process.env.DATABASE_NAME || "faceattend_db",
    connectionLimit,
  };
}

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaMariaDb;
};

if (!globalForPrisma.prismaAdapter) {
  globalForPrisma.prismaAdapter = new PrismaMariaDb(getDatabaseConfig(5));
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: globalForPrisma.prismaAdapter,
    log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
