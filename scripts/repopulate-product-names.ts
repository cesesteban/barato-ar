/**
 * F020 · Repopula `Product.name` y `Product.brand` de todos los products
 * existentes en Neon aplicando el pipeline de F020 (cleanProductName +
 * cleanBrand + brand-catalog), sin necesidad de re-ingest completo.
 *
 * Usage:
 *   pnpm tsx scripts/repopulate-product-names.ts [--dry-run] [--limit N]
 *
 * Flags:
 *   --dry-run   Solo log deltas, no persiste. Recomendado antes del real.
 *   --limit N   Procesa solo los primeros N products (útil para test).
 *
 * Env required: DATABASE_URL_UNPOOLED (usamos direct connection para batch).
 *
 * Idempotente: si el name/brand ya está limpio, no hace update.
 *
 * Also recalcula `normalized_name` (derivado de name) — crítico para pg_trgm search.
 */

import { PrismaClient } from "@prisma/client";
import { cleanBrand, cleanProductName } from "../src/lib/text-cleanup";
import { normalizeName } from "../src/ingestion/core/normalize";

const BATCH_SIZE = 500;

type Args = {
  dryRun: boolean;
  limit: number | null;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 && args[limitIdx + 1] ? Number(args[limitIdx + 1]) : null;
  return { dryRun, limit };
}

type Counters = {
  processed: number;
  updated: number;
  skipped: number;
  sepaCodesStripped: number;
  chainNamesStripped: number;
  abbrevExpanded: number;
  brandCanonicalized: number;
  brandExtractedFromName: number;
  brandCleared: number;
};

function detectFixes(
  oldName: string,
  newName: string,
  oldBrand: string | null,
  newBrand: string | null,
  c: Counters,
): void {
  if (/BOT-|PCK-|LAT-|PAQ-/i.test(oldName) && !/BOT-|PCK-|LAT-|PAQ-/i.test(newName)) {
    c.sepaCodesStripped++;
  }
  if (/^(carrefour|coto|día|dia|jumbo|vea|disco|la anónima|la anonima|changomas|farmacity)\s/i.test(oldName) &&
      !/^(carrefour|coto|día|dia|jumbo|vea|disco|la anónima|la anonima|changomas|farmacity)\s/i.test(newName)) {
    c.chainNamesStripped++;
  }
  // Detecta expansiones: contamos como abbrevExpanded si length subió (proxy razonable)
  if (newName.length > oldName.length + 3 || / X | C | D /i.test(oldName)) {
    c.abbrevExpanded++;
  }
  if (oldBrand !== newBrand) {
    if (oldBrand == null && newBrand != null) c.brandExtractedFromName++;
    else if (oldBrand != null && newBrand == null) c.brandCleared++;
    else if (oldBrand !== newBrand) c.brandCanonicalized++;
  }
}

async function main() {
  const { dryRun, limit } = parseArgs();
  const p = new PrismaClient();

  console.log(`\n=== F020 · Repopulate product names ===`);
  console.log(`Mode: ${dryRun ? "🧪 DRY-RUN (no writes)" : "⚠️  REAL (writes)"}`);
  console.log(`Limit: ${limit ?? "sin límite"}`);
  console.log("");

  const total = await p.product.count();
  const willProcess = limit ? Math.min(limit, total) : total;
  console.log(`Total en DB: ${total} · procesará: ${willProcess}`);

  const c: Counters = {
    processed: 0,
    updated: 0,
    skipped: 0,
    sepaCodesStripped: 0,
    chainNamesStripped: 0,
    abbrevExpanded: 0,
    brandCanonicalized: 0,
    brandExtractedFromName: 0,
    brandCleared: 0,
  };

  const samples: Array<{ old: string; new: string; oldBrand: string | null; newBrand: string | null }> = [];

  let offset = 0;
  while (offset < willProcess) {
    const take = Math.min(BATCH_SIZE, willProcess - offset);
    const batch = await p.product.findMany({
      skip: offset,
      take,
      orderBy: { id: "asc" },
      select: { id: true, name: true, brand: true },
    });
    if (batch.length === 0) break;

    const updates: Array<{ id: string; name: string; brand: string | null; normalizedName: string }> = [];

    for (const row of batch) {
      c.processed++;
      const newName = cleanProductName(row.name);
      const newBrand = cleanBrand(row.brand, { productName: newName });
      const newNormalized = normalizeName(newName);

      if (newName === row.name && newBrand === row.brand) {
        c.skipped++;
        continue;
      }

      detectFixes(row.name, newName, row.brand, newBrand, c);
      c.updated++;

      // Guarda hasta 10 samples random para el log
      if (samples.length < 10 && Math.random() < 0.05) {
        samples.push({ old: row.name, new: newName, oldBrand: row.brand, newBrand });
      }

      updates.push({ id: row.id, name: newName, brand: newBrand, normalizedName: newNormalized });
    }

    if (updates.length > 0 && !dryRun) {
      await p.$transaction(
        updates.map((u) =>
          p.product.update({
            where: { id: u.id },
            data: {
              name: u.name,
              brand: u.brand,
              normalizedName: u.normalizedName,
            },
          }),
        ),
      );
    }

    offset += take;
    if (c.processed % (BATCH_SIZE * 4) === 0 || offset >= willProcess) {
      console.log(`  progress: ${c.processed}/${willProcess} · updated ${c.updated} · skipped ${c.skipped}`);
    }
  }

  console.log(`\n=== Resumen ===`);
  console.log(`  Total processed:              ${c.processed}`);
  console.log(`  Updated:                      ${c.updated}`);
  console.log(`  Skipped (ya limpio):          ${c.skipped}`);
  console.log(`\n=== Tipos de fix aplicados ===`);
  console.log(`  Códigos SEPA strippedados:    ${c.sepaCodesStripped}`);
  console.log(`  Chain names strippedados:     ${c.chainNamesStripped}`);
  console.log(`  Abbrevs/conectores expandidos: ${c.abbrevExpanded}`);
  console.log(`  Brands canonicalizadas:       ${c.brandCanonicalized}`);
  console.log(`  Brands extraídas del name:    ${c.brandExtractedFromName}`);
  console.log(`  Brands cleared (invalidas):   ${c.brandCleared}`);

  if (samples.length > 0) {
    console.log(`\n=== Samples random (old → new) ===`);
    for (const s of samples) {
      console.log(`  name:  "${s.old}"`);
      console.log(`     →   "${s.new}"`);
      if (s.oldBrand !== s.newBrand) {
        console.log(`  brand: "${s.oldBrand ?? "null"}" → "${s.newBrand ?? "null"}"`);
      }
      console.log("");
    }
  }

  console.log(dryRun ? "🧪 DRY-RUN completado (sin cambios en DB)" : "✅ Repopulation complete");
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
