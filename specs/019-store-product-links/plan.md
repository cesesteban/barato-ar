# Implementation Plan: "Ir a la tienda" → producto en el sitio de la cadena (F019)

**Branch**: `019-store-product-links` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

## Summary

Reemplazar el fallback interno (`tiendaHref(chainSlug, zone)` → landing propia)
por URLs externas al sitio real de cada cadena, con búsqueda pre-cargada. Nueva
biblioteca `src/lib/store-links.ts` con un builder por cadena (~7 super + 1
farmacia + reuso de F014 para 3 delivery). Priority order:

1. `storeProductUrl` explícito (parser folleto lo capturó) → PDP directo
2. Builder específico por chain (`store-links.ts`)
3. Reuso de `DELIVERY_PARTNERS` (F014) para PY/Rappi/ML
4. Fallback Google site search sobre `chain.websiteUrl`

Modificación mínima en `<PriceComparisonRow>` (recibe `chain.websiteUrl` como
prop opcional) y en `get-comparison.ts` (join a chain para exponer `websiteUrl`).

## Technical Context

**Language/Version**: TypeScript 5.6 strict (Node 20)

**Primary Dependencies**: ninguna nueva — reutiliza F014 (`deep-links.ts` + `buildDeliveryQuery`) y Next Link

**Storage**: sin cambios — usa `Chain.websiteUrl` (ya seedeado), `Price.storeProductUrl` (opcional, ya en schema)

**Testing**: Vitest — `tests/unit/lib/store-links.test.ts` con casos por cadena

**Target Platform**: server components (Next 15 App Router) — links renderizados en HTML

**Project Type**: web-service

**Performance Goals**: builders puros — O(1) por row. Sin impacto en RSC render time.

**Constraints**:
- Sin fetch cross-origin (CORS + performance)
- Sin scraping (Principio VI Legality First)
- URLs abren en new tab con `noopener noreferrer nofollow` (best practice SEO)

**Scale/Scope**:
- 11 chains cubiertas (8 con builder específico + 3 delivery via F014)
- Cada `/producto/[slug]` puede renderizar hasta ~15 links (5 in-zone + 5 nearby + 5 nacional)

## Constitution Check

- ✅ **I. SEO-First**: los links salen del sitio pero `rel="nofollow"` evita fuga de link juice; `rel="sponsored"` cuando exista afiliado
- ✅ **II. Data honesty**: mostramos link claramente labelled "Ir a la tienda" (usuario espera salir), UTM sí, no dark patterns
- ✅ **III. Testability**: test unit por builder (7 super + 1 farmacia + fallback)
- ✅ **IV. Privacy**: no tracking cross-site propio; el user va al sitio de la cadena y AHÍ ellos lo trackean (fuera de nuestro dominio)
- ✅ **V. Performance**: builders son puros, sin overhead
- ✅ **VI. Legality**: solo redirección a URL público (no scraping). Deep-linkeamos a búsqueda pública que cualquiera puede visitar
- ✅ **VII. Operational simplicity**: 1 archivo nuevo (`store-links.ts`) + 1 archivo test + edit chico en `PriceComparisonRow` y `get-comparison.ts`
- ✅ **VIII. Accesibilidad**: `<a>` con `aria-label` descriptivo + `target="_blank"` anunciado con "(abre en nueva pestaña)"

**Gate**: ✅ pasa sin violaciones.

## Phase 0 — Research

### U-1: URL patterns de search por cadena

Investigado con navegadores + docs públicos:

| Cadena | Pattern de búsqueda | Notas |
|---|---|---|
| Carrefour | `https://www.carrefour.com.ar/{slug}?_q={q}&map=ft` | VTEX standard |
| Coto | `https://www.cotodigital3.com.ar/sitios/cdigi/browse?Ntt={q}` | Endeca/Oracle Commerce |
| Día | `https://diaonline.supermercadosdia.com.ar/{slug}?_q={q}&map=ft` | VTEX standard |
| Jumbo | `https://www.jumbo.com.ar/{slug}?_q={q}&map=ft` | VTEX standard |
| Vea | `https://www.vea.com.ar/{slug}?_q={q}&map=ft` | VTEX standard |
| Disco | `https://www.disco.com.ar/{slug}?_q={q}&map=ft` | VTEX standard |
| La Anónima | `https://laanonimaonline.com/busqueda?q={q}` | Custom |
| Changomas | `https://www.changomas.com.ar/{slug}?_q={q}&map=ft` | VTEX standard |
| Farmacity | `https://www.farmacity.com/{slug}?_q={q}&map=ft` | VTEX standard |

**Decision**: helper `vtexSearch(host, q)` unifica los 6 casos VTEX. Coto y La Anónima tienen builders custom.

**Rationale**: VTEX es un e-commerce platform muy usado en LatAm. Su convención `/{slug}?_q={q}&map=ft` es estable y funciona con o sin `slug` (redirige a resultados si no matchea). Reduce duplicación y hace fácil agregar cadenas futuras que también corran en VTEX (Alberdi, Toledo, etc.).

**Alternatives**:
- Scraping para obtener PDP real → descartado (Principio VI + costo)
- URL nativa por chain sin unificar → duplicación innecesaria
- Un solo endpoint Google site search para todas → funciona pero UX peor (usuario pasa por Google en vez de la cadena)

### U-2: ¿Qué hacer si la búsqueda no matchea en el sitio de la cadena?

**Decision**: aceptamos que la cadena maneja ese caso. Su UI mostrará "sin resultados" con opciones de refinar. No es nuestro problema resolverlo.

**Rationale**: verificar server-side que cada URL matchea sería costoso (fetch cross-origin bloqueado por CORS + rate limiting). Trust the chain.

**Alternatives**: fallback pre-emptivo a Google site search si detectamos que la cadena tiene "nombres cortos" → sobre-engineering.

### U-3: ¿Cómo se comporta el link para la fila de PY/Rappi/ML?

**Decision**: reutilizar `DELIVERY_PARTNERS` de F014. La función `buildStoreLink` chequea si el chainSlug matchea una delivery platform y usa ese builder. Consistencia con "Comprar por delivery" card.

**Rationale**: DRY + comportamiento uniforme entre "Ir a la tienda" (fila) y "Comprar por delivery" (card grande).

### U-4: ¿Query cleanup separado o compartido con F014?

**Decision**: usar el mismo `buildDeliveryQuery` de F014 (`src/lib/deep-links.ts`). Rename optional a `buildProductSearchQuery` como alias si simplifica lectura.

**Rationale**: mismos códigos SEPA (BOT-N-ml, PCK-N-un, cc → ml) rompen para PY como para Coto. Un solo cleanup consistente.

## Phase 1 — Design & Contracts

### Data Model changes

**Ninguno**. Todo el data ya existe:
- `Chain.websiteUrl` — string, ya seedeado para las 11 chains.
- `Price.storeProductUrl` — string opcional, existente (folletos lo llenan).

### Contract 1: `src/lib/store-links.ts` (nuevo)

```typescript
export type StoreLinkContext = {
  chainSlug: string;
  productName: string;
  brand: string | null;
  /** Si el parser folleto capturó PDP directo, prioridad absoluta */
  storeProductUrl?: string | null;
  /** Chain.websiteUrl como último recurso para fallback Google */
  chainWebsiteUrl?: string | null;
};

/**
 * Resuelve el URL externo al que debe llevar "Ir a la tienda".
 * Orden de prioridad:
 *   1. storeProductUrl explícito (PDP directo del folleto)
 *   2. Builder específico por chain (VTEX o custom)
 *   3. Delivery partner de F014 (PY, Rappi, ML)
 *   4. Google site search si tenemos chainWebsiteUrl
 *   5. null (caller debería fallback a chainWebsiteUrl root o interno)
 */
export function resolveStoreLink(ctx: StoreLinkContext): string | null;
```

**Behavior contract**:
- Nunca throws — cualquier error interno devuelve null.
- Reutiliza `buildDeliveryQuery` de F014 para cleanup.
- Reutiliza `DELIVERY_PARTNERS` para PY/Rappi/ML.
- VTEX chains agrupan un `vtexSearch(host, q)` helper interno.

### Contract 2: `<PriceComparisonRow>` (edit)

Nueva prop opcional:

```typescript
type PriceComparisonRowProps = {
  // ...props existentes
  chainWebsiteUrl?: string | undefined;
};
```

El caller ya no pasa `href` computed — lo resuelve el component internamente:

```typescript
const href =
  resolveStoreLink({ chainSlug, productName, brand, storeProductUrl, chainWebsiteUrl }) ??
  chainWebsiteUrl ??
  "#";
```

Attrs del link:
```html
<a href={href} target="_blank" rel="noopener noreferrer nofollow" aria-label="Ir a la tienda de {chainName} (abre en nueva pestaña)">
```

### Contract 3: `get-comparison.ts` (edit)

La raw query ya joinea `chains`. Solo necesitamos exponer `websiteUrl`:

```typescript
type LatestPriceRow = {
  // ...existing
  chain_website_url: string | null;
};

// SQL:
SELECT ..., c.website_url AS chain_website_url

// Row mapping:
{
  // ...existing
  chainWebsiteUrl: r.chain_website_url,
}
```

Nuevo campo en `ComparisonStoreRow`:
```typescript
type ComparisonStoreRow = {
  // ...existing
  chainWebsiteUrl: string | null;
};
```

### Contract 4: Tests

`tests/unit/lib/store-links.test.ts`:

```typescript
// 1 test por chain con builder específico (8)
it("VTEX chain devuelve URL con _q y map=ft", () => {...})
it("Coto usa Ntt param custom", () => {...})
it("La Anónima usa /busqueda?q=", () => {...})

// Fallback + priority
it("storeProductUrl gana sobre builder", () => {...})
it("PY reutiliza DELIVERY_PARTNERS", () => {...})
it("Chain desconocida con websiteUrl → Google site search", () => {...})
it("Chain desconocida sin websiteUrl → null", () => {...})

// Query cleanup
it("limpia códigos SEPA antes de armar URL", () => {...})
```

**Total: ~11-13 tests**.

### Click tracking

Server-rendered links no tienen JS. Para tracking:
- Agregar `data-store-click={chainSlug}` al link
- Client component wrapper `<TrackedLink>` en `PriceComparisonRow` (o listener global en layout)
- `plausible("Store Click", { props: { chain: chainSlug, hasPdp: !!storeProductUrl } })`

**Trade-off**: convertir `PriceComparisonRow` a client component (impacta bundle) vs listener global en layout (más simple).

**Decision**: listener global en un pequeño client wrapper que escucha `click` en `[data-store-click]`. Minimal JS overhead.

### Quickstart

Ver `quickstart.md`.

## Post-Design Constitution Re-check

- ✅ Todos los principios siguen OK después del diseño
- ✅ Complejidad se mantuvo mínima: 1 archivo nuevo, 3 files editados
- ✅ No agregamos deps, no cambiamos DB schema

**Gate final**: ✅ pasa.

## Progress Tracking

- [x] Phase 0: research (4 unknowns resueltos)
- [x] Phase 1: contracts + tests definidos
- [x] Constitution check pre + post OK
- [ ] Ready for `/speckit-tasks` → luego `/speckit-implement`

## Artifacts generated

- ✅ `spec.md`
- ✅ `plan.md` (este)
- ✅ `quickstart.md`
- ⚫ `data-model.md` — no requiere (sin schema changes)
- ⚫ `contracts/` — inline arriba (4 contratos claros)
- ⚫ `research.md` — inline en Phase 0 (fix chico)
