/**
 * Servicio de búsqueda (F006). Compone query + did-you-mean + logging.
 */

import { prisma } from "@/lib/db";
import { getRedis } from "@/lib/redis";
import { didYouMean, rankProducts } from "./query";
import type {
  AutocompleteResponse,
  PopularSearchesResponse,
  SearchParams,
  SearchResponse,
  SearchResultItem,
} from "./schemas";

const POPULAR_CACHE_TTL = 300; // 5 min
const AUTOCOMPLETE_CACHE_TTL = 60;

export async function runSearch(params: SearchParams, ipHash?: string): Promise<SearchResponse> {
  const started = Date.now();
  const rows = await rankProducts(params.q, params.limit);
  const results: SearchResultItem[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    brand: r.brand,
    imageUrl: r.imageUrl,
    minPrice: r.minPrice,
    chainCount: r.chainCount,
    score: r.score,
  }));

  const suggestion = results.length < 3 ? await didYouMean(params.q) : null;

  // Log en fire-and-forget para no bloquear la respuesta.
  void logSearch({
    query: params.q,
    zoneSlug: params.zone ?? null,
    resultsCount: results.length,
    ipHash: ipHash ?? null,
  });

  return {
    results,
    suggestion,
    total: results.length,
    ms: Date.now() - started,
  };
}

export async function runAutocomplete(q: string): Promise<AutocompleteResponse> {
  const cacheKey = `ac:${q.toLowerCase()}`;
  const redis = getRedis();
  const cached = await redis.get<AutocompleteResponse>(cacheKey);
  if (cached) return cached;

  const normalized = q.toLowerCase().trim();
  const [products, brands, categories] = await Promise.all([
    prisma.$queryRaw<Array<{ slug: string; label: string }>>`
      SELECT slug, name AS label
      FROM products
      WHERE canonical_id IS NULL AND normalized_name % ${normalized}
      ORDER BY similarity(normalized_name, ${normalized}) DESC
      LIMIT 8
    `,
    prisma.$queryRaw<Array<{ label: string; count: bigint }>>`
      SELECT brand AS label, COUNT(*)::bigint AS count
      FROM products
      WHERE brand IS NOT NULL AND LOWER(brand) % ${normalized}
      GROUP BY brand
      ORDER BY count DESC
      LIMIT 3
    `,
    prisma.$queryRaw<Array<{ slug: string; count: bigint }>>`
      SELECT category AS slug, COUNT(*)::bigint AS count
      FROM products
      WHERE category IS NOT NULL AND category ILIKE ${`%${normalized}%`}
      GROUP BY category
      ORDER BY count DESC
      LIMIT 2
    `,
  ]);

  const response: AutocompleteResponse = {
    products,
    brands: brands.map((b) => ({ label: b.label, count: Number(b.count) })),
    categories: categories.map((c) => ({
      slug: c.slug,
      label: formatCategoryLabel(c.slug),
      count: Number(c.count),
    })),
  };

  await redis.set(cacheKey, response, { ex: AUTOCOMPLETE_CACHE_TTL });
  return response;
}

export async function runPopular(zoneSlug: string): Promise<PopularSearchesResponse> {
  const cacheKey = `popular:${zoneSlug}`;
  const redis = getRedis();
  const cached = await redis.get<PopularSearchesResponse>(cacheKey);
  if (cached) return cached;

  const rows = await prisma.$queryRaw<Array<{ query: string; count: bigint }>>`
    SELECT LOWER(query) AS query, COUNT(*)::bigint AS count
    FROM search_logs
    WHERE ts > NOW() - INTERVAL '7 days'
      AND (${zoneSlug}::text IS NULL OR zone_slug = ${zoneSlug})
    GROUP BY LOWER(query)
    ORDER BY count DESC
    LIMIT 10
  `;

  const response: PopularSearchesResponse = {
    zone: zoneSlug,
    items: rows.map((r) => ({ query: r.query, count: Number(r.count) })),
  };
  await redis.set(cacheKey, response, { ex: POPULAR_CACHE_TTL });
  return response;
}

type LogInput = {
  query: string;
  zoneSlug: string | null;
  resultsCount: number;
  clickedProductId?: string;
  ipHash: string | null;
};

async function logSearch(input: LogInput): Promise<void> {
  try {
    await prisma.$executeRaw`
      INSERT INTO search_logs (query, zone_slug, results_count, clicked_product_id, ip_hash)
      VALUES (${input.query}, ${input.zoneSlug}, ${input.resultsCount},
              ${input.clickedProductId ?? null}, ${input.ipHash})
    `;
  } catch (err) {
    console.warn("[search] logSearch falló:", err instanceof Error ? err.message : err);
  }
}

function formatCategoryLabel(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
