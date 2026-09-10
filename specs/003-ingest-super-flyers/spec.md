# Feature Specification: Ingest Supermarket Flyers

**Feature Branch**: `003-ingest-super-flyers`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 001-foundation-scaffold

## Overview

Ingestar los folletos semanales oficiales de Carrefour, Coto, Día y Jumbo — la fuente de datos más legal, estable y valiosa del ecosistema argentino de supermercados. Cada folleto es un PDF o HTML público con productos, precios de oferta, precio anterior tachado, marca, presentación y vigencia. Al final de esta feature, la DB tiene ofertas activas de estas 4 cadenas actualizadas semanalmente vía cron.

## User Scenarios & Testing

### User Story 1 — Ingesta manual del folleto de Carrefour (P1) 🎯 MVP

**Descripción**: Un dev corre `pnpm ingest carrefour` y en < 3 min hay ~200-500 productos con precios de oferta de Carrefour en la DB, categorizados y con vigencia.

**Independent Test**: correr el comando contra el folleto de la semana; verificar que `SELECT COUNT(*) FROM prices WHERE chain_id = 'carrefour' AND captured_at > now() - interval '1 hour'` devuelve > 100.

**Acceptance Scenarios**:
1. **Given** una URL de folleto Carrefour válida, **When** se corre `pnpm ingest carrefour`, **Then** se insertan filas en `products`, `prices` y `offers` sin duplicados.
2. **Given** el mismo folleto ya ingerido, **When** se corre nuevamente, **Then** el sistema es idempotente (no crea duplicados).
3. **Given** una URL rota, **When** se corre el comando, **Then** el proceso falla con mensaje claro sin corromper DB.

### User Story 2 — Ingesta semanal automática (P1)

**Descripción**: Cada lunes 8am (ART), GitHub Actions corre la ingesta de las 4 cadenas y actualiza la DB.

**Independent Test**: verificar que `SELECT MAX(captured_at) FROM prices WHERE source='flyer'` es del lunes más reciente.

**Acceptance Scenarios**:
1. **Given** el workflow programado, **When** llega el lunes 8am, **Then** las 4 cadenas se ingieren y hay un log en Sentry o Better Stack.
2. **Given** la ingesta de una cadena falla, **When** las otras 3 tienen éxito, **Then** las 3 exitosas quedan cargadas y la falla se reporta a Sentry.

### User Story 3 — Dashboard de estado de ingesta (P2)

**Descripción**: Página `/admin/ingest-status` (auth por env token) muestra últimas 10 corridas por cadena: éxito/falla, cantidad de rows, duración, primer error si aplica.

**Independent Test**: correr una ingesta y ver la fila nueva en la página.

**Acceptance Scenarios**:
1. **Given** una ingesta terminada, **When** se visita `/admin/ingest-status`, **Then** aparece con status, rows, duración.

### User Story 4 — Ingesta detecta caída ≥ 20 % de rows y alerta (P2)

**Descripción**: Si una corrida ingesta < 80 % de la anterior, se dispara alerta Sentry (no falla el job — es una advertencia).

**Independent Test**: correr con un folleto truncado deliberadamente; verificar alerta en Sentry.

**Acceptance Scenarios**:
1. **Given** la última corrida trajo 500 rows, **When** la nueva trae 300, **Then** Sentry recibe un evento `warning` con el delta.

### Edge Cases

- Folleto con formato PDF distinto al esperado → parser falla loudly con snapshot que se puede reproducir.
- Producto sin EAN → se guarda con `ean_code = null`, el normalizador (F05) hará matching por nombre.
- Precio anterior ausente → `is_offer = true` pero `previous_price = null`, `discount_pct` no se calcula.
- Vigencia sin fecha explícita → default 7 días desde captura, marcado como estimado.
- Encoding de caracteres (á, ñ) → todo en UTF-8, verificado con tests.

## Requirements

### Functional Requirements

- **FR-001**: El sistema DEBE tener un parser por cadena, cada uno con snapshot test contra un fixture del folleto de esa semana.
- **FR-002**: El sistema DEBE ser idempotente: mismo folleto → mismos rows sin duplicados (usar `unique(product_id, store_id, source, captured_at::date)`).
- **FR-003**: Cada precio ingestado DEBE tener: `product_id`, `store_id`, `price`, `previous_price` (opt), `discount_pct` (calculado), `is_offer`, `valid_from`, `valid_to`, `source = 'flyer'`, `source_url`, `captured_at`.
- **FR-004**: Cada producto NUEVO detectado DEBE crearse con `normalized_name`, `brand`, `size`, `unit`, `ean_code` (si disponible).
- **FR-005**: El scheduler DEBE correr los lunes 8am ART (11:00 UTC).
- **FR-006**: Si un parser falla, el error DEBE reportarse a Sentry con contexto (URL, cadena, offset del error).
- **FR-007**: El sistema DEBE mantener un log en tabla `ingestion_runs` con `chain`, `started_at`, `finished_at`, `status`, `rows_ingested`, `error_message`.
- **FR-008**: Si `rows_ingested < 0.8 * previous_rows` DEBE emitir warning Sentry.
- **FR-009**: El sistema NO DEBE hacer > 1 request/s al servidor de la cadena (rate-limit ético).
- **FR-010**: El parser DEBE respetar `robots.txt` de la cadena.

### Key Entities

- **Chain**: cadena de supermercado (carrefour, coto, dia, jumbo).
- **Store**: sucursal (para MVP, una "store virtual" por cadena con `zone_id = null` → oferta nacional).
- **Product**: producto normalizable (Coca 2.25L Retornable).
- **Price**: precio observado en un momento.
- **PriceHistory**: append-only, cada precio observado (feature 10).
- **Offer**: agrupación semántica de ofertas destacadas.
- **IngestionRun**: registro de cada corrida.

## Success Criteria

- **SC-001**: Al menos 400 productos con oferta activa por semana en total (4 cadenas × ~100).
- **SC-002**: Duración de la corrida por cadena < 3 min.
- **SC-003**: 0 duplicados en `prices` para el mismo día por (product, store).
- **SC-004**: 95 % de precios ingestados tienen `previous_price` (indicador de calidad del parser).
- **SC-005**: 100 % de los parsers tienen snapshot tests que pueden re-correrse contra fixtures commiteados.
- **SC-006**: Alerta Sentry disparada dentro de los 5 min de una corrida fallida.

## Assumptions

- Los folletos oficiales de las cadenas se publican en URL estable o descubrible desde su home.
- Formato HTML es preferido; PDF requiere parser diferente (pdf-parse + heurísticas).
- Para MVP, se ignoran los "clubes" (Club DIA, Miércoles Coto) — se ingesta el precio base.
- Zonas: por ahora `national`; F05 introducirá `zone_id` por sucursal.
- No hay foto de producto en folletos parseados; se usa placeholder.
