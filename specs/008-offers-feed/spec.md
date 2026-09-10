# Feature Specification: Offers Feed (Home + Listing)

**Feature Branch**: `008-offers-feed`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 002, 003, 005, 006, 007

## Overview

Home (`/`) con hero + feed de "Mejores ofertas de hoy" en la zona actual y ruta `/ofertas` con listado completo, sidebar de filtros (vertical, cadena, % descuento, distancia, validez, tipo de promo, vecinos on/off), chips activos, paginación infinita y orden por descuento/novedad/popularidad/precio-por-unidad.

> **Aplica**: C-001 (badge combo + filtro por `promoType`), C-002 (`<NeighborsToggle>` en sidebar + separador visual), C-003 (badge $/L en card + orden opcional), C-004 (implícito vía canonicals separados) — ver [clarifications.md](../../.specify/memory/clarifications.md).

## User Scenarios & Testing

### User Story 1 — Landing con feed de ofertas destacadas (P1) 🎯 MVP

**Descripción**: El usuario entra a `/` y ve las 8 mejores ofertas de su zona ordenadas por `discount_pct` desc.

**Independent Test**: `curl /` responde HTML con al menos 8 `<article class="deal-card">`.

**Acceptance Scenarios**:
1. **Given** 200 ofertas activas en Palermo, **When** el usuario entra a `/`, **Then** ve 8 cards ordenadas por descuento decreciente.
2. **Given** el usuario cambia zona, **When** re-renderiza, **Then** las cards son de la nueva zona.

### User Story 2 — Feed completo con filtros (P1)

**Descripción**: El usuario navega a `/ofertas`; sidebar permite filtrar por vertical, cadena, % descuento mínimo, distancia. Orden por: mayor descuento / más nuevas / más populares.

**Independent Test**: aplicar `?vertical=supermarket&minDiscount=20` → todos los resultados cumplen.

### User Story 3 — Chips activos con "quitar" (P1)

**Descripción**: Filtros aplicados aparecen como chips arriba del grid; click en X del chip lo quita.

**Independent Test**: aplicar 2 filtros → 2 chips visibles; click X en uno → URL y grid se actualizan.

### User Story 4 — Paginación infinita (P2)

**Descripción**: Scroll cerca del bottom carga siguiente página automáticamente.

**Independent Test**: scroll → segunda página fetch → cards añadidas.

### User Story 5 — Vista mobile con tabs (P2)

**Descripción**: En mobile 375, en lugar de sidebar hay tabs horizontales de vertical + botón "Más filtros" que abre un bottom sheet.

### Edge Cases

- Zona sin ofertas → mensaje "todavía no hay ofertas en tu zona; reportá una".
- Filtros contradictorios → cero resultados con "no encontramos con estos filtros, quitá alguno".
- Overflow de chips → wrap en múltiples líneas.

## Requirements

### Functional Requirements

- **FR-001**: `/` DEBE ser SSG con `revalidate = 300` (5 min).
- **FR-002**: `/ofertas` DEBE aceptar query params: `zone`, `vertical`, `chains[]`, `minDiscount`, `maxDistanceKm`, `validity`, `sort`, `cursor`.
- **FR-003**: Endpoint interno `/api/offers` DEBE responder < 250 ms p95.
- **FR-004**: Ranking "mejores del día" = `discount_pct * 0.6 + freshness * 0.2 + upvotes/100 * 0.2`.
- **FR-005**: URL DEBE reflejar filtros (shareable); cambio de filtro usa `router.push` con shallow.
- **FR-006**: DEBE respetar la zona del `ZoneChip` (cookie + URL param toma precedencia).
- **FR-007**: Paginación con cursor opaco (Base64 de `{offerId, score}`).
- **FR-008**: Chips DEBEN ser interactivos con teclado (Enter/Espacio elimina, foco cíclico).
- **FR-009**: Mobile bottom-sheet DEBE ser accesible (focus trap, esc close).
- **FR-010**: Home DEBE incluir sección "cómo funciona" (3 pasos).

### Key Entities

- `Offer` (F03), `Product`, `Price`, `Store`, `Zone`.
- **OfferListing**: DTO con producto, mejor precio, cadena, delta, expiration.

## Success Criteria

- **SC-001**: Home LCP < 2 s.
- **SC-002**: `/ofertas` p95 API < 250 ms.
- **SC-003**: Feed muestra ≥ 100 ofertas cargables via paginación.
- **SC-004**: Bounce rate < 40 % (medido en Plausible 4 semanas post-launch).
- **SC-005**: CTR de "Ver oferta" > 15 %.
- **SC-006**: Bundle JS `/` < 60 KB gz.

## Assumptions

- "Oferta activa" = `Price` con `is_offer = true` OR `discount_pct > 5` en últimos 14 días.
- Sort default: "mejor descuento".
- Home siempre muestra Palermo/CABA si no hay zona seleccionada.
