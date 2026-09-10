#!/usr/bin/env node
/**
 * CLI de ingesta: `pnpm ingest <chain>` [--dry-run] [--limit N].
 */

import { Command } from "commander";
import { runIngestion } from "./runner";
import { getChainParser } from "../chains";
import { prisma } from "@/lib/db";

const program = new Command();

program
  .name("ingest")
  .description("Ejecuta la ingesta semanal de un folleto de supermercado")
  .argument("<chain>", "slug de la cadena (carrefour, coto, dia, jumbo, pcl)")
  .option("--dry-run", "no persiste; solo cuenta rows")
  .option("--store <id>", "storeId a asociar (default: sucursal virtual de la cadena)")
  .option("--zone <slug>", "zona afectada para revalidate", (v, prev: string[]) => [...prev, v], [] as string[])
  .action(async (chainSlug: string, options: { dryRun?: boolean; store?: string; zone: string[] }) => {
    const parser = await getChainParser(chainSlug);
    if (!parser) {
      console.error(`No hay parser para "${chainSlug}"`);
      process.exit(1);
    }

    const storeId = options.store ?? (await resolveDefaultStoreId(chainSlug));
    if (!storeId) {
      console.error(`No hay Store virtual para "${chainSlug}" — corré 'pnpm db:seed' primero`);
      process.exit(1);
    }

    console.info(`[ingest] chain=${chainSlug} store=${storeId} dryRun=${!!options.dryRun}`);
    const started = Date.now();
    const summary = await runIngestion({
      parser,
      source: "flyer",
      storeId,
      affectedZones: options.zone,
      dryRun: options.dryRun ?? false,
    });
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);
    console.info(
      `[ingest] status=${summary.status} rows=${summary.rowsIngested} skipped=${summary.rowsSkipped} elapsed=${elapsed}s`,
    );
    if (summary.errorMessage) console.error(`[ingest] error: ${summary.errorMessage}`);
    process.exit(summary.status === "failed" ? 1 : 0);
  });

async function resolveDefaultStoreId(chainSlug: string): Promise<string | null> {
  const chain = await prisma.chain.findUnique({ where: { slug: chainSlug } });
  if (!chain) return null;
  const store = await prisma.store.findFirst({
    where: { chainId: chain.id, isVirtual: true },
    orderBy: { createdAt: "asc" },
  });
  return store?.id ?? null;
}

program.parseAsync(process.argv).catch((err) => {
  console.error(err);
  process.exit(1);
});
