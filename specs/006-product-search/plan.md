# Implementation Plan: Product Search

**Branch**: `006-product-search` | **Date**: 2026-09-09

## Summary

Endpoint `/api/search` con Postgres `pg_trgm` full-text + ranking custom, componente `SearchBar` React con debounce + keyboard-nav, página `/buscar?q=` server-rendered con filtros. Redis cache para "populares del día".

## Technical Context

- **Deps**: `@upstash/redis`, `zod`, `unaccent` (Postgres extension), Prisma
- **Storage**: Postgres (`pg_trgm` + GiST index), Redis
- **Testing**: Vitest (unit) + Playwright (e2e), fixtures de queries reales
- **Performance**: p95 < 200 ms, autocomplete < 300 ms

## Constitution Check

| Principio | Nota |
|---|---|
| I. SEO | `/buscar` es SSR-friendly con SEO `noindex` (search pages) |
| II. Datos frescos | Sí, `captured_at` en cada resultado |
| III. Testeable | Sí, tests de ranking |
| V. Performance | Central. Índices GiST + Redis cache |
| VII. Simplicidad | Postgres full-text; no Elasticsearch |

## Data Model & Indexes

```sql
-- migración
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE INDEX idx_products_name_trgm ON products USING gist (normalized_name gist_trgm_ops);
CREATE INDEX idx_products_brand_trgm ON products USING gist (brand gist_trgm_ops);

CREATE TABLE search_logs (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  zone_slug TEXT,
  results_count INT NOT NULL,
  clicked_product_id TEXT,
  ip_hash TEXT,
  ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_search_logs_query_ts ON search_logs (query, ts DESC);
```

## Ranking Query

```sql
WITH candidates AS (
  SELECT
    p.id, p.slug, p.name, p.brand, p.image_url,
    similarity(p.normalized_name, $1) AS name_sim,
    similarity(COALESCE(p.brand, ''), $1) AS brand_sim,
    COUNT(sl.id) FILTER (WHERE sl.ts > NOW() - INTERVAL '7 days') AS pop_7d,
    MIN(pr.price) AS min_price,
    MAX(pr.captured_at) AS last_seen
  FROM products p
  LEFT JOIN search_logs sl ON sl.clicked_product_id = p.id
  LEFT JOIN prices pr ON pr.product_id = p.id
    AND pr.captured_at > NOW() - INTERVAL '14 days'
  WHERE p.normalized_name % $1
     OR COALESCE(p.brand, '') % $1
  GROUP BY p.id
),
scored AS (
  SELECT *,
    (name_sim * 0.5 +
     brand_sim * 0.2 +
     LEAST(pop_7d::float / 100.0, 1.0) * 0.2 +
     CASE WHEN last_seen > NOW() - INTERVAL '3 days' THEN 0.1 ELSE 0 END) AS score
  FROM candidates
)
SELECT * FROM scored ORDER BY score DESC LIMIT 20;
```

## API Contracts

```ts
// GET /api/search
export const SearchParams = z.object({
  q: z.string().min(2).max(100),
  zone: z.string().optional(),
  vertical: z.enum(["supermarket","delivery","pharmacy","beverages"]).optional(),
  limit: z.number().int().min(1).max(50).default(20),
});

export type SearchResult = {
  results: Array<{
    id: string; slug: string; name: string; brand?: string;
    imageUrl?: string; minPrice: number; chainCount: number;
    score: number;
  }>;
  suggestion?: string;      // did-you-mean
  total: number;
  ms: number;
};

// GET /api/search/autocomplete?q=coc
export type Autocomplete = {
  products: Array<{ slug: string; label: string; }>;
  brands:   Array<{ slug: string; label: string; }>;
  categories: Array<{ slug: string; label: string; }>;
};
```

## Did-you-mean

Si `total < 3` y `q.length >= 4`, correr:
```sql
SELECT word FROM (
  SELECT word_similarity($1, normalized_name) AS s, unnest(string_to_array(normalized_name, ' ')) AS word
  FROM products
) t
WHERE s > 0.4
GROUP BY word ORDER BY MAX(s) DESC LIMIT 1;
```

## Caching

- Popular searches: cache 5 min por `zoneSlug` en Redis (`popular:zone:{slug}` → JSON array).
- Autocomplete: cache 60 s por query prefix (`ac:{prefix}`).
- No cache para full search (por si zona/vertical cambia).

## Component API

```tsx
// SearchBar.tsx
<SearchBar
  zone={zoneSlug}
  onNavigate={(slug) => router.push(`/producto/${slug}`)}
  onSubmit={(q) => router.push(`/buscar?q=${encodeURIComponent(q)}`)}
  compact={boolean}         // versión nav compacta
/>
```

Comportamiento:
- Focus vacío → fetch `/api/search/popular` (mostrar chips).
- Tipear ≥ 2 chars → debounce 200 ms → `/api/search/autocomplete`.
- Enter → submit → navegar a `/buscar?q=`.
- ↑↓ → mover selección; Esc → cerrar.

## Testing

- Unit: ranking function tests con dataset conocido.
- Integration: `/api/search?q=coca` returns Coca first.
- Playwright: keyboard nav en dropdown.
- Load: k6 script para simular 100 rps → p95 < 200 ms.

## Complexity Tracking

Ninguna violación.
