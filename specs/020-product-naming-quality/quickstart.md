# Quickstart · F020 — Calidad de nombres de productos

Validación end-to-end del pipeline de naming + repopulate.

## Prerrequisitos

- Repo checked out en `feat/020-product-naming-quality` (o main post-merge)
- Node 20 + pnpm
- Neon prod accesible (envs `DATABASE_URL` + `DATABASE_URL_UNPOOLED`)

## Paso 1 — Audit inicial (baseline)

Correr el audit script para tener baseline:

```bash
pnpm tsx scripts/audit-product-names.ts
```

**Expected baseline (pre-fix)** (según audit del 2026-09-13):
- Total: 47,116 productos
- Con " X " suelto: ~12,840 (27.3%)
- Con " C " suelto: ~828 (1.8%)
- Con códigos SEPA: ~1000
- Marcas truncadas comunes: ~799
- Sin brand: ~6,377 (13.5%)

## Paso 2 — Tests unit del pipeline

```bash
pnpm test --run tests/unit/text-cleanup.test.ts tests/unit/lib/brand-catalog.test.ts
```

**Expected**: 30+ tests pasan (los existentes + los nuevos del F020).

## Paso 3 — Dry-run del repopulate

Ver qué cambiaría sin escribir:

```bash
pnpm tsx scripts/repopulate-product-names.ts --dry-run --limit 100
```

**Expected**:
- Log listando muestra de nombres antes/después (`old → new`).
- Counts por tipo de fix aplicado (`x_stripped: N`, `codes_stripped: N`, `brand_canonicalized: N`).
- Exit code 0.

Verificar manualmente 5-10 casos que la transformación tenga sentido.

## Paso 4 — Full dry-run

```bash
pnpm tsx scripts/repopulate-product-names.ts --dry-run
```

**Expected**:
- Recorre los 47k productos.
- Reporta cuántos serían actualizados vs cuántos ya están limpios.
- Aproximado: 20-30k productos afectados (data con noise > 40%).

## Paso 5 — Ejecución real

```bash
pnpm tsx scripts/repopulate-product-names.ts
```

**Expected**:
- Batch de 500 en 500.
- Total time 3-10 min.
- Log final con counts + `✅ Repopulation complete`.

## Paso 6 — Verificar post-fix

```bash
pnpm tsx scripts/audit-product-names.ts
```

**Success criteria** (spec):
- `% X %` count debe pasar de 12,840 → < 200 (99% resuelto).
- Códigos SEPA debe pasar de ~1000 → < 20.
- Marcas truncadas conocidas (Guinn, Imper, Stell, Coca) < 10.

## Paso 7 — Verificar búsqueda

En prod:

```bash
curl -s "https://barato-ar.vercel.app/api/search?q=focaccia" | head -c 500
curl -s "https://barato-ar.vercel.app/api/search?q=guinness" | head -c 500
curl -s "https://barato-ar.vercel.app/api/search?q=coca+cola" | head -c 500
```

**Expected**: cada uno devuelve >= 1 result (antes: focaccia probablemente 0).

## Paso 8 — Verificar deep links

En barato-ar.vercel.app, entrar a 3 productos random:

1. Uno de Carrefour con nombre previamente sucio (ej. la focaccia del screenshot).
2. Uno de Coto.
3. Una cerveza (para verificar dictionary de marcas).

Click en "Ir a la tienda" en cada uno → verificar que el sitio de la cadena devuelve al menos 1 resultado (o el producto exacto).

Antes del fix: la focaccia daba "Disculpanos, no encontramos productos" en Carrefour.

## Paso 9 — Update docs

Editar en el commit del merge:

- [ ] `docs/AUDIT.md`: marcar B-03 y B-04 como ✅ resueltos con F020.
- [ ] `docs/ESTADO_ACTUAL.md`: agregar F020 al scorecard con 🟢.
- [ ] `docs/FLUJO_BACKEND.md`: mencionar `brand-catalog.ts` como parte del pipeline de ingesta.

## Rollback

**Si el script cambia nombres incorrectamente**:

Neon tiene PITR (7 días). Restore point-in-time al momento previo del script.

Alternativa: `UPDATE products SET name = <backup>` si tenés backup de names originales. Recomendado: correr el script con `--dry-run` primero + revisar sample cuidadoso antes del real.

**Si el dictionary genera falsos positivos** (ej. "Ledesma" se aplica a algo que no es la marca):

Editar `brand-catalog.ts` para quitar la alias problemática + re-correr repopulate (idempotente).

**Si la búsqueda empeora post-fix**:

Muy poco probable (nombres más limpios ayudan pg_trgm). Si pasa: `REFRESH MATERIALIZED VIEW price_daily_avg` + re-indexar `products.normalized_name`. El script ya recalcula `normalized_name`.
