#!/usr/bin/env node
/**
 * Purga PII/foto de reports viejos (F011).
 * - `photoUrl` de reports `rejected` con `createdAt > 30d` → null + purgedAt.
 * - `ipHash` de todos los reports con `createdAt > 90d` → null.
 */

import { prisma } from "@/lib/db";

async function main() {
  const now = Date.now();
  const cutoff30d = new Date(now - 30 * 24 * 3600 * 1000);
  const cutoff90d = new Date(now - 90 * 24 * 3600 * 1000);

  const photoPurge = await prisma.report.updateMany({
    where: { status: "rejected", createdAt: { lt: cutoff30d }, photoUrl: { not: null } },
    data: { photoUrl: null, photoBlobKey: null, purgedAt: new Date() },
  });
  const ipPurge = await prisma.report.updateMany({
    where: { createdAt: { lt: cutoff90d }, ipHash: { not: "" } },
    data: { ipHash: "" },
  });

  console.info(
    `[reports:purge] photos purged=${photoPurge.count} ipHashes purged=${ipPurge.count}`,
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
