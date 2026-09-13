/**
 * Fetch de la comparación de precios para /producto/[slug] (F007).
 * Prisma raw para la query central; distancias calculadas en JS a partir
 * de las coordenadas del store y el centroide de la zona (poblados por F004).
 */

import { prisma } from "@/lib/db";
import type { ComparisonStoreRow, ComparisonView, Proximity } from "./types";

export type GetComparisonParams = {
  slug: string;
  zoneSlug: string;
  includeNearby?: boolean;
  nearbyRadiusKm?: number;
};

type LatestPriceRow = {
  id: string;
  store_id: string;
  store_name: string;
  address: string | null;
  chain_slug: string;
  chain_name: string;
  zone_id: string | null;
  store_lat: number | null;
  store_lng: number | null;
  is_virtual: boolean;
  price: string;
  previous_price: string | null;
  discount_pct: number | null;
  captured_at: Date;
  valid_to: Date | null;
  source: string;
  store_product_url: string | null;
  promo_type: string;
  promo_buy_qty: number | null;
  promo_pay_qty: number | null;
  promo_second_discount_pct: number | null;
  price_per_unit: string | null;
  price_per_unit_eff: string | null;
};

// Defaults ajustados para AMBA: barrios CABA son ~3km pero municipios GBA
// ~10-15km. 10 captura el municipio propio + el vecino inmediato sin ser ruido.
const DEFAULT_NEARBY_RADIUS_KM = 10;
// Cap para el bucket "nacional": stores más lejos que esto son irrelevantes
// para el usuario a menos que sean virtual (delivery online).
const REGIONAL_MAX_KM = 30;

export async function getComparison(params: GetComparisonParams): Promise<ComparisonView | null> {
  const { slug, zoneSlug, includeNearby = true, nearbyRadiusKm = DEFAULT_NEARBY_RADIUS_KM } = params;

  const product = await prisma.product.findFirst({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      brand: true,
      imageUrl: true,
      eanCode: true,
      size: true,
      unit: true,
      standardSize: true,
      standardUnit: true,
      packagingFlag: true,
      canonicalId: true,
    },
  });
  if (!product) return null;

  const canonicalId = product.canonicalId ?? product.id;

  const zone = await prisma.zone.findFirst({
    where: { OR: [{ id: zoneSlug }, { slug: zoneSlug }] },
    select: { id: true, lat: true, lng: true },
  });

  const rows = await prisma.$queryRaw<LatestPriceRow[]>`
    SELECT DISTINCT ON (pr.store_id)
      pr.id,
      pr.store_id,
      s.name AS store_name,
      s.address,
      c.slug AS chain_slug,
      c.name AS chain_name,
      s.zone_id,
      s.lat AS store_lat,
      s.lng AS store_lng,
      s.is_virtual,
      pr.price::text AS price,
      pr.previous_price::text AS previous_price,
      pr.discount_pct,
      pr.captured_at,
      pr.valid_to,
      pr.source::text AS source,
      pr.store_product_url,
      pr.promo_type::text AS promo_type,
      pr.promo_buy_qty,
      pr.promo_pay_qty,
      pr.promo_second_discount_pct,
      pr.price_per_unit::text AS price_per_unit,
      pr.price_per_unit_eff::text AS price_per_unit_eff
    FROM prices pr
    JOIN products p ON p.id = pr.product_id
    JOIN stores s ON s.id = pr.store_id
    JOIN chains c ON c.id = s.chain_id
    WHERE (p.id = ${canonicalId} OR p.canonical_id = ${canonicalId})
      AND pr.captured_at > NOW() - INTERVAL '14 days'
      AND pr.price > 0
      AND (pr.valid_to IS NULL OR pr.valid_to > NOW())
    ORDER BY pr.store_id, pr.captured_at DESC
  `;

  const stores: { inZone: ComparisonStoreRow[]; nearby: ComparisonStoreRow[]; national: ComparisonStoreRow[] } = {
    inZone: [],
    nearby: [],
    national: [],
  };

  for (const r of rows) {
    const price = Number(r.price);
    const previousPrice = r.previous_price != null ? Number(r.previous_price) : null;
    const distanceKm = computeDistance(r.store_lat, r.store_lng, zone?.lat, zone?.lng);
    const proximity: Proximity = r.is_virtual
      ? "national"
      : r.zone_id === zone?.id
        ? "in_zone"
        : distanceKm !== null && distanceKm <= nearbyRadiusKm
          ? "nearby"
          : "national";

    const row: ComparisonStoreRow = {
      storeId: r.store_id,
      storeName: r.store_name,
      address: r.address,
      chainSlug: r.chain_slug,
      chainName: r.chain_name,
      price,
      previousPrice,
      discountPct: r.discount_pct,
      pricePerUnit: r.price_per_unit != null ? Number(r.price_per_unit) : null,
      pricePerUnitEff: r.price_per_unit_eff != null ? Number(r.price_per_unit_eff) : null,
      promoType: normalizePromoType(r.promo_type),
      promoBuyQty: r.promo_buy_qty,
      promoPayQty: r.promo_pay_qty,
      promoSecondDiscountPct: r.promo_second_discount_pct,
      capturedAt: r.captured_at,
      validTo: r.valid_to,
      source: r.source,
      storeProductUrl: r.store_product_url,
      distanceKm,
      proximity,
      deltaVsAvgPct: null,
    };

    if (proximity === "in_zone") stores.inZone.push(row);
    else if (proximity === "nearby" && includeNearby) stores.nearby.push(row);
    else if (proximity === "national") {
      // Cap: stores físicos a más de 30km del centroide de la zona del usuario
      // son ruido — se descartan salvo que sean virtuales (delivery online).
      const withinCap =
        r.is_virtual ||
        distanceKm == null || // sin coords: mantener como referencia nacional
        distanceKm <= REGIONAL_MAX_KM;
      if (withinCap) stores.national.push(row);
    }
  }

  // Dedup en bucket "nacional": una fila por cadena (la más barata), para
  // no mostrar la misma cadena 4 veces con precios distintos por sucursal.
  stores.national = dedupByChainKeepingCheapest(stores.national);

  const [avgRow] = await prisma.$queryRaw<Array<{ avg30d: string | null; min_price: string | null; max_price: string | null }>>`
    SELECT
      AVG(pr.price)::text AS avg30d,
      MIN(pr.price)::text AS min_price,
      MAX(pr.price)::text AS max_price
    FROM prices pr
    JOIN products p ON p.id = pr.product_id
    JOIN stores s ON s.id = pr.store_id
    WHERE (p.id = ${canonicalId} OR p.canonical_id = ${canonicalId})
      AND pr.captured_at > NOW() - INTERVAL '30 days'
      AND pr.price > 0
      AND (s.zone_id = ${zone?.id ?? null}::text OR s.is_virtual)
  `;
  const avg30d = avgRow?.avg30d != null ? Number(avgRow.avg30d) : null;
  const minPrice = avgRow?.min_price != null ? Number(avgRow.min_price) : null;
  const maxPrice = avgRow?.max_price != null ? Number(avgRow.max_price) : null;

  // Delta vs promedio zonal 30d
  for (const bucket of ["inZone", "nearby", "national"] as const) {
    for (const row of stores[bucket]) {
      if (avg30d && avg30d > 0) {
        row.deltaVsAvgPct = ((row.price - avg30d) / avg30d) * 100;
      }
    }
  }

  // Ranking: en cada bucket, orden por precio efectivo si existe, sino price.
  const rank = (a: ComparisonStoreRow, b: ComparisonStoreRow) =>
    (a.pricePerUnitEff ?? a.price) - (b.pricePerUnitEff ?? b.price);
  stores.inZone.sort(rank);
  stores.nearby.sort(rank);
  stores.national.sort(rank);

  // Variante contraria de packaging (C-004)
  const variantOfPackaging = await findPackagingVariant(product);

  return {
    product: {
      ...product,
      standardSize: product.standardSize != null ? Number(product.standardSize) : null,
    },
    stores,
    avg30d,
    minPrice,
    maxPrice,
    zoneSlug,
    variantOfPackaging,
  };
}

function dedupByChainKeepingCheapest(rows: ComparisonStoreRow[]): ComparisonStoreRow[] {
  const byChain = new Map<string, ComparisonStoreRow>();
  for (const r of rows) {
    const existing = byChain.get(r.chainSlug);
    if (!existing || r.price < existing.price) {
      byChain.set(r.chainSlug, r);
    }
  }
  return [...byChain.values()];
}

function normalizePromoType(t: string): ComparisonStoreRow["promoType"] {
  if (t === "nx1" || t === "nxm" || t === "second_off" || t === "bundle_discount") return t;
  return "unit";
}

function computeDistance(
  a: number | null | undefined,
  b: number | null | undefined,
  c: number | null | undefined,
  d: number | null | undefined,
): number | null {
  if (a == null || b == null || c == null || d == null) return null;
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(c - a);
  const dLng = toRad(d - b);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

async function findPackagingVariant(
  product: { name: string; packagingFlag: string | null; standardSize: unknown; standardUnit: string | null },
): Promise<{ slug: string; name: string; packagingFlag: string } | null> {
  if (!product.packagingFlag || !product.standardUnit) return null;
  const opposite = OPPOSITE_PACKAGING[product.packagingFlag];
  if (!opposite) return null;
  const variant = await prisma.product.findFirst({
    where: {
      packagingFlag: opposite,
      standardSize: product.standardSize as never,
      standardUnit: product.standardUnit,
      canonicalId: null,
    },
    select: { slug: true, name: true, packagingFlag: true },
  });
  if (!variant?.packagingFlag) return null;
  return { slug: variant.slug, name: variant.name, packagingFlag: variant.packagingFlag };
}

const OPPOSITE_PACKAGING: Record<string, string> = {
  retornable: "descartable",
  descartable: "retornable",
  light: "regular",
  regular: "light",
  zero: "regular",
  descremada: "entera",
  entera: "descremada",
};
