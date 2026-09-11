#!/usr/bin/env node
/**
 * Refresh nocturno de materialized views (F010).
 * `pnpm views:refresh`
 */

import { prisma } from "@/lib/db";

async function main() {
  const started = Date.now();
  console.info("[views] refresh price_daily_avg CONCURRENTLY...");
  try {
    await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW CONCURRENTLY price_daily_avg");
  } catch (err) {
    // Primera vez la view no tiene datos aún → CONCURRENTLY falla. Fallback.
    console.warn("[views] CONCURRENTLY falló, uso refresh completo:", err instanceof Error ? err.message : err);
    await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW price_daily_avg");
  }
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.info(`[views] refresh completo en ${elapsed}s`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
