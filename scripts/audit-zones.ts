/**
 * Investiga por qué todos los stores tienen zone_id NULL.
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();

  const totalReal = await p.store.count({ where: { isVirtual: false } });
  const withZone = await p.store.count({ where: { isVirtual: false, zoneId: { not: null } } });
  const withoutZone = await p.store.count({ where: { isVirtual: false, zoneId: null } });
  console.log(`Real stores: ${totalReal} | con zone_id: ${withZone} | sin zone_id: ${withoutZone}`);

  const sample = await p.store.findMany({
    where: { isVirtual: false },
    take: 5,
    select: { slug: true, name: true, address: true, lat: true, lng: true, zoneId: true },
  });
  console.log("\nSample:");
  for (const s of sample) {
    console.log(`  slug: ${s.slug}`);
    console.log(`    name: ${s.name}`);
    console.log(`    addr: ${s.address}`);
    console.log(`    lat/lng: ${s.lat}, ${s.lng}`);
    console.log(`    zone_id: ${s.zoneId}`);
    console.log("");
  }

  await p.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
