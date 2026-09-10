# Feature Specification: Product Search

**Feature Branch**: `006-product-search`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 003, 005

## Overview

Buscador de productos: typeahead con autocomplete debounced, resultados full-text con `pg_trgm`, ranking por (a) similitud de nombre, (b) popularidad (búsquedas + views), (c) frescura de precios, (d) descuento vigente. Empty state con sugerencias populares. Cero-resultados con "no encontramos X, ¿quisiste decir Y?".

## User Scenarios & Testing

### User Story 1 — Buscar por texto y ver resultados relevantes (P1) 🎯 MVP

**Descripción**: Un usuario escribe "coca 2.25" y ve resultados encabezados por Coca-Cola Original 2.25L, con precio mínimo actual y tienda.

**Independent Test**: llamar `GET /api/search?q=coca+2.25` → primer resultado es el canonical de Coca-Cola 2.25L.

**Acceptance Scenarios**:
1. **Given** productos "Coca 2.25", "Coca Zero 2.25", "Pepsi 2.25" en DB, **When** se busca "coca 2.25", **Then** los 2 primeros son los Coca-Cola en orden por popularidad.
2. **Given** typo "coka 2.25", **When** se busca, **Then** el sistema muestra "quisiste decir coca 2.25" y resultados de Coca-Cola.

### User Story 2 — Autocomplete debounced en el SearchBar (P1)

**Descripción**: Mientras el usuario tipea, tras 200 ms de inactividad se llama al backend y aparece un dropdown con top 8 productos + top 3 marcas + top 2 categorías.

**Independent Test**: escribir "coc" en el input → dropdown aparece con Coca-Cola 2.25L primera.

**Acceptance Scenarios**:
1. **Given** el input vacío, **When** el usuario escribe "coc", **Then** dropdown con sugerencias aparece en < 300 ms.
2. **Given** dropdown abierto, **When** usuario presiona Enter, **Then** se navega al primer resultado.
3. **Given** dropdown abierto, **When** usuario presiona ↓ y Enter, **Then** navega al resultado seleccionado.

### User Story 3 — Empty state con sugerencias (P2)

**Descripción**: Al abrir el SearchBar sin escribir, se muestran búsquedas populares del día y última búsqueda del usuario (localStorage).

**Independent Test**: sin cookies, focus en input → chip de "más buscados".

### User Story 4 — Zero results con "quisiste decir" (P2)

**Descripción**: Búsqueda "yogurhy" (typo) → devuelve 0 resultados directos + sugerencia "yogur" con resultados.

**Independent Test**: `GET /api/search?q=yogurhy` → `{results: [], suggestion: "yogur"}`.

### Edge Cases

- Query con solo emojis o caracteres especiales → vacío + hint.
- Query > 100 chars → truncar y avisar.
- Query en mayúsculas → normalizar.
- Query "coca 2,25" (coma vs. punto) → matchear igual.
- Búsqueda con acentos: "aceite gírasol" == "aceite girasol".

## Requirements

### Functional Requirements

- **FR-001**: Endpoint `GET /api/search?q={query}&zone={zoneSlug}&vertical={vertical}` DEBE responder < 200 ms p95.
- **FR-002**: Usar `pg_trgm` con índice GiST en `products.normalized_name` y `brand`.
- **FR-003**: Ranking mixto: `similarity_score * 0.5 + normalized_popularity * 0.3 + freshness_bonus * 0.2`.
- **FR-004**: Autocomplete DEBE incluir productos, marcas, categorías (etiquetadas).
- **FR-005**: Debounce del cliente = 200 ms.
- **FR-006**: Registrar `SearchLog` con `query`, `zoneSlug`, `resultsCount`, `clickedProductId` (si hay).
- **FR-007**: "Quisiste decir" usando `word_similarity` de trigrams.
- **FR-008**: Empty state: top 10 productos más buscados del día por zona (cached 5 min en Redis).
- **FR-009**: Full-page results en `/buscar?q={query}` con filtros (vertical, cadena, ordenar).
- **FR-010**: `<SearchBar>` reusable (design system) instrumentado con Plausible custom event.

### Key Entities

- **SearchLog**: `{id, query, zoneSlug, resultsCount, clickedProductId, ipHash, ts}` (anonymous).
- **PopularSearches** (materialized view): `{query, zoneSlug, dayBucket, count}`.

## Success Criteria

- **SC-001**: p95 latency de `/api/search` < 200 ms.
- **SC-002**: CTR de resultados (clicked/searched) > 40 %.
- **SC-003**: Rate de zero-results < 5 %.
- **SC-004**: Rate de "quisiste decir" que llevan a clicks > 30 %.
- **SC-005**: Bundle JS del SearchBar + dropdown < 15 KB gz.

## Assumptions

- Zona actual proviene del `ZoneChip` (localStorage o `?zone=` param).
- Sin auth: `ipHash = sha256(ip + daily_salt)` para agrupar sin identificar.
- Popularidad se calcula sobre últimos 7 días.
