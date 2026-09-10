# Tasks: Price Alerts

## Phase 1: Setup
- [ ] T001 Instalar `resend`, `@react-email/components`, `@react-email/render`.
- [ ] T002 Generar `ALERT_TOKEN_SECRET` y agregar a env vars.
- [ ] T003 Migration: tabla `alerts` + `email_events`.

## Phase 2: Foundational
- [ ] T010 [P] `src/lib/tokens.ts` — sign, verify, purpose-scoped, expiry.
- [ ] T011 [P] `src/lib/rate-limit.ts` — token bucket sobre Redis.
- [ ] T012 [P] Templates React Email en `src/emails/`.
- [ ] T013 [P] Wrapper `src/lib/resend.ts` con retry + logging.

## Phase 3: US1 — Crear alerta + doble opt-in (P1) 🎯 MVP
### Tests
- [ ] T020 [P] [US1] Unit: token sign/verify.
- [ ] T021 [P] [US1] Unit: `CreateAlert` Zod schema (invalid emails).
- [ ] T022 [P] [US1] Integration: POST → mock Resend called with expected params.
- [ ] T023 [US1] Playwright: form → email mock → verify link → success page.

### Implementation
- [ ] T024 [US1] `POST /api/alerts/route.ts` con dedup (email+product+target).
- [ ] T025 [US1] Envío email con Resend (`AlertVerify`).
- [ ] T026 [US1] `GET /api/alerts/verify` route verifica token, activa alert.
- [ ] T027 [US1] Página `/alerts/verified` con confirmación.
- [ ] T028 [US1] Integrar `<AlertCard>` (design system) en `/producto/[slug]` (llena mount de F07).

**Checkpoint**: POST → email → click → alerta activa.

## Phase 4: US2 — Cron detecta bajas (P1)
- [ ] T030 [US2] Script `src/scripts/alerts-scan.ts`.
- [ ] T031 [US2] Query batch por producto+zona.
- [ ] T032 [US2] Enqueue emails con `p-limit(10)`.
- [ ] T033 [US2] Registrar `notifiedAt` y `EmailEvent`.
- [ ] T034 [US2] Workflow `.github/workflows/alerts-scan.yml`.
- [ ] T035 [P] [US2] Integration test: seed alerta + precio bajo → mock Resend called.
- [ ] T036 [P] [US2] Test cooldown: notificar dos veces mismo día → segunda no envía.

## Phase 5: US3 — Unsubscribe one-click (P1)
- [ ] T040 [US3] `GET /api/alerts/unsubscribe` verifica token, cancela.
- [ ] T041 [US3] Página `/alerts/cancelled`.
- [ ] T042 [US3] Todos los emails incluyen link unsubscribe visible.
- [ ] T043 [P] [US3] Test: cancelar → cron no envía más.

## Phase 6: US4 — Rate-limit (P2)
- [ ] T050 [US4] Middleware IP rate-limit en `/api/alerts`.
- [ ] T051 [US4] Check email max 20 activas antes de crear.
- [ ] T052 [P] [US4] Test 6ta alerta en 1h → 429.

## Phase 7: US5 — Panel del usuario (P2)
- [ ] T060 [US5] `POST /api/alerts/manage-link` (email-only) → envía email con `manageToken`.
- [ ] T061 [US5] `/mis-alertas?token=X` — lista + cancelar individual.
- [ ] T062 [P] [US5] Playwright: manage link → panel → cancelar → confirmado.

## Phase 8: Polish
- [ ] T070 [P] Webhook Resend `POST /api/webhooks/resend` + verificación firma.
- [ ] T071 [P] `pnpm alerts:cleanup` purga `ipHash` > 30d.
- [ ] T072 [P] Página `/privacidad` y `/terminos` actualizadas con política de emails.
- [ ] T073 [P] Métrica dashboard `/admin/alerts-status` (activas, notificadas 7d, bounce rate).
- [ ] T074 [P] Bounce hard → status=bounced automatic.
- [ ] T075 Constitution Check.

## Definition of Done
- [ ] Doble opt-in verificado end-to-end.
- [ ] Cron horario en prod.
- [ ] Unsubscribe funcional.
- [ ] Rate-limit activo.
- [ ] Webhook Resend integrado.
- [ ] PII cleanup script listo.
