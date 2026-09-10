/**
 * Score de match entre dos productos (F005).
 * Threshold: >= 0.90 auto-merge, 0.60-0.89 cola manual, < 0.60 ignore.
 */

import type { Product } from "@prisma/client";
import { detectPackagingConflictText, jaroWinkler, type MatchFeatures } from "./features";

export const AUTO_MERGE_THRESHOLD = 0.9;
export const MANUAL_QUEUE_THRESHOLD = 0.6;

export type ScoreResult = {
  confidence: number;
  bucket: "auto" | "manual" | "ignore";
  features: MatchFeatures;
};

export function scoreMatch(a: Product, b: Product): ScoreResult {
  const nameSim = jaroWinkler(a.normalizedName, b.normalizedName);
  const brandSim =
    a.brand && b.brand
      ? jaroWinkler(a.brand.toLowerCase(), b.brand.toLowerCase())
      : a.brand === b.brand
        ? 1
        : 0;

  const sameStdSize =
    a.standardSize != null &&
    b.standardSize != null &&
    Number(a.standardSize) === Number(b.standardSize);
  const sameStdUnit = a.standardUnit === b.standardUnit;
  const sizeMatch = sameStdSize && sameStdUnit;

  const packagingConflict =
    (a.packagingFlag && b.packagingFlag && a.packagingFlag !== b.packagingFlag) ||
    detectPackagingConflictText(a.name, b.name);

  const features: MatchFeatures = {
    eanMatch: a.eanCode && b.eanCode ? a.eanCode === b.eanCode : null,
    nameSim,
    brandSim,
    sizeMatch,
    unitMatch: sameStdUnit,
    packagingConflict: !!packagingConflict,
  };

  if (packagingConflict) {
    return { confidence: 0, bucket: "ignore", features };
  }
  if (!sizeMatch) {
    // Sin match de tamaño, la similitud del nombre pesa poco.
    return { confidence: 0.2 * nameSim, bucket: "ignore", features };
  }

  const W_NAME = 0.5;
  const W_BRAND = 0.3;
  const W_SIZE = 0.2;
  const confidence = W_NAME * nameSim + W_BRAND * brandSim + W_SIZE * 1;

  const bucket: ScoreResult["bucket"] =
    confidence >= AUTO_MERGE_THRESHOLD
      ? "auto"
      : confidence >= MANUAL_QUEUE_THRESHOLD
        ? "manual"
        : "ignore";
  return { confidence, bucket, features };
}
