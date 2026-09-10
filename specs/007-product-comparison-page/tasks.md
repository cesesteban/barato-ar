# Tasks: Product Comparison Page

## Phase 1: Setup
- [ ] T001 Añadir `Product.slug` unique en Prisma + migration + backfill de slugs desde `normalizedName`.
- [ ] T002 [P] Instalar `@vercel/og`, `date-fns`.

## Phase 2: Foundational
- [ ] T010 [P] Escribir `src/lib/slug.ts` — `slugify(name)` kebab-case sin acentos.
- [ ] T011 Backfill: script `pnpm slugs:backfill` genera slugs para todos los canonicales.
- [ ] T012 Endpoint helper `src/server/product/get-comparison.ts` con query raw.
- [ ] T013 [P] Type `ComparisonView` en `src/server/product/types.ts`.

## Phase 3: US1 — Ver comparación (P1) 🎯 MVP
### Tests
- [ ] T020 [P] [US1] Seed test: 1 canonical con 3 stores.
- [ ] T021 [P] [US1] Unit test `get-comparison`: rank ok, delta ok.
- [ ] T022 [US1] Playwright: `/producto/coca-cola-2-25l` renderiza con 3 stores ordenadas.

### Implementation
- [ ] T023 [US1] `src/app/producto/[slug]/page.tsx` (RSC).
- [ ] T024 [US1] `<ProductHeader>` (foto, nombre, marca, presentación).
- [ ] T025 [US1] `<ComparisonTable>` con ranking (usa `PriceComparisonRow` del design system).
- [ ] T026 [US1] `<HistoryPlaceholder>`, `<AlertCardMount>`, `<SimilarProductsPlaceholder>`.
- [ ] T027 [US1] `loading.tsx` con skeleton.
- [ ] T028 [US1] `not-found.tsx` amigable.

**Checkpoint**: página funcional local.

## Phase 4: US2 — SEO / JSON-LD (P1)
- [ ] T030 [US2] `generateMetadata` con `title`, `description`, `openGraph`, `canonical`.
- [ ] T031 [US2] `<script type="application/ld+json">` con Product + AggregateOffer + Offer[].
- [ ] T032 [US2] `opengraph-image.tsx` con `@vercel/og`.
- [ ] T033 [US2] `generateStaticParams` top 10k productos.
- [ ] T034 [P] [US2] Test unit: JSON-LD shape valida contra schema con `schema-dts`.
- [ ] T035 [US2] Manual: pegar URL en Google Rich Results Test → válido.

## Phase 5: US3 — Delta vs promedio (P2)
- [ ] T040 [US3] Query `avg30d` en `get-comparison`.
- [ ] T041 [US3] Badge `-X%` en `ComparisonTable` (usa `<DiscountBadge>`).
- [ ] T042 [P] [US3] Test unit: delta = ((price - avg) / avg) * 100.

## Phase 6: US4 — Deep link (P2)
- [ ] T050 [US4] Campo opcional `storeProductUrl` en `Price` (migration).
- [ ] T051 [US4] En parsers F03 guardar `storeProductUrl` si el folleto lo trae.
- [ ] T052 [US4] Botón `Ir a la tienda` usa `storeProductUrl` o fallback a `/tienda/[chainSlug]`.
- [ ] T053 [US4] Registrar `outbound_click` con Plausible al click.

## Phase 6b — Clarifications aplicadas (C-001, C-002, C-003, C-004)
- [ ] T054 [C-001] Badge `<PromoBadge>` en cada `PriceComparisonRow` cuando `promoType != 'unit'`.
- [ ] T055 [C-001] Rank por `pricePerUnitEff` en lugar de `price`; mostrar ambos en columnas.
- [ ] T056 [C-002] Query devuelve `proximity: 'in_zone' | 'nearby'`; renderizar dos secciones: "En {zone}" primero, "Cerca de {zone} (< 3 km)" después.
- [ ] T057 [C-002] Toggle `<NeighborsToggle>` reactivo (URL param `?nearby=1`).
- [ ] T058 [C-003] Columna "por L/kg/un" en la tabla; toggle "ordenar por precio total / por unidad".
- [ ] T059 [C-003] `<PriceTag>` muestra `$/L` debajo del precio grande.
- [ ] T059b [C-004] Sección "Ver también" con la variante contraria de `packagingFlag` cuando existe.

## Phase 7: Polish
- [ ] T060 [P] Lighthouse CI: `/producto/coca-cola-2-25l` Perf ≥ 95, LCP < 2 s.
- [ ] T061 [P] `docs/product-page.md`.
- [ ] T062 Bundle analysis: verificar < 40 KB gz.
- [ ] T063 Constitution Check.

## Definition of Done
- [ ] Página funcional con datos reales.
- [ ] JSON-LD válido.
- [ ] Rich Result válido en Google.
- [ ] Lighthouse ≥ 95.
- [ ] a11y 0 errores axe.
