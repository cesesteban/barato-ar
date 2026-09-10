# Implementation Plan: Price History & Charts

**Branch**: `010-price-history-charts` | **Date**: 2026-09-09

## Summary

Vista materializada `price_daily_avg`, endpoint que la sirve con range param, componente `<PriceHistoryChart>` SVG puro server-rendered + interactividad client (hover tooltip, range switch).

## Technical Context

- **Deps**: nada nuevo (SVG puro). Client-only: `d3-scale` opt (small module).
- **Storage**: Postgres materialized view refreshed nightly.
- **Testing**: Vitest snapshot del SVG.
- **Performance**: endpoint < 100 ms.

## Constitution Check

| Principio | Nota |
|---|---|
| I. SEO | Chart SSR-safe = indexable |
| II. Frescura | `last_seen` visible en tooltip |
| V. Performance | Materialized view + LCP guard |

## Data Model

```sql
CREATE MATERIALIZED VIEW price_daily_avg AS
SELECT
  p.canonical_id AS product_id,
  COALESCE(s.zone_id, 'national') AS zone_slug,
  DATE(pr.captured_at) AS day,
  AVG(pr.price) AS avg_price,
  MIN(pr.price) AS min_price,
  MAX(pr.price) AS max_price,
  COUNT(*) AS obs_count
FROM prices pr
JOIN products p ON p.id = pr.product_id
JOIN stores s ON s.id = pr.store_id
WHERE pr.captured_at > NOW() - INTERVAL '400 days'
GROUP BY 1, 2, 3;

CREATE UNIQUE INDEX ON price_daily_avg (product_id, zone_slug, day);
CREATE INDEX ON price_daily_avg (product_id, day DESC);
```

Refresh cada noche:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY price_daily_avg;
```

## Server Query

```ts
// src/server/history/get-history.ts
export async function getHistory({ productId, zoneSlug, days }: Params) {
  return prisma.$queryRaw<HistoryRow[]>`
    SELECT day, avg_price, min_price, max_price, obs_count
    FROM price_daily_avg
    WHERE product_id = ${productId}
      AND zone_slug = ${zoneSlug}
      AND day > NOW() - (${days}::int || ' days')::interval
    ORDER BY day
  `;
}
```

## Component

```tsx
// src/components/domain/price-history-chart.tsx (server-safe)
export function PriceHistoryChart({ data, current, currency = "ARS" }: Props) {
  const path = pathFromData(data);          // pure SVG path string
  const area = areaFromData(data);
  const scales = computeScales(data);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={ariaLabel}>
      <defs>{/* gradient */}</defs>
      <g>{/* gridlines + axes */}</g>
      <path d={area} fill="url(#grad)" />
      <path d={path} stroke="var(--color-primary)" strokeWidth={2.4} fill="none" />
      <circle cx={scales.x(today)} cy={scales.y(current)} r={5} fill="var(--color-primary)" />
      <PriceHistoryTooltip data={data} />   {/* client, opcional */}
    </svg>
  );
}
```

Estrategia responsive: `viewBox` fijo + `preserveAspectRatio="none"`.

## Client Enhancer

Un client component muy pequeño (`<PriceHistoryInteractive>`) engloba:
- Botones 30D/90D/180D/1A → refetch a `/api/product/[slug]/history`.
- Hover: mousemove → binaria búsqueda → tooltip.
- SSR renderiza inicial 90D (por default).

## API Contract

```ts
// GET /api/product/[slug]/history?zone=caba-palermo&days=90
export type HistoryResponse = {
  days: number;
  points: Array<{ day: string; avgPrice: number; minPrice: number; maxPrice: number; obsCount: number; }>;
  stats: { current: number; avg: number; min: { price: number; day: string }; max: { price: number; day: string }; };
  currency: "ARS";
};
```

## Cron & Refresh

`.github/workflows/refresh-materialized-views.yml`:
```yaml
on:
  schedule: [{ cron: "0 6 * * *" }]     # 3am ART
jobs:
  refresh:
    steps:
      - run: psql "$DATABASE_URL_UNPOOLED" -c "REFRESH MATERIALIZED VIEW CONCURRENTLY price_daily_avg;"
```

## Outlier Filter

En `getHistory`, aplicar filtro `avg_price < avg_all * 3` sobre el resultado para eliminar corruptos evidentes.

## Testing

- Snapshot SVG con dataset determinístico.
- Playwright: click 30D → chart cambia (menos puntos).
- Perf: endpoint p95 < 100 ms bajo 100 rps.

## Complexity Tracking

Ninguna.
