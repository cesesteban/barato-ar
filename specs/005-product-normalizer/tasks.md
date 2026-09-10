# Tasks: Product Normalizer

## Phase 1: Setup
- [ ] T001 Instalar `string-similarity` (Jaro-Winkler + Levenshtein).
- [ ] T002 Crear `src/normalizer/` (index, matcher, features, merger).

## Phase 2: Foundational
- [ ] T010 Migration: agregar `Product.canonicalId` self-ref + `NormalizerCandidate` + `NormalizerReject`.
- [ ] T011 Índice `products(canonical_id)`.
- [ ] T012 [P] Crear `tests/fixtures/normalizer/ground-truth.json` con 200 pares etiquetados.
- [ ] T013 [P] Escribir `src/normalizer/features.ts` — jaroWinkler, sizeMatch, detectPackagingConflict.
- [ ] T014 Escribir `src/normalizer/matcher.ts` — score + bucket.

## Phase 3: US1 — EAN match (P1) 🎯 MVP
- [ ] T020 [US1] Implementar `src/normalizer/pass-ean.ts` con la query SQL del plan.
- [ ] T021 [P] [US1] Test: 3 productos con mismo EAN → todos comparten `canonicalId`.
- [ ] T022 [US1] Hook en runner F03/F04 post-ingest.

## Phase 4: US2 — Fuzzy match (P1)
- [ ] T030 [US2] Implementar `src/normalizer/pass-fuzzy.ts` con thresholds.
- [ ] T031 [US2] Evaluar contra ground-truth: precision/recall ≥ 0.95/0.80.
- [ ] T032 [P] [US2] Test packaging conflict: retornable vs no-retornable → confidence = 0.
- [ ] T033 [P] [US2] Test size mismatch → no auto-merge.

## Phase 5: US3 — Cola manual (P2)
- [ ] T040 [US3] `src/app/admin/normalizer-queue/page.tsx` con lista + side-by-side.
- [ ] T041 [US3] Endpoints `POST /api/admin/normalizer/candidates/:id/approve|reject`.
- [ ] T042 [US3] Playwright test: aprobar en UI → canonical updated.
- [ ] T043 [US3] Auth por env token (middleware).

## Phase 6: US4 — Recomputo semanal (P2)
- [ ] T050 [US4] Script `pnpm normalize:full` corre pass 1 + 2 full.
- [ ] T051 [US4] Workflow `.github/workflows/normalize-weekly.yml` (miércoles 3am ART).
- [ ] T052 [US4] Verificar que aprobados en cola no se rompen tras recomputo.

## Phase 7: Polish
- [ ] T060 [P] Métrica: `/admin/normalizer-status` con canonical count, orphans, queue length.
- [ ] T061 [P] Docs `docs/normalizer/algorithm.md`.
- [ ] T062 Constitution Check.

## Definition of Done
- [ ] Precision ≥ 0.98 en auto-matches.
- [ ] > 70 % productos con canonical en 4 semanas.
- [ ] Cola manual funcional.
- [ ] Rollback de merge implementado.
