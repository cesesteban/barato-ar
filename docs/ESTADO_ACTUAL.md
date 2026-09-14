# Estado actual del proyecto

Snapshot al **2026-09-13 · commit `4990cfe`**. Basado en auditoría real —
ver [AUDIT.md](AUDIT.md) para el detalle metodológico.

## TL;DR

**Un MVP funcional pero con bugs por resolver antes del launch público.**

- ✅ Deploy en producción (`barato-ar.vercel.app`)
- ✅ 7 cadenas SEPA con 47k productos + 121k precios en Neon
- 🟡 12 features implementados pero solo 4/12 realmente completos end-to-end
- 🔴 1 bug crítico (`zone_id` NULL en todos los stores → "En tu zona" siempre vacío)
- 🔴 Home LCP 5.9s (target 2.5s)
- ⚫ Sin dominio propio, sin fotos, sin analytics, alerts en sandbox Resend

**Distancia estimada al launch público**: ~15-20 h de trabajo (fixes P0 + configs P0-P1).

## Sistema de scoring

Cada feature/componente evaluado en **3 dimensiones**:

- **Código**: ¿la lógica está implementada?
- **Data**: ¿los datos que consume existen y son correctos?
- **Config**: ¿los env vars y servicios externos están conectados?

Estado: 🟢 Completo · 🟡 Parcial · 🔴 Roto · ⚫ No implementado / no configurado.

## Features (F001–F012 + F013–F017)

### Foundation

| # | Feature | Código | Data | Config | Estado |
|---|---|---|---|---|---|
| F001 | Foundation scaffold | 🟢 | — | 🟢 | 🟢 |
| F002 | Design system | 🟢 | — | 🟢 | 🟢 |

### Ingesta

| # | Feature | Código | Data | Config | Estado |
|---|---|---|---|---|---|
| F003 | Ingesta folletos | 🟡 (solo Carrefour) | 🔴 (no probado en prod) | 🟢 | 🟡 |
| F004 | Ingesta SEPA (v2) | 🟢 | 🟡 (7/8 cadenas, calidad variable) | 🟢 | 🟡 |

### Domain features

| # | Feature | Código | Data | Config | Estado |
|---|---|---|---|---|---|
| F005 | Normalizer | 🟢 | 🟡 (0 candidatos encolados) | 🟢 | 🟡 |
| F006 | Búsqueda | 🟢 | 🟡 (nombres truncados) | 🟢 | 🟡 |
| F007 | Comparación producto | 🟢 | 🔴 (zone_id NULL) | 🟢 | 🔴 |
| F008 | Feed ofertas | 🟢 | 🟡 (filtros ok, data limitada) | 🟢 | 🟢 |
| F009 | Alertas email | 🟢 | ⚫ (0 alerts) | 🔴 (Resend sandbox) | 🔴 |
| F010 | Charts historial | 🟢 | 🟡 (1 día de data) | 🟢 | 🟢 |
| F011 | Community reports | 🟢 | ⚫ (0 reports) | 🟡 (sin Turnstile) | 🟡 |
| F012 | SEO + performance | 🟢 | 🟢 | 🔴 (LCP 5.9s) | 🟡 |

### Post-MVP shipped (F013–F017)

Todos code-complete y mergeados:

| # | Descripción | Estado |
|---|---|---|
| F013 | PCL pipeline reescrito para SEPA real | 🟢 |
| F014 | Deep links delivery con afiliados | 🟢 |
| F015 | Zone picker + localStorage + geolocation | 🟢 |
| F016 | 18 localidades GBA fine-grained | 🟢 |
| F017 | Zone propagation across pages (7 sub-fixes) | 🟢 |
| F019 | "Ir a la tienda" externo (VTEX + custom + F014 reuso + Google fallback + tracking) | 🟢 |
| F020 | Calidad de nombres (brand-catalog + text-cleanup extendido + repopulate 47k) | 🟢 |
| F021 | "Ir a la tienda" → Google site search para todos los super sin afiliado | 🟢 |

**Score real global**:
- 🟢 Completos: **6/17** (F001, F002, F008, F010, F013-F017 counted como 1)
- 🟡 Parciales: **8/17**
- 🔴 Bloqueados: **3/17** (F007, F009, F012)

## Data en producción (Neon)

```
chains: 11             stores (real): 954
zones: 33              stores (geo-tagged): 954
products: 47,116       stores con zone_id: 0    ← BUG
prices: 121,061        alerts: 0
price_history: 121,061 reports: 0
                       ingestion_runs: 7
```

### Distribución por cadena

| Cadena | Sucursales | Productos | Precios | Estado data |
|---|---|---|---|---|
| carrefour | 35 | 33,590 | 34,956 | 🟢 completo |
| coto | 106 | 14,255 | 26,598 | 🟢 completo |
| disco | 37 | 9,448 | 19,028 | 🟢 completo |
| jumbo | 23 | 9,975 | 14,268 | 🟢 completo |
| vea | 17 | 7,564 | 11,456 | 🟢 completo |
| dia | 734 | 4,367 | 7,580 | 🟡 ratio anómalo prod/sucursal |
| la-anonima | 2 | 7,052 | 7,175 | 🟡 solo 2 sucursales (¿filtro?) |
| farmacity | — | — | — | ⚫ no en SEPA |
| changomas | — | — | — | ⚫ mapping wrong / no ingest |
| pedidosya | — | — | — | ⚫ deep-link only |
| rappi | — | — | — | ⚫ deep-link only |

**Última ingesta**: dia · status=partial · 17,294 rows · 2026-09-13T01:16Z.

## Bugs actuales (top priorizados)

Detalle completo en [AUDIT.md](AUDIT.md).

### 🔴 P0 — bloquean launch

- **B-01** · Todos los stores con `zone_id = NULL` (root: `resolveZoneId` no acepta código `AR-C` de SEPA)
- **B-10** · Alerts en modo sandbox Resend (solo envía a mi email)
- **B-12** · Analytics NO configurado (sin métricas de tracción)
- **B-17** · Sin dominio propio (bloquea Resend + branding)

### 🟡 P1 — impacto grande en calidad

- **B-02** · Home LCP 5.9s vs target 2.5s
- **B-08** · 0% de productos con imagen
- **B-13** · Sentry NO configurado
- **B-14** · Upstash Redis NO configurado
- **B-15** · R2 NO configurado

### 🟢 P2 — mejoras iterativas

- **B-03** · Nombres truncados en algunas cadenas (SEPA source data)
- **B-04** · Marcas truncadas (SEPA source data)
- **B-05** · Sitemap 4.2 MB (podría split)
- **B-06** · La Anónima solo 2 sucursales
- **B-07** · Día partial (734 stores, solo 4k productos)
- **B-09** · Search devuelve nombres feos (efecto de B-03)
- **B-11** · Reports sin Turnstile antispam
- **B-16** · Contenido/blog vacío

## Infraestructura

| Servicio | Estado |
|---|---|
| Vercel Hobby | 🟢 activo, auto-deploy on push a main |
| Neon Postgres | 🟢 activo, `pg_trgm` + `vector` habilitadas |
| GitHub | 🟢 repo privado `cesesteban/barato-ar` |
| GitHub Actions | 🟢 8 workflows configurados |
| Resend | 🟡 API key OK, modo sandbox |
| Cloudflare R2 | ⚫ NO configurado (bloquea fotos) |
| Upstash Redis | ⚫ NO configurado (usa stub in-memory) |
| Sentry | ⚫ NO configurado |
| Plausible | ⚫ NO configurado |
| Dominio propio | ⚫ NO — `barato.ar` ocupado |
| MailPit (dev) | 🟢 local via docker-compose |

## Performance

Medidas reales (curl, primer request tras cold Neon):

| Ruta | Tiempo | Tamaño | Estado |
|---|---|---|---|
| `/` (home) | 5.9s | 78 KB | 🔴 sobre budget |
| `/ofertas` | 1.4s | 99 KB | 🟢 |
| `/buscar?q=cerveza` | 0.7s | 60 KB | 🟢 |
| `/producto/[slug]` | ~1s | ~150 KB | 🟢 |
| `/tienda/coto` | 2.6s | 122 KB | 🟡 |
| `/tienda/carrefour` | 1.1s | 139 KB | 🟢 |
| `/sitemap.xml` | 1.3s | 4.26 MB | 🟡 (peso) |

Budget de constitución: LCP < 2.5s p75 mobile 4G. **La home rompe el budget**.

## Tests

**Total**: ~200 unit tests pasando (`pnpm test`).

**Cobertura**:
- ✅ Ingesta PCL: schemas, zones, geo, EAN dedup
- ✅ Comparison: bucketing, dedup por chain
- ✅ Deep links: URLs con/sin afiliado, cleanup queries SEPA
- ✅ Zone catalog: 33 zonas, nearest matching
- ✅ Utils: tokens HMAC, format-price, promo parsing
- ⚫ E2E: no configurado (fuera de MVP)
- ⚫ Visual regression: no configurado

## Deuda técnica reconocida

Ordenada por impacto:

1. **Fix B-01** (zone_id NULL) — bloquea el flujo core de "productos cerca tuyo"
2. **Setup dominio + Resend prod** — habilita monetización futura + alerts reales
3. **Profile LCP home** — puede requerir cache Upstash + query dedicada + Suspense
4. **Photo scraping (OFF + R2)** — cambia percepción del sitio de "wireframe" a "producto real"
5. **Dictionary de marcas AR + OFF cross-ref** — arregla nombres/marcas truncados
6. **Content**: FAQ + 3-5 blog posts SEO — necesario para tracción orgánica
7. **Turnstile antispam** en /reportar — necesario si abrimos community reports públicamente
8. **Rate limiting** en `/api/*` — necesario si tenemos volumen
9. **E2E tests** con Playwright — para regressions cuando la superficie crezca

## Métricas objetivo pre-launch

Para poder decir "listo para lanzamiento público":

| Métrica | Actual | Target | Bloqueador |
|---|---|---|---|
| Features 🟢 completos | 6/17 (35%) | ≥13/17 (76%) | Fixes P0 |
| Cadenas con data completa | 5/8 SEPA | ≥7/8 | Re-ingest día + la-anonima |
| Sucursales con zone_id | 0/954 | ≥800/954 | B-01 |
| Productos con imagen | 0% | ≥40% | R2 + OFF |
| LCP p75 mobile | 5.9s | <2.5s | B-02 |
| Alerts funcional prod | ❌ | ✅ | Dominio + Resend |
| Analytics activo | ❌ | ✅ | Plausible env |
| Al menos 1 canal afiliado | ⚫ | ✅ | MLA registration |

## Roadmap sugerido a la luz del audit

**Semana 1 (P0)**:
1. Fix B-01 (zone_id) + repopular via script + re-verify → 1h
2. Registrar dominio alternativo (`barato.com.ar` o `baratos.ar` en Cloudflare Registrar) → 30min + wait DNS
3. Verificar dominio en Resend → 30min + wait DNS
4. Registrarse en MLA Afiliados + pegar ID en Vercel → 20min
5. Activar Plausible → 10min
6. Re-ingest día completo → 30min

**Semana 2 (P1)**:
7. Configurar R2 → 30min
8. Implementar photo scraping via OFF (script cron) → 3h
9. Configurar Sentry + Upstash → 45min
10. Profile + fix LCP de la home → 2-3h
11. Publicar el sitio con dominio nuevo → activar

**Semana 3+ (P2)**:
12. Dictionary de marcas + OFF cross-ref → 4h
13. Turnstile en /reportar → 30min
14. Rate limit `/api/*` → 1h
15. Blog posts iniciales → 4-6h de contenido
16. Google Search Console + Bing → 20min

## Cambios desde el doc anterior

Este documento reemplaza al anterior "12/12 ✅" que era optimista.

**Diferencias clave**:
- Sistema de scoring en 3 dimensiones (código/data/config) en vez de solo "spec entregado"
- Bugs enumerados con IDs para trazabilidad
- Data real de Neon incluida (contradice varios supuestos anteriores)
- Distancia real al launch estimada en horas de trabajo, no vagamente
- Referencia cruzada con [AUDIT.md](AUDIT.md) para el detalle
