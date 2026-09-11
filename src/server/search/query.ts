/**
 * Query SQL con pg_trgm + ranking mixto (F006).
 * El índice GiST en `products.normalized_name` hace que `% $1` sea rápido.
 */

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

const RANK_SQL = Prisma.sql`
WITH candidates AS (
  SELECT
    p.id,
    p.slug,
    p.name,
    p.brand,
    p.image_url,
    similarity(p.normalized_name, $1) AS name_sim,
    similarity(COALESCE(LOWER(p.brand), ''), $1) AS brand_sim,
    (
      SELECT COUNT(*) FROM search_logs sl
      WHERE sl.clicked_product_id = p.id AND sl.ts > NOW() - INTERVAL '7 days'
    ) AS pop_7d,
    (
      SELECT MIN(pr.price)::float FROM prices pr
      WHERE pr.product_id = p.id
        AND pr.captured_at > NOW() - INTERVAL '14 days'
        AND pr.price > 0
        AND (pr.valid_to IS NULL OR pr.valid_to > NOW())
    ) AS min_price,
    (
      SELECT COUNT(DISTINCT s.chain_id)::int
      FROM prices pr
      JOIN stores s ON s.id = pr.store_id
      WHERE pr.product_id = p.id
        AND pr.captured_at > NOW() - INTERVAL '14 days'
    ) AS chain_count,
    (
      SELECT MAX(pr.captured_at) FROM prices pr WHERE pr.product_id = p.id
    ) AS last_seen
  FROM products p
  WHERE p.canonical_id IS NULL
    AND (
      p.normalized_name % $1
      OR COALESCE(LOWER(p.brand), '') % $1
    )
),
scored AS (
  SELECT *,
    (
      COALESCE(name_sim, 0) * 0.5
      + COALESCE(brand_sim, 0) * 0.2
      + LEAST(pop_7d::float / 100.0, 1.0) * 0.2
      + CASE WHEN last_seen > NOW() - INTERVAL '3 days' THEN 0.1 ELSE 0 END
    ) AS score
  FROM candidates
)
SELECT id, slug, name, brand, image_url AS "imageUrl", min_price AS "minPrice",
       chain_count AS "chainCount", score
FROM scored
ORDER BY score DESC
LIMIT $2
`;

export type RankedRow = {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  minPrice: number | null;
  chainCount: number;
  score: number;
};

export async function rankProducts(query: string, limit: number): Promise<RankedRow[]> {
  const normalized = query.toLowerCase().trim();
  const rows = await prisma.$queryRaw<RankedRow[]>(
    Prisma.sql`${RANK_SQL}`,
    normalized,
    limit,
  );
  return rows;
}

/**
 * Did-you-mean: cuando la búsqueda encuentra poco, sugiere token similar.
 */
export async function didYouMean(query: string): Promise<string | null> {
  const normalized = query.toLowerCase().trim();
  if (normalized.length < 4) return null;
  const rows = await prisma.$queryRaw<Array<{ word: string; sim: number }>>`
    WITH tokens AS (
      SELECT DISTINCT unnest(string_to_array(normalized_name, ' ')) AS word
      FROM products
      WHERE canonical_id IS NULL
    )
    SELECT word, word_similarity(${normalized}, word) AS sim
    FROM tokens
    WHERE word_similarity(${normalized}, word) > 0.4
    ORDER BY sim DESC
    LIMIT 1
  `;
  const first = rows[0];
  if (!first || first.word.toLowerCase() === normalized) return null;
  return first.word;
}
