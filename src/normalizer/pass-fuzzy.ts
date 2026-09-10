/**
 * Pass 2: Fuzzy match sobre productos sin canonical (F005).
 * Compara pares dentro del mismo `(standardUnit, standardSize)` bucket para
 * mantener O(n) por bucket; sin buckets sería O(n²).
 * >= 0.90 → auto-merge inmediato
 * 0.60-0.89 → upsert NormalizerCandidate para revisión manual
 * < 0.60 → ignora
 */

import { prisma } from "@/lib/db";
import type { Product } from "@prisma/client";
import { scoreMatch } from "./matcher";
import { mergeProducts } from "./merger";

export type FuzzyPassResult = {
  autoMerged: number;
  candidatesUpserted: number;
  compared: number;
};

export async function runFuzzyPass(): Promise<FuzzyPassResult> {
  const result: FuzzyPassResult = { autoMerged: 0, candidatesUpserted: 0, compared: 0 };

  // Sólo productos sin canonical, agrupados por bucket de tamaño/unidad.
  const products = await prisma.product.findMany({
    where: { canonicalId: null, standardSize: { not: null }, standardUnit: { not: null } },
    orderBy: [{ standardUnit: "asc" }, { standardSize: "asc" }, { createdAt: "asc" }],
  });

  const rejects = await loadRejects();

  const buckets = new Map<string, Product[]>();
  for (const p of products) {
    const key = `${p.standardUnit}:${p.standardSize?.toString() ?? "?"}`;
    const arr = buckets.get(key) ?? [];
    arr.push(p);
    buckets.set(key, arr);
  }

  for (const [, group] of buckets) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i++) {
      const a = group[i]!;
      // Si `a` ya fue asignado un canonical durante esta pass, salteamos.
      if (a.canonicalId) continue;
      for (let j = i + 1; j < group.length; j++) {
        const b = group[j]!;
        if (b.canonicalId) continue;
        if (rejects.has(rejectKey(a.id, b.id))) continue;

        result.compared++;
        const { confidence, bucket, features } = scoreMatch(a, b);
        if (bucket === "auto") {
          const { canonicalId } = await mergeProducts(a, b);
          // Reflejar en la copia local para que las iteraciones siguientes
          // consideren el nuevo canonical.
          a.canonicalId = canonicalId;
          b.canonicalId = canonicalId;
          result.autoMerged++;
          break;
        }
        if (bucket === "manual") {
          await upsertCandidate(a.id, b.id, confidence, features);
          result.candidatesUpserted++;
        }
      }
    }
  }

  return result;
}

async function loadRejects(): Promise<Set<string>> {
  const rows = await prisma.normalizerReject.findMany({
    select: { productAId: true, productBId: true },
  });
  return new Set(rows.map((r) => rejectKey(r.productAId, r.productBId)));
}

function rejectKey(a: string, b: string): string {
  return a < b ? `${a}::${b}` : `${b}::${a}`;
}

async function upsertCandidate(a: string, b: string, confidence: number, features: unknown) {
  // Orden estable para el unique compound.
  const [x, y] = a < b ? [a, b] : [b, a];
  await prisma.normalizerCandidate.upsert({
    where: { productAId_productBId: { productAId: x, productBId: y } },
    update: { confidence, features: features as never, status: "pending" },
    create: {
      productAId: x,
      productBId: y,
      confidence,
      features: features as never,
      status: "pending",
    },
  });
}
