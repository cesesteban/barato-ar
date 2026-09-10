/**
 * Entry point del normalizer (F005).
 * Se llama post-ingesta desde el runner de F003/F004, y también como cron
 * semanal via `pnpm normalize:full`.
 */

import { prisma } from "@/lib/db";
import { runEanPass } from "./pass-ean";
import { runFuzzyPass } from "./pass-fuzzy";
import { mergeProducts } from "./merger";

export type NormalizeResult = {
  eanMerged: number;
  fuzzyAutoMerged: number;
  candidatesUpserted: number;
  fuzzyCompared: number;
};

export async function runNormalizer(): Promise<NormalizeResult> {
  const ean = await runEanPass();
  const fuzzy = await runFuzzyPass();
  return {
    eanMerged: ean.merged,
    fuzzyAutoMerged: fuzzy.autoMerged,
    candidatesUpserted: fuzzy.candidatesUpserted,
    fuzzyCompared: fuzzy.compared,
  };
}

export type ApproveResult = { canonicalId: string; aliasId: string };

export async function approveCandidate(candidateId: string, decidedBy: string): Promise<ApproveResult> {
  const c = await prisma.normalizerCandidate.findUnique({ where: { id: candidateId } });
  if (!c) throw new Error("Candidate not found");
  if (c.status !== "pending") throw new Error(`Candidate already ${c.status}`);

  const [a, b] = await Promise.all([
    prisma.product.findUnique({ where: { id: c.productAId } }),
    prisma.product.findUnique({ where: { id: c.productBId } }),
  ]);
  if (!a || !b) throw new Error("Product not found");
  const merge = await mergeProducts(a, b);
  await prisma.normalizerCandidate.update({
    where: { id: candidateId },
    data: { status: "approved", decidedBy, decidedAt: new Date() },
  });
  return merge;
}

export async function rejectCandidate(
  candidateId: string,
  decidedBy: string,
  reason?: string,
): Promise<void> {
  const c = await prisma.normalizerCandidate.findUnique({ where: { id: candidateId } });
  if (!c) throw new Error("Candidate not found");
  if (c.status !== "pending") throw new Error(`Candidate already ${c.status}`);

  await prisma.$transaction([
    prisma.normalizerCandidate.update({
      where: { id: candidateId },
      data: { status: "rejected", decidedBy, decidedAt: new Date() },
    }),
    prisma.normalizerReject.upsert({
      where: {
        productAId_productBId: { productAId: c.productAId, productBId: c.productBId },
      },
      update: { reason: reason ?? null, rejectedBy: decidedBy, rejectedAt: new Date() },
      create: {
        productAId: c.productAId,
        productBId: c.productBId,
        reason: reason ?? null,
        rejectedBy: decidedBy,
      },
    }),
  ]);
}
