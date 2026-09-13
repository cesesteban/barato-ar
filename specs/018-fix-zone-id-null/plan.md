# Implementation Plan: Fix zone_id NULL en todos los stores (B-01)

**Branch**: `018-fix-zone-id-null` | **Date**: 2026-09-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/018-fix-zone-id-null/spec.md`

## Summary

Bug fix P0 en 2 partes:

1. **Fix del código en `src/ingestion/pcl/zones.ts`**: agregar `"ar-c"` a las condiciones `isCaba` de `resolveZoneId` para reconocer el código de provincia que SEPA emite para CABA. Sin esto, todas las sucursales de CABA quedaban con `zone_id = NULL` en cada ingesta.

2. **Repopulación de 954 stores existentes**: script one-shot `scripts/repopulate-store-zones.ts` que actualiza `zone_id` de rows con `zoneId IS NULL` usando `nearestZone(lat, lng)` del catálogo cliente. Idempotente. Batch de 100 rows con Prisma.

## Technical Context

**Language/Version**: TypeScript 5.6 strict (Node 20)

**Primary Dependencies**: Prisma 5.22, Zod 3

**Storage**: Neon PostgreSQL 16 — tabla `stores` con columna `zone_id` (FK a `zones.id`)

**Testing**: Vitest 2.1 — tests unit para `resolveZoneId` en `tests/unit/ingestion/pcl-zones.test.ts`

**Target Platform**: Node runtime en GitHub Actions (ingesta) + script local ejecutado 1 vez contra Neon

**Project Type**: web-service (Barato.ar — Next.js + Prisma)

**Performance Goals**: script de repopulación < 5 min para 954 stores

**Constraints**:
- Script solo actualiza `zone_id`, no toca otros campos
- Idempotente
- Log de counts por zone slug al terminar

**Scale/Scope**: 954 rows a actualizar (fixed, no crece)

## Constitution Check

Verificación contra los 8 principios:

- ✅ **I. SEO-First**: no aplica — bug de data interna, no impacta URLs/HTML
- ✅ **II. Data honesty**: el fix ARREGLA data honesty — sin él la sección "En tu zona" miente por omisión (mostrando vacío cuando debería tener stores)
- ✅ **III. TypeScript strict + testability**: se agrega test unit específico para el caso `AR-C` (User Story 3)
- ✅ **IV. Privacy**: no toca datos personales
- ✅ **V. Performance**: no impacta performance (fix ligero en resolveZoneId, script one-shot)
- ✅ **VI. Legality**: no impacta legalidad
- ✅ **VII. Operational simplicity**: no agrega servicios ni dependencias. Un file de código + un script + un test.
- ✅ **VIII. Accesibilidad**: no aplica — cambio backend

**Gate**: ✅ Pasa sin violaciones.

## Phase 0 — Outline & Research

### Unknowns a resolver

**U-1: ¿Qué otros códigos de provincia SEPA usa además de `AR-C` y `AR-B`?**
- Decision: SEPA usa códigos ISO 3166-2 (`AR-C` para CABA, `AR-B` para Buenos Aires provincia, `AR-X` para Córdoba, etc.). Como Barato.ar por spec solo cubre CABA + GBA, solo importan `AR-C` y `AR-B`. Otros códigos → resolveZoneId retorna `null` correctamente (fuera de scope).
- Rationale: Barato.ar filtra por `isInGBA(lat, lng)` antes de intentar taggear zone. Stores fuera de AMBA con provincia `AR-X` no entran al pipeline. Igual sería seguro devolver `null` — el script de repop puede tolerar stores sin zone (skip).
- Alternatives: agregar todos los códigos AR-* al mapping. Descartado — YAGNI, agrega mantenimiento sin valor.

**U-2: ¿Qué hacemos con stores sin lat/lng en el script de repop?**
- Decision: skip. `nearestZone` requiere lat/lng. Store sin coords → zone_id queda null → esos stores no aparecen en "En tu zona" pero sí en "Cadenas nacionales".
- Rationale: la auditoría mostró que 954/954 stores real TIENEN lat/lng (no hay stores sin coords). Este caso es defensivo, no debería activarse.
- Alternatives: bulk-inferir zone desde `address` con LLM. Descartado por complejidad + potencial de errores.

**U-3: ¿Cómo verificamos que el fix funciona post-deploy?**
- Decision: query manual + verificación en el detalle producto de un producto conocido de Coto en Palermo. Métrica: `SELECT COUNT(*) FROM stores WHERE is_virtual = false AND zone_id IS NULL` debe pasar de 954 a < 154 (aceptable: stores fuera de AMBA que no matcheen a ninguna zona por lejanía).
- Rationale: no requiere test E2E automatizado — verificación manual suficiente para bug fix único.
- Alternatives: escribir Playwright test que hits `/producto/[slug]?zone=caba-palermo` y assert `stores.inZone.length > 0`. Descartado para MVP — E2E no configurado.

**U-4: ¿Corremos el script contra prod directo o hacemos dump-restore para probar antes?**
- Decision: correr directo contra prod porque es UPDATE simple con WHERE claro (no DROP, no DELETE). Backup de Neon PITR cubre rollback si algo sale mal.
- Rationale: 954 rows, operación reversible (podemos volver a NULL con un UPDATE). PITR de Neon retiene 7 días.
- Alternatives: dry-run mode con `--dry-run` flag. Se agrega como safety extra.

**Output**: research.md consolidado (breve — un fix chico).

## Phase 1 — Design & Contracts

### Data Model changes

Ninguno. La estructura de `stores` y `zones` no cambia. Solo se actualiza data
existente:

- `stores.zone_id`: pasa de NULL a un slug válido de `zones.id` (ej. `"caba-palermo"`, `"pba-quilmes"`, `"caba"`, `"pba"` etc.)

FK constraint `stores_zone_id_fkey` ya existe — si el script intenta setear un slug que no existe en `zones`, falla → capturamos en try/catch y skipeamos ese row (edge, no debería pasar porque `nearestZone` solo devuelve slugs del catálogo que está seedeado).

### Contracts

Ninguna API pública nueva. Cambios internos:

**Contract 1: `resolveZoneId` (existing function, extended)**

```typescript
// src/ingestion/pcl/zones.ts
export function resolveZoneId(input: {
  provincia?: string | null;
  ciudad?: string | null;
  localidad?: string | null;
}): string | null
```

**Change**: la condición `isCaba` acepta `"ar-c"` además de los existentes.

**Contract 2: `scripts/repopulate-store-zones.ts` (nuevo script)**

```typescript
// Command: pnpm tsx scripts/repopulate-store-zones.ts [--dry-run]
// Env required: DATABASE_URL, DATABASE_URL_UNPOOLED

// Behavior:
//   1. SELECT id, lat, lng FROM stores WHERE is_virtual = false AND zone_id IS NULL
//   2. Por cada row: zone_slug = nearestZone(lat, lng).slug (skip si lat OR lng null)
//   3. Batch UPDATE en batches de 100 rows via prisma.$transaction([...])
//   4. Log: counts por zone_slug + total actualizados + skipped
//   5. Exit 0 en éxito, 1 en cualquier error
```

**Contract 3: Test unit (`tests/unit/ingestion/pcl-zones.test.ts`)**

Agrega estos casos:

```typescript
it("PBA + provincia AR-C (SEPA CSV) → matchea CABA", () => {
  expect(resolveZoneId({ provincia: "AR-C", ciudad: "Palermo", localidad: "Palermo" }))
    .toBe("caba-palermo");
});

it("Provincia AR-C sin match localidad → caba (umbrella)", () => {
  expect(resolveZoneId({ provincia: "AR-C", ciudad: "Once", localidad: "Once" }))
    .toBe("caba");
});
```

### Quickstart validation

**Ver `quickstart.md`** — checklist ejecutable para validar el fix end-to-end:

1. Correr tests unit → asegurar los 2 nuevos casos pasan
2. Correr script en dry-run → confirmar counts razonables
3. Correr script real → verificar total actualizado
4. Query directo a Neon → confirmar `zone_id IS NULL` < 154
5. Verificación manual en producción: `/producto/{slug}?zone=caba-palermo` con producto conocido de Coto → sección "En Palermo" debe mostrar >= 1 sucursal

## Post-Design Constitution Re-check

Después del diseño, todos los principios siguen cumplidos:

- ✅ Sin nuevos servicios (VII Operational Simplicity respetado)
- ✅ Tests agregados (III Testability)
- ✅ Sin cambios en URL ni HTML (I SEO-First no afectado)
- ✅ Sin nueva superficie de PII (IV Privacy)
- ✅ Sin regresión de performance (V — el script corre offline)

**Gate final**: ✅ pasa.

## Progress Tracking

- [x] Phase 0: research completado (4 unknowns resueltos)
- [x] Phase 1: contracts + data model + quickstart definidos
- [x] Constitution check: pre + post OK
- [ ] Ready for `/speckit-tasks` → luego `/speckit-implement`

## Artifacts generated

- ✅ `spec.md` (creado por el usuario)
- ✅ `plan.md` (este archivo)
- ✅ `research.md` (Phase 0 inline arriba — no requiere archivo separado dado el tamaño chico del fix)
- ✅ `quickstart.md`
- ⚫ `data-model.md` — no requiere (no hay cambios de schema)
- ⚫ `contracts/` — inline en Phase 1 (fix simple, no APIs públicas nuevas)
