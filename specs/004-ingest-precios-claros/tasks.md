# Tasks: Ingest Precios Claros (SEPA)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md)

## Phase 1: Setup

- [ ] T001 Instalar `csv-parse`, `zod` (ya está), `haversine-distance`.
- [ ] T002 Crear `src/ingestion/pcl/` según plan.
- [ ] T003 [P] Investigar URL oficial actual del dataset SEPA y documentar en `docs/ingest/sepa.md`.
- [ ] T004 Definir seed de zonas base en `prisma/seed/zones.ts` (CABA barrios + PBA GBA norte/oeste/sur).

## Phase 2: Foundational

- [ ] T010 Escribir `src/ingestion/pcl/manifest.ts` — fetch + parse manifest.json.
- [ ] T011 Escribir `src/ingestion/pcl/downloader.ts` — download CSV con retry y `Retry-After` honor.
- [ ] T012 [P] Escribir `src/ingestion/pcl/chains.ts` con mapeo `id_comercio → chainId`.
- [ ] T013 [P] Escribir `src/ingestion/pcl/zones.ts` con función `resolveZone(provincia, ciudad, localidad, lat, lng)`.
- [ ] T014 Escribir `src/ingestion/pcl/geo.ts` — `isInGBA(lat, lng)` con radio 50 km desde Obelisco.
- [ ] T015 Schemas Zod: `SepaSucursalSchema`, `SepaProductoSchema`, `SepaPrecioSchema` en `src/ingestion/pcl/schemas.ts`.

**Checkpoint**: `pnpm ingest pcl --dry-run` descarga manifest sin errores.

---

## Phase 3: US1 — Ingesta semanal automática (P1) 🎯 MVP

### Tests

- [ ] T020 [P] [US1] Fixture `tests/fixtures/pcl/sucursales-sample.csv` (~30 rows mix CABA/PBA/Ushuaia).
- [ ] T021 [P] [US1] Fixture `precios-sample.csv` (~100 rows).
- [ ] T022 [P] [US1] Test `pcl.test.ts` — pipeline completo contra fixtures → assert counts.

### Implementation

- [ ] T023 [US1] Implementar `src/ingestion/pcl/stores.ts` — pass 1 (upsert Zone + Store).
- [ ] T024 [US1] Implementar `src/ingestion/pcl/products.ts` — pass 2 (upsert Product por EAN).
- [ ] T025 [US1] Implementar `src/ingestion/pcl/prices.ts` — pass 3 (streaming, upsert Price + PriceHistory).
- [ ] T026 [US1] Integrar en `src/ingestion/core/runner.ts` como fuente `pcl`.
- [ ] T027 [US1] `pnpm ingest pcl` funciona local contra dataset real; verificar > 5000 rows.

**Checkpoint**: `pnpm ingest pcl` en local trae > 5000 precios de CABA+GBA en < 20 min.

---

## Phase 4: US1 continua — cron GH Actions

- [ ] T030 [US1] Crear `.github/workflows/ingest-pcl.yml` (cron martes 8am ART, `workflow_dispatch`).
- [ ] T031 [US1] Configurar `timeout-minutes: 30`.
- [ ] T032 [US1] Correr `workflow_dispatch` manual y verificar rows en prod.

**Checkpoint**: workflow verde en corrida manual; rows en prod.

---

## Phase 5: US2 — Zonas y sucursales reales (P1)

- [ ] T040 [US2] Confirmar que `stores` post-corrida tiene > 200 rows con `is_virtual = false`.
- [ ] T041 [US2] Confirmar que `zones` tiene > 20 rows con jerarquía correcta.
- [ ] T042 [US2] Test `zones.test.ts` — casos: "Palermo" → `caba-palermo`, "Morón" → `pba-gba-oeste`.
- [ ] T043 [US2] Correr script `pnpm db:validate:zones` para detectar sucursales sin zona asignada.

**Checkpoint**: mapa de zones + stores coherente.

---

## Phase 6: US3 — Deduplicación con folletos (P2)

- [ ] T050 [US3] En `prices.ts`, agregar check de `existingFlyer` antes de upsert.
- [ ] T051 [US3] Test `dedup.test.ts` — mock `Price` con `source='flyer'` → PCL skip.
- [ ] T052 [US3] Correr F03 + F04 en secuencia contra DB dev; query dedup:
  ```sql
  SELECT product_id, store_id, DATE(valid_from), COUNT(*)
  FROM prices GROUP BY 1,2,3 HAVING COUNT(*) > 1;
  ```
  → 0 rows.

**Checkpoint**: no hay duplicados F03↔F04.

---

## Phase 7: Polish

- [ ] T060 [P] `docs/ingest/sepa.md` con endpoints, formato y troubleshooting.
- [ ] T061 [P] Alerta si manifest.json cambia formato (schema violation).
- [ ] T062 [P] Considerar chunking del pass 3 en batches de 1000 para reducir memoria.
- [ ] T063 Constitution Check final.

## Definition of Done

- [ ] > 5000 rows de PCL ingestados por semana.
- [ ] > 200 sucursales reales con lat/lng.
- [ ] 0 duplicados con folletos.
- [ ] Cron programado y verificado.
- [ ] Docs completos.
