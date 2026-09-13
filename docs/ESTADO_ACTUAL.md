# Estado actual del proyecto

Snapshot al 2026-09-13. Actualizar al mergear cambios grandes.

## Resumen ejecutivo

**MVP funcional deployado en producción**: https://barato-ar.vercel.app
Data real de Coto (~17k productos, ~40k precios) ya en Neon.
Falta: completar ingesta de las 7 cadenas SEPA restantes + dominio propio + monetización.

## Features implementados (12/12)

Todas mergeadas en `main`. Cada una tiene su spec en `specs/00X-*/spec.md`.

| # | Feature | Estado | Notas |
|---|---|---|---|
| F001 | Foundation scaffold | ✅ | Next.js + Prisma + Docker + CI |
| F002 | Design system | ✅ | 15 UI primitives + 15 domain components |
| F003 | Ingesta folletos super | ✅ | Parser Carrefour listo; Coto/Día/Jumbo/Vea/Disco pendientes |
| F004 | Ingesta Precios Claros (SEPA) | ✅ | v2 con estructura zip anidada real |
| F005 | Normalizer productos | ✅ | Fuzzy match + admin queue |
| F006 | Búsqueda | ✅ | pg_trgm + autocomplete + did-you-mean |
| F007 | Página comparación producto | ✅ | JSON-LD + segmentado por zona |
| F008 | Feed de ofertas | ✅ | Home + /ofertas con filtros + paginación |
| F009 | Alertas email | ✅ | Doble opt-in via Resend/MailPit |
| F010 | Charts historial | ✅ | Materialized view + endpoint |
| F011 | Community reports | ✅ | Reportar oferta + moderación admin |
| F012 | SEO + performance | ✅ | Sitemap dinámico + legales + Lighthouse |

## Fixes post-MVP aplicados

- **F013**: PCL pipeline reescrito para la estructura real de SEPA (zip anidado por comercio, delimitador `|`, precios inline en productos.csv)
- **F014**: Deep links a PedidosYa/Rappi/MercadoLibre con soporte de afiliados via env vars
- **F015**: Ubicación del usuario — picker de zona persistente en localStorage + geolocation
- **F016**: 18 localidades GBA agregadas al picker (San Isidro, Quilmes, Morón, etc.)
- **F017**: Serie de fixes de propagación de zona (URL → server components → hrefs)
- **F017.5**: Filtrado real por distancia geográfica en query SQL (antes hacía haversine solo para display)
- **F017.6**: Radio default 10km en todo el sitio
- **F017.7**: Deep links usan Google site search cuando no hay afiliado (workaround al selector de dirección de PY/Rappi)
- **F017.8**: `buildDeliveryQuery` limpia códigos SEPA (BOT-750-ml, PCK-6-un, cc→ml)

## Data en producción

**Neon Postgres** (us-east-2):

```
chains: 11        products: 17,607
zones: 33         prices: 39,273
stores: 185       ingestion_runs: pendiente (se resetó tras F013)
```

- Solo Coto está ingested completamente (una corrida truncada por cambios de schema)
- Falta re-ingesta completa con el pipeline nuevo (F013)
- Extensiones activas: `pg_trgm`, `vector`
- Materialized view `price_daily_avg` seedeada

## Infraestructura activa

- ✅ **Vercel**: `barato-ar.vercel.app` — auto-deploy on push to main
- ✅ **Neon Postgres**: `ep-proud-mountain-aenvwxuv` — pooled + unpooled
- ✅ **GitHub**: `cesesteban/barato-ar` — repo privado
- ✅ **Resend**: cuenta con API key, modo sandbox (solo envía a email verificado)
- ✅ **GitHub Actions**: 8 workflows (ingest-flyers, ingest-pcl, alerts-scan, refresh-mv, normalize-weekly, reports-purge, ci, lighthouse)
- ⚠️ **Dominio**: `barato.ar` NO disponible (ocupado); usamos `barato-ar.vercel.app`
- ⏳ **R2**: NO configurado — bloquea photo scraping + hosting de manifest
- ⏳ **Upstash**: NO configurado — uso stub in-memory (funciona, sin persistencia entre restarts)
- ⏳ **Sentry**: NO configurado — errores solo en logs de Vercel
- ⏳ **Plausible**: NO configurado — sin analytics todavía
- ⏳ **Afiliados**: NO configurados — deep links en modo tracking-only

## Tests

Total: **~200 tests unit** pasando (última corrida `pnpm test`).
Cobertura de módulos críticos:
- Ingesta PCL: schemas, zones, geo, dedupe
- Comparación de precios: segmentación por proximidad
- Deep links: URLs con/sin afiliado, cleanup de queries SEPA
- Zone catalog: 15+33 zonas, nearest matching
- Auth tokens, alerts, offers cursor, promos, normalize

E2E: no configurado (fuera de MVP).

## Bugs conocidos / limitaciones

1. **Data**: solo Coto ingested; el resto de cadenas requiere re-ingesta
2. **Fotos**: sin R2 configurado, todos los productos muestran placeholder
3. **Búsqueda**: pg_trgm threshold 0.3 puede perder matches de queries cortos (backlog)
4. **Sitemap**: emite links a `/tienda/[slug]` — están OK ahora, se rompía antes
5. **Home**: hardcodeaba Palermo hasta F017 — fixed pero requiere re-verificar
6. **Alertas en prod**: solo pueden enviar a `ces.esteban@gmail.com` (sandbox Resend)
7. **`/mi-zona`**: no existe como página; el picker se abre desde nav/mobile

## Próximos pasos sugeridos

**Corto plazo (semana)**:
1. Re-ingesta completa de las 7 cadenas SEPA (Carrefour, Día, Jumbo, Disco, Vea, La Anónima, ChangoMás)
2. Definir "oferta real" — filtro por delta ≥ 10% vs promedio 30d (matview lista)
3. Registrarse en MLA Afiliados (5 min, único con auto-registro en AR)
4. Configurar Plausible para tracking de clicks a delivery

**Mediano plazo (1-2 semanas)**:
5. Cloudflare R2 → habilitar photo scraping (Open Food Facts primero)
6. Dominio alternativo (`barato.com.ar` u otro) → verificar en Resend → activar producción de emails
7. Contenido: mejorar `/sobre`, agregar FAQ, blog con 3-5 posts SEO
8. Google Search Console + Bing Webmaster + Rich Results validation

**Largo plazo (mes+)**:
9. Parsers de folleto para Carrefour/Coto/Día (backup a SEPA + fotos + promos exclusivas)
10. Pilot de PedidosYa/Rappi scraping controlado (Cache 12h + rate limit)
11. Freemium: alertas premium ilimitadas, dashboard familiar
12. Partnership B2B con al menos 1 cadena grande
