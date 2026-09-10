# Plan de Desarrollo — Comparador de Ofertas por Zona

> Producto: web pública que detecta y compara las mejores ofertas de delivery, supermercados, farmacias y bebidas en CABA + GBA.
> Filosofía: MVP acotado, escalable, foco en velocidad y SEO.

---

## 1. Propuesta de valor

> **"Encontrá el precio más bajo de lo que vas a comprar, sin importar la app."**

Un solo lugar para:
- Buscar un producto y ver dónde está más barato en tu zona.
- Ver el feed diario de las mejores promos (ordenadas por % descuento y validez).
- Suscribir un producto por email y recibir alerta cuando baja.
- Ver el historial de precios y saber si "la oferta" es realmente oferta.

## 2. Nombre y marca (a decidir)

Sugerencias para el brief de diseño:
- **Precioya** / **Bajón** / **Ofertómetro** / **Chirola** / **Barato.ar** / **Quilombo de Ofertas**

## 3. Arquitectura técnica

```
┌────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js 15)                    │
│  - App Router + Server Components                               │
│  - SSG para landing y páginas de producto (SEO crítico)         │
│  - ISR para revalidar cada X minutos                            │
│  - Tailwind + shadcn/ui (estilo Notion/Linear)                  │
└──────────────────────┬─────────────────────────────────────────┘
                       │ tRPC / Server Actions
┌──────────────────────┴─────────────────────────────────────────┐
│                    API Layer (Next.js Route Handlers)           │
│  - Búsqueda (full-text sobre productos)                         │
│  - Feed ofertas (rankeadas)                                     │
│  - Suscripciones a alertas (email-only)                         │
│  - Reportes de la comunidad                                     │
└──────────────────────┬─────────────────────────────────────────┘
                       │ Prisma
┌──────────────────────┴─────────────────────────────────────────┐
│                    Postgres (Neon/Supabase)                     │
│  Tablas: products, prices, offers, stores, zones,               │
│          price_history, alerts, user_reports                    │
│  Extensiones: pg_trgm (búsqueda), pgvector (matching)           │
└──────────────────────┬─────────────────────────────────────────┘
                       │
┌──────────────────────┴─────────────────────────────────────────┐
│                    Workers de ingesta (Cron)                    │
│  - GitHub Actions o Trigger.dev                                 │
│  - Scrapers Node/Playwright por cadena                          │
│  - Parser de folletos (PDF → productos)                         │
│  - Ingesta Precios Claros (SEPA)                                │
│  - Normalizador (matching de "Coca 2.25L" en distintas cadenas) │
└─────────────────────────────────────────────────────────────────┘
```

### Stack final

- **Framework**: Next.js 15 (App Router) + TypeScript
- **UI**: Tailwind CSS + shadcn/ui + Radix + Lucide icons
- **DB**: Postgres (Neon Serverless) + Prisma ORM
- **Búsqueda**: Postgres full-text + pg_trgm para MVP; migrar a Meilisearch/Typesense si escala
- **Cache**: Vercel Data Cache + Redis (Upstash) para queries calientes
- **Jobs / cron**: GitHub Actions (gratis, suficiente para MVP semanal-diario)
- **Emails**: Resend (alertas) — plan gratis alcanza para MVP
- **Deploy**: Vercel (Next.js) + Neon (DB) + Upstash (Redis) — todo tier gratis inicial
- **Analytics**: Plausible o Umami (self-hosted, privacy-first)
- **Monitoring**: Sentry (errores) + Better Stack (uptime)

## 4. Modelo de datos (core)

```sql
zones          (id, name, slug, lat, lng, radius_km)
stores         (id, name, slug, chain_id, zone_id, platform)  -- ej: "Coto Palermo"
chains         (id, name, slug, logo_url, vertical)           -- carrefour, coto, pedidosya...
products       (id, name, normalized_name, brand, size, unit,
                category, image_url, ean_code)
prices         (id, product_id, store_id, price, currency,
                is_offer, offer_pct, valid_from, valid_to,
                source, captured_at)
price_history  (product_id, store_id, price, captured_at)     -- append-only
offers         (id, title, description, product_id, store_id,
                zone_id, discount_pct, badge, valid_from,
                valid_to, source_url, upvotes)
alerts         (id, email, product_id, target_price,
                zone_id, created_at, verified, unsubscribe_token)
reports        (id, email_or_ip, product_id, store_id, price,
                photo_url, status)  -- crowdsourcing con moderación
```

**Clave**: la tabla `products` con `normalized_name` + `ean_code` permite matchear el mismo producto entre cadenas ("Coca-Cola 2.25L Retornable" en Carrefour y "Gaseosa Coca-Cola 2.25 L" en Día).

## 5. Estrategia de ingesta de datos

### Fase 1 (Semana 1-2) — Supermercados por folleto
- Parser de folletos PDF/HTML semanales de Carrefour, Coto, Día, Jumbo.
- Cron semanal (lunes 8am) que descarga y parsea.
- **Ventaja**: dato legal, estable, el folleto ES el vector de ofertas del super.

### Fase 2 (Semana 3-4) — Precios Claros + APIs privadas
- Ingesta del dataset SEPA (Precios Claros).
- Scrapers de los buscadores JSON internos (`/api/search`) de las webs de super — la mayoría exponen JSON sin auth.

### Fase 3 (Semana 5-6) — Crowdsourcing
- Formulario público "Reportá una oferta" con foto opcional.
- Moderación por rate-limit (IP) + votos de la comunidad + revisión manual básica.

### Fase 4 (post-MVP) — Delivery
- Evaluar scraping controlado de PedidosYa/Rappi (menús públicos, no requiere login).
- Alternativa: alianzas / afiliados si el tráfico lo justifica.

## 6. Roadmap por sprints (6 semanas al MVP)

| Sprint | Duración | Entregables |
|---|---|---|
| **S1: Foundation** | Semana 1 | Repo, Next.js base, DB schema, deploy pipeline, sistema de diseño (tokens, shadcn), landing con hero + feed mock |
| **S2: Ingesta base** | Semana 2 | Parsers de 2 folletos (Carrefour + Coto), cron, ingesta Precios Claros, normalizador básico |
| **S3: Búsqueda + comparación** | Semana 3 | Página de producto (comparación multi-cadena), buscador, ranking de tiendas por zona |
| **S4: Feed de ofertas** | Semana 4 | Homepage con feed ordenado, filtros por vertical/zona/descuento, badges de urgencia |
| **S5: Alertas + Historial** | Semana 5 | Suscripción email por producto, cron de detección de bajas, gráfico de historial en página de producto |
| **S6: Comunidad + pulido** | Semana 6 | Formulario de reporte de ofertas, moderación básica, SEO on-page, sitemap, OG tags, Lighthouse ≥ 95, launch |

## 7. Estructura de páginas

```
/                          — Home: feed de mejores ofertas del día + búsqueda
/ofertas                   — Feed completo con filtros
/ofertas/[categoria]       — Ofertas por vertical (super, farmacia, delivery)
/producto/[slug]           — Detalle de producto: comparación de precios,
                             historial, alerta, tiendas cercanas
/tienda/[slug]             — Perfil de tienda: ofertas actuales, folleto
/buscar?q=coca             — Resultados de búsqueda
/mi-zona                   — Selector de zona (guardado en localStorage)
/reportar                  — Formulario de crowdsourcing
/sobre                     — About + cómo funciona
/api/*                     — Route handlers
```

## 8. SEO — pilar estratégico

Un sitio de ofertas vive del SEO. Prioridades:
- **SSG por producto y por categoría** (miles de páginas indexables).
- **Schema.org**: `Product`, `Offer`, `AggregateOffer`, `PriceValidUntil`.
- **URLs semánticas**: `/producto/coca-cola-2-25l` no `/p/1234`.
- **Sitemap dinámico** que se regenera con la ingesta.
- **Long-tail queries**: "coca cola 2.25 oferta", "precio arroz gallo palermo", "carrefour miércoles frutas".

## 9. Consideraciones legales y éticas

- **Robots.txt / crawl-delay respetuoso** en scrapers propios.
- **Fuentes secundarias por default**: folletos, Precios Claros, crowdsourcing. Scraping de delivery apps solo si el proyecto crece.
- **Disclaimer visible**: precios son referenciales y pueden variar.
- **DMCA / takedowns**: proceso claro para que una cadena pida retirar contenido.
- **GDPR / Ley 25.326 (AR)**: email de alertas requiere doble opt-in y opción unsubscribe en cada correo.

## 10. Monetización futura (post-MVP)

1. **Programas de afiliados** (Mercado Libre, Awin, cadenas con programa propio).
2. **Ads nativos** — pero cuidados (destruye la UX si se abusa).
3. **Alertas premium** ($ mensual bajo: alertas ilimitadas, notificaciones push).
4. **API B2B** para comercios que quieran los datos de mercado.

## 11. Métricas norte

- **Sesiones/mes** (SEO tracking).
- **Búsquedas únicas** (¿qué buscan? = qué scrappear).
- **CTR a tienda** (indica utilidad real).
- **Alertas activas** (retención suave sin cuenta).
- **Aportes de comunidad aceptados** (indicador de PMF si crece).

## 12. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Cambios frecuentes en las webs scrapeadas | Tests por scraper + alerta Sentry si baja tasa de éxito |
| Bloqueo IP en scraping | Rotación de user-agents, proxies residenciales si es necesario |
| Datos desactualizados generan desconfianza | Mostrar `capturado_hace: 2h` en cada precio, marca visual |
| Baja calidad de datos crowdsourced | Moderación + reputación de reporter + fotos requeridas |
| ToS violations | Empezar con folletos + Precios Claros (100% legal); delivery es P2 |
