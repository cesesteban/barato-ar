# Flujo Frontend

Cómo Next.js 15 App Router renderiza cada request, cómo funcionan los server
components + hidratación cliente, y cómo se propaga el estado del usuario.

## Modelo mental

Next 15 App Router = **por default todos los componentes son server**.
Solo se marcan `"use client"` los que necesitan estado local, browser APIs o
event handlers. Barato.ar sigue este principio: ~90% de componentes son server.

```
Request → Server Component (Prisma) → HTML + streaming → Client hydration
                                                              │
                                                              ▼
                                              interactivity (useZone, forms, modals)
```

## Ciclo de una página (ejemplo: `/producto/coca-cola-2-25?zone=pba-quilmes`)

### 1. Vercel edge recibe request
- Chequea ISR cache (revalidate: 3600 en product page).
- Si cache HIT: sirve HTML pre-renderizado.
- Si cache MISS (o revalidate expired): re-genera.

### 2. Server component ejecuta
- `ProductPage({ params, searchParams })` — `params.slug` + `searchParams.zone`.
- `getComparison({ slug, zoneSlug })` → Prisma raw query joinea prices + stores + chains.
- `getHistory({ slug, zone, days: 90 })` → matview lookup para el chart.
- Ambos en paralelo con `Promise.all`.

### 3. Render de HTML
- `<PageShell zoneLabel={formatZoneLabel(zone)}>` envuelve todo.
- `<Nav>` server component + `<NavZoneSlot>` client component wrapper.
- StoreSection → dedupBy chain → PriceComparisonRow por cada store.
- `<AlertCard>`, `<PriceHistoryCard>`, `<DeliveryLinks>` — client components.
- JSON-LD `<script type="application/ld+json">` inline para SEO.

### 4. Streaming al cliente
- Vercel envía HTML progresivamente (React 19 RSC + Suspense).
- Fallbacks de Suspense (ej. `<PriceHistoryCard>` con skeleton) mientras data carga.

### 5. Hydration cliente
- React hidrata el HTML → componentes client se activan.
- `useZone` hook lee `searchParams` (URL) → si difiere de localStorage → sync.
- Handlers de forms, modals, buttons se enganchan.

## Estado del usuario

### Zone (localidad seleccionada)

**Fuente de verdad DOBLE**:
- **Server-side**: `searchParams.zone` en la URL. Los server components lo leen y renderizan HTML con esa zone.
- **Client-side**: `localStorage["barato.zone"]` + `useZone` hook.

**Sincronización crítica**: cuando el usuario elige una zone en el picker, `setZone(nextSlug)` hace 3 cosas:
1. `setZoneState(nextSlug)` → actualiza state local del hook
2. `localStorage.setItem("barato.zone", nextSlug)` → persiste
3. `router.replace(?zone=X)` → dispara re-render server-side de la página

Y en el mount, si `urlZone` es falsy pero localStorage tiene una zone, el hook
también llama `router.replace()` para que los hrefs server-side se generen
con la zona correcta (fix F017.3).

### Otros

- Filtros de `/ofertas` (chains, minDiscount, vertical, includeNearby) → todo en URL params.
- Alertas: token HMAC en URL (magic link).
- Admin: session cookie via Auth.js.

## Componentes clave y su tipo

| Componente | Tipo | Función |
|---|---|---|
| `<PageShell>` | Server | Layout con Nav + Footer + MobileBottomNav |
| `<Nav>` | Server | Header desktop; recibe `zoneLabel` server-calculado |
| `<NavZoneSlot>` | Client | Wrapper del ZonePicker; pasa `ssrZoneLabel` para no flashear |
| `<ZonePicker>` | Client | Modal Radix; usa `useZone` internamente |
| `<DealCard>` | Server | Card de producto con precio + descuento; href pre-calculado |
| `<PriceComparisonRow>` | Server | Fila de precio por store; F019 arma link externo con `resolveStoreLink`. F021: fallback a Google site search para todos los super sin afiliado (los sites VTEX/custom eran demasiado estrictos con queries SEPA). |
| `<StoreClickTracker>` | Client | Listener global en PageShell; registra evento Plausible "Store Click" cuando el usuario clickea un `<a data-store-click>` externo |
| `<SearchBar>` | Client | Autocomplete con debounce, fetch a /api/search/autocomplete |
| `<AlertCard>` | Client | Form para crear alerta; POST a /api/alerts |
| `<PriceHistoryCard>` | Client wrapper | Recibe initial data server-side, hidrata Chart |
| `<PriceHistoryChart>` | Client | Recharts wrapper (SVG, sin JS pesado extra) |
| `<DeliveryLinks>` | Client | Deep links con click tracking a Plausible |
| `<FiltersSidebar>` | Client | Filtros de /ofertas; usa `useSearchParams` |
| `<InfiniteLoader>` | Client | Paginación scroll infinito de /ofertas |
| `<MobileBottomNav>` | Client | Bottom nav en mobile; incluye Zone picker |
| `<ReportForm>` | Client | Form de reportar oferta (foto opcional) |

## Rutas y sus estrategias de rendering

Ver [VISTAS.md](VISTAS.md) para el mapa completo. Resumen:

- **Estáticas** (prerender, no query DB): `/legales/*`, `/sobre`, `/robots.txt`, `/dev/components`.
- **ISR con revalidate**:
  - `/` → 300s (5 min)
  - `/producto/[slug]` → 3600s (1h)
- **Dynamic (SSR cada request)**: `/ofertas`, `/tienda/[slug]`, `/buscar`, `/mis-alertas`, `/admin/*`.
- **API routes**: `/api/offers`, `/api/search/*`, `/api/alerts/*`, `/api/reports*`, `/api/revalidate`.

## Manejo de errores

- **Server component throws** → Next muestra `error.tsx` (por segmento) o `global-error.tsx`.
- **`notFound()`** → Next muestra `not-found.tsx` del segmento.
- **Fetch fails en client** → toast con Radix + retry manual (no auto).
- **Rate limit alcanzado** (roadmap) → 429 con mensaje amigable.

## Suspense boundaries

- **ZonePicker**: envuelto en `<Suspense>` porque usa `useSearchParams()` (requerimiento Next 15 para páginas estáticas prerenderizadas).
- **PriceHistoryCard**: puede tener Suspense con skeleton mientras chart carga.
- **InfiniteLoader**: sin Suspense — es state local que se llena on-demand.

## Formularios

Todos con validation client-side + server-side (Zod schemas compartidos):

- `/reportar` → POST `/api/reports` (Turnstile en roadmap).
- `<AlertCard>` en detalle producto → POST `/api/alerts` (double opt-in via magic link).
- `<AdminReportRow>` → PATCH `/api/admin/reports/[id]/approve|reject`.
- `<SearchBar>` → GET `/api/search?q=X` (no form, debounced input).

## Analytics tracking

Cuando `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` está configurado, `plausible.js` inyecta
el tracker cookieless. Eventos custom:

- `Delivery Click` con `{ platform, query, affiliate: "yes"|"no" }`
- `Alert Created` con `{ chainSlug, verticalHint }`
- `Report Submitted`

## Performance budget

- **LCP p75 mobile 4G**: < 2.5s (constitución Ppio IV)
- **CLS**: < 0.1 (imágenes con `next/image` + skeletons dimensionados)
- **Bundle JS shared**: ~102 KB gzip (verificado en último build)
- **Fonts**: Inter local con `next/font`, `display: swap`

## Deep links delivery (F014)

**Modo tracking-only** (default, sin env `NEXT_PUBLIC_AFFILIATE_*`):
- PY/Rappi → Google site search (`site:X.com.ar query`).
- ML → URL nativa `/listado/X`.

**Modo afiliado** (con env seteado):
- PY → `/mercados-y-almacenes?searchTerm=X&partnerId=<id>`
- Rappi → `/search?query=X&ref=<id>`
- ML → `/listado/X?matt_word=<id>&matt_tool=88833099`

Todos con UTM `utm_source=barato.ar&utm_medium=deep_link&utm_campaign=comparator`.
Click tracking a Plausible con `props.affiliate: "yes"|"no"` para distinguir revenue.
