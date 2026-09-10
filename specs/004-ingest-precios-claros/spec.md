# Feature Specification: Ingest Precios Claros (SEPA)

**Feature Branch**: `004-ingest-precios-claros`
**Created**: 2026-09-09
**Status**: Draft
**Depends on**: 003-ingest-super-flyers (schema del core)

## Overview

Ingestar el dataset SEPA (Sistema Electrónico de Publicidad de Precios Argentinos, ex Precios Claros) que publica el Estado argentino con precios de cadenas grandes por sucursal. Fuente 100 % legal, complementa los folletos con: precio base (no oferta) por sucursal + cobertura de cadenas que no publican folletos digitales (La Anónima, Changomas, Josimar).

## User Scenarios & Testing

### User Story 1 — Ingesta semanal automática (P1) 🎯 MVP

**Descripción**: Cron semanal descarga los CSVs del dataset abierto, filtra por sucursales de CABA + GBA, e inserta en `prices` como `source = 'precios_claros'`.

**Independent Test**: `SELECT COUNT(*) FROM prices WHERE source = 'precios_claros' AND captured_at > now() - interval '1 hour'` > 5000 tras corrida exitosa.

**Acceptance Scenarios**:
1. **Given** el dataset publicado, **When** el cron corre, **Then** > 5000 rows se ingestan filtrando por CABA+GBA.
2. **Given** el dataset con formato inesperado, **When** el cron corre, **Then** falla con mensaje claro y no corrompe DB.

### User Story 2 — Zonas y sucursales reales pobladas (P1)

**Descripción**: A partir del CSV `sucursales`, poblar `Zone` (barrio/localidad) y `Store` (sucursal real) con lat/lng.

**Independent Test**: `SELECT COUNT(*) FROM stores WHERE is_virtual = false AND zone_id IS NOT NULL` > 200 tras primera corrida.

**Acceptance Scenarios**:
1. **Given** el CSV de sucursales, **When** se procesa, **Then** cada sucursal única queda en `stores` con `zone_id` correspondiente.

### User Story 3 — Deduplicación con folletos (P2)

**Descripción**: Si el mismo (producto, sucursal, día) llega por folleto y por Precios Claros, el sistema prefiere el folleto (más específico) y marca el de Precios Claros como `is_offer = false`.

**Independent Test**: correr F03 + F04 para la misma semana; verificar 0 duplicados por `(product, store, day)`.

**Acceptance Scenarios**:
1. **Given** Coca 2.25L en Carrefour Palermo, folleto = $890, Precios Claros = $1290, **When** se ingesta ambos, **Then** hay una sola row con precio = $890 y `source = 'flyer'`.

### Edge Cases

- CSV con encoding Latin-1 → convertir a UTF-8 en pipeline.
- Sucursal sin lat/lng → ingesta el precio pero sin distancia calculable.
- Producto sin EAN → skip (Precios Claros exige EAN; si falta, es data corrupta).
- Cadenas fuera de nuestra lista soportada → ignorar.

## Requirements

### Functional Requirements

- **FR-001**: El sistema DEBE descargar el dataset desde el endpoint público oficial (URL parametrizable).
- **FR-002**: El sistema DEBE filtrar por sucursales cuyo `provincia IN ('CABA', 'BUENOS_AIRES')` y solo GBA (radio ~50 km del Obelisco).
- **FR-003**: El sistema DEBE poblar `Store` con `is_virtual = false`, `zoneId`, `lat`, `lng`.
- **FR-004**: El sistema DEBE poblar `Zone` a partir de `localidad` del CSV con jerarquía (`caba > palermo`, `pba > gba > moron`).
- **FR-005**: `Price` con `source = 'precios_claros'` NO DEBE marcarse `is_offer = true` por default.
- **FR-006**: Si el mismo `(product, store, date)` ya existe con `source = 'flyer'`, la fila de Precios Claros NO DEBE sobrescribirla.
- **FR-007**: Log de corrida en `IngestionRun` con `source = 'precios_claros'`.
- **FR-008**: Ejecutarse los martes 8am ART (día siguiente al de folletos, para dedup lógica).
- **FR-009**: Tiempo total < 20 min.
- **FR-010**: El sistema DEBE respetar los ToS del portal de datos abiertos (siempre respetar `Retry-After`).

### Key Entities

- Re-usa `Chain`, `Store`, `Zone`, `Product`, `Price` de F03.
- **RawSepaRow**: DTO intermedio derivado del CSV.

## Success Criteria

- **SC-001**: > 5000 precios de PCLR por semana ingestados.
- **SC-002**: > 200 sucursales reales pobladas con lat/lng.
- **SC-003**: 0 duplicados entre folleto y Precios Claros para el mismo (producto, sucursal, día).
- **SC-004**: Duración < 20 min.
- **SC-005**: 95 % de sucursales tienen `zone_id` asignada correctamente.

## Assumptions

- El dataset SEPA sigue publicándose con formato similar al histórico (comerciantes CSV, sucursales CSV, productos CSV, precios CSV).
- La URL del dataset se configura en `.env`; puede cambiar sin previo aviso.
- Sucursales dentro de radio 50 km del Obelisco = GBA/CABA para MVP.
- Datos abiertos legales.
