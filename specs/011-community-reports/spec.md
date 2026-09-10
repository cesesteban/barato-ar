# Feature Specification: Community Reports (Report an Offer)

**Feature Branch**: `011-community-reports`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 002, 003, 005, 007

## Overview

Formulario público `/reportar` para que cualquier persona (sin cuenta) reporte una oferta: producto (autocomplete), cadena, sucursal (autocomplete de la zona), precio, foto opcional, vigencia. Los reportes entran en cola con `status = pending`. Moderación mixta: auto-hold + revisión manual por admin. Sistema de votos anti-fraude en el feed público. Rate-limit por IP.

## User Scenarios & Testing

### User Story 1 — Reportar una oferta desde el formulario (P1) 🎯 MVP

**Descripción**: Un usuario ve una oferta que no está en Precioya y llena el form; queda `pending`. Nadie más la ve hasta aprobación.

**Independent Test**: POST `/api/reports` → row en tabla con `status=pending`.

**Acceptance Scenarios**:
1. **Given** formulario válido, **When** se envía, **Then** aparece confirmación "gracias, revisamos y aprobamos".
2. **Given** foto de 5 MB, **When** se envía, **Then** se acepta y se sube al blob storage.

### User Story 2 — Admin aprueba/rechaza reportes (P1)

**Descripción**: `/admin/reports-queue` lista pending, admin revisa y aprueba (crea `Price + Offer`) o rechaza.

**Independent Test**: aprobar → aparece en feed público como `source=crowdsourced`.

**Acceptance Scenarios**:
1. **Given** un report pending, **When** admin aprueba, **Then** se crea Price con `source=crowdsourced` y report status=approved.
2. **Given** admin rechaza con motivo, **When** se rechaza, **Then** report status=rejected + `reasonRejected` guardado.

### User Story 3 — Rate-limit por IP y captcha simple (P1)

**Descripción**: Máx 5 reports por IP por hora; después del 3ro, aparece captcha (Cloudflare Turnstile).

### User Story 4 — Votos en feed público (P2)

**Descripción**: Usuarios pueden votar 👍/👎 en un report aprobado; ≥ 3 downvotes verificados → auto-hide + re-review admin.

### User Story 5 — Fotos moderadas (P2)

**Descripción**: Fotos pasan por auto-check (NSFW básico via un modelo abierto o Cloudflare Images) antes de mostrar.

### Edge Cases

- Producto no en catálogo → offer flag "producto nuevo" para F05.
- Sucursal no en catálogo → texto libre + admin la crea si aprueba.
- Report duplicado (mismo producto+tienda mismo día) → auto-merge.
- Fotos > 10 MB → reject 413.

## Requirements

### Functional Requirements

- **FR-001**: Tabla `Report` con `{id, productSlug|productText, chainSlug, storeText, price, previousPrice, validTo, photoUrl, description, ipHash, status, reasonRejected, approvedBy, approvedAt, createdAt}`.
- **FR-002**: Endpoint `POST /api/reports` con Zod, multipart para foto.
- **FR-003**: Storage de fotos: Vercel Blob o Cloudflare Images.
- **FR-004**: Rate-limit: 5/hora/IP.
- **FR-005**: Turnstile obligatorio a partir del 3er report en 1h.
- **FR-006**: Admin UI `/admin/reports-queue` con foto preview + side-by-side con historial de precios existente.
- **FR-007**: Aprobación → crear `Price + Offer` con `source=crowdsourced`.
- **FR-008**: Votos: `ReportVote` `{reportId, ipHash, kind: up|down}`; 1 vote por IP por report.
- **FR-009**: Downvotes ≥ 3 → auto-hide del feed + status=re-review.
- **FR-010**: Preservar `ipHash` (no IP cruda) por 90 días para anti-fraude.
- **FR-011**: PII/foto: purgar `photoUrl` si status=rejected tras 30 días.

### Key Entities

- **Report**: descrito arriba.
- **ReportVote**: voto anónimo.

## Success Criteria

- **SC-001**: > 10 reports/día en semana 4.
- **SC-002**: > 70 % aprobados.
- **SC-003**: < 5 spam reports/día tras Turnstile.
- **SC-004**: Admin decide 30 items/hora.
- **SC-005**: 0 fotos NSFW en producción (target).

## Assumptions

- Turnstile free tier alcanza.
- Vercel Blob free tier (1 GB) alcanza inicial.
- Modelo NSFW: `nsfwjs` local (via serverless) o Cloudflare Images (paid).
