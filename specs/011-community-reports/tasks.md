# Tasks: Community Reports

## Phase 1: Setup
- [ ] T001 Instalar `@vercel/blob`, `sharp`, `@marsidev/react-turnstile`.
- [ ] T002 Configurar `BLOB_READ_WRITE_TOKEN`, `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
- [ ] T003 Migration: tablas `reports` + `report_votes`.

## Phase 2: Foundational
- [ ] T010 [P] Zod schemas `CreateReport`.
- [ ] T011 [P] Rate-limit wrapper `checkReportRateLimit(ipHash)`.
- [ ] T012 [P] Turnstile verify util `verifyTurnstile(token, ip)`.
- [ ] T013 [P] Blob helpers: `uploadPhoto(file)` → `{ url, blobId, thumbUrl }`.

## Phase 3: US1 — Reportar oferta (P1) 🎯 MVP
### Tests
- [ ] T020 [P] [US1] Test unit: `uploadPhoto` genera thumbnail 400x400.
- [ ] T021 [US1] Playwright: llenar form + submit → 200 + confirmación.

### Implementation
- [ ] T022 [US1] `src/app/reportar/page.tsx` con form completo.
- [ ] T023 [US1] Autocomplete producto (usa F06 API).
- [ ] T024 [US1] Autocomplete cadena/sucursal con fallback texto libre.
- [ ] T025 [US1] Widget Turnstile client-side (mostrado condicional).
- [ ] T026 [US1] `POST /api/reports/route.ts` con Zod + rate-limit + upload.
- [ ] T027 [US1] Página success `/reportar/gracias`.

**Checkpoint**: form + submit funcional.

## Phase 4: US2 — Admin approval (P1)
- [ ] T030 [US2] `src/app/admin/reports-queue/page.tsx` con lista.
- [ ] T031 [US2] Componente `<ReportReviewCard>` con foto + datos + historial.
- [ ] T032 [US2] Endpoint `POST /api/admin/reports/:id/approve`.
- [ ] T033 [US2] Endpoint `POST /api/admin/reports/:id/reject`.
- [ ] T034 [US2] Al aprobar: upsert store/product/price/offer.
- [ ] T035 [P] [US2] Test integration: approve → Price row nuevo.
- [ ] T036 [US2] Auth admin (token env).

## Phase 5: US3 — Rate-limit + Turnstile (P1)
- [ ] T040 [US3] Middleware count reports por IP en última hora.
- [ ] T041 [US3] Retornar 429 si > 5.
- [ ] T042 [US3] Retornar 428 si count > 2 y no viene turnstileToken.
- [ ] T043 [P] [US3] Test: submit 6 veces → 429.

## Phase 6: US4 — Votos en feed (P2)
- [ ] T050 [US4] Endpoint `POST /api/reports/:id/vote` (kind up|down).
- [ ] T051 [US4] `ReportVote` unique index vía ipHash.
- [ ] T052 [US4] Trigger o cron: downvotes ≥ 3 → status=re_review.
- [ ] T053 [US4] `<DealCard>` con botones vote para crowdsourced.
- [ ] T054 [P] [US4] Test: 3 downvotes → hidden del feed.

## Phase 7: US5 — Moderation de fotos (P2)
- [ ] T060 [US5] Integrar `nsfwjs` en `POST /api/reports` (server serverless).
- [ ] T061 [US5] Si score > 0.7 → `status=auto_hidden`.
- [ ] T062 [P] [US5] Test con foto ok → NO auto_hidden.

## Phase 8: Polish
- [ ] T070 [P] Cron `pnpm reports:purge` diario (foto + ipHash retention).
- [ ] T071 [P] Workflow `.github/workflows/reports-purge.yml`.
- [ ] T072 [P] `/reportar` link en Nav + empty states.
- [ ] T073 [P] Métricas dashboard: total reports, aprobados, rejected, cola.
- [ ] T074 Constitution Check.

## Definition of Done
- [ ] Form público funcional con Turnstile.
- [ ] Cola admin funcional.
- [ ] Approval crea `Price + Offer` con `source=crowdsourced`.
- [ ] Voting + auto-hide funcional.
- [ ] Purga PII/foto cron activo.
- [ ] Rate-limit y captcha probados.
