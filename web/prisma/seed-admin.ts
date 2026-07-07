require("dotenv/config");

const bcrypt = require("bcryptjs");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("../src/generated/prisma/client");

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || "127.0.0.1",
  port: Number(process.env.DATABASE_PORT || 3306),
  user: process.env.DATABASE_USER || "root",
  password: process.env.DATABASE_PASSWORD || undefined,
  database: process.env.DATABASE_NAME || "faceattend_db",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password_hash = await bcrypt.hash("123456", 10);

  await prisma.user.upsert({
    where: {
      email: "owner@creativemu.com",
    },
    update: {
      name: "Owner Creativemu",
      password_hash,
      role: "owner",
      status: "active",
    },
    create: {
      name: "Owner Creativemu",
      email: "owner@creativemu.com",
      password_hash,
      role: "owner",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "admin@creativemu.com",
    },
    update: {
      name: "Admin Creativemu",
      password_hash,
      role: "admin",
      status: "active",
    },
    create: {
      name: "Admin Creativemu",
      email: "admin@creativemu.com",
      password_hash,
      role: "admin",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: {
      email: "cs@creativemu.com",
    },
    update: {
      name: "CS Creativemu",
      password_hash,
      role: "cs",
      status: "active",
    },
    create: {
      name: "CS Creativemu",
      email: "cs@creativemu.com",
      password_hash,
      role: "cs",
      status: "active",
    },
  });

  await prisma.shift.upsert({
    where: { name: "Jam Kerja Utama" },
    update: { tolerance_minutes: 15, status: "active" },
    create: { id: "shift-1", name: "Jam Kerja Utama", tolerance_minutes: 15, status: "active" },
  });

  await prisma.unit.upsert({
    where: { name: "Pusat" },
    update: { status: "active" },
    create: { id: "unit-1", name: "Pusat", status: "active" },
  });

  await prisma.department.upsert({
    where: { id: "dept-1" },
    update: { name: "IT Development", unit_id: "unit-1", shift_id: "shift-1" },
    create: { id: "dept-1", name: "IT Development", unit_id: "unit-1", shift_id: "shift-1" },
  });

  await prisma.position.upsert({
    where: { id: "pos-1" },
    update: { name: "Software Engineer", department_id: "dept-1", status: "active" },
    create: { id: "pos-1", name: "Software Engineer", department_id: "dept-1", status: "active" },
  });

  console.log("Akun owner, admin, CS, serta data Shift, Unit, Divisi, dan Jabatan berhasil dibuat");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
