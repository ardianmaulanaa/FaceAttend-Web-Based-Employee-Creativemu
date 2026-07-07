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

  await prisma.position.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.shift.deleteMany({});

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

  // Seeds for Alfabank Unit
  await prisma.unit.upsert({
    where: { name: "Alfabank" },
    update: { status: "active" },
    create: { id: "unit-1", name: "Alfabank", status: "active" },
  });

  // Seeds for Creativemu Academy Unit
  await prisma.unit.upsert({
    where: { name: "Creativemu Academy" },
    update: { status: "active" },
    create: { id: "unit-2", name: "Creativemu Academy", status: "active" },
  });

  // Seeds for IT Department under Alfabank
  await prisma.department.upsert({
    where: { id: "dept-it-alfabank" },
    update: { name: "IT", unit_id: "unit-1", shift_id: "shift-1" },
    create: { id: "dept-it-alfabank", name: "IT", unit_id: "unit-1", shift_id: "shift-1" },
  });

  // Seeds for IT Department under Creativemu Academy
  await prisma.department.upsert({
    where: { id: "dept-it-creativemu" },
    update: { name: "IT", unit_id: "unit-2", shift_id: "shift-1" },
    create: { id: "dept-it-creativemu", name: "IT", unit_id: "unit-2", shift_id: "shift-1" },
  });

  // Seeds for Web Dev Position under Alfabank IT
  await prisma.position.upsert({
    where: { id: "pos-webdev-alfabank" },
    update: { name: "Web Dev", department_id: "dept-it-alfabank", status: "active" },
    create: { id: "pos-webdev-alfabank", name: "Web Dev", department_id: "dept-it-alfabank", status: "active" },
  });

  // Seeds for Software Position under Alfabank IT
  await prisma.position.upsert({
    where: { id: "pos-software-alfabank" },
    update: { name: "Software", department_id: "dept-it-alfabank", status: "active" },
    create: { id: "pos-software-alfabank", name: "Software", department_id: "dept-it-alfabank", status: "active" },
  });

  // Seeds for Web Dev Position under Creativemu IT
  await prisma.position.upsert({
    where: { id: "pos-webdev-creativemu" },
    update: { name: "Web Dev", department_id: "dept-it-creativemu", status: "active" },
    create: { id: "pos-webdev-creativemu", name: "Web Dev", department_id: "dept-it-creativemu", status: "active" },
  });

  // Seeds for Software Position under Creativemu IT
  await prisma.position.upsert({
    where: { id: "pos-software-creativemu" },
    update: { name: "Software", department_id: "dept-it-creativemu", status: "active" },
    create: { id: "pos-software-creativemu", name: "Software", department_id: "dept-it-creativemu", status: "active" },
  });

  console.log("Akun owner, admin, CS, serta data Shift, Unit (Alfabank, Creativemu Academy), Divisi, dan Jabatan berhasil dibuat");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
