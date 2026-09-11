/**
 * Historial de precios (F010) — lee price_daily_avg + fallback en price_history.
 * Outlier filter: descarta puntos donde avg_price > 3 * mediana del rango.
 */

import { prisma } from "@/lib/db";
import type { HistoryParams, HistoryPoint, HistoryResponse, HistoryStats } from "./schemas";

type RawRow = {
  day: Date;
  avg_price: number;
  min_price: number;
  max_price: number;
  obs_count: number;
};

export async function getHistory(params: HistoryParams): Promise<HistoryResponse | null> {
  const started = Date.now();
  const product = await prisma.product.findFirst({
    where: { slug: params.slug },
    select: { id: true, canonicalId: true },
  });
  if (!product) return null;
  const canonicalId = product.canonicalId ?? product.id;

  const rowsInZone = await prisma.$queryRaw<RawRow[]>`
    SELECT day, avg_price, min_price, max_price, obs_count
    FROM price_daily_avg
    WHERE product_id = ${canonicalId}
      AND zone_slug = ${params.zone}
      AND day > NOW() - (${params.days} || ' days')::interval
    ORDER BY day ASC
  `;
  const rows =
    rowsInZone.length >= 2
      ? rowsInZone
      : await prisma.$queryRaw<RawRow[]>`
          SELECT day, avg_price, min_price, max_price, obs_count
          FROM price_daily_avg
          WHERE product_id = ${canonicalId}
            AND day > NOW() - (${params.days} || ' days')::interval
          ORDER BY day ASC
        `;

  const filtered = filterOutliers(rows);
  const points: HistoryPoint[] = filtered.map((r) => ({
    day: r.day.toISOString().slice(0, 10),
    avgPrice: r.avg_price,
    minPrice: r.min_price,
    maxPrice: r.max_price,
    obsCount: r.obs_count,
  }));

  const stats = computeStats(points);
  return {
    slug: params.slug,
    zone: params.zone,
    days: params.days,
    points,
    stats,
    currency: "ARS",
    ms: Date.now() - started,
  };
}

function filterOutliers(rows: RawRow[]): RawRow[] {
  if (rows.length < 4) return rows;
  const sorted = [...rows].map((r) => r.avg_price).sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
  if (median <= 0) return rows;
  return rows.filter((r) => r.avg_price <= median * 3 && r.avg_price >= median / 3);
}

function computeStats(points: HistoryPoint[]): HistoryStats {
  if (points.length === 0) {
    return { current: null, avg: null, min: null, max: null };
  }
  const current = points[points.length - 1]?.avgPrice ?? null;
  const avg = points.reduce((sum, p) => sum + p.avgPrice, 0) / points.length;

  let minP = points[0]!;
  let maxP = points[0]!;
  for (const p of points) {
    if (p.minPrice < minP.minPrice) minP = p;
    if (p.maxPrice > maxP.maxPrice) maxP = p;
  }
  return {
    current,
    avg,
    min: { price: minP.minPrice, day: minP.day },
    max: { price: maxP.maxPrice, day: maxP.day },
  };
}
