# Mapa de vistas

Todas las rutas del app + qué renderiza cada una + prop drilling clave.

## Rutas públicas (usuario sin auth)

### `/` — Home

**Archivo**: [src/app/page.tsx](../src/app/page.tsx)
**Rendering**: ISR revalidate 300s (5 min)
**Server data**: `runOffers({ zone: sp.zone, limit: 8, onlyBestPerProduct: true })`

Elementos:
- Hero con contador de ofertas + `<SearchBar>` gigante
- Grid de 8 `<DealCard>` (top ofertas de la zona)
- Sección "Cómo funciona" (3 pasos estáticos)
- CTA a `/ofertas` y `/reportar`

### `/ofertas` — Feed principal

**Archivo**: [src/app/ofertas/page.tsx](../src/app/ofertas/page.tsx)
**Rendering**: `force-dynamic` (params en URL cambian a menudo)
**Server data**: `runOffers(parsed.data)` con todos los filtros

Elementos:
- `<FiltersSidebar>` con vertical, cadenas, orden, minDiscount, includeNearby
- `<ActiveChips>` muestra filtros activos con X para remover
- `<InfiniteLoader>` con `<DealCard>` grid, paginación scroll

**Query params**:
- `zone`, `vertical`, `chains`, `minDiscount`, `maxDistanceKm`, `validity`, `sort`, `includeNearby`

### `/producto/[slug]` — Detalle producto

**Archivo**: [src/app/producto/[slug]/page.tsx](../src/app/producto/[slug]/page.tsx)
**Rendering**: ISR revalidate 3600s (1h)
**Server data**: `getComparison({ slug, zoneSlug })` + `getHistory({ slug, zone, days: 90 })`
**SEO**: `productJsonLd` con Product + AggregateOffer

Elementos:
- Header: brand, name, precio destacado, promedio zonal 30d
- 3 `<StoreSection>`: En tu zona / Cerca de tu zona / Cadenas nacionales
- Card "Ver también" con variante de packaging (si aplica)
- `<DeliveryLinks>` a PY/Rappi/ML
- `<PriceHistoryCard>` con chart 90d
- `<AlertCard>` form email

### `/tienda/[slug]` — Landing de cadena

**Archivo**: [src/app/tienda/[slug]/page.tsx](../src/app/tienda/[slug]/page.tsx)
**Rendering**: `force-dynamic`, revalidate 300s
**Server data**: `runOffers({ zone, chains: [slug] })` + `prisma.store.findMany`

Elementos:
- Header con nombre + vertical + link al sitio oficial
- Sidebar: 8 sucursales más cercanas al usuario
- Grid: top ofertas de esa cadena filtradas por zona

### `/buscar` — Resultados de búsqueda

**Archivo**: [src/app/buscar/page.tsx](../src/app/buscar/page.tsx)
**Rendering**: `force-dynamic`
**Server data**: `runSearch({ q, zone, limit: 24 })`

Elementos:
- `<SearchBar>` con query prefilled
- Grid de resultados con score ranking
- Sugerencia "did you mean" si few results

### `/reportar` — Reportar oferta

**Archivo**: [src/app/reportar/page.tsx](../src/app/reportar/page.tsx)
**Rendering**: estático + client component form
**Server data**: —

Elementos:
- Form con: producto (autocomplete), tienda (autocomplete), precio, foto opcional
- Disclaimer legal
- POST a `/api/reports`

### `/sobre` — Página de about

**Archivo**: [src/app/sobre/page.tsx](../src/app/sobre/page.tsx)
**Rendering**: estático prerender
**Server data**: —

Elementos:
- Qué hacemos, qué NO hacemos, fuentes de datos, cómo nos financiamos, contacto.

### `/legales/*` — Términos, privacidad, takedown

**Archivos**: [src/app/legales/](../src/app/legales/)
**Rendering**: estáticos prerender

- `/legales/terminos`
- `/legales/privacidad`
- `/legales/takedown`

### `/mis-alertas` — Gestión de alertas

**Archivo**: [src/app/mis-alertas/page.tsx](../src/app/mis-alertas/page.tsx)
**Auth**: requiere magic link (Auth.js) — o listar por token en URL
**Server data**: alerts by email

Elementos:
- Lista de alertas activas del usuario
- Toggle activo/pausado, botón cancelar

### `/alerts/verified` · `/alerts/cancelled`

**Archivos**: [src/app/alerts/verified/page.tsx](../src/app/alerts/verified/page.tsx) · [src/app/alerts/cancelled/page.tsx](../src/app/alerts/cancelled/page.tsx)
**Rendering**: estáticos (pages de "gracias")
**Server data**: —

## Rutas admin (requieren magic link + email en `ADMIN_EMAILS`)

### `/admin` — Dashboard

Cards con counts de pending reports + pending normalizer candidates + last ingesta run.

### `/admin/reports`

Cola de reports pending con foto + contexto. Botones approve/reject.

### `/admin/normalizer/candidates`

Cola de fuzzy match candidates. Comparación side-by-side. Botones approve/reject.

## Rutas de sistema

### `/robots.txt`

**Archivo**: [src/app/robots.ts](../src/app/robots.ts)
**Rendering**: estático

Allow: `/`
Disallow: `/admin/`, `/api/`, `/alerts/`, `/mis-alertas`, `/dev/`
Disallow para GPTBot, ChatGPT-User, CCBot, ClaudeBot (no scraping IA sin autorización).

### `/sitemap.xml`

**Archivo**: [src/app/sitemap.ts](../src/app/sitemap.ts)
**Rendering**: dinámico (query DB)

Incluye:
- Core pages (home, ofertas, sobre, legales)
- Top 20k productos canónicos (por `updatedAt` desc)
- 11 chains (`/tienda/[slug]`)

### `/health`

**Archivo**: [src/app/health/route.ts](../src/app/health/route.ts)
**Rendering**: API route

Devuelve `{status, db, commit, version, timestamp}`. Uptime monitors lo llaman
cada 3 min.

### `/dev/components`

**Archivo**: [src/app/dev/components/page.tsx](../src/app/dev/components/page.tsx)
**Rendering**: estático
**Solo dev**: mostrado sólo en NODE_ENV != production (o siempre pero robots block).

Design system playground — todos los primitives + domain components con ejemplos.

## Endpoints API (no son "vistas", pero completan el mapa)

Ver [FLUJO_BACKEND.md](FLUJO_BACKEND.md) sección "Endpoints API".

## Layout global

Todas las páginas usan `<PageShell>`:

```
<PageShell zoneLabel={formatZoneLabel(zone)}>
  <Nav zoneLabel={...} />          {/* incluye NavZoneSlot client */}
  <main>{children}</main>
  <Footer />                        {/* si !hideFooter */}
  <MobileBottomNav />               {/* si !hideMobileNav */}
</PageShell>
```

`zoneLabel` server-side es crítico para que el chip del header muestre la zona
correcta desde el primer paint (evita flash de Palermo). El chip cliente lo
sobreescribe una vez hidratado si hay diferencia con URL/localStorage.

## Metadata SEO por página

- **Home**: title "Barato.ar — Comparador de precios de super, delivery y farmacia en Argentina"
- **Ofertas**: dinámico según filtros + zone
- **Producto/[slug]**: `${producto.name} — desde ${minPrice}` + JSON-LD Product/AggregateOffer
- **Tienda/[slug]**: `Ofertas en ${chain.name}` + zona
- **Sobre**: title "Cómo funciona Barato.ar"
- **Legales**: title del tipo de doc

Canonical URLs siempre absolutos: `${NEXT_PUBLIC_APP_URL}/path`.

## Componentes globales del layout

- **Search bar** en el hero del home y en /buscar (uso principal desde nav en mobile).
- **Zone picker modal** accesible desde Nav (desktop) + MobileBottomNav (mobile).
- **Report button** en Nav ("Reportar oferta") + prominent en /ofertas.
- **Footer**: links a legales + sobre + GitHub del proyecto + "hecho con ❤️ en AR".

## Estado esperado del usuario en cada vista

| Vista | Sin zone en URL | Con zone en URL | Sin localStorage | Con localStorage |
|---|---|---|---|---|
| `/` | Default Palermo (SSR) | Zone del URL | Default | Sync URL en mount |
| `/producto/[slug]` | Default | Zone del URL | Default | Zone de localStorage vía URL sync |
| `/ofertas` | Default | Zone del URL | Default | Zone de localStorage vía URL sync |
| `/tienda/[slug]` | Default | Zone del URL | Default | Zone de localStorage vía URL sync |

**Único caso conflictivo resuelto en F017.3**: user con localStorage="pba-quilmes"
llega a `/` sin `?zone=` → useZone dispara `router.replace(?zone=pba-quilmes)` en
mount → re-render server con zone correcta → hrefs de cards con zone Quilmes.
