import "dotenv/config";
import bcrypt from "bcryptjs";
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

const prisma = new PrismaClient({ adapter });

async function main() {
  const password_hash = await bcrypt.hash("123456", 10);

  // Clear existing items in reverse dependency order
  await prisma.position.deleteMany({});
  await prisma.unit.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.shift.deleteMany({});

  // Seed Users
  await prisma.user.upsert({
    where: { email: "owner@creativemu.co.id" },
    update: {
      name: "Owner Creativemu",
      password_hash,
      role: "owner",
      status: "active",
    },
    create: {
      name: "Owner Creativemu",
      email: "owner@creativemu.co.id",
      password_hash,
      role: "owner",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@creativemu.co.id" },
    update: {
      name: "Admin Creativemu",
      password_hash,
      role: "admin",
      status: "active",
    },
    create: {
      name: "Admin Creativemu",
      email: "admin@creativemu.co.id",
      password_hash,
      role: "admin",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "cs@creativemu.co.id" },
    update: {
      name: "CS Creativemu",
      password_hash,
      role: "cs",
      status: "active",
    },
    create: {
      name: "CS Creativemu",
      email: "cs@creativemu.co.id",
      password_hash,
      role: "cs",
      status: "active",
    },
  });

  await prisma.user.upsert({
    where: { email: "employee@creativemu.co.id" },
    update: {
      name: "Karyawan Creativemu",
      password_hash,
      role: "employee",
      status: "active",
    },
    create: {
      name: "Karyawan Creativemu",
      email: "employee@creativemu.co.id",
      password_hash,
      role: "employee",
      status: "active",
    },
  });

  // Seed Shift
  await prisma.shift.upsert({
    where: { name: "Jam Kerja Utama" },
    update: { tolerance_minutes: 15, status: "active" },
    create: { id: "shift-1", name: "Jam Kerja Utama", tolerance_minutes: 15, status: "active" },
  });

  // --- SEED DEPARTMENTS (Divisi) ---
  // Note: In the schema, Department belongs to OfficeLocation, and has child Units.
  await prisma.department.upsert({
    where: { id: "dept-it" },
    update: { name: "IT", office_id: "office-1", shift_id: "shift-1", status: "active" },
    create: { id: "dept-it", name: "IT", office_id: "office-1", shift_id: "shift-1", status: "active" },
  });

  await prisma.department.upsert({
    where: { id: "dept-dm" },
    update: { name: "DIGITAL MARKETING AGENCY", office_id: "office-1", shift_id: "shift-1", status: "active" },
    create: { id: "dept-dm", name: "DIGITAL MARKETING AGENCY", office_id: "office-1", shift_id: "shift-1", status: "active" },
  });

  await prisma.department.upsert({
    where: { id: "dept-magang-dm" },
    update: { name: "MAGANG-DIGITAL MARKETING AGENCY", office_id: "office-1", shift_id: "shift-1", status: "active" },
    create: { id: "dept-magang-dm", name: "MAGANG-DIGITAL MARKETING AGENCY", office_id: "office-1", shift_id: "shift-1", status: "active" },
  });

  await prisma.department.upsert({
    where: { id: "dept-mgt" },
    update: { name: "MANAJEMEN", office_id: "office-1", shift_id: "shift-1", status: "active" },
    create: { id: "dept-mgt", name: "MANAJEMEN", office_id: "office-1", shift_id: "shift-1", status: "active" },
  });

  // --- SEED UNITS ---
  // Note: In the schema, Unit belongs to Department.
  await prisma.unit.upsert({
    where: { id: "unit-it-alfabank" },
    update: { name: "Alfabank", department_id: "dept-it", status: "active" },
    create: { id: "unit-it-alfabank", name: "Alfabank", department_id: "dept-it", status: "active" },
  });

  await prisma.unit.upsert({
    where: { id: "unit-it-creativemu" },
    update: { name: "Creativemu Academy", department_id: "dept-it", status: "active" },
    create: { id: "unit-it-creativemu", name: "Creativemu Academy", department_id: "dept-it", status: "active" },
  });

  await prisma.unit.upsert({
    where: { id: "unit-dm-alfabank" },
    update: { name: "Alfabank", department_id: "dept-dm", status: "active" },
    create: { id: "unit-dm-alfabank", name: "Alfabank", department_id: "dept-dm", status: "active" },
  });

  await prisma.unit.upsert({
    where: { id: "unit-dm-creativemu" },
    update: { name: "Creativemu Academy", department_id: "dept-dm", status: "active" },
    create: { id: "unit-dm-creativemu", name: "Creativemu Academy", department_id: "dept-dm", status: "active" },
  });

  await prisma.unit.upsert({
    where: { id: "unit-magang-dm-creativemu" },
    update: { name: "Creativemu Academy", department_id: "dept-magang-dm", status: "active" },
    create: { id: "unit-magang-dm-creativemu", name: "Creativemu Academy", department_id: "dept-magang-dm", status: "active" },
  });

  await prisma.unit.upsert({
    where: { id: "unit-mgt-alfabank" },
    update: { name: "Alfabank", department_id: "dept-mgt", status: "active" },
    create: { id: "unit-mgt-alfabank", name: "Alfabank", department_id: "dept-mgt", status: "active" },
  });

  await prisma.unit.upsert({
    where: { id: "unit-mgt-creativemu" },
    update: { name: "Creativemu Academy", department_id: "dept-mgt", status: "active" },
    create: { id: "unit-mgt-creativemu", name: "Creativemu Academy", department_id: "dept-mgt", status: "active" },
  });

  // --- SEED POSITIONS ---
  // Note: In the schema, Position belongs to Unit.

  // Positions under Alfabank IT
  await prisma.position.upsert({
    where: { id: "pos-webdev-alfabank" },
    update: { name: "Web Dev", unit_id: "unit-it-alfabank", status: "active" },
    create: { id: "pos-webdev-alfabank", name: "Web Dev", unit_id: "unit-it-alfabank", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-software-alfabank" },
    update: { name: "Software", unit_id: "unit-it-alfabank", status: "active" },
    create: { id: "pos-software-alfabank", name: "Software", unit_id: "unit-it-alfabank", status: "active" },
  });

  // Positions under Creativemu IT
  await prisma.position.upsert({
    where: { id: "pos-webdev-creativemu" },
    update: { name: "Web Dev", unit_id: "unit-it-creativemu", status: "active" },
    create: { id: "pos-webdev-creativemu", name: "Web Dev", unit_id: "unit-it-creativemu", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-software-creativemu" },
    update: { name: "Software", unit_id: "unit-it-creativemu", status: "active" },
    create: { id: "pos-software-creativemu", name: "Software", unit_id: "unit-it-creativemu", status: "active" },
  });

  // Positions under Alfabank DM
  await prisma.position.upsert({
    where: { id: "pos-seo-alfabank" },
    update: { name: "SEO Specialist", unit_id: "unit-dm-alfabank", status: "active" },
    create: { id: "pos-seo-alfabank", name: "SEO Specialist", unit_id: "unit-dm-alfabank", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-cw-alfabank" },
    update: { name: "Content Writer", unit_id: "unit-dm-alfabank", status: "active" },
    create: { id: "pos-cw-alfabank", name: "Content Writer", unit_id: "unit-dm-alfabank", status: "active" },
  });

  // Positions under Creativemu DM
  await prisma.position.upsert({
    where: { id: "pos-seo-creativemu" },
    update: { name: "SEO Specialist", unit_id: "unit-dm-creativemu", status: "active" },
    create: { id: "pos-seo-creativemu", name: "SEO Specialist", unit_id: "unit-dm-creativemu", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-cw-creativemu" },
    update: { name: "Content Writer", unit_id: "unit-dm-creativemu", status: "active" },
    create: { id: "pos-cw-creativemu", name: "Content Writer", unit_id: "unit-dm-creativemu", status: "active" },
  });

  // Positions under Creativemu Magang DM
  await prisma.position.upsert({
    where: { id: "pos-intern-dm-creativemu" },
    update: { name: "Intern DM", unit_id: "unit-magang-dm-creativemu", status: "active" },
    create: { id: "pos-intern-dm-creativemu", name: "Intern DM", unit_id: "unit-magang-dm-creativemu", status: "active" },
  });

  // Positions under Alfabank Manajemen
  await prisma.position.upsert({
    where: { id: "pos-mgr-alfabank" },
    update: { name: "Manager", unit_id: "unit-mgt-alfabank", status: "active" },
    create: { id: "pos-mgr-alfabank", name: "Manager", unit_id: "unit-mgt-alfabank", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-staff-alfabank" },
    update: { name: "Staff", unit_id: "unit-mgt-alfabank", status: "active" },
    create: { id: "pos-staff-alfabank", name: "Staff", unit_id: "unit-mgt-alfabank", status: "active" },
  });

  // Positions under Creativemu Manajemen
  await prisma.position.upsert({
    where: { id: "pos-mgr-creativemu" },
    update: { name: "Manager", unit_id: "unit-mgt-creativemu", status: "active" },
    create: { id: "pos-mgr-creativemu", name: "Manager", unit_id: "unit-mgt-creativemu", status: "active" },
  });
  await prisma.position.upsert({
    where: { id: "pos-staff-creativemu" },
    update: { name: "Staff", unit_id: "unit-mgt-creativemu", status: "active" },
    create: { id: "pos-staff-creativemu", name: "Staff", unit_id: "unit-mgt-creativemu", status: "active" },
  });

  console.log("Akun owner, admin, CS, serta data Shift, Divisi, Unit, dan Jabatan berhasil dibuat");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
