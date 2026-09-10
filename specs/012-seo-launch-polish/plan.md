# Implementation Plan: SEO, Performance & Launch

**Branch**: `012-seo-launch-polish` | **Date**: 2026-09-09

## Summary

Feature transversal: hardening SEO, sitemap dinámico, Lighthouse CI, contenidos legales, launch checklist. No introduce lógica de negocio nueva.

## Technical Context

- **Deps**: `@lhci/cli` (Lighthouse CI), `next-sitemap` (opt, o built-in `sitemap.ts`), `schema-dts` (types de schema.org)
- **Storage**: no
- **Testing**: LHCI + axe + Playwright + Rich Results Test manual
- **Performance**: budget definido y enforced por CI

## Constitution Check

Esta feature es el "compliance" de la constitución en todos los principios simultáneamente.

## SEO Layer

### Layout `/layout.tsx`

```tsx
export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  title: { template: "%s · Precioya", default: "Precioya — Comparador de ofertas Argentina" },
  description: "Encontrá el precio más bajo en supermercados, delivery y farmacias de CABA y GBA.",
  openGraph: {
    type: "website", locale: "es_AR",
    siteName: "Precioya",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
  alternates: { canonical: "/", languages: { "es-AR": "/" } },
};
```

### JSON-LD helpers

```ts
// src/lib/jsonld.ts
export const orgJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Precioya",
  url: env.NEXT_PUBLIC_APP_URL,
  logo: `${env.NEXT_PUBLIC_APP_URL}/logo-512.png`,
  sameAs: ["https://twitter.com/precioya_ar"],
});

export const websiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Precioya",
  url: env.NEXT_PUBLIC_APP_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${env.NEXT_PUBLIC_APP_URL}/buscar?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});
```

### Sitemap dinámico `/sitemap.ts`

```ts
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await prisma.product.findMany({
    where: { canonicalId: null },
    orderBy: { prices: { _count: "desc" } },
    take: 20000,
    select: { slug: true, updatedAt: true },
  });
  const chains = await prisma.chain.findMany({ select: { slug: true } });
  const base = env.NEXT_PUBLIC_APP_URL;

  return [
    { url: `${base}/`, priority: 1.0, changeFrequency: "hourly" },
    { url: `${base}/ofertas`, priority: 0.9, changeFrequency: "hourly" },
    { url: `${base}/sobre`, priority: 0.4, changeFrequency: "monthly" },
    ...products.map(p => ({
      url: `${base}/producto/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8, changeFrequency: "daily" as const,
    })),
    ...chains.map(c => ({
      url: `${base}/tienda/${c.slug}`,
      priority: 0.6, changeFrequency: "weekly" as const,
    })),
  ];
}
```

### `/robots.ts`

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/mis-alertas", "/alerts/"] },
      { userAgent: "GPTBot", disallow: "/" },   // opt: bloquear scrapers de LLMs
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
```

## Lighthouse CI

`.lighthouserc.json`:
```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/ofertas",
        "http://localhost:3000/producto/coca-cola-2-25l",
        "http://localhost:3000/buscar?q=coca",
        "http://localhost:3000/reportar"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.90 }],
        "categories:accessibility": ["error", { "minScore": 0.95 }],
        "categories:best-practices": ["error", { "minScore": 0.95 }],
        "categories:seo": ["error", { "minScore": 0.95 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "total-blocking-time": ["error", { "maxNumericValue": 200 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }]
      }
    }
  }
}
```

Workflow: `.github/workflows/lighthouse.yml` corre en cada PR.

## Analytics

`src/lib/analytics.tsx`:
```tsx
export function trackEvent(name: string, props?: Record<string, string|number>) {
  if (typeof window !== "undefined" && window.plausible) {
    window.plausible(name, { props });
  }
}
```

Eventos: `search`, `outbound_click` (con `chain`), `alert_created`, `report_submitted`, `filter_applied`, `zone_changed`.

## Legal pages

- `/legales/terminos`: cláusulas mínimas (uso, propiedad intelectual, límite de responsabilidad, jurisdicción CABA).
- `/legales/privacidad`: qué datos, base legal (consentimiento art. 5 Ley 25.326), retención, derechos ARCO, contacto.
- `/legales/takedown`: form o mailto para pedir retiro de contenido; SLA 5 días hábiles.
- `/sobre`: quién, por qué, fuentes de datos.
- `/contacto`: form o mailto.

## Launch Checklist (`LAUNCH.md`)

Ver `tasks.md` Fase 6 para el listado. En prod:
1. DNS + SSL válido.
2. Sitemap indexado en Google Search Console + Bing.
3. Plausible mide sesiones.
4. Sentry recibe errores.
5. Better Stack uptime a `/health` cada 3 min.
6. Backups Neon activados.
7. Ingestion cron corriendo.
8. Alerts scan cron corriendo.
9. Reports purge cron corriendo.
10. Materialized view refresh cron corriendo.

## Testing

- LHCI en CI.
- axe integrado en Playwright para las rutas del `.lighthouserc.json`.
- Rich Results Test manual pre-launch en 3 productos.

## Complexity Tracking

Ninguna.
