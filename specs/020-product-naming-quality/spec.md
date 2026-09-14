# Feature Specification: Calidad de nombres de productos (F020)

**Feature Branch**: `020-product-naming-quality`
**Created**: 2026-09-13
**Status**: Draft
**Type**: Data quality (P0 — bloquea búsqueda + monetización)
**Blocks**: F019 (deep links a super devuelven 0 hits porque el query es sucio)
**Depends on**: nada
**Relates to**: B-03, B-04 en `docs/AUDIT.md`; C-006 (photo scraping, futuro con OFF)

## Overview

Los nombres de productos ingested desde SEPA vienen sucios y nuestro
`cleanProductName` no los limpia lo suficiente. Consecuencia concreta:

- **12,840 productos (27%)** tienen " X " suelto en el nombre (SEPA usa "X" como "por").
- **828 productos** con " C " suelto (con).
- **~1000 productos** con códigos SEPA de packaging persistiendo en el name
  (`BOT-1000-ml`, `PCK-6-un`, `LAT-473-cc`) — el fix F017.8 solo aplicó a
  `buildDeliveryQuery`, no al `cleanProductName` que persiste el name en DB.
- **~500 productos** con abrevs "Cerv" (Cerveza), "Ret" (Retornable), "Extr" (Extra).
- **799 productos** con marca truncada ("Guinn" en lugar de "Guinness", "Imper" en
  lugar de "Imperial", "Stell" en lugar de "Stella Artois").
- **Sample real** validado con captura del usuario: al hacer click "Ir a la
  tienda" en `Carrefour Cristal Focaccia C Salsa D Tomate X 250 g`, la
  búsqueda en carrefour.com.ar devuelve 0 resultados porque el query
  "C Salsa D Tomate X 250 g" no matchea nada en su catálogo.

**Objetivo**: reescribir el pipeline de naming para producir nombres limpios y
buscables — reducir " X " suelto a 0%, expandir todas las abrevs comunes,
strip códigos de packaging, mejorar detección de marcas truncadas, y aplicar
el nuevo pipeline a los 47k productos existentes.

## User Scenarios & Testing

### User Story 1 — Nombres sin abrevs cripticas (P0) 🎯 MVP

**Descripción**: `Product.name` y `Product.brand` son visibles al usuario en
cards, detalle, alerts. Deben ser legibles y coherentes.

**Independent Test**: query a DB post-fix — `SELECT COUNT(*) FROM products WHERE name LIKE '% X %' OR name LIKE '% C %' OR name ~* 'BOT-|PCK-|LAT-'` debe dar < 100 (aceptable: nombres oficiales que sí contienen esos chars, ej. "Vitamina C").

**Acceptance Scenarios**:
1. **Given** product SEPA raw name `"CARREFOUR CRISTAL FOCACCIA C SALSA D TOMATE X 250 G"`, **When** corre `cleanProductName`, **Then** produce `"Cristal Focaccia con Salsa de Tomate 250 g"` (strip chain, expand C/D/X, title case, unit normalize).
2. **Given** raw `"Cerveza Iguana Pilsener 1 l Ret BOT-1000-ml."`, **When** cleanProductName, **Then** `"Cerveza Iguana Pilsener 1 L Retornable"` (strip código SEPA, expand Ret).
3. **Given** raw `"Cerv Extra Stout"` + brand raw `"Guinn"`, **When** clean both, **Then** name=`"Cerveza Extra Stout"` brand=`"Guinness"` (lookup en dictionary).

### User Story 2 — Búsqueda funciona con nombres reales (P0)

**Descripción**: al buscar "focaccia" o "cerveza guinness" en `/buscar`, los productos matcheen.

**Independent Test**: `GET /api/search?q=focaccia` devuelve >= 1 hit; `?q=guinness` devuelve >= 1 hit.

**Acceptance Scenarios**:
1. **Given** producto con nombre limpio "Cristal Focaccia con Salsa de Tomate", **When** usuario busca "focaccia", **Then** aparece en resultados.
2. **Given** producto con marca corregida "Guinness", **When** usuario busca "guinness", **Then** aparece en resultados.

### User Story 3 — Deep link a la tienda encuentra el producto (P0)

**Descripción**: al hacer click "Ir a la tienda" el link a Carrefour/Coto/etc. debe llegar a resultados reales, no a "sin resultados".

**Independent Test**: manualmente elegir 5 productos random de 5 cadenas distintas, verificar que el click en "Ir a la tienda" devuelve resultados en el sitio de la cadena.

**Acceptance Scenarios**:
1. **Given** producto con nombre limpio, **When** usuario clickea "Ir a la tienda" en fila de Carrefour, **Then** el sitio de Carrefour muestra al menos 1 resultado (o el mismo producto si existe).
2. **Note**: no controlamos el catálogo de la cadena — el criterio es "query razonablemente permisivo", no "match 100%".

### User Story 4 — Marca detectada y normalizada (P1)

**Descripción**: cuando SEPA manda marca truncada, la corregimos con dictionary de marcas comunes AR. Cuando no manda marca pero el nombre incluye una marca conocida (ej. "Guinness Extra Stout"), la extraemos al campo `brand`.

**Acceptance Scenarios**:
1. **Given** brand raw = `"Guinn"`, **When** clean, **Then** brand = `"Guinness"` (via dictionary).
2. **Given** brand raw = null pero name = `"Cerveza Guinness Extra Stout"`, **When** clean, **Then** brand = `"Guinness"` (extracted from name).
3. **Given** brand raw = `"Coca"`, **When** clean, **Then** brand = `"Coca-Cola"` (dictionary canonicalization).

### User Story 5 — Presentación separada del nombre (P1)

**Descripción**: los fields `Product.size` y `Product.unit` deben ser precisos
(hoy: parseo de "1 l" devuelve 100 ml — bug). El nombre no debería
duplicar el tamaño; el tamaño se muestra separado en la card.

**Acceptance Scenarios**:
1. **Given** SEPA row con `productos_cantidad_presentacion = 1` y `productos_unidad_medida_presentacion = "l"`, **When** ingesta, **Then** `Product.size = 1`, `Product.unit = "L"`, `Product.standardSize = 1000` (ml).
2. **Given** name que contiene "1 L", **When** clean, **Then** el "1 L" queda solo en el name (opcional) O se strip del name si `Product.size` está seteado (evita duplicación).

### User Story 6 — Repopulate script de 47k productos existentes (P0)

**Descripción**: script one-shot que re-limpia todos los `Product.name` y `Product.brand` existentes con el nuevo pipeline, sin re-ingest.

**Acceptance Scenarios**:
1. **Given** 47,116 productos con names sucios, **When** corre `scripts/repopulate-product-names.ts`, **Then** todos los names se actualizan a la versión limpia (batch de 500, < 10 min).
2. **Given** productos ya limpios (idempotencia), **When** corre segunda vez, **Then** 0 cambios.

## Non-functional requirements

- **Performance**: repopulate script < 10 min para 47k rows (batch 500, updates simples).
- **Idempotencia**: cleanProductName y cleanBrand son puros — segundo run no cambia nada.
- **Backward compat**: la función cleanProductName sigue exportada, solo se enriquece. Callers existentes (ingest pipelines) siguen funcionando.
- **Test coverage**: >= 30 tests unit cubriendo casos reales de la DB actual + edge cases.
- **Auditable**: script emite log de counts por tipo de fix aplicado (X→x, códigos strippedados, brands corregidas).

## Out of scope

- **Open Food Facts cross-reference por EAN** — deferred. Requiere R2 configurado + costo de API calls. Se agregará en F021 cuando R2 esté up.
- **Fotos de producto (B-08)** — resolvería en la misma pasada que OFF integration.
- **Deep dedup por nombre + tamaño** — F005 normalizer ya hace fuzzy match; no compete a este spec.
- **Traducción de marcas internacionales** (ej. no cambiamos "Nestlé" → "Nestle") — mantenemos ortografía original con acentos.

## Success criteria

- ✅ Post-fix, `SELECT COUNT(*) FROM products WHERE name LIKE '% X %'` < 200 (99% resuelto)
- ✅ Post-fix, códigos SEPA (`BOT-`, `PCK-`, `LAT-`) < 20 (99.9% resuelto)
- ✅ Marcas truncadas conocidas (Guinn, Imper, Stell, Coca) < 10 (99% resuelto vía dictionary)
- ✅ Test suite pasa 30+ tests unit
- ✅ Repopulate script corrido en prod, log confirma actualizaciones
- ✅ Manualmente verificado: click en "Ir a la tienda" en 3 productos random → cada uno devuelve resultados en el sitio de la cadena
- ✅ Search returns hit para "focaccia", "guinness", "coca cola"
- ✅ B-03 y B-04 del AUDIT marcados como ✅ resueltos
