---

description: "Tasks para F020 — Calidad de nombres de productos"
---

# Tasks: F020 · Calidad de nombres de productos

**Input**: Design documents from `specs/020-product-naming-quality/`
**Prerequisites**: [spec.md](./spec.md), [plan.md](./plan.md), [quickstart.md](./quickstart.md)
**Tests**: Incluidos — spec exige 30+ tests unit (success criteria).
**Organization**: Tareas agrupadas por user story.

## Format: `[ID] [P?] [Story] Description con path`

- **[P]**: Puede correr en paralelo (archivos distintos)
- **[Story]**: US1..US6
- Todas las tasks incluyen path exacto

## Path Conventions

- Código: `src/`
- Tests: `tests/unit/`
- Scripts one-shot: `scripts/`
- Docs: `docs/`, `specs/020-product-naming-quality/`

---

## Phase 1: Setup

- [X] T001 Crear branch `feat/020-product-naming-quality` desde `main`

## Phase 2: Foundational

Prerequisitos que desbloquean múltiples stories: el dictionary de marcas + el archivo de tests base.

- [X] T002 Crear `src/lib/brand-catalog.ts` con estructura base (interface `BrandEntry`, `BRAND_CATALOG: BrandEntry[] = []` vacío inicialmente, funciones `resolveBrand` y `extractBrandFromName` con implementación stub que devuelve null). US4 llena el catalog después.
- [X] T003 Crear `tests/unit/lib/brand-catalog.test.ts` con `describe("brand-catalog (F020)")` vacío.

---

## Phase 3: US1 — Nombres sin abrevs crípticas (P0) 🎯 MVP

**Goal**: `cleanProductName` produce nombres legibles: strippea códigos SEPA, expande abrevs, dedup palabras, strip chain names.

**Independent Test**: post-fix, `SELECT COUNT(*) FROM products WHERE name ~* '\\b(X|C|D)\\b' OR name ~* 'BOT-|PCK-|LAT-'` < 200 (99% de 12,840 baseline).

- [X] T004 [US1] En `src/lib/text-cleanup.ts`: agregar strip de códigos SEPA. Regex `/\b[A-Z]{2,4}-\d+(?:[.,]\d+)?-[A-Za-z]+\.?\b/g` (misma que buildDeliveryQuery de F017.8) aplicada primero en `cleanProductName`, antes de las abreviaturas.
- [X] T005 [US1] En `src/lib/text-cleanup.ts`: agregar strip de chain names al inicio. Lista: `["Carrefour", "Coto", "Día", "Dia", "Jumbo", "Vea", "Disco", "La Anónima", "Changomas", "Farmacity"]`. Match case-insensitive con `\b` boundary, solo al inicio. Nueva opción `opts?: { skipChainStrip?: boolean }` para tests.
- [X] T006 [US1] En `src/lib/text-cleanup.ts` `ABBREV_EXPANSIONS`: agregar entradas para `\bCERV\b` → `Cerveza`, `\bRET\b` → `Retornable`, `\bEXTR\b` → `Extra`, `\bDESCR\b` → `Descremada`, `\bSEMIDESCRE\b` → `Semidescremada`, `\bMUZZARE\b` → `Muzzarella`, `\bRECTAN\b` → `Rectangular`, `\bCHOC\b` → `Chocolate`, `\bGASEO\b` → `Gaseosa`, `\bALFA\b` → `Alfajor`, `\bFRUT\b` → `Frutas`, `\bSAB\b` → `Sabor`.
- [X] T007 [US1] En `src/lib/text-cleanup.ts`: agregar expansión de conectores sueltos. `\b C \b` → ` con `, `\b D \b` → ` de `, `\b X \b` → ` x `. NOTA: son solo espacio-letra-espacio, no matchean letra sola pegada a un número (ej. "1L" no rompe).
- [X] T008 [US1] En `src/lib/text-cleanup.ts`: agregar dedup de palabras consecutivas repetidas. Función `dedupConsecutiveWords(str)` que colapsa `"Cerveza Cerveza Extra"` → `"Cerveza Extra"`. Ignora mayúsculas para el compare pero preserva original.
- [X] T009 [US1] En `src/lib/text-cleanup.ts`: extender `UNIT_ABBREV` con más casos. Agregar `LT` → `L`, `GRS` → `g`, `GRAMOS` → `g`, `LITROS?` → `L`, `KILOS?` → `kg`, `MLTS?` → `ml`.
- [X] T010 [US1] Modificar `cleanProductName` signature para aceptar opts opcionales: `cleanProductName(raw: string, opts?: { skipChainStrip?: boolean }): string`. Orden interno: (1) strip códigos SEPA, (2) strip chain names (a menos que skipChainStrip), (3) abbrev expansions, (4) unit abbrev, (5) whitespace normalize, (6) dedup consecutive, (7) title case.
- [X] T011 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "strip códigos SEPA del name" con input `"Cerveza Iguana 1 l BOT-1000-ml."` → expected `"Cerveza Iguana 1 L"`.
- [X] T012 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "strip Carrefour al inicio" con input `"CARREFOUR CRISTAL FOCACCIA C SALSA D TOMATE X 250 G"` → expected `"Cristal Focaccia con Salsa de Tomate x 250 g"`.
- [X] T013 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "expande Cerv/Ret/Extr" con 3 assertions distintas.
- [X] T014 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "expande C/D/X sueltos" — `"Alfajor C Mousse D Frutilla X 6 un"` → `"Alfajor con Mousse de Frutilla x 6 un"`.
- [X] T015 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "no rompe 1L, 250g pegados" — input `"Aceite 1L"` → `"Aceite 1L"` (regex \b C \b no matchea).
- [X] T016 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "dedup palabras consecutivas" — `"Cerveza Cerveza Extra"` → `"Cerveza Extra"`.
- [X] T017 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "idempotencia" — `cleanProductName(cleanProductName(x)) === cleanProductName(x)` con 3 inputs distintos.
- [X] T018 [P] [US1] En `tests/unit/text-cleanup.test.ts`: agregar test "skipChainStrip preserva chain" — `cleanProductName("Carrefour Focaccia", { skipChainStrip: true })` → `"Carrefour Focaccia"`.

**US1 checkpoint**: cleanProductName produce nombres limpios verificados con 8+ tests unit.

---

## Phase 4: US5 — Fix de size parsing (P1)

**Goal**: `Product.size`/`Product.unit`/`standard_size` correctos post-ingesta. Bug del audit: "1 l" del name resultaba en 100 ml.

**Depends on**: US1 (cleanProductName produce name limpio como fallback).

- [X] T019 [US5] En `src/ingestion/pcl/products.ts`: en la función que parsea size (probable `extractSizeUnit` o inline en `upsertProduct`), reordenar la resolución para PREFERIR `row.productos_cantidad_presentacion` + `row.productos_unidad_medida_presentacion` cuando ambos están presentes. Solo caer al regex del name si están null.
- [X] T020 [P] [US5] En `tests/unit/ingestion/pcl-products.test.ts` (nuevo si no existe): agregar test "prefiere SEPA fields sobre regex del name" con mock row `{ productos_cantidad_presentacion: 1, productos_unidad_medida_presentacion: "l", productos_descripcion: "Cerveza Iguana 1 l Ret" }` → expected `Product.size = 1, Product.unit = "L", Product.standardSize = 1000`.

**US5 checkpoint**: no más "1 l → 100 ml".

---

## Phase 5: US4 — Dictionary de marcas AR (P1)

**Goal**: `BRAND_CATALOG` popula ~80 marcas con aliases. `cleanBrand` las usa.

- [X] T021 [US4] En `src/lib/brand-catalog.ts`: poblar `BRAND_CATALOG` con ~80 entries. Categorías cubiertas: bebidas alcohólicas (Guinness, Stella Artois, Imperial, Quilmes, Corona, Heineken, Andes, Salta, Warsteiner), gaseosas (Coca-Cola, Pepsi, Manaos, 7Up, Sprite, Fanta), lácteos (La Serenísima, Sancor, Ilolay, Milkaut, Ledesma, Serenito), snacks (Milka, Cadbury, Bon o Bon, Águila, Terrabusi, Bagley, Bimbo, Fargo, Lactal), limpieza (Ala, Skip, Cif, Ayudín, Poett), higiene (Palmolive, Colgate, Dove, Rexona, Sedal). Cada entry con `canonicalName` + `aliases` (variantes truncadas comunes).
- [X] T022 [US4] En `src/lib/brand-catalog.ts`: implementar `resolveBrand(input: string): string | null` — normaliza input (lowercase, trim) y busca match exacto en canonical + aliases. Return canonical si match, null si no.
- [X] T023 [US4] En `src/lib/brand-catalog.ts`: implementar `extractBrandFromName(name: string): string | null` — tokeniza el name en palabras, por cada palabra >= 3 chars llama `resolveBrand(word)`, devuelve primer match. Preferir matches más largos (multi-word) sobre single-word.
- [X] T024 [US4] En `src/lib/text-cleanup.ts`: modificar `cleanBrand` para aceptar hint opcional `cleanBrand(raw: string | null | undefined, hint?: { productName?: string }): string | null`. Nuevo flow: (1) si raw existe, resolveBrand(raw) y devolver canonical si match; sino aplicar filtros existentes; (2) si raw es null y hint.productName existe, extractBrandFromName(productName).
- [X] T025 [P] [US4] En `tests/unit/lib/brand-catalog.test.ts`: agregar 5 tests para `resolveBrand`: match exacto, match alias, case-insensitive, no match, canonical trumps alias.
- [X] T026 [P] [US4] En `tests/unit/lib/brand-catalog.test.ts`: agregar 5 tests para `extractBrandFromName`: encuentra brand en el medio, encuentra brand al inicio, ignora palabras cortas (`<3 chars`), no match si name sin brand conocida, prefiere multi-word sobre single-word.
- [X] T027 [P] [US4] En `tests/unit/text-cleanup.test.ts`: agregar test "cleanBrand con hint extrae desde name si raw es null".
- [X] T028 [P] [US4] En `tests/unit/text-cleanup.test.ts`: agregar test "cleanBrand canonicaliza Guinn → Guinness".

**US4 checkpoint**: 799 marcas truncadas resueltas via dictionary.

---

## Phase 6: US6 — Script repopulate de 47k productos (P0)

**Goal**: aplicar el nuevo pipeline a los products existentes sin re-ingest.

**Depends on**: US1 + US4 + US5 (usa las funciones nuevas).

- [X] T029 [US6] Crear `scripts/repopulate-product-names.ts`. Signature CLI: acepta `--dry-run` y `--limit N`. Env required: `DATABASE_URL_UNPOOLED`.
- [X] T030 [US6] En `scripts/repopulate-product-names.ts`: implementar loop batch de 500 rows. `SELECT id, name, brand FROM products ORDER BY id [LIMIT N] OFFSET batch*500`. Por cada row: computar newName + newBrand + newNormalizedName. Si cualquiera cambió → agregar a payload de update. Ejecutar `prisma.$transaction([...])` con updates.
- [X] T031 [US6] En `scripts/repopulate-product-names.ts`: agregar counters por tipo de fix (`sepa_codes_stripped`, `chain_names_stripped`, `abbrevs_expanded`, `brand_canonicalized`, `brand_extracted_from_name`). Detectar cada tipo comparando old/new. Log final resumen.
- [X] T032 [US6] En `scripts/repopulate-product-names.ts`: modo `--dry-run`. Skip el UPDATE + solo log muestra de 10 casos random old→new.
- [X] T033 [US6] Verify local: `pnpm tsx scripts/repopulate-product-names.ts --dry-run --limit 100` → confirmar visualmente que la muestra tiene sentido.
- [X] T034 [US6] Ejecutar full dry-run: `pnpm tsx scripts/repopulate-product-names.ts --dry-run` — asegurar que reporta ~20-30k rows afectados.
- [X] T035 [US6] Ejecución real en Neon prod: `pnpm tsx scripts/repopulate-product-names.ts` (SIN --dry-run). Requiere OK del usuario.
- [X] T036 [US6] Re-correr audit: `pnpm tsx scripts/audit-product-names.ts` → verificar que counts problemáticos bajaron (spec success criteria).

**US6 checkpoint**: 47k productos limpios en Neon.

---

## Phase 7: US2 — Búsqueda funciona con nombres reales (P0)

**Goal**: post-repopulate, la búsqueda encuentra productos que antes no matcheaba.

**Depends on**: US6.

- [X] T037 [US2] Verify prod: `curl -s "https://barato-ar.vercel.app/api/search?q=focaccia" | head -c 500` → devuelve al menos 1 result.
- [X] T038 [US2] Verify prod: `curl -s "https://barato-ar.vercel.app/api/search?q=guinness" | head -c 500` → al menos 1 result.
- [X] T039 [US2] Verify prod: `curl -s "https://barato-ar.vercel.app/api/search?q=coca+cola" | head -c 500` → al menos 1 result.

**US2 checkpoint**: los 3 sample searches devuelven hits.

---

## Phase 8: US3 — Deep links a la tienda encuentran producto (P0)

**Goal**: cuando el usuario clickea "Ir a la tienda" en un producto random, la búsqueda en el sitio de la cadena devuelve resultados.

**Depends on**: US6 (nombres limpios).

- [X] T040 [US3] Verify manual: entrar a barato-ar.vercel.app, elegir 3 productos random (uno de Carrefour, uno de Coto, una cerveza). Por cada uno: click "Ir a la tienda" → verificar que el sitio muestra al menos 1 resultado (o el producto directo).
- [X] T041 [US3] Documentar el resultado del test manual en `docs/AUDIT.md` sección "Bugs cerrados post-audit" con timestamp.

**US3 checkpoint**: deep links funcionan con nombres limpios.

---

## Phase 9: Polish + docs (cross-cutting)

- [X] T042 [P] Correr `pnpm typecheck` → 0 errores.
- [X] T043 [P] Correr `pnpm test` → 200+ tests siguen pasando + nuevos 30+ de F020.
- [X] T044 [P] Correr `SKIP_ENV_VALIDATION=1 pnpm build` → build local exitoso.
- [X] T045 Editar `docs/AUDIT.md`: marcar B-03 (nombres truncados) y B-04 (marcas truncadas) como ✅ resueltos con F020. Bajar contador de bugs P2 en el resumen ejecutivo.
- [X] T046 Editar `docs/ESTADO_ACTUAL.md`: agregar F020 al scorecard "Post-MVP shipped" con estado 🟢.
- [X] T047 Editar `docs/FLUJO_BACKEND.md`: en sección "Ingesta SEPA / Pipeline 1", mencionar el brand catalog + cleanProductName mejorado como parte del pass 2 (products).
- [X] T048 Editar `docs/AUDIT.md`: agregar snapshot post-fix de audit-product-names (new baseline).
- [X] T049 Commit con mensaje `feat(020-product-naming-quality): pipeline de nombres limpios + brand catalog + repopulate`.
- [X] T050 Merge no-ff + push a main. Vercel auto-deploy.
- [X] T051 Post-deploy: re-correr audit script + agregar timestamp a docs/AUDIT.md.

---

## Dependency Graph

```
Phase 1 Setup: T001
                │
Phase 2 Foundational: T002 (brand-catalog stub) → T003 (test file)
                │
        ┌───────┴─────────────────────────────────────────────┐
        ▼                              ▼                       ▼
Phase 3 (US1)              Phase 5 (US4)                  Phase 4 (US5)
T004-T018                  T021-T028                       T019-T020
(text-cleanup + tests)     (brand catalog + tests)         (size parsing fix)
        │                              │                       │
        └───────────────┬──────────────┘                       │
                        │                                       │
                        ▼                                       │
              Phase 6 (US6) T029-T036                          │
              (repopulate script + run)                        │
                        │                                       │
                        ▼                                       │
              Phase 7 (US2) T037-T039  ◄──────────────────────┘
              (search verify)
                        │
                        ▼
              Phase 8 (US3) T040-T041
              (deep links verify)
                        │
                        ▼
              Phase 9 Polish T042-T051
```

## Paralelización — ejemplos concretos

**Dentro de US1**: T004-T010 secuenciales (mismo archivo). T011-T018 [P] entre sí (secciones distintas del mismo test file).

**Entre stories** (después de fundacionales T001-T003): US1, US4 y US5 son 100% paralelizables (archivos distintos). Un agente puede tomar US1, otro US4, otro US5.

**Phase 9**: T042-T044 [P] entre sí (comandos independientes). T045-T048 [P] (docs distintos). T049-T051 secuenciales (commit → merge → verify).

## Implementation Strategy

**MVP scope**: US1 + US6 (Phase 3 + 6 = ~26 tasks). Con eso los 47k productos existentes se limpian y la búsqueda mejora dramáticamente.

**Incremental delivery**:
1. **Ship 1**: US1 (pipeline) + US6 (repopulate) → merge + deploy. Usuario ve nombres limpios inmediatamente en la web.
2. **Ship 2**: US4 (brand catalog) + US5 (size fix) — mejora calidad de marcas + previene bugs futuros.
3. **Verify**: US2 + US3 son solo tests manuales, no shipping — se hacen post-deploy.

**Estimación total**: ~2.5-3.5h implementación + ~30min verify + docs = **~3.5h**.

## Independent test criteria per story

- **US1**: `SELECT COUNT(*) FROM products WHERE name LIKE '% X %'` post-repopulate < 200.
- **US2**: 3 curl API search devuelven ≥1 result cada uno.
- **US3**: 3 productos random random → click en Carrefour/Coto → sitio devuelve resultados.
- **US4**: `resolveBrand("Guinn") === "Guinness"` en test unit + `SELECT COUNT(*) WHERE brand = 'Guinn'` = 0 post-repopulate.
- **US5**: test unit con mock SEPA row `{ 1, "l", ... }` produce `Product.size=1, unit=L, standardSize=1000`.
- **US6**: audit script muestra deltas (12,840 → <200 para " X ", etc.).
