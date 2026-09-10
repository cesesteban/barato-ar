# Implementation Plan: Product Comparison Page

**Branch**: `007-product-comparison-page` | **Date**: 2026-09-09

## Summary

Route `/producto/[slug]` (App Router, RSC, SSG + ISR 1 h). Query agregada por zona, componente `<ComparisonTable>` con ranking, JSON-LD, OG dinámico.

## Technical Context

- **Deps**: Next.js 15 RSC, Prisma, `date-fns`, `@vercel/og`
- **Storage**: Postgres (query optimizada con índices existentes)
- **Testing**: Vitest + Playwright + Lighthouse CI
- **Performance**: TTFB < 400 ms, LCP < 2 s, Lighthouse ≥ 95

## Constitution Check

| Principio | Nota |
|---|---|
| I. SEO | **Central**. SSG + JSON-LD + canonical URL |
| II. Datos frescos | Cada precio muestra timestamp |
| V. Performance | Bundle budget 40 KB |
| VIII. a11y | Keyboard nav en tabla, aria-sort |

## Route Structure

```
src/app/producto/[slug]/
├── page.tsx                     # RSC page
├── opengraph-image.tsx          # dynamic OG (900×630)
├── loading.tsx                  # skeleton
├── not-found.tsx
└── components/
    ├── product-header.tsx
    ├── comparison-table.tsx
    ├── history-placeholder.tsx  # feature 10 lo reemplaza
    ├── alert-card-mount.tsx     # feature 09 lo llena
    └── similar-products.tsx     # feature 08 lo llena
```

## Data Fetching

```ts
// src/server/product/get-comparison.ts
export async function getProductComparison({
  slug,
  zoneSlug,
}: { slug: string; zoneSlug: string }): Promise<ComparisonView | null> {
  // 1. Product + canonical
  const product = await prisma.product.findFirst({
    where: { slug: slug },
    include: { canonical: true },
  });
  if (!product) return null;

  const canonicalId = product.canonicalId ?? product.id;

  // 2. Latest price per store en la zona
  const rows = await prisma.$queryRaw<StorePriceRow[]>`
    SELECT DISTINCT ON (s.id)
      s.id AS store_id, s.name AS store_name, s.address, s.lat, s.lng,
      c.id AS chain_id, c.name AS chain_name, c.slug AS chain_slug,
      pr.price, pr.previous_price, pr.captured_at,
      pr.discount_pct, pr.valid_to, pr.source
    FROM prices pr
    JOIN stores s ON s.id = pr.store_id
    JOIN chains c ON c.id = s.chain_id
    JOIN products p ON p.id = pr.product_id
    WHERE (p.id = ${canonicalId} OR p.canonical_id = ${canonicalId})
      AND pr.captured_at > NOW() - INTERVAL '14 days'
      AND (s.zone_id = ${zoneSlug} OR s.is_virtual = true)
    ORDER BY s.id, pr.captured_at DESC
  `;

  // 3. Promedio 30d en zona
  const [{ avg30d }] = await prisma.$queryRaw<{avg30d: number}[]>`
    SELECT AVG(price) AS avg30d FROM prices pr
    JOIN stores s ON s.id = pr.store_id
    JOIN products p ON p.id = pr.product_id
    WHERE (p.id = ${canonicalId} OR p.canonical_id = ${canonicalId})
      AND pr.captured_at > NOW() - INTERVAL '30 days'
      AND s.zone_id = ${zoneSlug}
  `;

  // 4. Rank & compute delta
  return shapeComparison(product, rows, avg30d);
}
```

## Ranking del listado

1. Ordenar por `price` ascending.
2. Empate: menor `distance_km` (haversine desde centro de zone o desde `userLat` si el frontend lo pasó como cookie).
3. Empate2: `captured_at` desc.

## JSON-LD

```ts
// generateMetadata + <script>
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
  image: product.imageUrl,
  gtin: product.eanCode,
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "ARS",
    lowPrice: minPrice,
    highPrice: maxPrice,
    offerCount: rows.length,
    offers: rows.slice(0, 10).map(r => ({
      "@type": "Offer",
      price: r.price,
      priceCurrency: "ARS",
      seller: { "@type": "Organization", name: r.chainName },
      priceValidUntil: r.validTo,
      availability: "https://schema.org/InStock",
      url: r.storeProductUrl ?? `https://precioya.ar/tienda/${r.chainSlug}`,
    })),
  },
};
```

## OG Image (dynamic)

`opengraph-image.tsx` con `@vercel/og`:
```tsx
export default async function OG({ params }) {
  const data = await getProductComparison({ slug: params.slug, zoneSlug: "caba" });
  return new ImageResponse(
    <div style={{...}}>
      <h1>{data.product.name}</h1>
      <p>Desde ${data.minPrice} en {data.bestChain}</p>
      <p>Precioya</p>
    </div>,
    { width: 900, height: 630 },
  );
}
```

## ISR & generateStaticParams

```ts
export const revalidate = 3600;

export async function generateStaticParams() {
  const top = await prisma.product.findMany({
    where: { canonicalId: null }, // solo canonicales
    orderBy: [{ prices: { _count: "desc" } }],
    take: 10000,
    select: { slug: true },
  });
  return top.map(p => ({ slug: p.slug }));
}
```

## Contracts

```ts
export type ComparisonView = {
  product: { id: string; slug: string; name: string; brand?: string; imageUrl?: string; eanCode?: string; };
  stores: Array<{
    storeId: string; storeName: string; address?: string; chainId: string; chainName: string; chainSlug: string;
    price: number; previousPrice?: number; discountPct?: number;
    distanceKm?: number; capturedAt: string; source: string; validTo?: string;
    storeProductUrl?: string;
    deltaVsAvgPct: number;   // negativo = más barato
  }>;
  avg30d: number;
  minPrice: number;
  maxPrice: number;
  zoneSlug: string;
};
```

## Testing

- Snapshot test de `<ComparisonTable>` con dataset fake.
- Playwright: navegar y verificar orden + badges.
- Rich Results Test manual pre-launch.
- Lighthouse CI budget en workflow para esta ruta.

## Complexity Tracking

Ninguna.
