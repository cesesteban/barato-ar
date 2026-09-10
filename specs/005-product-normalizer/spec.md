# Feature Specification: Product Normalizer

**Feature Branch**: `005-product-normalizer`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 003, 004

## Overview

Resolver el problema de "el mismo producto tiene distinto nombre en cada cadena". Ej: "Coca-Cola Original 2.25L Retornable" (Carrefour) y "Gaseosa Coca-Cola 2.25 L retornable" (Día) son EL MISMO producto. El normalizador matchea por (1) EAN cuando existe, (2) similitud vectorial + reglas de negocio cuando no. Cola de revisión manual para casos ambiguos.

> **Aplica C-004 de [clarifications.md](../../.specify/memory/clarifications.md)**: `packagingFlag` distinto → confidence = 0 y no queda ni en cola.
> **Aplica C-003**: dos productos con misma `standardUnit + standardSize` son candidatos aunque el nombre difiera.

## User Scenarios & Testing

### User Story 1 — Matching automático por EAN (P1) 🎯 MVP

**Descripción**: Cuando dos rows de `products` distintas comparten EAN, el sistema las mergea en un `canonical_product_id`.

**Independent Test**: Correr con fixtures de 2 cadenas con mismo EAN → 1 canonical product, 2 chain-listings.

**Acceptance Scenarios**:
1. **Given** productos con mismo EAN, **When** corre el matcher, **Then** ambos apuntan a un `canonicalId` y `Price` se agrupa por canonical en la comparación.

### User Story 2 — Matching fuzzy sin EAN (P1)

**Descripción**: Sin EAN, el sistema calcula similitud entre `normalizedName + brand + size + unit` y auto-mergea con `confidence >= 0.90`.

**Independent Test**: Correr con "Coca 2.25L" y "Coca-Cola 2.25 L" (sin EAN) → match automático.

**Acceptance Scenarios**:
1. **Given** productos altamente similares, **When** corre el matcher, **Then** se mergean con confidence log.
2. **Given** productos con `size` distinto, **When** corre el matcher, **Then** NO se mergean aunque nombre + marca coincidan.

### User Story 3 — Cola de revisión manual (P2)

**Descripción**: Matches con confidence 0.60–0.89 quedan en cola `/admin/normalizer-queue`. Un admin aprueba o rechaza.

**Independent Test**: Insertar 3 candidatos borderline, ver la cola, aprobar 2, rechazar 1 → estado se refleja.

**Acceptance Scenarios**:
1. **Given** un candidato en cola, **When** admin aprueba, **Then** ambos productos comparten `canonicalId`.
2. **Given** un candidato rechazado, **When** vuelve a aparecer en ingesta, **Then** no se sugiere de nuevo (blacklist).

### User Story 4 — Recomputo periódico (P2)

**Descripción**: Job semanal recalcula todos los matches con umbral actualizado; nuevos matches, cero regresiones sobre aprobados.

### Edge Cases

- Producto retornable vs. no-retornable con mismo tamaño → NO son el mismo.
- Producto light vs. regular con mismo tamaño → NO son el mismo.
- Producto con packaging distinto (ej. lata 354 ml vs botella 354 ml) → NO son el mismo (variant explícita en `size` + `packaging`).

## Requirements

### Functional Requirements

- **FR-001**: `Product` DEBE tener nuevo campo `canonicalId` (self-reference).
- **FR-002**: El matcher DEBE ejecutarse tras cada ingesta (F03 y F04) y en cron semanal.
- **FR-003**: Match automático por EAN sin confidence score (confidence = 1.0).
- **FR-004**: Match fuzzy usa: token overlap normalizado (Jaccard) + Levenshtein normalizado + coincidencia estricta de `size` y `unit`.
- **FR-005**: Threshold: confidence ≥ 0.90 → auto; 0.60–0.89 → cola; < 0.60 → skip.
- **FR-006**: Cola persiste en tabla `NormalizerCandidate` con `productAId`, `productBId`, `confidence`, `features (JSON)`, `status`, `decidedBy`, `decidedAt`.
- **FR-007**: Blacklist en `NormalizerReject` para pares ya rechazados.
- **FR-008**: Métricas expuestas: total canonical, huérfanos, cola pendiente, precision estimada.
- **FR-009**: Rollback: admin puede des-mergear un canonical (raro pero necesario).

### Key Entities

- **Product** (extendido): `canonicalId?: string`.
- **NormalizerCandidate**: `{id, productAId, productBId, confidence, features, status: pending/approved/rejected}`.
- **NormalizerReject**: `{productAId, productBId, reason, createdAt}`.

## Success Criteria

- **SC-001**: > 70 % de productos de cadenas soportadas tienen `canonicalId` no-null a 4 semanas del launch.
- **SC-002**: Precision de auto-matches ≥ 0.98 (medida contra sample manual de 100).
- **SC-003**: Cola de revisión < 200 items en régimen normal.
- **SC-004**: Un admin decide 20 items/hora.
- **SC-005**: Regresión 0 sobre matches aprobados tras recomputo.

## Assumptions

- pgvector disponible para similitud (embeddings opt).
- Para MVP se usan solo métricas string; embeddings quedan para post-MVP.
- Marca "Coca-Cola" y "coca cola" son la misma tras normalización.
