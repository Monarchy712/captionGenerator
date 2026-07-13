import { PrismaClient } from "@prisma/client";
import { FRESH_BAD_EXAMPLES } from "../prisma/bad-examples-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Replacing bad examples with fresh set...");
  await prisma.badExample.deleteMany();
  await prisma.badExample.createMany({ data: FRESH_BAD_EXAMPLES });
  const count = await prisma.badExample.count();
  console.log(`Done. ${count} bad examples loaded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
