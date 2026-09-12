/**
 * Runner de Precios Claros (SEPA) — F004 v2 (data real).
 *
 * Descarga el snapshot diario del dataset SEPA (una carpeta con N zips
 * anidados por comercio), extrae, y por cada zip conocido corre:
 *   Pass 1: sucursales.csv → upsert Store (con lat/lng, filtrado GBA)
 *   Pass 2: productos.csv  → upsert Product por EAN + insert Price
 *
 * Un mismo comercio puede tener múltiples banderas (Cencosud: Vea/Disco/Jumbo)
 * — el runner cuenta con `chainIdsTouched` acumulado entre passes para
 * registrar un IngestionRun por cadena.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "@/lib/db";
import {
  downloadAndExtractSnapshot,
  cleanupSnapshot,
  type ExtractedCommerce,
  type ExtractedSnapshot,
} from "./extractor";
import { ingestSucursales, type Pass1Result, type StoreCache } from "./stores";
import { ingestProductos, type Pass2Result } from "./products";
import { revalidateAfterIngest } from "../core/revalidate";

export type PclRunSummary = {
  status: "success" | "partial" | "failed";
  commercesProcessed: number;
  commercesSkipped: number;
  storesUpserted: number;
  productsUpserted: number;
  pricesUpserted: number;
  rowsSkipped: number;
  chainIdsTouched: string[];
  durationMs: number;
  errorMessage?: string;
};

export async function runPclIngestion(): Promise<PclRunSummary> {
  const startedAt = new Date();
  let snapshot: ExtractedSnapshot | null = null;

  const summary: PclRunSummary = {
    status: "success",
    commercesProcessed: 0,
    commercesSkipped: 0,
    storesUpserted: 0,
    productsUpserted: 0,
    pricesUpserted: 0,
    rowsSkipped: 0,
    chainIdsTouched: [],
    durationMs: 0,
  };

  try {
    console.info("[pcl] descargando snapshot diario…");
    snapshot = await downloadAndExtractSnapshot();
    console.info(`[pcl] snapshot listo (${snapshot.commerces.length} comercios) source=${snapshot.sourceUrl}`);

    const zoneIdsTouched = new Set<string>();
    const chainIdsTouched = new Set<string>();

    for (const commerce of snapshot.commerces) {
      const outcome = await processCommerce(commerce, snapshot.sourceUrl);
      if (outcome == null) {
        summary.commercesSkipped++;
        continue;
      }
      summary.commercesProcessed++;
      summary.storesUpserted += outcome.pass1.storesUpserted;
      summary.productsUpserted += outcome.pass2.productsUpserted;
      summary.pricesUpserted += outcome.pass2.pricesUpserted;
      summary.rowsSkipped += outcome.pass1.rowsSkipped + outcome.pass2.rowsSkipped;
      for (const c of outcome.pass2.chainIdsTouched) chainIdsTouched.add(c);
      for (const z of outcome.pass2.zoneIdsTouched) zoneIdsTouched.add(z);
    }

    summary.chainIdsTouched = [...chainIdsTouched];
    summary.status = summary.pricesUpserted > 0 ? (summary.rowsSkipped > 0 ? "partial" : "success") : "failed";

    if (summary.pricesUpserted > 0) {
      for (const chainId of chainIdsTouched) {
        await revalidateAfterIngest(chainId, [...zoneIdsTouched]);
      }
    }

    await recordPerChainRun(
      chainIdsTouched,
      summary.status,
      summary.pricesUpserted,
      summary.rowsSkipped,
    );
  } catch (err) {
    void reportSentry(err);
    summary.status = "failed";
    summary.errorMessage = err instanceof Error ? err.message : String(err);
    console.error("[pcl] fatal:", err);
  } finally {
    summary.durationMs = Date.now() - startedAt.getTime();
    if (snapshot) cleanupSnapshot(snapshot);
  }

  return summary;
}

type CommerceOutcome = {
  pass1: Pass1Result;
  pass2: Pass2Result;
};

async function processCommerce(
  commerce: ExtractedCommerce,
  sourceUrl: string,
): Promise<CommerceOutcome | null> {
  const sucursalesPath = join(commerce.dir, "sucursales.csv");
  const productosPath = join(commerce.dir, "productos.csv");
  if (!existsSync(sucursalesPath) || !existsSync(productosPath)) {
    console.warn(`[pcl] skip ${commerce.fileName}: CSVs faltantes`);
    return null;
  }

  console.info(`[pcl] procesando ${commerce.fileName}…`);

  const pass1 = await ingestSucursales(sucursalesPath);
  if (pass1.storesUpserted === 0) {
    console.info(`[pcl]   ${commerce.fileName}: 0 stores tras filtro (comercio no mapeado o fuera de GBA)`);
    return { pass1, pass2: emptyPass2() };
  }

  const pass2 = await ingestProductos(productosPath, pass1.storeCache, commerce.sourceDate, sourceUrl);
  console.info(
    `[pcl]   ${commerce.fileName}: stores=${pass1.storesUpserted} products=${pass2.productsUpserted} prices=${pass2.pricesUpserted} skipped=${pass1.rowsSkipped + pass2.rowsSkipped}`,
  );
  return { pass1, pass2 };
}

function emptyPass2(): Pass2Result {
  return {
    productsUpserted: 0,
    pricesUpserted: 0,
    rowsSkipped: 0,
    chainIdsTouched: new Set<string>(),
    zoneIdsTouched: new Set<string>(),
  };
}

async function recordPerChainRun(
  chainIds: Set<string>,
  status: "success" | "partial" | "failed",
  rowsIngested: number,
  rowsSkipped: number,
) {
  if (chainIds.size === 0) return;
  const share = Math.max(chainIds.size, 1);
  for (const chainId of chainIds) {
    await prisma.ingestionRun.create({
      data: {
        chainId,
        source: "precios_claros",
        status,
        finishedAt: new Date(),
        rowsIngested: Math.round(rowsIngested / share),
        rowsSkipped: Math.round(rowsSkipped / share),
      },
    });
  }
}

async function reportSentry(err: unknown): Promise<void> {
  try {
    const mod = await import("@sentry/nextjs");
    const capture = (mod as { captureException?: (e: unknown, opts?: unknown) => void }).captureException;
    if (typeof capture === "function") {
      capture(err, { tags: { pipeline: "pcl" } });
    }
  } catch {
    // Sentry no disponible fuera del runtime Next — best effort.
  }
}

// Utilidad para futura suppresión de `StoreCache` unused warning
export type { StoreCache };
