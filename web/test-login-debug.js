require("dotenv/config");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");
const { PrismaClient } = require("./src/generated/prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Querying database triggers...");
  try {
    const result = await prisma.$queryRawUnsafe(`SHOW TRIGGERS;`);
    console.log("Triggers:", result);
  } catch (err) {
    console.error("Error querying triggers:", err);
  }
}

main().finally(() => prisma.$disconnect());
