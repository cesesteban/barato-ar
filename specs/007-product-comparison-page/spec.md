# Feature Specification: Product Comparison Page

**Feature Branch**: `007-product-comparison-page`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 002, 003, 005, 006

## Overview

Página `/producto/[slug]` con la comparación multi-cadena para un producto canónico: hero del producto, ranking de precios por tienda (ordenado por precio efectivo + distancia), delta vs promedio, badge de combo si aplica, precio por unidad ($/L, $/kg) prominente, botón "Ir a la tienda", tarjeta de alerta (placeholder para F09), historial y similares (placeholders para F10 y F08). SSG con ISR (revalidate: 3600).

> **Aplica**: C-001 (badge combo + precio efectivo para ranking), C-002 (segmentación En Palermo / Cerca de Palermo), C-003 (columna $/unidad prominente + toggle de orden), C-004 (card "ver también: retornable/descartable") — ver [clarifications.md](../../.specify/memory/clarifications.md).

## User Scenarios & Testing

### User Story 1 — Ver comparación de precios por tienda (P1) 🎯 MVP

**Descripción**: Un usuario navega a `/producto/coca-cola-2-25l` y ve dónde está más barato ese producto en su zona.

**Independent Test**: `curl /producto/coca-cola-2-25l` responde HTML con lista ordenada de tiendas + precios.

**Acceptance Scenarios**:
1. **Given** Coca 2.25L con precios en 6 tiendas de Palermo, **When** el usuario entra a la página, **Then** ve las 6 tiendas rankeadas por precio, con la mejor destacada.
2. **Given** el usuario cambia de zona a "Belgrano", **When** la página se re-render, **Then** las tiendas listadas son las de Belgrano.
3. **Given** un producto sin precios recientes, **When** el usuario entra, **Then** ve mensaje "no tenemos precios recientes" y sugerencia de reportar.

### User Story 2 — SEO completo con schema.org (P1)

**Descripción**: La página emite `Product`, `Offer`, `AggregateOffer` en JSON-LD. Google la muestra como rich result.

**Independent Test**: pegar URL en Rich Results Test → válido.

**Acceptance Scenarios**:
1. **Given** la página SSG, **When** se inspecciona HTML, **Then** hay `<script type="application/ld+json">` con `@type: Product` + `offers`.

### User Story 3 — Delta vs promedio (P2)

**Descripción**: Cada precio muestra `-31%` vs promedio zonal de 30 días.

**Independent Test**: precio $890 con promedio zonal $1290 → badge `-31%`.

### User Story 4 — Deep link al producto en la tienda (P2)

**Descripción**: Botón "Ir a la tienda" redirige al PDP de la cadena si tenemos `product_url`, o al buscador de la cadena si no.

### Edge Cases

- Zero precios en la zona → fallback a nacional o mensaje.
- Producto sin canonical → mostrar solo la variante puntual.
- Zona no seleccionada → default `caba-palermo`.
- URL de deep link caduca → fallback a home de la tienda.

## Requirements

### Functional Requirements

- **FR-001**: `/producto/[slug]` DEBE renderizarse en SSG con `revalidate = 3600`.
- **FR-002**: DEBE aceptar `?zone={zoneSlug}` para render zonal (server component decide).
- **FR-003**: DEBE emitir JSON-LD válido: `Product` con `offers` como `AggregateOffer` (lowPrice, highPrice, priceCurrency=ARS, offerCount).
- **FR-004**: Cada `Offer` inner en JSON-LD DEBE tener `seller`, `price`, `priceValidUntil`.
- **FR-005**: DEBE mostrar `captured_at` como "hace X" en cada precio.
- **FR-006**: DEBE incluir OG image dinámica (`/producto/[slug]/og`).
- **FR-007**: DEBE calcular delta vs `avg(price)` últimos 30 días en la misma zona.
- **FR-008**: Si `product.canonicalId` existe, DEBE mostrar precios agregados por canonical (todas las aliases).
- **FR-009**: Botón "Ir a la tienda" DEBE registrar `outbound_click` en Plausible.
- **FR-010**: Página DEBE ser navegable con teclado sin trampas.

### Key Entities

- Usa `Product`, `Price`, `Store`, `Chain`, `Zone`.
- **ProductComparisonView**: DTO con `product`, `stores[]`, `history` (últimos 30 días agg), `similars`.

## Success Criteria

- **SC-001**: TTFB < 400 ms.
- **SC-002**: LCP < 2 s.
- **SC-003**: Rich Result válido en Google.
- **SC-004**: p95 de `generateStaticParams` para top 10k productos < 30 min.
- **SC-005**: Bundle JS de la página < 40 KB gz.

## Assumptions

- Slug = kebab-case de `normalizedName` truncado a 100 chars.
- Producto canonical siempre existe (F05 corrió).
- Zona default = `caba-palermo` si no viene en URL/cookie.
