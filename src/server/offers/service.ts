/**
 * Servicio de feed de ofertas (F008).
 */

import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { encodeCursor } from "@/lib/cursor";
import { fetchFacets, fetchOffers } from "./query";
import type { OffersParams, OffersResponse, OfferListing } from "./schemas";

const CACHE_TTL = 60;

export async function runOffers(params: OffersParams): Promise<OffersResponse> {
  const started = Date.now();

  const zone = await prisma.zone.findFirst({
    where: { OR: [{ id: params.zone }, { slug: params.zone }] },
    select: { lat: true, lng: true },
  });
  const zoneCenter = zone?.lat != null && zone?.lng != null ? { lat: zone.lat, lng: zone.lng } : null;

  const cacheKey = `offers:${paramsHash(params)}`;
  const redis = getRedis();
  const cached = await redis.get<OffersResponse>(cacheKey);
  if (cached) return { ...cached, ms: Date.now() - started };

  const [rawRows, facets] = await Promise.all([fetchOffers(params, zoneCenter), fetchFacets(params)]);
  const rowsRaw = rawRows.slice(0, params.limit);
  const nextCursor =
    rawRows.length > params.limit
      ? encodeCursor({ score: rowsRaw[rowsRaw.length - 1]!.score, id: rowsRaw[rowsRaw.length - 1]!.id })
      : null;

  const items: OfferListing[] = rowsRaw.map((r) => {
    const distanceKm =
      zoneCenter && r.store_lat != null && r.store_lng != null
        ? haversineKm(zoneCenter.lat, zoneCenter.lng, r.store_lat, r.store_lng)
        : null;
    const proximity: OfferListing["proximity"] = r.is_virtual
      ? "national"
      : r.zone_id === (params.zone as string)
        ? "in_zone"
        : distanceKm !== null && distanceKm <= params.maxDistanceKm
          ? "nearby"
          : "national";
    return {
      id: r.id,
      productId: r.product_id,
      productSlug: r.product_slug,
      productName: r.product_name,
      productBrand: r.product_brand,
      productImageUrl: r.product_image_url,
      chainSlug: r.chain_slug,
      chainName: r.chain_name,
      storeId: r.store_id,
      storeName: r.store_name,
      price: Number(r.price),
      previousPrice: r.previous_price != null ? Number(r.previous_price) : null,
      discountPct: r.discount_pct,
      pricePerUnit: r.price_per_unit != null ? Number(r.price_per_unit) : null,
      pricePerUnitEff: r.price_per_unit_eff != null ? Number(r.price_per_unit_eff) : null,
      standardUnit: r.standard_unit,
      standardSize: r.standard_size != null ? Number(r.standard_size) : null,
      promoType: normalizePromoType(r.promo_type),
      promoBuyQty: r.promo_buy_qty,
      promoPayQty: r.promo_pay_qty,
      promoSecondDiscountPct: r.promo_second_discount_pct,
      validTo: r.valid_to ? r.valid_to.toISOString() : null,
      distanceKm,
      proximity,
      score: r.score,
    };
  });

  const response: OffersResponse = {
    items,
    nextCursor,
    total: items.length,
    ms: Date.now() - started,
    facets,
  };
  await redis.set(cacheKey, response, { ex: CACHE_TTL });
  return response;
}

function paramsHash(p: OffersParams): string {
  return [
    p.zone,
    p.vertical ?? "",
    p.chains.join(","),
    p.minDiscount,
    p.maxDistanceKm,
    p.validity,
    p.sort,
    p.cursor ?? "",
    p.limit,
    p.includeNearby ? "1" : "0",
  ].join("|");
}

function normalizePromoType(t: string): OfferListing["promoType"] {
  if (t === "nx1" || t === "nxm" || t === "second_off" || t === "bundle_discount") return t;
  return "unit";
}

function haversineKm(a: number, b: number, c: number, d: number): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(c - a);
  const dLng = toRad(d - b);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a)) * Math.cos(toRad(c)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
