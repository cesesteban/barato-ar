/**
 * Runner específico de Precios Claros (F004).
 * A diferencia de un ChainParser (F003), PCL toca varias cadenas — se registra
 * IngestionRun por cada `chainId` afectado con `source='precios_claros'`.
 */

import * as Sentry from "@sentry/nextjs";
import { prisma } from "@/lib/db";
import { downloadToTemp } from "./downloader";
import { fetchManifest } from "./manifest";
import { ingestSucursales, type Pass1Result } from "./stores";
import { ingestProductos, type Pass2Result } from "./products";
import { ingestPrecios, type Pass3Result } from "./prices";

export type PclRunSummary = {
  status: "success" | "partial" | "failed";
  pass1: Pass1Result;
  pass2: Pass2Result;
  pass3: Pass3Result;
  durationMs: number;
  errorMessage?: string;
};

export async function runPclIngestion(): Promise<PclRunSummary> {
  const startedAt = new Date();
  const rowsInitial: Pass1Result & Pass2Result & Pass3Result = {
    storesUpserted: 0,
    productsUpserted: 0,
    pricesUpserted: 0,
    rowsSkipped: 0,
    rowsDedupedVsFlyer: 0,
    chainIdsTouched: new Set<string>(),
    zoneIdsTouched: new Set<string>(),
  };

  const manifest = await fetchManifest();

  const [sucursalesPath, productosPath, preciosPath] = await Promise.all([
    downloadToTemp(manifest.files.sucursales, "sucursales"),
    downloadToTemp(manifest.files.productos, "productos"),
    downloadToTemp(manifest.files.precios, "precios"),
  ]);

  // Open ONE ingestion run per chain al finalizar; para agnosia de cadena en
  // passes 1-2 usamos un run "meta" temporal en Sentry breadcrumb solamente.
  Sentry.addBreadcrumb({ category: "pcl", message: "manifest fetched", data: { manifest } });

  let pass1: Pass1Result = { storesUpserted: 0, rowsSkipped: 0 };
  let pass2: Pass2Result = { productsUpserted: 0, rowsSkipped: 0 };
  let pass3: Pass3Result = { ...rowsInitial };

  try {
    pass1 = await ingestSucursales(sucursalesPath);
    pass2 = await ingestProductos(productosPath);
    pass3 = await ingestPrecios(preciosPath, manifest.files.precios);
  } catch (err) {
    Sentry.captureException(err, { tags: { pipeline: "pcl" } });
    const finishedAt = new Date();
    await recordPerChainRun(pass3.chainIdsTouched, "failed", pass3.pricesUpserted, pass3.rowsSkipped, err);
    return {
      status: "failed",
      pass1,
      pass2,
      pass3,
      durationMs: finishedAt.getTime() - startedAt.getTime(),
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }

  const finishedAt = new Date();
  const status: "success" | "partial" =
    pass3.rowsSkipped > 0 && pass3.pricesUpserted > 0 ? "partial" : "success";
  await recordPerChainRun(pass3.chainIdsTouched, status, pass3.pricesUpserted, pass3.rowsSkipped);

  return {
    status,
    pass1,
    pass2,
    pass3,
    durationMs: finishedAt.getTime() - startedAt.getTime(),
  };
}

async function recordPerChainRun(
  chainIds: Set<string>,
  status: "success" | "partial" | "failed",
  rowsIngested: number,
  rowsSkipped: number,
  err?: unknown,
) {
  if (chainIds.size === 0) return;
  const errorMessage = err ? (err instanceof Error ? err.message : String(err)) : null;
  for (const chainId of chainIds) {
    await prisma.ingestionRun.create({
      data: {
        chainId,
        source: "precios_claros",
        status,
        finishedAt: new Date(),
        rowsIngested: Math.round(rowsIngested / Math.max(chainIds.size, 1)),
        rowsSkipped: Math.round(rowsSkipped / Math.max(chainIds.size, 1)),
        errorMessage,
      },
    });
  }
}
