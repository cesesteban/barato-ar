# Tasks: Price History & Charts

## Phase 1: Setup
- [ ] T001 Migration: crear materialized view `price_daily_avg` con índices.
- [ ] T002 Backfill inicial refrescando la view.

## Phase 2: Foundational
- [ ] T010 [P] `src/server/history/get-history.ts`.
- [ ] T011 [P] Helpers puros `src/lib/chart.ts`: `computeScales`, `pathFromData`, `areaFromData`, `bisectDate`.
- [ ] T012 [P] Types `HistoryResponse`.

## Phase 3: US1 — Chart visible en producto (P1) 🎯 MVP
### Tests
- [ ] T020 [P] [US1] Snapshot test: `<PriceHistoryChart data={fixture}>` → SVG estable.
- [ ] T021 [P] [US1] Test unit: `pathFromData`, `computeScales` con edge cases (1 punto, 0 puntos).

### Implementation
- [ ] T022 [US1] Componente `<PriceHistoryChart>` en design system (F02 lo dejó placeholder).
- [ ] T023 [US1] Integración en `/producto/[slug]` (RSC llama a `getHistory` y pasa `data`).
- [ ] T024 [US1] Fallback "sin historial" cuando `data.length < 7`.

**Checkpoint**: chart visible en producto.

## Phase 4: US2 — Cambio de rango (P1)
- [ ] T030 [US2] Endpoint `GET /api/product/[slug]/history`.
- [ ] T031 [US2] Client `<PriceHistoryInteractive>` con state de range.
- [ ] T032 [US2] Botones 30D/90D/180D/1A en design system.
- [ ] T033 [P] [US2] Playwright: click 30D → fetch → chart update.

## Phase 5: US3 — Stats (P1)
- [ ] T040 [US3] Card row con Current / Avg / Min (fecha) / Max (fecha).
- [ ] T041 [US3] `stats` calculado server-side.
- [ ] T042 [P] [US3] Test: Min tiene fecha correcta.

## Phase 6: US4 — Refresh nocturno (P2)
- [ ] T050 [US4] Workflow `.github/workflows/refresh-materialized-views.yml` diario.
- [ ] T051 [US4] Alerta Sentry si `REFRESH` toma > 60 s.

## Phase 7: Polish
- [ ] T060 [P] Tooltip on-hover (client component); accesible por teclado.
- [ ] T061 [P] Outlier filter en `getHistory`.
- [ ] T062 [P] Playwright a11y: chart tiene `role="img"` y `aria-label` correcto.
- [ ] T063 Bundle client chart < 15 KB gz.
- [ ] T064 Constitution Check.

## Definition of Done
- [ ] Materialized view refrescándose noctumo.
- [ ] Chart SSR-safe y accesible.
- [ ] Endpoint < 100 ms p95.
- [ ] Bundle en presupuesto.
