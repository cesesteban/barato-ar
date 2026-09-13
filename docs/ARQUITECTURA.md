# Arquitectura general

Flujo end-to-end desde que un dato entra al sistema hasta que llega al usuario.

## Vista aérea

```
┌────────────────────┐        ┌────────────────────┐        ┌────────────────────┐
│  Fuentes externas  │        │  Ingesta workflows │        │  Neon Postgres     │
│                    │        │  (GitHub Actions)  │        │                    │
│  • SEPA govt zip   │───────▶│  • ingest-pcl      │───────▶│  chains  zones     │
│  • Folletos web    │───────▶│  • ingest-flyers   │───────▶│  stores  products  │
│  • Reports user    │───────▶│  • Community API   │───────▶│  prices  history   │
│                    │        │                    │        │  alerts  reports   │
└────────────────────┘        └────────────────────┘        └────────────────────┘
                                        │                            │
                                        │  normalize + refresh MV    │
                                        ▼                            │
                              ┌────────────────────┐                 │
                              │  Matview           │                 │
                              │  price_daily_avg   │                 │
                              └────────────────────┘                 │
                                                                     │
                                                                     ▼
                                                          ┌────────────────────┐
                                                          │  Next.js (Vercel)  │
                                                          │                    │
                                       ┌──────────────────┤  Server components │
                                       │                  │  API routes        │
                                       ▼                  │  Cron endpoints    │
                              ┌────────────────────┐      └────────────────────┘
                              │  Cliente (browser) │              ▲
                              │                    │              │
                              │  • ZonePicker      │              │
                              │  • Search UI       ├──────────────┘
                              │  • Alerts form     │  /api/*
                              │  • Deep links      │
                              └────────────────────┘
                                       │
                                       │  clicks
                                       ▼
                              ┌────────────────────┐
                              │  Delivery apps     │
                              │  • PedidosYa       │
                              │  • Rappi           │
                              │  • MercadoLibre    │
                              └────────────────────┘
```

## Ciclo de vida de un dato (ejemplo: "Coca-Cola 2.25L")

**T0 · Fuente**
- SEPA publica el snapshot diario a las ~5am ART en `datos.produccion.gob.ar`.
- Los precios crudos vienen en un zip por comercio (id_comercio=10 = INC = Carrefour), delimitador `|`.

**T1 · Ingesta (GH Actions, 9am ART)**
- `ingest-pcl.yml` corre → descarga el zip diario → extrae → itera cada commerce zip.
- Por cada commerce: pass 1 (sucursales, filtro GBA) → pass 2 (productos + precios).
- Deduplica por EAN → upsert Product → batch-insert Prices.
- Al terminar: registra `IngestionRun` por chain touched.

**T2 · Post-proceso**
- `refresh-materialized-views.yml` (cada 4h) → REFRESH CONCURRENTLY `price_daily_avg`.
- `normalize-weekly.yml` (miércoles) → fuzzy match de productos sin EAN estándar.
- `alerts-scan.yml` (cada 30min) → dispara emails cuando precio cae bajo umbral.

**T3 · Revalidate**
- Al terminar cada IngestionRun exitoso: llama a `POST /api/revalidate` con tags
  (`offers-feed`, `producto:coca-cola-2-25`) → Next invalida el ISR cache.

**T4 · Request de usuario**
- Usuario abre `barato-ar.vercel.app` (o su URL con zone).
- Vercel edge sirve la respuesta cacheada si ISR está frío; sino re-renderiza.
- Server component consulta Prisma → `runOffers(zone)` → devuelve top 8 deals.
- Hydration client: `useZone` lee URL + localStorage → chip del header.
- Client interactivity: search-as-you-type, filtros, ZonePicker modal.

**T5 · Interacción con delivery**
- Usuario click "Buscar en PedidosYa" en la card de un producto.
- `buildDeliveryQuery` limpia el nombre (saca códigos SEPA, EANs).
- URL construida: si hay afiliado en Vercel env → URL nativa; sino → Google site search.
- Nueva pestaña se abre → analytics registra evento `Delivery Click`.

## Capas

### Layer 0 — Datos externos

- SEPA (dataset abierto, HTTP público, sin auth)
- Folletos de cadenas (HTML público, scraping polite con rate limit)
- Community reports (POST desde `/reportar` con Turnstile en roadmap)

### Layer 1 — Ingesta

- Runs en Ubuntu latest (GH Actions), Node 20, pnpm.
- Sin state entre runs — cada run es idempotente (upsert por EAN, `skipDuplicates` en createMany).
- Timeout máximo: 90 min por corrida (PCL completo ~30-60 min).

### Layer 2 — Datos (Neon)

- Postgres 16 con `pg_trgm` + `vector`.
- Pooling: `-pooler` connection para app, direct para migrations + ingest.
- Modelos principales: `Chain` (11) → `Store` (~185+) → `Product` (~17k+) → `Price` (~40k+).
- Materialized view `price_daily_avg` para queries de "delta vs promedio".

### Layer 3 — Server (Next.js)

- **Server components**: renderizan HTML con datos frescos de Prisma.
- **API routes**: `/api/offers`, `/api/search`, `/api/alerts`, `/api/reports`, `/api/revalidate`.
- **Middleware**: rate limiting, geo hints (roadmap).
- **Static generation**: sitemap.xml, robots.txt, legales.

### Layer 4 — Client (React)

- Hooks propios: `useZone`, `useAlertToken` (roadmap).
- Componentes client marcados con `"use client"` — mínimo posible.
- Radix UI para primitives (dialog, tooltip, popover).
- `next/font` con Inter local para performance.

### Layer 5 — Outbound

- **Emails**: Resend (prod) / MailPit (dev) — magic links, alerts.
- **Deep links**: PY/Rappi/ML con URLs construidas + UTM tracking.
- **R2**: fotos de productos + reports user-uploaded.
- **Sentry / Plausible**: errors + analytics.

## Sincronización + consistencia

- **Read-your-writes NO garantizado** — post-ingesta, el ISR puede tardar hasta 5 min
  en actualizar salvo que `/api/revalidate` sea llamado (siempre lo es).
- **Cache Upstash 60s** en `runOffers` — usuarios pueden ver un delta hasta 60s.
- **localStorage** del usuario es la fuente para la zone chip client-side; URL
  es la fuente server-side. `useZone` los sincroniza.

## Failure modes conocidos

| Falla | Efecto usuario | Mitigación |
|---|---|---|
| Neon caído | Home muestra "0 ofertas" | `safeFeed()` con try/catch, ISR sirve versión anterior |
| SEPA no publica el día | Sin data nueva | Última data 14 días atrás sigue visible (filtro `captured_at > NOW() - 14 days`) |
| Resend rate limit | Alertas encoladas fallan | Cron reintenta cada 30 min |
| R2 caído | Fotos no cargan | Placeholder SVG por vertical |
| PY bloquea Google search | Deep link 0 resultados | Fallback a URL nativa con afiliado (cuando exista) |

## Escalabilidad (dimensionamiento actual)

- **Requests**: ~10k page views / día = fits en Vercel Hobby (100 GB-hrs).
- **Neon compute**: 0.25 CU autoscale → suficiente para <1M rows totales.
- **Ingesta**: 90 min máximo por corrida; SEPA snapshot ~350MB.
- **Costos**: $0/mes en free tiers hasta ~100k users/mes.

Cuando pase de eso: Vercel Pro ($20/mes), Neon Launch ($19), Resend Pro ($20), Upstash Pay-as-you-go.
