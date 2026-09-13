# Feature Specification: Fix zone_id NULL en todos los stores (B-01)

**Feature Branch**: `018-fix-zone-id-null`
**Created**: 2026-09-13
**Status**: Draft
**Type**: Bug fix (P0)
**Blocks**: launch público — F007 sección "En tu zona" siempre vacía.
**Depends on**: F004 (ingesta PCL), F015 (zones catalog), F016 (localidades GBA)

## Overview

Los 954 stores reales ingested en Neon tienen `zone_id = NULL`. Como consecuencia,
la sección "En tu zona" del detalle de producto (`/producto/[slug]`) siempre
está vacía — solo funciona "Cerca de tu zona" que usa distancia haversine.

**Root cause identificado**: en `src/ingestion/pcl/zones.ts` la función
`resolveZoneId` no reconoce el código de provincia `AR-C` que SEPA usa para
CABA. En una iteración anterior (F016) se agregó `AR-B` para PBA pero se
omitió el equivalente `AR-C` de CABA. Cuando la ingesta corre con provincia
`AR-C`, resolveZoneId retorna `null` → upsertStore inserta con `zoneId = null`.

Además del fix del código, hay 954 stores existentes que necesitan ser
re-linkeados sin re-ingest completo (que tomaría 30-60 min y volvería a
insertar la misma data). Se resuelve con un script one-shot que actualiza
`zone_id` de rows existentes usando `nearestZone(lat, lng)` del catálogo cliente.

## User Scenarios & Testing

### User Story 1 — "En tu zona" muestra las sucursales locales (P0) 🎯

**Descripción**: Cuando el usuario entra a un detalle de producto con `?zone=X`,
la sección "En X" debe listar las sucursales cuyo `store.zone_id = X.id`.

**Independent Test**: `GET /producto/{slug}?zone=caba-palermo` debe devolver
`stores.inZone.length > 0` para al menos un producto conocido de Coto o Carrefour.

**Acceptance Scenarios**:
1. **Given** usuario en zone `caba-palermo`, **When** entra al detalle de un producto
   que Coto vende en Palermo, **Then** aparece bajo "En Palermo" (no solo bajo "Cerca de Palermo").
2. **Given** ingesta SEPA nueva con provincia `AR-C`, **When** corre `resolveZoneId`,
   **Then** devuelve el slug de zone CABA correspondiente (barrio si matchea, `caba` fallback).

### User Story 2 — Repopulación de stores existentes (P0)

**Descripción**: Ejecutar un script one-shot que actualiza `zone_id` de los
954 stores existentes sin re-correr el pipeline completo.

**Independent Test**: post-script, `SELECT COUNT(*) FROM stores WHERE is_virtual = false AND zone_id IS NULL` = 0.

**Acceptance Scenarios**:
1. **Given** 954 stores con zone_id NULL, **When** corre el script `scripts/repopulate-store-zones.ts`,
   **Then** todos los stores con lat/lng válidos reciben el `zone_id` de `nearestZone(lat, lng)`.
2. **Given** stores en Bahía Blanca (fuera de AMBA), **When** corre el script,
   **Then** reciben el zone más cercano igual (aceptable — la matview y filtros
   los excluyen por distancia después).

### User Story 3 — Test unitario del fix (P0)

**Descripción**: Test unit que cubre el caso `AR-C` explícitamente para prevenir regression.

**Acceptance Scenarios**:
1. **Given** input `{provincia: "AR-C", ciudad: "Palermo", localidad: "Palermo"}`, **When** corre `resolveZoneId`, **Then** devuelve `"caba-palermo"`.
2. **Given** input `{provincia: "AR-C", ciudad: "?", localidad: "?"}`, **When** corre `resolveZoneId`, **Then** devuelve `"caba"` (fallback umbrella).

## Non-functional requirements

- **Performance**: el script de repopulación debe correr en < 5 min para 954 stores (batch de 100 con Prisma).
- **Idempotencia**: el script puede correrse múltiples veces sin causar cambios adicionales una vez completado.
- **Safety**: el script solo actualiza `zone_id`, no toca `lat`, `lng`, `name`, `address`, ni ningún otro campo.
- **Auditable**: log de cuántos stores actualizó por zone slug.

## Out of scope

- Re-ingesta completa (evitar 30-60 min sin necesidad — la data ya está)
- Fix de otros bugs del audit (B-02 a B-17) — cada uno se resuelve aparte
- Cambios de UX en `/producto/[slug]` — solo backend + repop

## Success criteria

- ✅ Post-fix, `store.zone_id` != NULL para >= 800/954 stores (>= 83%)
- ✅ Test unit para `AR-C` pasa
- ✅ En prod, "En Palermo" muestra al menos 3 productos con precio de Coto/Carrefour
- ✅ B-01 marcado como resuelto en `docs/AUDIT.md`
