import { PrismaClient } from "@prisma/client";
import { FRESH_GOOD_EXAMPLES } from "../prisma/good-examples-data";

const prisma = new PrismaClient();

async function main() {
  console.log("Replacing good examples with fresh set...");
  await prisma.goodExample.deleteMany();
  await prisma.goodExample.createMany({ data: FRESH_GOOD_EXAMPLES });
  const count = await prisma.goodExample.count();
  console.log(`Done. ${count} good examples loaded.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
