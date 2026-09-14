# Implementation Plan: Calidad de nombres de productos (F020)

**Branch**: `020-product-naming-quality` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

## Summary

Reescribir el pipeline de naming (`src/lib/text-cleanup.ts`) para producir
nombres limpios y buscables, más un script one-shot que re-limpia los 47k
productos existentes en Neon sin re-ingest.

Cambios core:

1. **`cleanProductName`**: 
   - Expandir dictionary de abrevs (Cerv → Cerveza, Ret → Retornable, Extr → Extra, X → x, C → con, D → de).
   - Strip códigos SEPA (BOT-N-ml, PCK-N-un, LAT-N-cc) — fix F017.8 solo aplicó a `buildDeliveryQuery`.
   - Strip chain names al inicio (Carrefour, Coto, Día, etc.) para evitar "Carrefour Cristal Focaccia".
   - Deduplicar palabras consecutivas (bug SEPA "Cerveza Cerveza").
   - Normalizar unidades más agresivamente (LT → L, GRS → g, LATA/BOTELLA → dropear cuando es packaging).

2. **`cleanBrand`**:
   - Dictionary de marcas AR canónicas (top 100 brands) — corrige truncados: "Guinn"→"Guinness", "Coca"→"Coca-Cola", "Stell"→"Stella Artois", etc.
   - Extracción de brand desde name cuando brand raw es null.
   - Reject más agresivo de "SIN MARCA", números sueltos, palabras genéricas.

3. **Fix de size parsing**: bug donde "1 l" del name parsea como "100 ml" — root cause probable en `products.ts` extractSizeUnit regex. Preferir siempre `productos_cantidad_presentacion` + `productos_unidad_medida_presentacion` de SEPA (fields separados y confiables).

4. **`scripts/repopulate-product-names.ts`**: one-shot para 47k rows, batch 500, idempotente.

## Technical Context

**Language/Version**: TypeScript 5.6 strict, Node 20
**Primary Dependencies**: Prisma 5.22, Zod 3 (ya presente)
**Storage**: Neon Postgres — actualiza `products.name`, `products.brand`, `products.normalized_name`
**Testing**: Vitest — `tests/unit/text-cleanup.test.ts` (existente, extender)
**Target Platform**: Node runtime (ingest en GH Actions) + script CLI one-shot
**Project Type**: web-service (Barato.ar)
**Performance Goals**: 
- `cleanProductName` puro, O(n) por regex apply — negligible per row
- Script repopulate: 47k rows / 500 por batch × ~200ms Neon RTT = ~20s teórico, 1-5 min real
**Constraints**:
- Idempotente en TODAS las funciones (segundo run no cambia)
- Backward compat: signature de funciones existentes no cambia
- Log de cambios aplicados por tipo para auditoría

**Scale/Scope**: 47,116 productos actuales — proyectado a ~100k con más cadenas.

## Constitution Check

- ✅ **I. SEO-First**: nombres más limpios mejoran búsqueda y crawl (Google prefiere títulos legibles)
- ✅ **II. Data honesty**: NO inventamos data — solo limpiamos texto que ya viene sucio. Marcas del dictionary se aplican solo cuando hay match de prefix estricto (Guinn → Guinness) — nunca "adivinamos" marca
- ✅ **III. TypeScript strict + testability**: 30+ tests unit obligatorios (spec success criteria)
- ✅ **IV. Privacy**: no afecta
- ✅ **V. Performance**: funciones puras, script one-shot fuera del hot path
- ✅ **VI. Legality**: no afecta
- ✅ **VII. Operational simplicity**: 1 archivo core editado (`text-cleanup.ts`) + 1 archivo nuevo (repopulate script) + 1 archivo test extendido
- ✅ **VIII. Accesibilidad**: nombres más legibles ayudan a screen readers

**Gate**: ✅ pasa sin violaciones.

## Phase 0 — Research

### U-1: ¿Cuáles son las TOP marcas AR con nombres canónicos?

**Decision**: dictionary de ~80-120 marcas hardcoded en `src/lib/brand-catalog.ts`.
Fuente: mix de conocimiento propio + análisis de las top 100 marcas por
cantidad de precios en nuestra DB.

**Rationale**:
- Un dictionary chico y curado es mejor que un algoritmo genérico.
- Cubre 80%+ de casos comunes.
- Fácil de extender (agregar un item al catalog).
- Formato: `{ canonicalName, aliases: string[] }`. Ejemplo:
  ```ts
  { canonicalName: "Guinness", aliases: ["Guinn", "Guiness", "Guinnes"] }
  ```

**Alternatives**:
- Fuzzy match global (Levenshtein) contra un catalog grande → más ruido, alto costo per row
- LLM lookup por producto → costo + latencia + Ppio II ("no inventar")

### U-2: ¿Cómo strip chain names sin borrar marcas legítimas?

**Decision**: lista explícita de chains (`Carrefour`, `Coto`, `Día`, `Jumbo`, `Vea`, `Disco`, `La Anónima`, `Changomas`). Se strippea SOLO si aparece como primera palabra del nombre y va seguida de espacio (`^Carrefour \b`).

**Rationale**: los productos white-label suelen mandarse con nombre "Coto Yogur Griego", "Carrefour Sábanas". El chain name como primer token es señal fuerte de white-label — el usuario ya sabe que está viendo un Coto porque el chip lo indica.

**Alternatives**:
- Regex más agresivo (chain name en cualquier posición) → riesgo de falsos positivos con marcas legítimas
- Mantener chain name → nombres largos y redundantes ("Coto Yogur Griego" cuando ya sabés que es Coto)

### U-3: ¿Cómo prevenimos parseo de size incorrecto ("1 l" → "100 ml")?

**Decision**: en `products.ts`, cuando `productos_cantidad_presentacion` y `productos_unidad_medida_presentacion` de SEPA están seteados, usar SIEMPRE esos fields directamente (son más confiables que parsear del name). Solo caer al parseo del name como último recurso.

**Rationale**: SEPA los envía como fields separados normalizados. El regex del name es propenso a errores con "1 l" (matchea como "1" + "l" pero por spacing parece "1 ml"). Trust the structured fields.

**Bug root cause del actual "1 l → 100 ml"**: el regex `/(\d+(?:[.,]\d+)?)\s*(ml|cc|l|lts?|litros?...)\b/i` matchea "1 l" pero luego mi lógica de `computeStandard` convierte "1 l" a "1000 ml" correctamente. El "100 ml" mostrado en el audit debe venir de otra parte del pipeline — probablemente `standardSize` calculado mal cuando el name tiene ambigüedad (ej. "473ml LAT-473-cc" → matchea el 473 primero como "ml"). El fix es preferir SEPA fields ANTES del regex.

**Alternatives**:
- Solo usar SEPA fields, deprecar regex del name → puede perder data cuando SEPA no viene con presentation. Descartado.
- Fixear el regex → paliativo, no root cause. Descartado.

### U-4: ¿El repopulate script necesita recalcular normalized_name también?

**Decision**: sí. `normalized_name` se usa para búsqueda pg_trgm. Si actualizamos `name` sin recalcular `normalized_name`, la búsqueda sigue rota. El script hace ambos updates.

**Rationale**: normalized_name es derivado del name via `normalizeName()`. Consistencia crítica.

## Phase 1 — Design & Contracts

### Data Model changes

**Ninguno**. La tabla `products` ya tiene columns `name`, `brand`, `normalized_name`, `size`, `unit`, `standard_size`, `standard_unit`. Solo actualizamos data.

### Contract 1: `cleanProductName` (extended)

Signature igual, comportamiento enriquecido:

```typescript
export function cleanProductName(raw: string, opts?: { skipChainStrip?: boolean }): string
```

**Nuevos comportamientos**:
- Expande C/D/X sueltos (con/de/x/por).
- Expande Cerv, Ret, Extr, Descr, Semi, etc. como whole-words.
- Strip códigos SEPA (`\b[A-Z]{2,4}-\d+(?:[.,]\d+)?-[A-Za-z]+\.?\b`).
- Strip chain names al inicio (opcional via `skipChainStrip: true` para tests).
- Deduplica palabras consecutivas repetidas (`Cerveza Cerveza` → `Cerveza`).
- Normaliza unidades LT/GRS/GRM (extensión de UNIT_ABBREV).

### Contract 2: `cleanBrand` (extended)

Signature igual, comportamiento enriquecido:

```typescript
export function cleanBrand(raw: string | null | undefined, hint?: { productName?: string }): string | null
```

**Nuevos comportamientos**:
- Consulta `BRAND_CATALOG` para canonicalizar aliases truncados.
- Si `raw` es null y `hint.productName` está seteado, intenta extraer brand del name (match de palabra que exista en catalog).
- Reject más estricto: >4 palabras, >30 chars, palabras genéricas ("varios", "genérico", "s/m").

### Contract 3: `src/lib/brand-catalog.ts` (nuevo)

```typescript
export type BrandEntry = {
  canonicalName: string;      // "Guinness"
  aliases: string[];          // ["Guinn", "Guiness", "Guinnes"]
  category?: string;          // "cerveza" (opcional, para desempate)
};

export const BRAND_CATALOG: BrandEntry[];

/** Devuelve el canonicalName si input matchea alguna alias/canonical (case-insensitive) */
export function resolveBrand(input: string): string | null;

/** Extrae brand del nombre buscando matches en el catalog */
export function extractBrandFromName(name: string): string | null;
```

**Contenido inicial**: 80-120 brands cubriendo los verticals actuales (super, farmacia, bebidas). Sample:

```typescript
[
  { canonicalName: "Coca-Cola", aliases: ["Coca", "Cocacola", "Coca Cola"] },
  { canonicalName: "Guinness", aliases: ["Guinn", "Guiness", "Guinnes"] },
  { canonicalName: "Stella Artois", aliases: ["Stell", "Stella"] },
  { canonicalName: "Imperial", aliases: ["Imper"] },
  { canonicalName: "Quilmes", aliases: ["Quil"] },
  { canonicalName: "La Serenísima", aliases: ["Serene", "Serenisima", "Serenisi"] },
  { canonicalName: "Ledesma", aliases: ["Ledesm"] },
  { canonicalName: "Sancor", aliases: ["Sancr"] },
  { canonicalName: "Pescador", aliases: ["Pesca"] },
  { canonicalName: "Bulldog", aliases: ["Bulld"] },
  { canonicalName: "Milka", aliases: [] },
  { canonicalName: "Nestlé", aliases: ["Nestle"] },
  // ... etc
]
```

### Contract 4: `scripts/repopulate-product-names.ts` (nuevo)

```typescript
// Command: pnpm tsx scripts/repopulate-product-names.ts [--dry-run] [--limit N]
// Env required: DATABASE_URL, DATABASE_URL_UNPOOLED

// Behavior:
//   1. SELECT id, name, brand FROM products [LIMIT N si --limit]
//   2. Por cada row:
//      - newName = cleanProductName(row.name)
//      - newBrand = cleanBrand(row.brand, { productName: newName }) — reintenta con name limpio
//      - newNormalizedName = normalizeName(newName)
//      - Si algún field cambió → agregar a batch
//   3. Batch de 500 rows con prisma.$transaction([...])
//   4. Log incremental por batch + counter por tipo de fix (X→x, códigos SEPA strippedados, brand canonicalizada)
//   5. Exit 0 en success, 1 en error
```

**Idempotencia**: si `cleanProductName(name) === name` no hace update.

### Contract 5: Tests

`tests/unit/text-cleanup.test.ts` (extender) — nuevos casos:

```typescript
// Ver spec User Story 1 acceptance scenarios — cada uno un test
// + los ejemplos reales del audit:

it("strip 'Carrefour ' al inicio del name", () => {
  expect(cleanProductName("CARREFOUR CRISTAL FOCACCIA C SALSA D TOMATE X 250 G"))
    .toBe("Cristal Focaccia con Salsa de Tomate 250 g");
});

it("expande Cerv sueltos", () => {
  expect(cleanProductName("Cerv Extra Stout")).toBe("Cerveza Extra Stout");
});

it("expande Ret", () => {
  expect(cleanProductName("Cerveza Iguana Pilsener 1 l Ret BOT-1000-ml."))
    .toBe("Cerveza Iguana Pilsener 1 L Retornable");
});

it("expande C/D/X sueltos", () => {
  expect(cleanProductName("Alfajor C Mousse D Frutilla X 6 un"))
    .toBe("Alfajor con Mousse de Frutilla x 6 un");
});

it("deduplica palabras consecutivas", () => {
  expect(cleanProductName("Cerveza Cerveza Extra")).toBe("Cerveza Extra");
});

// brand catalog:
it("resolveBrand acepta alias truncado", () => {
  expect(resolveBrand("Guinn")).toBe("Guinness");
});

it("extractBrandFromName encuentra brand en name", () => {
  expect(extractBrandFromName("Cerveza Guinness Extra Stout")).toBe("Guinness");
});

it("cleanBrand con hint extrae desde name si brand raw es null", () => {
  expect(cleanBrand(null, { productName: "Cerveza Guinness Extra Stout" })).toBe("Guinness");
});
```

`tests/unit/lib/brand-catalog.test.ts` (nuevo): 15+ tests de resolveBrand + extractBrandFromName con edge cases.

### Contract 6: Update de callers

- `src/ingestion/pcl/products.ts`: cambiar orden de resolución de size — probar primero `productos_cantidad_presentacion` + `productos_unidad_medida_presentacion` de SEPA, solo caer al regex del name si esos son null. También: pasar `productName` como hint a `cleanBrand`.
- `src/ingestion/chains/carrefour/parser.ts`: idem cambio de orden para size.

### Quickstart

Ver `quickstart.md` para validación end-to-end.

## Post-Design Constitution Re-check

- ✅ Sin cambios de schema (Ppio VII simplicity)
- ✅ Tests obligatorios agregados (Ppio III)
- ✅ Nada nuevo en el hot path del render (Ppio V performance)
- ✅ Dictionary hardcoded es transparent y auditable — no ML "black box" (Ppio II honesty)

**Gate final**: ✅ pasa.

## Progress Tracking

- [x] Phase 0: 4 unknowns resueltos
- [x] Phase 1: 6 contracts explícitos
- [x] Constitution check pre + post OK
- [ ] Ready for `/speckit-tasks` → `/speckit-implement`

## Artifacts generated

- ✅ `spec.md`
- ✅ `plan.md` (este)
- ✅ `quickstart.md`
- ⚫ `data-model.md` — no requiere (sin schema changes)
- ⚫ `contracts/` — inline arriba (6 contratos claros)
- ⚫ `research.md` separado — inline en Phase 0
