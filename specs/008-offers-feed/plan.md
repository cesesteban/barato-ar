# Implementation Plan: Offers Feed

**Branch**: `008-offers-feed` | **Date**: 2026-09-09

## Summary

Home + `/ofertas` con feed rankeado, filtros vía query params (shareable), sidebar desktop + bottom-sheet mobile, paginación infinita con cursor.

## Technical Context

- **Deps**: RSC + `useSearchParams`, Prisma, Redis (cache), Radix Dialog (bottom-sheet)
- **Testing**: Vitest + Playwright (múltiples viewports)
- **Performance**: LCP < 2 s en `/`, p95 `/api/offers` < 250 ms

## Constitution Check

| Principio | Nota |
|---|---|
| I. SEO | `/` SSG (5 min ISR); `/ofertas` server-rendered SEO-friendly con `<link rel="canonical">` sin filtros |
| II. Frescura | Cada card muestra `capturedAt` |
| V. Performance | Cache Redis 60 s |
| VII. Simplicidad | Sin virtualización de listas en MVP; paginación cursor |
| VIII. a11y | Focus trap en bottom-sheet, teclado en chips |

## Routing

```
src/app/
├── page.tsx                     # Home (SSG, revalidate 300)
├── ofertas/
│   ├── page.tsx                 # Feed (server, dynamic)
│   ├── loading.tsx
│   └── layout.tsx               # con sidebar
└── api/offers/route.ts          # JSON API
```

## Query Params → Filters

```ts
export const OffersParams = z.object({
  zone: z.string().default("caba-palermo"),
  vertical: z.enum(["supermarket","delivery","pharmacy","beverages"]).optional(),
  chains: z.string().optional().transform(v => v?.split(",") ?? []),   // ?chains=carrefour,coto
  minDiscount: z.coerce.number().min(0).max(100).default(0),
  maxDistanceKm: z.coerce.number().min(0).max(50).default(5),
  validity: z.enum(["today","week","month"]).default("week"),
  sort: z.enum(["discount","new","popular"]).default("discount"),
  cursor: z.string().optional(),
});
```

## Ranking Query

```sql
WITH latest AS (
  SELECT DISTINCT ON (pr.product_id, pr.store_id) pr.*
  FROM prices pr
  ORDER BY pr.product_id, pr.store_id, pr.captured_at DESC
),
scored AS (
  SELECT
    l.id, l.product_id, l.store_id, l.price, l.previous_price, l.discount_pct,
    l.captured_at, l.valid_to,
    (COALESCE(l.discount_pct, 0) * 0.6
     + LEAST((EXTRACT(EPOCH FROM (NOW() - l.captured_at)) / 86400), 7) * -0.05  -- fresher = higher
     + COALESCE(l.upvotes_cache, 0) / 100.0 * 0.2) AS score
  FROM latest l
  JOIN stores s ON s.id = l.store_id
  JOIN chains c ON c.id = s.chain_id
  WHERE (s.zone_id = $zone OR s.is_virtual = true)
    AND l.captured_at > NOW() - INTERVAL '14 days'
    AND ($vertical IS NULL OR c.vertical = $vertical)
    AND ($chains IS NULL OR c.slug = ANY($chains))
    AND COALESCE(l.discount_pct, 0) >= $minDiscount
    AND (l.valid_to IS NULL OR l.valid_to > NOW())
)
SELECT * FROM scored
ORDER BY score DESC
LIMIT $limit OFFSET $offset;
```

## API Contract

```ts
// GET /api/offers?zone=...&minDiscount=20&sort=discount&cursor=xyz
export type OffersResponse = {
  items: OfferListing[];
  nextCursor: string | null;
  total: number;
  ms: number;
  facets: { chains: { slug: string; count: number }[]; verticals: {...}[] };
};
```

## Components

- `<HeroSection>` — copy + search bar + zone chip + trust bar (home).
- `<OffersGrid>` — 4-col desktop / 2-col tablet / 1-col mobile.
- `<FiltersSidebar>` — desktop (`/ofertas`).
- `<FiltersSheet>` — mobile.
- `<ActiveChips>` — desktop y mobile arriba del grid.
- `<HowItWorks>` — 3 pasos (home).
- `<InfiniteLoader>` — IntersectionObserver → fetch nextCursor.

## Caching

- Home `/` SSG con `revalidate = 300`.
- `/api/offers` cache Redis por hash de filtros: `offers:${sha1(JSON.stringify(filters))}` con TTL 60 s.

## Testing

- Playwright (desktop + mobile):
  - Home carga con 8 cards.
  - `/ofertas`: filtro por chain → grid actualiza.
  - Chip: click X → filtro eliminado.
  - Bottom-sheet mobile: focus trap.
  - Infinite scroll: segunda página añadida.
- Load test `/api/offers` con k6 → p95 < 250 ms.

## Complexity Tracking

Ninguna.
