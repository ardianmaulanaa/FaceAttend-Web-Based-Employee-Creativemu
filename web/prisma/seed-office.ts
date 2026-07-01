import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || undefined,
  database: process.env.DATABASE_NAME || "faceattend_db",
  connectionLimit: 5,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.officeLocation.upsert({
    where: {
      name: "Kantor Utama",
    },
    update: {
      address: "Alamat kantor utama",
      latitude: -6.917464,
      longitude: 107.619123,
      radius_meters: 100,
      status: "active",
    },
    create: {
      name: "Kantor Utama",
      address: "Alamat kantor utama",
      latitude: -6.917464,
      longitude: 107.619123,
      radius_meters: 100,
      status: "active",
    },
  });

  await prisma.officeLocation.upsert({
  where: {
    name: "Creativemu Academy",
  },
  update: {
    address: "Jogja",
    latitude: -7.812201,
    longitude: 110.2685415,
    radius_meters: 100,
    status: "active",
  },
  create: {
    name: "Creativemu Academy",
    address: "Jogja",
    latitude: -7.812201,
    longitude: 110.2685415,
    radius_meters: 100,
    status: "active",
  },
});

  console.log("Data kantor berhasil dibuat.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });