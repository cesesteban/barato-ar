#!/usr/bin/env node
/**
 * Script CLI para correr el normalizer completo (F005).
 * `pnpm normalize:full`
 */

import { runNormalizer } from "@/normalizer";
import { prisma } from "@/lib/db";

async function main() {
  const started = Date.now();
  console.info("[normalize] iniciando full pass...");
  const result = await runNormalizer();
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.info(
    `[normalize] ean=${result.eanMerged} fuzzy_auto=${result.fuzzyAutoMerged} manual_queue=${result.candidatesUpserted} compared=${result.fuzzyCompared} elapsed=${elapsed}s`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
