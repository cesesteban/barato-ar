# Feature Specification: Price Alerts (Email-only)

**Feature Branch**: `009-price-alerts-email`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 001, 003, 005, 007

## Overview

Sistema de alertas de precio sin cuentas: el usuario deja su email + producto + precio objetivo; el sistema envía un email de confirmación (doble opt-in), guarda la alerta y cuando el precio llega o baja, envía una notificación con link al producto. Cumple Ley 25.326 (AR) y GDPR-style unsubscribe.

## User Scenarios & Testing

### User Story 1 — Crear alerta y confirmar por email (P1) 🎯 MVP

**Descripción**: Desde `/producto/[slug]` el usuario pega su email y precio objetivo; recibe un email de confirmación con link; al clickear, la alerta queda activa.

**Independent Test**: POST `/api/alerts` → email enviado (mock) → GET `/api/alerts/verify?token=...` → `Alert.verified = true`.

**Acceptance Scenarios**:
1. **Given** producto Coca 2.25L en $890, **When** el usuario suscribe a $800, **Then** recibe email de confirmación con link único.
2. **Given** un token válido, **When** se hace GET al link, **Then** alerta queda `verified = true` y se muestra "listo, te avisamos".
3. **Given** un token inválido/expirado, **When** se hace GET, **Then** UI amigable "el link expiró, creá otra alerta".

### User Story 2 — Cron detecta bajas y envía notificación (P1)

**Descripción**: Cada hora, un job compara `target_price` con `min(current_price)` por producto+zona; si `current <= target`, dispara email.

**Independent Test**: seed alerta $800 + insertar Price $790 → correr cron → email enviado + `notified_at` set.

**Acceptance Scenarios**:
1. **Given** alerta activa a $800 y precio actual $790, **When** cron corre, **Then** email enviado y alerta marcada como `notified_at = now`.
2. **Given** alerta ya notificada esta semana, **When** cron corre y precio sigue bajo, **Then** NO se re-notifica (cooldown 7d).

### User Story 3 — Unsubscribe con un click (P1)

**Descripción**: Cada email tiene link `Cancelar alerta` con token firmado; un GET desactiva la alerta.

**Independent Test**: `GET /api/alerts/unsubscribe?token=X` → alerta status=cancelled + UI confirmación.

### User Story 4 — Rate-limit por email para prevenir abuso (P2)

**Descripción**: Máx 20 alertas activas por email; máx 5 nuevas por hora por IP.

### User Story 5 — Panel del usuario `/mis-alertas?token=X` (P2)

**Descripción**: Con un `management_token` (firmado, email-scoped, largo), el usuario ve todas sus alertas y puede cancelarlas.

### Edge Cases

- Email inválido → 422 con mensaje.
- Precio objetivo > precio actual → aceptar (para "avisame si baja aún más"; el criterio es `current <= target`).
- Producto eliminado del catálogo → cancelar alertas asociadas con notificación (no en MVP).
- Bounce hard de email → marcar suscripción como bounce_hard; no reintentar.
- Doble creación con mismo email/producto → devolver la existente en lugar de crear otra.

## Requirements

### Functional Requirements

- **FR-001**: `Alert` tabla con `{email, productId, targetPrice, zoneSlug, verifyToken, unsubscribeToken, verifiedAt, notifiedAt, status, createdAt, ipHash}`.
- **FR-002**: Doble opt-in obligatorio (verified_at requerido para que cron notifique).
- **FR-003**: Tokens firmados con `HMAC(secret, alertId + purpose)`, `purpose ∈ {verify, unsubscribe, manage}`.
- **FR-004**: `verifyToken` expira en 24 h; `unsubscribeToken` no expira.
- **FR-005**: Cron cada hora (`0 * * * *`), corre en < 5 min para hasta 100k alertas.
- **FR-006**: Cooldown 7 días entre notificaciones para una misma alerta.
- **FR-007**: Emails con Resend; templates en React Email.
- **FR-008**: Todos los emails incluyen link unsubscribe visible.
- **FR-009**: PII: solo `email` guardado; `ipHash` para rate-limit, purgar > 30 días.
- **FR-010**: Endpoint `POST /api/alerts` acepta `{email, productSlug, targetPrice, zoneSlug}`.

### Key Entities

- **Alert**: descripta arriba. `status: pending | active | notified | cancelled | bounced`.
- **EmailEvent** (log): `{alertId, kind: sent|opened|bounced, ts}`.

## Success Criteria

- **SC-001**: Latencia POST alert → email recibido < 30 s.
- **SC-002**: > 80 % de verify emails son abiertos y clickeados.
- **SC-003**: Cron corre en < 5 min con 10k alertas.
- **SC-004**: Notification delivery rate > 95 % (excluyendo bounces).
- **SC-005**: 0 leaks de PII en logs.

## Assumptions

- Resend plan free alcanza para MVP (3000 emails/mes).
- Ley 25.326: guardar consentimiento (email log + timestamp) alcanza.
- Sin push notifications ni SMS en MVP.
