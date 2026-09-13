/**
 * Ranking SQL para /api/offers (F008).
 * DISTINCT ON (product_id, store_id) → precio más reciente por par.
 * Score: 0.6 · discount + 0.2 · freshness + 0.2 · popularity(cache).
 * Cursor: (score, id) — orden estrictamente descendente para paginar.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decodeCursor } from "@/lib/cursor";
import type { OffersParams } from "./schemas";

type RawRow = {
  id: string;
  product_id: string;
  product_slug: string;
  product_name: string;
  product_brand: string | null;
  product_image_url: string | null;
  standard_unit: string | null;
  standard_size: string | null;
  chain_slug: string;
  chain_name: string;
  store_id: string;
  store_name: string;
  zone_id: string | null;
  store_lat: number | null;
  store_lng: number | null;
  is_virtual: boolean;
  price: string;
  previous_price: string | null;
  discount_pct: number | null;
  price_per_unit: string | null;
  price_per_unit_eff: string | null;
  promo_type: string;
  promo_buy_qty: number | null;
  promo_pay_qty: number | null;
  promo_second_discount_pct: number | null;
  valid_to: Date | null;
  captured_at: Date;
  upvotes_cache: number;
  score: number;
};

export async function fetchOffers(params: OffersParams, zoneCenter?: { lat: number; lng: number } | null): Promise<RawRow[]> {
  const cursor = decodeCursor(params.cursor);
  const validityInterval = validityIntervalDays(params.validity);
  const chainFilter = params.chains.length > 0 ? Prisma.sql`AND c.slug = ANY(${params.chains}::text[])` : Prisma.empty;
  const verticalFilter = params.vertical ? Prisma.sql`AND c.vertical::text = ${params.vertical}` : Prisma.empty;
  const cursorFilter = cursor
    ? Prisma.sql`AND (score, id) < (${cursor.score}, ${cursor.id})`
    : Prisma.empty;

  const orderBy = orderClause(params.sort);

  const rows = await prisma.$queryRaw<RawRow[]>(Prisma.sql`
    WITH latest AS (
      SELECT DISTINCT ON (pr.product_id, pr.store_id)
        pr.id, pr.product_id, pr.store_id, pr.price, pr.previous_price,
        pr.discount_pct, pr.price_per_unit, pr.price_per_unit_eff,
        pr.promo_type::text AS promo_type, pr.promo_buy_qty, pr.promo_pay_qty,
        pr.promo_second_discount_pct, pr.valid_to, pr.captured_at,
        pr.upvotes_cache
      FROM prices pr
      WHERE pr.captured_at > NOW() - INTERVAL '14 days'
        AND pr.price > 0
        AND (pr.valid_to IS NULL OR pr.valid_to > NOW())
      ORDER BY pr.product_id, pr.store_id, pr.captured_at DESC
    ),
    per_product AS (
      SELECT
        l.product_id,
        MIN(l.price) AS min_price,
        AVG(l.price) AS avg_price,
        COUNT(DISTINCT s.chain_id) AS chain_count
      FROM latest l
      JOIN stores s ON s.id = l.store_id
      GROUP BY l.product_id
    ),
    dedup AS (
      SELECT DISTINCT ON (l.product_id) l.*, pp.avg_price, pp.chain_count
      FROM latest l
      JOIN per_product pp ON pp.product_id = l.product_id
      WHERE (
        ${params.onlyBestPerProduct}::boolean = false
        OR l.price = pp.min_price
      )
      AND pp.chain_count >= ${params.minChainCount}
      ORDER BY l.product_id, l.captured_at DESC, l.store_id
    ),
    filtered AS (
      SELECT
        d.id, d.product_id, d.store_id, d.price, d.previous_price,
        COALESCE(
          d.discount_pct,
          CASE
            WHEN d.avg_price > d.price AND d.chain_count >= 2
            THEN ROUND(((d.avg_price - d.price) / d.avg_price * 100)::numeric, 1)::float
            ELSE NULL
          END
        )::float AS discount_pct,
        d.price_per_unit, d.price_per_unit_eff,
        d.promo_type, d.promo_buy_qty, d.promo_pay_qty,
        d.promo_second_discount_pct, d.valid_to, d.captured_at, d.upvotes_cache,
        p.slug AS product_slug, p.name AS product_name, p.brand AS product_brand,
        p.image_url AS product_image_url,
        p.standard_unit,
        p.standard_size::text AS standard_size,
        s.name AS store_name, s.zone_id, s.lat AS store_lat, s.lng AS store_lng,
        s.is_virtual, c.slug AS chain_slug, c.name AS chain_name,
        (
          COALESCE(
            d.discount_pct,
            CASE WHEN d.avg_price > d.price AND d.chain_count >= 2
              THEN (d.avg_price - d.price) / d.avg_price * 100
              ELSE 0
            END
          ) * 0.6 / 100.0
          + GREATEST(0.0, (7.0 - EXTRACT(EPOCH FROM (NOW() - d.captured_at)) / 86400.0)) * 0.05
          + LEAST(d.upvotes_cache::float / 100.0, 1.0) * 0.2
          + CASE WHEN s.zone_id = ${params.zone} THEN 0.15 ELSE 0 END
          + LEAST(d.chain_count::float / 5.0, 1.0) * 0.15
        ) AS score
      FROM dedup d
      JOIN products p ON p.id = d.product_id AND p.canonical_id IS NULL
      JOIN stores s ON s.id = d.store_id
      JOIN chains c ON c.id = s.chain_id
      WHERE (d.valid_to IS NULL OR d.valid_to > NOW() - INTERVAL '${Prisma.raw(String(validityInterval))} days')
        AND (
          s.zone_id = ${params.zone}
          OR s.is_virtual = true
          OR (
            ${params.includeNearby}::boolean AND
            s.lat IS NOT NULL AND s.lng IS NOT NULL
            AND ${zoneCenter?.lat ?? null}::float IS NOT NULL
            AND ${zoneCenter?.lng ?? null}::float IS NOT NULL
            -- Bounding box aproximado (haversine sería más preciso pero requiere
            -- extension o UDF). 1° lat ≈ 111km; 1° lng en Buenos Aires ≈ 92km.
            -- Sobre-incluye ~20% que después JS filtra si es necesario.
            AND ABS(s.lat - ${zoneCenter?.lat ?? 0}::float) < (${params.maxDistanceKm}::float / 111.0)
            AND ABS(s.lng - ${zoneCenter?.lng ?? 0}::float) < (${params.maxDistanceKm}::float / 92.0)
          )
        )
        ${chainFilter}
        ${verticalFilter}
    )
    SELECT * FROM filtered
    WHERE COALESCE(discount_pct, 0) >= ${params.minDiscount}
    ${cursorFilter}
    ${orderBy}
    LIMIT ${params.limit + 1}
  `);
  return rows;
}

function validityIntervalDays(validity: "today" | "week" | "month"): number {
  if (validity === "today") return 0;
  if (validity === "week") return 7;
  return 30;
}

function orderClause(sort: "discount" | "new" | "popular" | "price_unit") {
  if (sort === "new") return Prisma.sql`ORDER BY captured_at DESC, id DESC`;
  if (sort === "popular") return Prisma.sql`ORDER BY upvotes_cache DESC, score DESC, id DESC`;
  if (sort === "price_unit") return Prisma.sql`ORDER BY price_per_unit_eff ASC NULLS LAST, id DESC`;
  return Prisma.sql`ORDER BY score DESC, id DESC`;
}

/**
 * Facets: cadenas + verticales con precios activos.
 */
export async function fetchFacets(params: OffersParams): Promise<{
  chains: Array<{ slug: string; name: string; count: number }>;
  verticals: Array<{ slug: string; count: number }>;
}> {
  const chainsPromise = prisma.$queryRaw<Array<{ slug: string; name: string; count: bigint }>>`
    SELECT c.slug, c.name, COUNT(DISTINCT (pr.product_id, pr.store_id))::bigint AS count
    FROM prices pr
    JOIN stores s ON s.id = pr.store_id
    JOIN chains c ON c.id = s.chain_id
    WHERE pr.captured_at > NOW() - INTERVAL '14 days'
      AND pr.price > 0
      AND (pr.valid_to IS NULL OR pr.valid_to > NOW())
      AND (s.zone_id = ${params.zone} OR s.is_virtual = true)
    GROUP BY c.slug, c.name
    ORDER BY count DESC
  `;
  const verticalsPromise = prisma.$queryRaw<Array<{ slug: string; count: bigint }>>`
    SELECT c.vertical::text AS slug, COUNT(DISTINCT (pr.product_id, pr.store_id))::bigint AS count
    FROM prices pr
    JOIN stores s ON s.id = pr.store_id
    JOIN chains c ON c.id = s.chain_id
    WHERE pr.captured_at > NOW() - INTERVAL '14 days'
      AND pr.price > 0
      AND (pr.valid_to IS NULL OR pr.valid_to > NOW())
      AND (s.zone_id = ${params.zone} OR s.is_virtual = true)
    GROUP BY c.vertical
    ORDER BY count DESC
  `;
  const [chains, verticals] = await Promise.all([chainsPromise, verticalsPromise]);
  return {
    chains: chains.map((r) => ({ slug: r.slug, name: r.name, count: Number(r.count) })),
    verticals: verticals.map((r) => ({ slug: r.slug, count: Number(r.count) })),
  };
}
