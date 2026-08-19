import "dotenv/config";

import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

function getDatabaseConfig() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl) {
    const parsedUrl = new URL(databaseUrl);
    const host = parsedUrl.hostname;
    const localHosts = new Set(["localhost", "127.0.0.1", "::1"]);
    const isLocalDatabase = localHosts.has(host.toLowerCase());
    const sslAccept = (
      parsedUrl.searchParams.get("sslaccept") || ""
    ).toLowerCase();
    const sslValue = (parsedUrl.searchParams.get("ssl") || "").toLowerCase();
    const sslMode = (
      parsedUrl.searchParams.get("sslmode") || ""
    ).toLowerCase();

    const useTls =
      !isLocalDatabase ||
      sslAccept === "strict" ||
      sslValue === "true" ||
      sslMode === "required" ||
      sslMode === "verify-ca" ||
      sslMode === "verify-identity";

    return {
      host,
      port: Number(parsedUrl.port || 3306),
      user: decodeURIComponent(parsedUrl.username),
      password: decodeURIComponent(parsedUrl.password) || undefined,
      database: decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, "")),
      connectionLimit: 5,
      connectTimeout: 20_000,
      ...(useTls
        ? {
            ssl: {
              minVersion: "TLSv1.2" as const,
              rejectUnauthorized: true,
            },
          }
        : {}),
    };
  }

  return {
    host: process.env.DATABASE_HOST || "127.0.0.1",
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER || "root",
    password: process.env.DATABASE_PASSWORD || undefined,
    database: process.env.DATABASE_NAME || "creativemu_db",
    connectionLimit: 5,
  };
}

const adapter = new PrismaMariaDb(getDatabaseConfig());

const prisma = new PrismaClient({ adapter });

async function main() {
  const rawPassword = process.env.SEED_OWNER_PASSWORD || "12345678";

  const password_hash = await bcrypt.hash(rawPassword, 12);

  await prisma.user.upsert({
    where: {
      email: "admin@creativemu.id",
    },
    update: {
      name: "Admin Creativemu",
      password_hash,
      role: "admin",
      status: "active",
    },
    create: {
      name: "Admin Creativemu",
      email: "admin@creativemu.id",
      password_hash,
      role: "admin",
      status: "active",
    },
  });

  console.log("Admin admin@creativemu.id berhasil dibuat");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
