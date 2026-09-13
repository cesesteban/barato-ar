# Quickstart · Fix B-01 (zone_id NULL)

Checklist ejecutable para validar el fix end-to-end. Cada paso puede correrse
independientemente.

## Prerrequisitos

- Repo local en `feat/018-fix-zone-id-null` (o main una vez mergeado)
- Env vars `DATABASE_URL` y `DATABASE_URL_UNPOOLED` apuntando a Neon prod
- Node 20 + pnpm instalado

## Paso 1 — Tests unit del fix

Correr los tests nuevos de resolución para `AR-C`:

```bash
pnpm test --run tests/unit/ingestion/pcl-zones.test.ts
```

**Expected**: 13 tests pasan (11 previos + 2 nuevos para `AR-C`).

## Paso 2 — Estado inicial (baseline)

Verificar cuántos stores tienen zone_id NULL antes del fix:

```bash
pnpm tsx scripts/audit-zones.ts
```

**Expected**: `sin zone_id: 954` (o similar según cuánto haya crecido).

## Paso 3 — Dry-run del script de repopulación

Ejecutar el script en modo dry-run para ver qué haría sin escribir:

```bash
pnpm tsx scripts/repopulate-store-zones.ts --dry-run
```

**Expected**:
- Log listando counts por zone_slug (ej. `caba-palermo: 42`, `pba-quilmes: 12`, etc.)
- Total: ~800-954 stores serían actualizados
- ~0-154 stores skipped (sin lat/lng, o fuera de AMBA)
- Exit code 0

## Paso 4 — Ejecución real

Si el dry-run se ve razonable, correr el script real:

```bash
pnpm tsx scripts/repopulate-store-zones.ts
```

**Expected**:
- Batch de 100 en 100 con log incremental
- Total time < 5 min
- Log final con counts + `✅ Repopulation complete`
- Exit code 0

## Paso 5 — Verificar estado post-fix

Re-correr el audit:

```bash
pnpm tsx scripts/audit-zones.ts
```

**Expected**: `sin zone_id: < 154` (aceptable: fuera de AMBA sin match cercano).

## Paso 6 — Verificación manual en producción

Con el fix desplegado, entrar al detalle de un producto conocido de Coto en Palermo:

1. Abrir https://barato-ar.vercel.app en incognito
2. Elegir zone "Palermo" en el picker
3. Buscar "coca 2.25" (o cualquier producto que Coto tenga en Palermo)
4. Click en el detalle
5. **Verificar**: sección "En Palermo" muestra al menos 1 fila con sucursal de Coto

**Regression check**: la sección "Cerca de Palermo" también sigue mostrando resultados (como antes del fix).

## Paso 7 — Marcar B-01 resuelto

Editar `docs/AUDIT.md`:

- Cambiar B-01 de estado 🔴 a ✅
- Agregar nota: "Resuelto en F018, 2026-09-13"

Editar `docs/ESTADO_ACTUAL.md`:

- F007 pasa de 🔴 (bloqueado) a 🟢 (completo)
- Bugs 🔴 P0: bajar contador 4 → 3

## Rollback (si algo sale mal)

**Si el script setea zone_id incorrectos**:

Ejecutar UPDATE reverso en Neon SQL Editor:

```sql
UPDATE stores SET zone_id = NULL WHERE is_virtual = false;
```

Volvemos al estado pre-fix. Después revisar el script y volver a correr.

**Si el fix del código `resolveZoneId` rompe alguna cosa**:

Revert del commit + push. La próxima ingesta usa el resolveZoneId anterior.

**Si el issue es más grave**:

Neon PITR restore al punto pre-cambio (retiene 7 días en free tier).
