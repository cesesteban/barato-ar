# Tasks: Ingest Supermarket Flyers

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Setup

- [ ] T001 Instalar deps: `cheerio`, `pdf-parse`, `undici`, `commander`, `robotstxt-parser`, `@sentry/node`.
- [ ] T002 Crear estructura `src/ingestion/` según plan.
- [ ] T003 [P] Seed inicial de cadenas: `pnpm db:seed:chains` (Carrefour, Coto, Día, Jumbo).

## Phase 2: Foundational — Data model + schema

- [ ] T010 Actualizar `prisma/schema.prisma` con: `Chain`, `Zone`, `Store`, `Product` (incl. `standardSize`, `standardUnit`, `packagingFlag`), `Price` (incl. `promoType`, `promoBuyQty/PayQty`, `promoSecondDiscountPct`, `promoDescription`, `pricePerUnit`, `pricePerUnitEff`), `PriceHistory`, `Offer`, `IngestionRun` + enums (incl. `PromoType`).
- [ ] T011 Crear migración `prisma migrate dev --name core_schema`.
- [ ] T012 Seed inicial: 4 chains + 4 stores virtuales (`isVirtual = true, zoneId = null`).
- [ ] T013 [P] Escribir `src/ingestion/core/normalize.ts` — normaliza nombre (lowercase, unaccent, tokens ordenados alfabéticamente) + detecta `packagingFlag` (retornable/descartable/light/zero…).
- [ ] T013b [P] Escribir `src/lib/units.ts` — `computeStandardUnit(size, unit)` y `computePricePerUnit(price, standardSize)` (C-003).
- [ ] T013c [P] Escribir `src/lib/promo.ts` — `computeEffectiveUnitPrice(price, promoType, promoBuyQty, promoPayQty, promoSecondDiscountPct)` (C-001).
- [ ] T013d [P] Escribir `src/ingestion/core/parse-promo.ts` — reconoce patrones de combo en texto de folleto (`2x1`, `3x2`, `LLEVA 3 PAGA 2`, `2do al 70%`, `3 iguales 20%`).
- [ ] T014 [P] Escribir `src/ingestion/core/http.ts` — undici + rate-limit + robots.txt.
- [ ] T015 [P] Escribir `src/ingestion/core/idempotency.ts` — upsert helpers.
- [ ] T016 Escribir `src/ingestion/core/runner.ts` — orquestador con logging + Sentry + llamadas a compute helpers.
- [ ] T017 Escribir `src/ingestion/core/cli.ts` — `pnpm ingest <chain>` con commander.
- [ ] T017b [P] Tests unit `parse-promo.test.ts` con snapshots de textos reales de folletos.
- [ ] T017c [P] Tests unit `units.test.ts` (ml→L, g→kg, x4 rollos, 6-pack lata).
- [ ] T017d [P] Tests unit `promo.test.ts` para cada `PromoType`.

**Checkpoint**: `pnpm ingest --help` funciona. Migration aplicada.

---

## Phase 3: US1 — Parser Carrefour manual (P1) 🎯 MVP

### Tests

- [ ] T020 [P] [US1] Descargar folleto Carrefour semana actual → guardar como fixture en `tests/fixtures/flyers/carrefour/YYYY-WW.html`.
- [ ] T021 [P] [US1] Escribir test `parser.test.ts` — parse(fixture) → snapshot; asserts sobre estructura.
- [ ] T022 [P] [US1] Test `idempotency.test.ts` — dos corridas contra fixture → mismo count.

### Implementation

- [ ] T023 [US1] `src/ingestion/chains/carrefour/fetcher.ts` — descubre URL del folleto vigente.
- [ ] T024 [US1] `src/ingestion/chains/carrefour/parser.ts` — cheerio + heurísticas para extraer `ParsedItem[]`.
- [ ] T025 [US1] `src/ingestion/chains/carrefour/index.ts` — export `ChainParser`.
- [ ] T026 [US1] Registrar Carrefour en el runner.
- [ ] T027 [US1] Correr localmente `pnpm ingest carrefour` contra DB dev; verificar rows.

**Checkpoint**: `pnpm ingest carrefour` inserta > 100 productos con precio actual y anterior en < 3 min.

---

## Phase 4: US1 continua — Coto, Día, Jumbo (P1)

- [ ] T030 [P] [US1] Fixture + parser Coto.
- [ ] T031 [P] [US1] Fixture + parser Día.
- [ ] T032 [P] [US1] Fixture + parser Jumbo (Cencosud → similar a Vea y Disco, se agregarán en F04).
- [ ] T033 [US1] Registrar los 3 en runner y verificar.

**Checkpoint**: `pnpm ingest coto|dia|jumbo` funciona; total > 400 rows/semana.

---

## Phase 5: US2 — Ingesta semanal automática (P1)

- [ ] T040 [US2] Crear `.github/workflows/ingest-flyers.yml` con cron lunes 8am ART y matrix por cadena.
- [ ] T041 [US2] Configurar secrets `DATABASE_URL_UNPOOLED`, `SENTRY_DSN_INGEST` en GH Actions.
- [ ] T042 [US2] Verificar corrida manual del workflow (`workflow_dispatch`).
- [ ] T043 [US2] Documentar el schedule en `docs/ingest/README.md`.

**Checkpoint**: workflow verde en corrida manual. Cron programado.

---

## Phase 6: US3 — Dashboard de estado (P2)

- [ ] T050 [US3] Crear página `src/app/admin/ingest-status/page.tsx` con auth por env token (middleware).
- [ ] T051 [US3] Query últimas 10 runs por cadena con `IngestionRun`.
- [ ] T052 [US3] Renderizar tabla: cadena, started_at, duration, status, rows, error.
- [ ] T053 [US3] Playwright test: login con token → tabla renderiza.

**Checkpoint**: `/admin/ingest-status` muestra las últimas corridas.

---

## Phase 7: US4 — Alerta caída ≥ 20 % (P2)

- [ ] T060 [US4] En `runner.ts`, tras finalizar, comparar `rowsIngested` vs corrida anterior exitosa.
- [ ] T061 [US4] Si delta < 0.8, `Sentry.captureMessage(warning)` con contexto.
- [ ] T062 [US4] Test: mock IngestionRun anterior con 500 rows; nueva con 300 → expect Sentry mock called.

**Checkpoint**: alerta se dispara correctamente en test.

---

## Phase 8: Polish

- [ ] T070 [P] `docs/ingest/parser-authoring.md` — cómo agregar una cadena nueva.
- [ ] T071 [P] Métricas custom en `IngestionRun.metadata`: parser_version, snapshot_hash, http_timing.
- [ ] T072 [P] Refactor: extraer helpers de cheerio comunes (`parsePrice`, `parseSize`) a `core/parse-utils.ts`.
- [ ] T073 Correr `pnpm ingest` de todas las cadenas en secuencia; medir tiempo total (target < 15 min).
- [ ] T074 Constitution Check final.

## Dependencies

- Foundational (T010–T017) bloquea todo.
- US1 primero (Carrefour); las otras 3 cadenas en paralelo tras Carrefour probado.
- US2 requiere US1.
- US3 y US4 pueden ir en paralelo tras US2.

## Definition of Done

- [ ] 4 parsers implementados y con snapshot tests.
- [ ] Ingesta semanal automática funcionando.
- [ ] Dashboard admin funcional.
- [ ] Alerta de caída ≥ 20 % verificada.
- [ ] > 400 rows totales por semana.
- [ ] Docs de parser authoring publicadas.
