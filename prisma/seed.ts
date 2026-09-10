import { PrismaClient } from "@prisma/client";
import { seedChainsAndVirtualStores } from "./seed/chains";

const prisma = new PrismaClient();

async function main() {
  await prisma.appMeta.upsert({
    where: { id: 1 },
    update: { version: "0.1.0" },
    create: { id: 1, version: "0.1.0" },
  });
  await seedChainsAndVirtualStores();
  console.info("✅ Seed completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
