/**
 * Runner de ingesta (F003).
 * - Orquesta fetch + parse + idempotent upsert.
 * - Registra IngestionRun con status y métricas.
 * - Alerta Sentry si delta vs corrida anterior < 0.8 (US4).
 * - Post-run: llama revalidateAfterIngest (C-008).
 */

import { prisma } from "@/lib/db";
import * as Sentry from "@sentry/nextjs";
import { appendPriceHistory, upsertPriceFromItem, upsertProductFromItem } from "./idempotency";
import { revalidateAfterIngest } from "./revalidate";
import type { ChainParser, ParserRunSummary } from "./types";

export type RunOptions = {
  parser: ChainParser;
  source: "flyer" | "precios_claros" | "public_api" | "crowdsourced" | "scraped";
  storeId: string;                     // MVP: sucursal virtual por cadena (F003 · Fase 2)
  affectedZones?: string[];
  dryRun?: boolean;
};

const CHAIN_DROP_THRESHOLD = 0.8;

export async function runIngestion(opts: RunOptions): Promise<ParserRunSummary> {
  const { parser, source, storeId, affectedZones = [], dryRun } = opts;
  const startedAt = new Date();

  const run = await prisma.ingestionRun.create({
    data: { chainId: parser.chainId, source, status: "running", startedAt, metadata: { dryRun: !!dryRun } },
  });

  let rowsIngested = 0;
  let rowsSkipped = 0;
  let fetched: Awaited<ReturnType<ChainParser["fetch"]>>;

  try {
    fetched = await parser.fetch();
  } catch (err) {
    return finalizeRun(run.id, { status: "failed", rowsIngested, rowsSkipped, error: err, startedAt });
  }

  const ctx = {
    db: prisma,
    chainId: parser.chainId,
    storeId,
    source,
    runId: run.id,
    capturedAt: fetched.capturedAt,
  };

  try {
    for await (const item of parser.parse(fetched.raw, fetched.sourceUrl)) {
      try {
        if (!Number.isFinite(item.price) || item.price < 0 || !item.productName?.trim()) {
          rowsSkipped++;
          continue;
        }
        if (dryRun) {
          rowsIngested++;
          continue;
        }
        const product = await upsertProductFromItem(ctx, item);
        await upsertPriceFromItem(ctx, product, item);
        if (item.price > 0) await appendPriceHistory(ctx, product, item.price);
        rowsIngested++;
      } catch (itemErr) {
        rowsSkipped++;
        Sentry.captureException(itemErr, {
          tags: { runId: run.id, chainId: parser.chainId },
          extra: { item },
        });
      }
    }
  } catch (err) {
    return finalizeRun(run.id, {
      status: rowsIngested > 0 ? "partial" : "failed",
      rowsIngested,
      rowsSkipped,
      error: err,
      startedAt,
    });
  }

  const status: "success" | "partial" = rowsSkipped > 0 && rowsIngested > 0 ? "partial" : "success";
  await checkDropThreshold(parser.chainId, source, rowsIngested);
  const summary = await finalizeRun(run.id, { status, rowsIngested, rowsSkipped, startedAt });

  if (!dryRun && rowsIngested > 0) {
    await revalidateAfterIngest(parser.chainId, affectedZones);
  }
  return summary;
}

async function finalizeRun(
  runId: string,
  args: {
    status: "success" | "partial" | "failed";
    rowsIngested: number;
    rowsSkipped: number;
    error?: unknown;
    startedAt: Date;
  },
): Promise<ParserRunSummary> {
  const finishedAt = new Date();
  const errorMessage = args.error
    ? args.error instanceof Error
      ? args.error.message
      : String(args.error)
    : undefined;

  if (args.error) {
    Sentry.captureException(args.error, { tags: { runId } });
  }

  await prisma.ingestionRun.update({
    where: { id: runId },
    data: {
      status: args.status,
      rowsIngested: args.rowsIngested,
      rowsSkipped: args.rowsSkipped,
      finishedAt,
      errorMessage: errorMessage ?? null,
    },
  });

  const summary: ParserRunSummary = {
    runId,
    rowsIngested: args.rowsIngested,
    rowsSkipped: args.rowsSkipped,
    status: args.status,
    durationMs: finishedAt.getTime() - args.startedAt.getTime(),
  };
  if (errorMessage !== undefined) summary.errorMessage = errorMessage;
  return summary;
}

async function checkDropThreshold(chainId: string, source: string, rowsIngested: number) {
  const previous = await prisma.ingestionRun.findFirst({
    where: {
      chainId,
      source: source as "flyer" | "precios_claros" | "public_api" | "crowdsourced" | "scraped",
      status: { in: ["success", "partial"] },
    },
    orderBy: { finishedAt: "desc" },
    skip: 1, // salteamos la corrida actual
  });
  if (!previous || previous.rowsIngested === 0) return;
  const ratio = rowsIngested / previous.rowsIngested;
  if (ratio < CHAIN_DROP_THRESHOLD) {
    Sentry.captureMessage("ingestion_rows_drop", {
      level: "warning",
      tags: { chainId, source },
      extra: {
        previous: previous.rowsIngested,
        current: rowsIngested,
        ratio: Number(ratio.toFixed(3)),
      },
    });
  }
}
