# Flujo Backend

Todo lo que pasa fuera del render: ingesta de datos, normalizer, cron jobs,
APIs internas, y colas de moderación admin.

## Ingesta de datos (2 pipelines paralelos)

### Pipeline 1: SEPA / Precios Claros (F004, F013)

**Fuente**: dataset abierto del gobierno argentino, publicado diariamente en
`datos.produccion.gob.ar/dataset/sepa-precios`. Zip por día de la semana
(~350 MB), que contiene N zips anidados (uno por comercio).

**Estructura del zip anidado descubierta**:

```
sepa_sabado.zip
  └── 2026-09-12/
        ├── sepa_1_comercio-sepa-3_....zip     (DEHEZA, no mapeado)
        ├── sepa_1_comercio-sepa-9_....zip     (Cencosud: Vea/Disco/Jumbo)
        ├── sepa_2_comercio-sepa-10_....zip    (INC = Carrefour)
        ├── sepa_1_comercio-sepa-12_....zip    (Coto)
        ├── sepa_1_comercio-sepa-15_....zip    (Día)
        ├── sepa_2_comercio-sepa-11_....zip    (Dorinka = ChangoMás)
        ├── sepa_2_comercio-sepa-2_....zip     (S.A. IMP EXP PATAGONIA = La Anónima)
        └── ... (otros comercios no mapeados)
```

**Cada zip anidado contiene 3 CSVs** con delimitador `|` (no `,`) y BOM UTF-8:

- `comercio.csv` — metadata (id_comercio, id_bandera, razón social, nombre bandera)
- `sucursales.csv` — 1 fila por sucursal, ~20 columnas incluyendo lat/lng y horarios
- `productos.csv` — 1 fila por (producto × sucursal), **precios inline** (columnas `productos_precio_lista`, `productos_precio_unitario_promo1/2`)

**Workflow**:

```
GH Actions cron (diario 9am ART)
  ├── pnpm ingest pcl
  │    ├── extractor.ts: descarga zip diario → extract outer → extract N inner zips
  │    ├── runner.ts: loop por commerce zip
  │    │    ├── stores.ts (Pass 1): sucursales.csv → filter isInGBA → upsert Store
  │    │    │                      → cache Map<"idComercio:idBandera:idSucursal", storeId>
  │    │    └── products.ts (Pass 2): productos.csv → resolve EAN → upsert Product
  │    │                              → batch createMany 500 rows Price + PriceHistory
  │    └── recordPerChainRun: IngestionRun con status + counts por chain
  └── refresh materialized view (post-success)
```

**Casos edge manejados**:

- **EAN "0" en Coto/Día**: fallback a `id_producto` si es 13 dígitos válidos.
  Sin fix, se perdía match multi-cadena. Ver `resolveProductKey` en `products.ts`.
- **Cencosud id_comercio=9 con 3 banderas**: mapping `{9:1→vea, 9:2→disco, 9:3→jumbo}`.
- **Prices <1 ARS o >999,999**: skipped (data quality — Decimal(10,4) overflow).
- **Slug uniqueness**: hash FNV-1a del EAN al final del slug para evitar colisiones.
- **Zone FK error**: si `resolveZoneId` devuelve slug no seedeado, retry con `zoneId=null`.
- **CSV con quotes desbalanceadas**: `quote: false` + `relax_quotes: true`.
- **Inner zip vacío/corrupto** (ej. sepa-36): warn + skip, no cortar el batch.

### Pipeline 2: Folletos semanales (F003)

**Fuente**: cada cadena publica un folleto de ofertas semanal en HTML público.

- Carrefour: `/promociones` → link con "folleto" o "revista" → HTML con `article.product-card`
- Coto/Día/Jumbo/Vea/Disco: parsers no implementados aún (roadmap)

**Workflow**:

```
GH Actions cron (lunes 8am ART)
  └── pnpm ingest carrefour (matrix strategy por chain)
       ├── fetcher.ts: politeFetch con User-Agent identificable → HTML
       ├── parser.ts: cheerio → ParsedItem[] {name, brand, size, unit, price, ...}
       └── runner.ts (core): upsertProduct por EAN + upsertPrice
```

**Diferencia vs SEPA**: los folletos incluyen `promo_type` (2x1, 3x2, etc.),
`valid_to` (fecha fin) y `previousPrice` (para calcular discount%). SEPA solo
tiene precio de lista.

## Normalizer (F005)

**Objetivo**: agrupar el mismo producto vendido en varias cadenas bajo un
producto canónico. Sin esto, "Coca 2.25 L" en Carrefour y "Coca-Cola Original
Retornable 2,25L" en Coto son entradas separadas.

**Estrategia por prioridad**:

1. **EAN match** (100% precision) → si dos rows tienen mismo EAN, son el mismo producto.
2. **Fuzzy trigram similarity** (>= 0.85) → borderline candidates encolados en
   `NormalizerCandidate` para review admin.
3. **Rejected** → si admin lo rechaza, se guarda en `NormalizerRejects` para
   no re-proponer.

**Workflow**:

```
GH Actions cron (miércoles 3am ART)
  └── pnpm normalize
       ├── query: productos sin canonicalId, >=2 chains con precio
       ├── por cada candidato: SELECT similar > 0.85
       ├── auto-merge si score > 0.95 y misma marca + mismo tamaño estándar
       └── el resto → NormalizerCandidate.status='pending'
```

**Admin queue**: `/admin/normalizer/candidates` — lista pending con botones
approve/reject.

## Materialized view (F010)

`price_daily_avg` — agrega el promedio de precio diario por (product, chain, zone).

**Refresh**: `refresh-materialized-views.yml` cada 4h con `REFRESH MATERIALIZED VIEW CONCURRENTLY`.

**Uso**:

- En `get-comparison.ts` para el promedio 30d de la zona del usuario.
- Roadmap: filtrar "solo ofertas reales" en `/ofertas` con `WHERE price < avg * 0.9` (delta >= 10%).

## Alertas de precio (F009)

**Flujo double opt-in**:

```
Usuario en /producto/X → AlertCard form
  ├── POST /api/alerts { email, productSlug, minDrop%, zone }
  ├── Alert row created status='pending', verify_token=hmac
  └── Resend envía email con verify link

Usuario click en verify link
  ├── GET /alerts/verify?token=X
  ├── Verify HMAC + expiration (24h) + sha256(token) match DB
  └── Alert.status='verified'; redirect /alerts/verified

Cron alerts-scan (cada 30 min)
  ├── SELECT alerts WHERE status='verified' AND lastNotifiedAt < NOW() - 24h
  ├── Por cada alerta: chequear precio actual vs threshold
  ├── Si trigger: Resend send + alert.lastNotifiedAt = NOW()
  └── EmailEvent audit trail

Link "Cancelar alerta" en cada email
  ├── /alerts/unsubscribe?token=X (sin expiración)
  └── alert.status='cancelled'
```

**Tokens**: HMAC-SHA256 firmados con formato
`<alertId>.<purpose>.<exp>.<nonce>.<sig>`. Guardamos solo el sha256(token) en DB.
Ver `src/lib/tokens.ts`.

## Community reports (F011)

**Flujo público** (sin auth):

```
Usuario en /reportar
  ├── Form con: producto (search), tienda, precio, foto opcional
  ├── (roadmap) Cloudflare Turnstile challenge
  ├── POST /api/reports → Report status='pending'
  ├── ipHash = sha256(ip + daily_salt) — no PII persistida
  └── Redirect a /reportar/gracias con report ID

Admin queue en /admin/reports
  ├── Lista pending con foto + contexto
  ├── Approve → crea Price row source='crowdsourced', dispara revalidate
  └── Reject → Report.status='rejected', razón opcional

Votos comunitarios (soft-moderación)
  ├── Cada report tiene POST /api/reports/[id]/vote {+1|-1}
  ├── upvotes_cache columna denormalizada
  └── (roadmap) auto-approve si upvotes > 10 sin downvotes
```

**Purge**: `reports-purge.yml` semanal, borra rejected > 30 días.

## Endpoints API

| Route | Method | Uso |
|---|---|---|
| `/api/offers` | GET | Paginación scroll infinito de /ofertas |
| `/api/search` | GET | Búsqueda de productos (pg_trgm) |
| `/api/search/autocomplete` | GET | Autocomplete debounced |
| `/api/search/popular` | GET | Sugerencias populares (últimos 7d) |
| `/api/alerts` | POST | Crear alerta (dispara email verify) |
| `/api/alerts/verify` | GET | Callback del magic link |
| `/api/alerts/unsubscribe` | GET | Callback cancelación |
| `/api/reports` | POST | Reportar oferta |
| `/api/reports/[id]/vote` | POST | Voto ↑↓ |
| `/api/admin/reports/[id]/approve` | POST | Admin approve |
| `/api/admin/reports/[id]/reject` | POST | Admin reject |
| `/api/admin/normalizer/candidates/[id]/approve` | POST | Admin approve merge |
| `/api/admin/normalizer/candidates/[id]/reject` | POST | Admin reject merge |
| `/api/product/[slug]/history` | GET | Datos del chart de precios |
| `/api/revalidate` | POST | On-demand revalidate (header `x-revalidate-secret`) |
| `/api/auth/[...nextauth]` | GET/POST | Auth.js magic link flow |
| `/health` | GET | Healthcheck para uptime monitoring |

## Servicios internos

**`src/server/**`** — lógica de negocio agnóstica de HTTP:

- `offers/service.ts` + `offers/query.ts` — feed con dedup + facets + cursor pagination
- `product/get-comparison.ts` — segmentación por proximidad (in_zone / nearby / national)
- `search/service.ts` + `search/query.ts` — pg_trgm ranking + popular tracking
- `history/get-history.ts` — 90d de precios desde matview
- `alerts/service.ts` — crear + verify + trigger

**`src/lib/**`** — utilidades transversales:

- `db.ts` — Prisma client singleton
- `env.ts` — Zod-validated env (falla al boot si inválido)
- `tokens.ts` — HMAC sign/verify
- `redis.ts` — Upstash con stub in-memory
- `mailer.ts` — Resend/MailPit/console cascade
- `units.ts` — normalización tamaños (250 g ↔ 0.25 kg)
- `zones-catalog.ts` — 33 zonas + geo matching
- `deep-links.ts` — URL builders PY/Rappi/ML con UTM + afiliado
- `text-cleanup.ts` — expansión abreviaturas SEPA + strip códigos + strip chain names + dedup words + integración con brand-catalog (F020)
- `brand-catalog.ts` — dictionary de ~90 marcas AR canónicas con aliases; `resolveBrand` + `extractBrandFromName` (F020)
- `urls.ts` — productHref/tiendaHref/ofertasHref (propaga zone)

## Failover

- **DB caída**: server components hacen catch → renderizan vacío + banner.
- **Ingesta falla**: IngestionRun.status='failed'; sitio sigue mostrando última data.
- **Cache Upstash caído**: fallback a stub in-memory automático.
- **Resend rate limit**: reintenta al próximo cron scan (30 min).
- **R2 caído**: `imageUrl` null → placeholder SVG.

## Seguridad

- **Rate limit**: en roadmap (Upstash sliding window).
- **CSP**: Vercel default + tightened en `next.config.js`.
- **CSRF**: SameSite=Strict cookies + POST con origin check.
- **SQL injection**: Prisma ORM + `Prisma.sql` templates (nunca concat manual).
- **Prompt injection en reports**: los admin siempre revisan manualmente.
- **PII**: nunca guardamos ip cruda (siempre ipHash con daily salt).
