# Tasks: Product Search

## Phase 1: Setup
- [ ] T001 Instalar `@upstash/redis` y configurar client.
- [ ] T002 Migration: extensiones `pg_trgm`, `unaccent` + índices GiST en products.
- [ ] T003 Migration: tabla `search_logs`.

## Phase 2: Foundational
- [ ] T010 [P] Crear `src/lib/redis.ts` (singleton Upstash).
- [ ] T011 [P] Crear `src/lib/hash.ts` — `ipHash(ip, dailySalt)`.
- [ ] T012 Crear `src/server/search/query.ts` con ranking query.
- [ ] T013 [P] Zod schemas de `SearchParams`, `SearchResult`, `Autocomplete` en `src/server/search/schemas.ts`.

## Phase 3: US1 — Buscar y ver resultados (P1) 🎯 MVP
### Tests
- [ ] T020 [P] [US1] Seed test data en `tests/fixtures/search-seed.sql`.
- [ ] T021 [P] [US1] Test unit ranking: dataset con 5 productos → orden esperado.
- [ ] T022 [P] [US1] Test integration `/api/search?q=coca` → top 2 Coca-Cola.

### Implementation
- [ ] T023 [US1] Endpoint `src/app/api/search/route.ts` con Zod validate.
- [ ] T024 [US1] Implementar `src/server/search/service.ts` (call query + shape response + timing).
- [ ] T025 [US1] Log en `search_logs` cada request con `ipHash`.
- [ ] T026 [US1] Página `src/app/buscar/page.tsx` SSR con `?q=` param.
- [ ] T027 [US1] Meta tags de la página `<meta name="robots" content="noindex">`.

**Checkpoint**: `curl /api/search?q=coca` responde con Coca primero.

## Phase 4: US2 — Autocomplete debounced (P1)
- [ ] T030 [US2] Endpoint `src/app/api/search/autocomplete/route.ts`.
- [ ] T031 [US2] Cache Redis 60 s por prefijo.
- [ ] T032 [US2] Componente `SearchBar` en `src/components/domain/search-bar.tsx` con debounce.
- [ ] T033 [US2] Dropdown con productos/marcas/categorías.
- [ ] T034 [US2] Keyboard nav (↑↓ Enter Esc) con `useReducer`.
- [ ] T035 [P] [US2] Test Playwright: escribir "coc" → dropdown aparece < 300 ms.
- [ ] T036 [P] [US2] Test Playwright: Enter → navigate.
- [ ] T037 [P] [US2] Test a11y: axe 0 errores en `SearchBar` con dropdown abierto.

**Checkpoint**: SearchBar funciona en `/` y en Nav.

## Phase 5: US3 — Empty state con populares (P2)
- [ ] T040 [US3] Endpoint `/api/search/popular?zone={slug}` con Redis cache 5 min.
- [ ] T041 [US3] Query: top 10 queries de `search_logs` últimos 7d por zona.
- [ ] T042 [US3] Renderizar chips en dropdown cuando input vacío.
- [ ] T043 [US3] Guardar última búsqueda en localStorage y mostrar en empty state.

## Phase 6: US4 — Zero results + "quisiste decir" (P2)
- [ ] T050 [US4] Query de `word_similarity` en `service.ts` cuando `total < 3`.
- [ ] T051 [US4] UI: "Buscabas 'X'? No encontramos nada. ¿Quisiste decir Y?"
- [ ] T052 [US4] Log `suggestion_shown` y `suggestion_clicked` en Plausible.

## Phase 7: Polish
- [ ] T060 [P] Load test k6: 100 rps → p95 < 200 ms.
- [ ] T061 [P] Analytics Plausible custom events: `search`, `autocomplete_select`, `did_you_mean_click`.
- [ ] T062 [P] `docs/search/ranking.md` con explicación del algoritmo.
- [ ] T063 Constitution Check.

## Definition of Done
- [ ] p95 < 200 ms.
- [ ] Autocomplete < 300 ms.
- [ ] Ranking testeado.
- [ ] a11y 0 errores.
- [ ] Docs completos.
