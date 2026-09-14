# Auditoría técnica · 2026-09-13

Snapshot honesto del estado real de la app en producción vs lo que dice el spec.
Base para el reordenamiento de `ESTADO_ACTUAL.md`.

**Método**: audit HTTP de todas las rutas + queries directas a Neon + inspección
visual de flujos clave + revisión del código de las últimas 20 iteraciones.

**Deploy auditado**: commit `4990cfe` en `barato-ar.vercel.app`.

## Resumen ejecutivo

- **12 features "✅ done" según spec** → **7 funcionan bien, 4 parcialmente, 1 con bug crítico**.
- **La data es más completa de lo que pensábamos**: 7 cadenas SEPA con 47k productos y 121k precios en Neon.
- **Bug crítico**: TODOS los stores (954) tienen `zone_id = NULL` → "En tu zona" siempre vacío.
- **Deuda visible**: 0% de productos con imagen, muchos nombres/marcas truncados por SEPA, home lenta (5.9s LCP).

## Data en Neon (real)

```
chains: 11             products: 47,116
zones: 33              prices: 121,061
stores (real): 954     price_history: 121,061
stores (geo): 954      alerts: 0
                       reports: 0
                       ingestion_runs: 7
```

### Distribución por cadena

| Cadena | Sucursales | Productos | Precios | Estado |
|---|---|---|---|---|
| carrefour | 35 | 33,590 | 34,956 | 🟢 completo |
| coto | 106 | 14,255 | 26,598 | 🟢 completo |
| disco | 37 | 9,448 | 19,028 | 🟢 completo |
| jumbo | 23 | 9,975 | 14,268 | 🟢 completo |
| vea | 17 | 7,564 | 11,456 | 🟢 completo |
| dia | 734 | 4,367 | 7,580 | 🟡 muchas sucursales, pocos productos (posible bug) |
| la-anonima | 2 | 7,052 | 7,175 | 🟡 solo 2 sucursales (¿filtro GBA muy estricto?) |
| farmacity | 0 | 0 | 0 | ⚫ no ingest (no está en SEPA) |
| changomas | 0 | 0 | 0 | ⚫ no ingest (mapping podría ser wrong) |
| pedidosya | 0 | 0 | 0 | ⚫ deep-link only (spec) |
| rappi | 0 | 0 | 0 | ⚫ deep-link only (spec) |

**Última corrida**: `dia` status=partial rows=17,294 at 2026-09-13T01:16Z.

## Bugs encontrados (por severidad)

### 🔴 Críticos (bloquean funcionalidad core)

**B-01 · Todos los stores con `zone_id = NULL`**
- 954/954 real stores tienen zone_id null en la DB.
- Consecuencia: sección "En tu zona" del detalle producto siempre está vacía. Solo funciona "Cerca de tu zona" (por distancia haversine).
- Root cause: en `src/ingestion/pcl/zones.ts` línea 184, la condición `isCaba` acepta `"caba"`, `"capital federal"`, `"ciudad autonoma..."` PERO no acepta el código SEPA `"AR-C"`. Idem para PBA acepta `"ar-b"` (ya agregado) pero de todas formas `resolveZoneId` puede haber retornado null en el momento de la ingesta previa.
- Fix estimado: 1 línea de código + script de repopulación de zone_id existentes basado en lat/lng → nearestZone.
- Prioridad: **P0**

**B-02 · Home page LCP 5.9s (target 2.5s)**
- Home rinde en ~5.9s en el primer request (curl time_total).
- Backup del budget de constitución (Ppio IV Performance: LCP < 2.5s p75 mobile 4G).
- Causas probables: cold Neon compute + query `safeFeed` sin cache + JSON-LD large + ISR revalidate expiró.
- Fix estimado: verificar cache Vercel + Upstash (no configurado) + query optimization + posiblemente Suspense en el feed grid.
- Prioridad: **P1**

### 🟡 Parciales (funciona pero con degradación visible)

**B-03 · Nombres de productos truncados** ✅ RESUELTO en F020 (2026-09-13)
- Ejemplos reales de Neon: "Gaseo Cola" (Gaseosa Coca Cola), "Gomit Regaliz Frutil", "Alfa Simple Choco", "Queso Muzzare Rectan", "Trapo de Piso Rayado".
- Root cause: SEPA source tiene nombres truncados en algunas cadenas (Coto notoriamente). `cleanProductName` no puede recuperar caracteres que no vinieron.
- Impacto UX: usuario ve nombres feos, dificulta identificar producto sin ver marca + tamaño.
- Fix posible: cross-reference con Open Food Facts por EAN para reemplazar nombre (post-integración R2). Sin OFF, no hay fix.
- Prioridad: **P2**

**B-04 · Marcas truncadas** ✅ RESUELTO en F020 (2026-09-13)
- Ejemplos: "Bulld" (Bulldog?), "Pesca" (Pescador?), "Smack", "Coca" (para Coca-Cola).
- Root cause: mismo que B-03 — SEPA source truncated.
- Impacto UX: display de marca en cards + brand chip en detalle.
- Fix posible: mapping manual de "top 50 marcas AR con nombres canónicos" en `text-cleanup.ts`, más OFF cross-ref.
- Prioridad: **P2**

**B-05 · Sitemap 4.2 MB (posiblemente demasiado)**
- `/sitemap.xml` devuelve 4.26 MB, con 20k productos + core pages + chains.
- Google recomienda sitemaps < 50 MB o < 50k URLs — está OK por eso.
- Pero: el fetch de 4MB frecuente puede impactar egress + performance.
- Fix opcional: split en múltiples sitemap indexed (`sitemap-products-1.xml`, `sitemap-products-2.xml`).
- Prioridad: **P3**

**B-06 · La Anónima solo 2 sucursales**
- La Anónima tiene ~350 sucursales nacionales, muchas en Buenos Aires. Que la ingesta haya tageado solo 2 en GBA sugiere que el filtro `isInGBA` es demasiado estricto para esta cadena O que sus lat/lng vienen mal en SEPA.
- Fix: revisar el CSV real de la última ingesta + ajustar `isInGBA` si aplica.
- Prioridad: **P2**

**B-07 · Día tiene 734 sucursales pero solo 4.367 productos**
- Cencosud/Coto/Carrefour tienen ratio ~200 productos/sucursal. Día tiene ~6.
- Puede indicar: catálogo real más chico en Día (posible), OR ingesta que se cortó a mitad.
- La última corrida fue `dia` status=`partial` — confirma parcial.
- Fix: re-run manual del workflow `ingest-pcl.yml` con `chain: dia`.
- Prioridad: **P2**

**B-08 · 0% de productos con imagen**
- 0 / 47116 productos tienen `imageUrl` seteado.
- Bloqueador: R2 no configurado + photo scraping (Open Food Facts) no implementado.
- Impacto UX: cards y detalle muestran placeholder SVG (bottle glyph) — sitio "look de wireframe".
- Prioridad: **P1** (mejora percibida enorme, ~3h de trabajo cuando R2 esté up)

**B-09 · Search returns "Gaseo Cola" con brand "Coca" al buscar "coca"**
- El search funciona pero devuelve nombres truncados (efecto de B-03).
- Adicionalmente: el ranking por `chainCount=6` sugiere que sí hay match multi-cadena — bueno. Pero el nombre display es feo.
- Fix: mismo que B-03.
- Prioridad: **P2**

### ⚫ No implementado / pendiente config externa

**B-10 · Alerts en prod NO funcionan para usuarios externos**
- 0 alerts creadas en DB → nadie las probó (o el flujo falla).
- Resend en modo sandbox: solo envía a `ces.esteban@gmail.com`.
- Bloqueador: dominio verificado + Resend production mode (requiere DNS del dominio propio, que no tenemos porque `barato.ar` estaba ocupado).
- Prioridad: **P0** para launch — sin esto no hay engagement.

**B-11 · Reports NO probados**
- 0 reports en DB.
- Flujo posiblemente OK pero sin volumen no sabemos. Turnstile antispam NO implementado.
- Prioridad: **P2**

**B-12 · Analytics NO configurado**
- Plausible env `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` vacía → sin métricas.
- Sin analytics: no sabemos qué está usando la gente ni podemos medir el norte star.
- Prioridad: **P0** para pre-launch (5 min de setup)

**B-13 · Sentry NO configurado**
- Sin observability de errores en producción.
- Prioridad: **P1**

**B-14 · Upstash Redis NO configurado**
- Cache stub in-memory funciona para desarrollo pero en Vercel cada instancia serverless tiene su propio cache → cache miss rate alto → costo Neon compute.
- Prioridad: **P1** para performance

**B-15 · R2 NO configurado**
- Bloquea fotos + manifest para SEPA (aunque no lo usamos).
- Prioridad: **P1** para calidad visual

### ⚫ Deuda de contenido / SEO

**B-16 · Contenido del sitio muy magro**
- `/sobre` es minimalista, sin FAQ.
- Sin blog, cero posts SEO.
- Sin Google Search Console verificado.
- Prioridad: **P2** para tracción orgánica.

**B-17 · Sin dominio propio**
- `barato-ar.vercel.app` funciona pero rompe branding.
- `barato.ar` ocupado (registrado por otra persona).
- Sin decisión sobre dominio alternativo (barato.com.ar / baratos.ar / etc.).
- Prioridad: **P1** para credibilidad + emails funcionales.

## Features spec vs realidad

Reevaluación granular de F001-F012 basada en audit:

| F# | Spec dice | Realidad | Estado real |
|---|---|---|---|
| F001 | Foundation scaffold | Deploy OK, migrations OK, Docker OK | 🟢 Completo |
| F002 | Design system | 15+15 componentes, tokens, accesible | 🟢 Completo |
| F003 | Ingesta folletos super | Solo parser Carrefour, no probado en prod | 🟡 Parcial (parser existe, sin data) |
| F004 | Ingesta SEPA | v2 funciona, 7 cadenas con data | 🟡 Funciona pero data truncada + zone_id NULL |
| F005 | Normalizer | Existe la cola admin pero SIN candidatos porque el flujo automático no encoló nada | 🟡 Parcial (no probado a fondo) |
| F006 | Búsqueda pg_trgm | Funciona, devuelve nombres feos | 🟡 Funciona con degradación (B-03) |
| F007 | Comparación producto | Funciona, pero "En tu zona" vacía por B-01 | 🟡 Funciona parcialmente (bug crítico B-01) |
| F008 | Feed ofertas | Funciona, filtros OK, distance filter fixed hoy | 🟢 Funciona (con radios ajustados) |
| F009 | Alertas email | Código completo, en sandbox Resend, 0 probadas | 🔴 No probado en real (B-10) |
| F010 | Charts historial | Matview OK, endpoint OK, chart renderiza | 🟢 Completo (limitado a 1 día de data por ahora) |
| F011 | Community reports | Form OK, admin queue OK, 0 reports probados | 🟡 No probado end-to-end |
| F012 | SEO + performance | Sitemap OK, JSON-LD OK, Lighthouse config OK. LCP roto (B-02) | 🟡 On-page OK, performance real ❌ |

**Score real**: 4 🟢 completo · 7 🟡 parcial · 1 🔴 no probado = **33% completo**, no 100% como decía el doc anterior.

## Bugs cerrados post-audit

- **F021** (2026-09-14): "Ir a la tienda" → Google site search para TODOS los
  super/farmacia (no solo delivery). Los sites VTEX/custom devolvían "producto
  no encontrado" con nuestros queries SEPA porque sus catálogos requieren
  títulos exactos. Google encuentra el producto en el mismo dominio siempre.
  Trade-off: user pasa por Google. Cuando existan deals con afiliado, cambiar
  a `NATIVE_BUILDERS` (exportado desde store-links.ts). Reemplaza el
  comportamiento de F019 que apuntaba directo al site de la cadena.

- **F020** (2026-09-13): calidad de nombres de productos. Pipeline extendido
  (cleanProductName + cleanBrand + brand-catalog nuevo) + repopulate script
  aplicado a los 47,116 products existentes en Neon. Métricas: " C "
  (con truncado) 828→0, " D " 114→0, Cerv/Choc/Gaseo/Alfa/Muzzare/Descrem/
  Semidescre/Rectan todos a 0, códigos SEPA (BOT/PCK/LAT) eliminados del name,
  32 marcas canonicalizadas (Guinn→Guinness, Coca→Coca-Cola, Stell→Stella
  Artois, etc.), 21 brands extraídas del name para productos sin marca raw.
  Búsqueda ahora encuentra "focaccia", "coca cola", "cerveza retornable"
  (0 hits antes). B-03 y B-04 del AUDIT resueltos.
  Ver `specs/020-product-naming-quality/`.

- **F019** (2026-09-13): "Ir a la tienda" ahora abre el sitio real de la cadena
  con búsqueda pre-cargada (VTEX + Coto/La Anónima custom + Farmacity + reuso F014
  para delivery + Google fallback). Antes caía a landing interna `/tienda/[slug]`.
  Ver `specs/019-store-product-links/`.

## Bugs fixed durante esta sesión (F013-F017.8)

Estos NO estaban documentados en la tabla de features, y son un ciclo entero de post-MVP:

| Ref | Descripción | Estado |
|---|---|---|
| F013 | Pipeline PCL reescrito para SEPA real | ✅ merged |
| F014 | Deep links delivery con afiliados | ✅ merged |
| F015 | Zone picker + localStorage + geolocation | ✅ merged |
| F016 | 18 localidades GBA fine-grained | ✅ merged |
| F017.1 | URLs preservan zone entre pages | ✅ merged |
| F017.2 | SSR fallback respeta zone del servidor | ✅ merged |
| F017.3 | localStorage → URL sync en mount | ✅ merged |
| F017.4 | REGIONAL_MAX_KM cap para bucket nacional | ✅ merged |
| F017.5 | Bounding box real en SQL para distance filter | ✅ merged |
| F017.6 | Radio 10 km en todo el sitio | ✅ merged |
| F017.7 | Deep links usan Google site search | ✅ merged |
| F017.8 | `buildDeliveryQuery` limpia códigos SEPA | ✅ merged |

Los 5 primeros (F013-F017.1) se hicieron en la sesión anterior. Los 7 últimos hoy.

## Recomendaciones priorizadas

### Antes del launch público (P0)

1. **Fix B-01**: agregar `"ar-c"` al isCaba + repopular zone_id existentes via nearestZone(lat, lng). ~30 min.
2. **Fix B-10**: registrar dominio (alternativa a barato.ar) + verificar Resend + salir de sandbox. ~2 h (excluye propagación DNS).
3. **Setup B-12**: Plausible (1 env var + 5 min de setup). ~10 min.
4. **Re-ingest Día completo** para llegar a ratio productos/sucursal razonable. ~30 min de espera.

### Post-launch inmediato (P1)

5. **Fix B-02**: profile del LCP + optimizar (Upstash Redis primero). ~2-3 h.
6. **Config B-15**: R2 + Open Food Facts para fotos. ~3 h.
7. **Config B-13**: Sentry. ~30 min.
8. **Config B-14**: Upstash Redis. ~15 min.
9. **Fix B-17**: comprar dominio alternativo. ~15 min + wait DNS.

### Medio plazo (P2)

10. **Fix B-03/B-04**: dictionary de marcas + OFF integration.
11. **Fix B-06/B-07**: revisar filtros de ingesta por cadena.
12. **B-16**: contenido, FAQ, GSC, blog posts iniciales.

## Métricas de calidad reales

Antes de decir "listo para launch":

| Métrica | Actual | Target |
|---|---|---|
| Features completos (🟢) | 4/12 (33%) | 10/12 (83%) |
| Cadenas con data | 7/8 target | 8/8 |
| Sucursales geo-tagged con zone | 0/954 | > 800 |
| Productos con imagen | 0% | > 40% |
| LCP p75 | ~5.9s | < 2.5s |
| Alerts en prod | 0 (sandbox) | funcional para cualquier email |
| Analytics | ninguno | Plausible activo |

## Sobre el proceso

**Aprendizaje**: la métrica "12/12 features ✅" del doc anterior era engañosa porque
medía "spec entregado" no "producto funcional end-to-end". Marcar features como
completos porque su spec fue implementado no significa que el sistema funciona
para el usuario final.

**Nueva heurística**: cada feature tiene 3 dimensiones que hay que checkear:
1. **Código**: ¿la lógica está implementada?
2. **Data**: ¿los datos que la feature consume existen y son correctos?
3. **Config**: ¿todos los env vars y servicios externos están conectados?

Un feature es 🟢 solo si las 3 están OK.
