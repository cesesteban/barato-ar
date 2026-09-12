import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const zones = await p.zone.count();
  const withParent = await p.zone.count({ where: { parentId: { not: null } } });
  const sample = await p.zone.findMany({
    where: { parentId: "pba-gba-norte" },
    select: { slug: true, name: true },
  });
  console.log(`total zones: ${zones}, con parent: ${withParent}`);
  console.log(`GBA Norte children:`, sample.map((s) => s.slug).join(", "));
  await p.$disconnect();
})();
