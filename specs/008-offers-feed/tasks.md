# Tasks: Offers Feed

## Phase 1: Setup
- [ ] T001 Añadir campo `upvotes_cache INT DEFAULT 0` en `Price` (para score); migration + backfill 0.
- [ ] T002 [P] Zod schemas `OffersParams`, `OffersResponse` en `src/server/offers/schemas.ts`.

## Phase 2: Foundational
- [ ] T010 Query en `src/server/offers/query.ts` (raw con params tipados).
- [ ] T011 [P] Cursor helpers `encodeCursor`/`decodeCursor` (base64 JSON) en `src/lib/cursor.ts`.
- [ ] T012 [P] Redis cache wrapper en `src/server/offers/cache.ts`.

## Phase 3: US1 — Home con feed (P1) 🎯 MVP
### Tests
- [ ] T020 [P] [US1] Seed test: 20 ofertas en 3 zonas.
- [ ] T021 [US1] Playwright `/` renderiza 8 cards ordenadas por descuento.

### Implementation
- [ ] T022 [US1] `src/app/page.tsx` con `<HeroSection>` + `<TrustBar>` + `<OffersGrid>` + `<HowItWorks>`.
- [ ] T023 [US1] Server component fetch top 8 con `sort=discount`.
- [ ] T024 [US1] `revalidate = 300`.
- [ ] T025 [US1] Zone default = `caba-palermo`; usar cookie si existe.
- [ ] T026 [US1] Meta OG + JSON-LD `WebSite` con `potentialAction: SearchAction`.

**Checkpoint**: `/` visible con feed real.

## Phase 4: US2 — Feed completo con filtros (P1)
- [ ] T030 [US2] `/ofertas/page.tsx` con `<FiltersSidebar>` + `<ActiveChips>` + `<OffersGrid>`.
- [ ] T031 [US2] Endpoint `/api/offers/route.ts`.
- [ ] T032 [US2] `<FiltersSidebar>` con: vertical (radio), cadenas (checkbox), minDiscount (slider), validity (radio), distance (chip group).
- [ ] T033 [US2] Cambios de filtro → `router.push` con nuevos params.
- [ ] T034 [P] [US2] Playwright: filtrar chain=carrefour → todos los items son Carrefour.
- [ ] T035 [P] [US2] Test API: params → SQL correcto.

## Phase 5: US3 — Chips activos (P1)
- [ ] T040 [US3] `<ActiveChips>` lee de searchParams y renderiza chips con X.
- [ ] T041 [US3] Click X → remove param del URL.
- [ ] T042 [P] [US3] Test keyboard: Tab → chip → Enter/Space quita filtro.
- [ ] T043 [P] [US3] "Limpiar todos" resetea filters manteniendo `zone`.

## Phase 6: US4 — Paginación infinita (P2)
- [ ] T050 [US4] `<InfiniteLoader>` con IntersectionObserver.
- [ ] T051 [US4] Cliente hace fetch a `/api/offers?cursor=...` y appendea.
- [ ] T052 [US4] `nextCursor = null` → mostrar "no hay más".
- [ ] T053 [P] [US4] Playwright: scroll hasta bottom → segunda page cargada.

## Phase 7: US5 — Mobile con tabs + bottom-sheet (P2)
- [ ] T060 [US5] En mobile (`< 768`), sidebar oculto; mostrar tabs de vertical horizontal.
- [ ] T061 [US5] Botón "Más filtros" → abre `<FiltersSheet>` (Radix Dialog fullscreen mobile).
- [ ] T062 [US5] Focus trap y escape close.
- [ ] T063 [P] [US5] Playwright viewport 375: tabs visibles; sheet abre/cierra.

## Phase 7b — Clarifications aplicadas
- [ ] T064 [C-001] Filtro sidebar `promoType` (checkboxes: unit / 2x1 / 3x2 / segundo off / bundle).
- [ ] T065 [C-001] Sort option: "por precio efectivo por unidad" además de "mayor descuento".
- [ ] T066 [C-001] `<DealCard>` muestra `<PromoBadge>` cuando aplique.
- [ ] T067 [C-002] `<NeighborsToggle>` en sidebar + chip activo "También Palermo + 3 km".
- [ ] T068 [C-002] Separador en el grid: "En Palermo" (destacado) vs "Cerca de Palermo".
- [ ] T069 [C-002] Query respeta el toggle; ranking penaliza `nearby` 0.15 puntos vs `in_zone`.
- [ ] T069b [C-003] `<DealCard>` muestra `$1.245 / L` bajo el precio.

## Phase 8: Polish
- [ ] T070 [P] `<HowItWorks>` con 3 tarjetas (Buscá / Compará / Alertas).
- [ ] T071 [P] Sección "Cadenas rastreadas" (`<TrustBar>`) en home.
- [ ] T072 [P] Empty state con "reportá una oferta" (link a F11).
- [ ] T073 [P] Load test k6 sobre `/api/offers`.
- [ ] T074 Lighthouse `/` y `/ofertas` ≥ 95.
- [ ] T075 Bundle < 60 KB gz.
- [ ] T076 Constitution Check.

## Definition of Done
- [ ] `/` feed funcional, LCP < 2 s.
- [ ] `/ofertas` filtros + paginación funcional.
- [ ] Mobile UX verificado.
- [ ] p95 `/api/offers` < 250 ms.
- [ ] Bundle en presupuesto.
