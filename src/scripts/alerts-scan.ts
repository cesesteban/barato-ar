#!/usr/bin/env node
/**
 * Cron horario que dispara notificaciones (F009 US2).
 * `pnpm alerts:scan`
 */

import { scanAndNotify } from "@/server/alerts/service";
import { prisma } from "@/lib/db";

async function main() {
  const started = Date.now();
  const result = await scanAndNotify();
  const elapsed = ((Date.now() - started) / 1000).toFixed(1);
  console.info(`[alerts:scan] triggered=${result.triggered} skipped=${result.skipped} elapsed=${elapsed}s`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
