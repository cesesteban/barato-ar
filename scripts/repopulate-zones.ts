#!/usr/bin/env node
/**
 * Re-popular `zone_id` en stores existentes basándose en lat/lng.
 * Usa `nearestZone` del catálogo cliente (equivalente a server-side).
 *
 * Uso: pnpm tsx scripts/repopulate-zones.ts
 */

import { PrismaClient } from "@prisma/client";
import { nearestZone } from "@/lib/zones-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("[repopulate-zones] buscando stores sin zone_id pero con lat/lng...");

  const stores = await prisma.store.findMany({
    where: {
      zoneId: null,
      isVirtual: false,
      lat: { not: null },
      lng: { not: null },
    },
    select: { id: true, name: true, lat: true, lng: true, chain: { select: { slug: true } } },
  });

  console.log(`[repopulate-zones] ${stores.length} stores a actualizar`);

  let updated = 0;
  let failed = 0;

  for (const store of stores) {
    if (store.lat === null || store.lng === null) {
      failed++;
      continue;
    }

    const zone = nearestZone(store.lat, store.lng);

    try {
      await prisma.store.update({
        where: { id: store.id },
        data: { zoneId: zone.slug },
      });
      console.log(`  ✓ ${store.chain.slug} | ${store.name} (${store.lat}, ${store.lng}) -> ${zone.slug} (${zone.name})`);
      updated++;
    } catch (err) {
      console.error(`  ✗ ${store.chain.slug} | ${store.name} -> ERROR: ${err instanceof Error ? err.message : err}`);
      failed++;
    }
  }

  console.log(`\n[repopulate-zones] Done. Updated: ${updated}, Failed: ${failed}`);

  // Verificación: contar stores con zone_id
  const withZone = await prisma.store.count({ where: { isVirtual: false, zoneId: { not: null } } });
  const withoutZone = await prisma.store.count({ where: { isVirtual: false, zoneId: null } });
  console.log(`Stores con zone_id: ${withZone}`);
  console.log(`Stores sin zone_id: ${withoutZone}`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});