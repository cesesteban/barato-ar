# Feature Specification: Price History & Charts

**Feature Branch**: `010-price-history-charts`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 003, 007

## Overview

Serie temporal de precios por producto (agregada por zona) + chart en la página de producto: promedio zonal por día, min histórico, max histórico, precio actual. Rangos 30d/90d/180d/1a. SSR-safe (no Recharts en el servidor — SVG puro renderizado en RSC).

## User Scenarios & Testing

### User Story 1 — Ver chart de precios en la página de producto (P1) 🎯 MVP

**Descripción**: En `/producto/[slug]` aparece un chart de líneas con la evolución del promedio zonal de precios en 90 días.

**Independent Test**: RSC render de página incluye `<svg>` con al menos 30 puntos.

**Acceptance Scenarios**:
1. **Given** producto con 90 días de historial, **When** el usuario entra a la página, **Then** ve chart con línea + área + puntos etiquetados.
2. **Given** un producto nuevo con < 7 días, **When** entra, **Then** ve mensaje "aún no tenemos suficiente historial".

### User Story 2 — Cambiar rango temporal (P1)

**Descripción**: Botones 30D/90D/180D/1A cambian la escala del chart (client-only interaction, no navigation).

**Independent Test**: click 30D → chart se re-render con menos puntos.

### User Story 3 — Stats: promedio, min y max (P1)

**Descripción**: Debajo del chart, 4 tarjetas: Actual, Promedio 90d, Mínimo histórico (con fecha), Máximo histórico.

### User Story 4 — Pre-agregación diaria para performance (P2)

**Descripción**: Job diario materializa `price_daily_avg` para evitar computar en cada request.

### Edge Cases

- Producto sin historial → mensaje amigable.
- Zona sin datos → fallback a nacional (average across zones).
- Precio "outlier" (10x el promedio) → filtrar como probable data corrupt.
- Sparse data (días sin observación) → interpolar visualmente con línea entrecortada.

## Requirements

### Functional Requirements

- **FR-001**: `PriceHistory` (F03) DEBE ser append-only y crecer con cada ingesta.
- **FR-002**: Vista materializada `price_daily_avg` con `{productId, zoneSlug, day, avgPrice, minPrice, maxPrice, obsCount}`.
- **FR-003**: Refresh de la vista cada noche a las 3am ART.
- **FR-004**: Endpoint `GET /api/product/[slug]/history?zone=&range=` responde en < 100 ms.
- **FR-005**: Chart SSR-safe: SVG generado en RSC con `<PriceHistoryChart>` (design system).
- **FR-006**: Cliente puede cambiar range → refetch parcial.
- **FR-007**: Datos < 7 días → placeholder.
- **FR-008**: Filtro de outliers: descartar valores > 3σ del promedio del período.
- **FR-009**: Tooltip on hover (client-only) muestra fecha + precio + cadena minimum.
- **FR-010**: DEBE incluir marca visual del "hoy" (círculo destacado + label).

### Key Entities

- **PriceHistory** (F03).
- **PriceDailyAvg** (mat view): `{productId, zoneSlug, day, avgPrice, minPrice, maxPrice, obsCount}`.

## Success Criteria

- **SC-001**: Endpoint `/history` < 100 ms p95.
- **SC-002**: Chart LCP no aumenta > 100 ms.
- **SC-003**: 95 % de productos populares tienen historial ≥ 30 días a mes 2.
- **SC-004**: Bundle client-only del chart interactivo < 15 KB gz.

## Assumptions

- Los rangos 30/90/180/1a alcanzan.
- Zona centrada en `caba` como default; agregación por barrio no en MVP.
- Recharts fuera; SVG puro para MVP.
