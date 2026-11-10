import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const stores = await p.store.findMany({
    where: { isVirtual: false },
    select: { id: true, name: true, zoneId: true, chain: { select: { slug: true } } },
    take: 20
  });
  console.log('Stores sample:', JSON.stringify(stores, null, 2));

  const withZone = await p.store.count({ where: { isVirtual: false, zoneId: { not: null } } });
  const withoutZone = await p.store.count({ where: { isVirtual: false, zoneId: null } });
  console.log('Con zone_id:', withZone);
  console.log('Sin zone_id:', withoutZone);
}

await main();
await p.$disconnect();