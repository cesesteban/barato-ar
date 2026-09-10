# Implementation Plan: Ingest Precios Claros (SEPA)

**Branch**: `004-ingest-precios-claros` | **Date**: 2026-09-09 | **Spec**: [spec.md](./spec.md)

## Summary

Job semanal que descarga los CSVs de SEPA, filtra CABA+GBA, y ingesta en el schema definido en F03. Introduce zonas y sucursales reales al modelo. Deduplica contra folletos.

## Technical Context

- **Language/Version**: TS 5.6, Node 20
- **Primary Dependencies**: `undici`, `csv-parse` (streaming), `zod`, `@prisma/client`, `@sentry/node`, `geohash-js` (opt), `haversine` (para radio GBA)
- **Storage**: Postgres (reusa schema F03)
- **Testing**: Vitest con fixtures CSV pequeños (~100 rows).
- **Target Platform**: GitHub Actions
- **Performance Goals**: < 20 min por corrida
- **Constraints**: streaming CSV (no cargar en memoria), rate-limit al portal
- **Scale/Scope**: ~50k rows crudos → ~5-10k después de filtrar

## Constitution Check

| Principio | Cumplimiento |
|---|---|
| I. SEO-First | N/A |
| II. Datos frescos | Sí. Timestamp + source. |
| III. TS strict + tests | Sí. Fixtures + parsers tipados con Zod. |
| IV. Privacidad | N/A |
| V. Performance | Sí. Streaming CSV. |
| VI. Legalidad | **Central**. Dataset público. |
| VII. Simplicidad | Sí. Un job más en GH Actions. |

## Data Source Contract

Endpoints típicos (URLs reales configurables por env):

```
DATASET_BASE=https://datos.produccion.gob.ar/dataset/sepa-precios/
SEPA_INDEX_URL=$DATASET_BASE/manifest.json
```

Archivos esperados: `comercio.csv`, `sucursales.csv`, `productos.csv`, `precios.csv`.

Columnas relevantes:
- `sucursales.csv`: `id_comercio, id_bandera, id_sucursal, sucursales_nombre, sucursales_calle, sucursales_numero, provincia, ciudad, localidad, sucursales_latitud, sucursales_longitud`.
- `productos.csv`: `id_producto (EAN), productos_descripcion, productos_marca, productos_presentacion`.
- `precios.csv`: `id_comercio, id_bandera, id_sucursal, id_producto, productos_precio_lista, productos_precio_referencia_impuestos_incluidos, fecha_relevamiento`.

## Pipeline Flow

1. Descargar `manifest.json` → obtener URLs de CSVs vigentes.
2. Descargar CSVs a `/tmp` (stream).
3. **Pass 1 — Sucursales**: parsear `sucursales.csv`, filtrar CABA+GBA (haversine ≤ 50 km desde Obelisco `−34.6037, −58.3816`), map `id_comercio → chainId` (solo cadenas soportadas), upsert `Zone` y `Store`.
4. **Pass 2 — Productos**: parsear `productos.csv`, upsert `Product` por EAN.
5. **Pass 3 — Precios**: stream `precios.csv`, para cada row donde `id_sucursal` está en `Store`:
   - Verificar si ya existe `Price` de la misma fecha con `source = 'flyer'` → skip.
   - Upsert Price con `source = 'precios_claros'`, `is_offer = false`.
   - Append PriceHistory.
6. Cerrar `IngestionRun`.

## Zone Hierarchy Bootstrap

Zonas semilla que se crean si no existen (idempotente):
- `caba` (parentId: null)
  - `caba-palermo`, `caba-recoleta`, `caba-belgrano`, ... (autopobladas desde `localidad` del CSV)
- `pba` (parentId: null)
  - `pba-gba-norte` (San Isidro, Vicente López)
  - `pba-gba-oeste` (Morón, Ituzaingó, Merlo)
  - `pba-gba-sur` (Avellaneda, Lomas de Zamora)

Mapping `localidad` (string) → `zoneId` mediante lookup table en `src/ingestion/pcl/zones.ts`.

## Chain ID Mapping

```ts
// src/ingestion/pcl/chains.ts
export const SEPA_CHAIN_MAP: Record<number, string> = {
  1: "carrefour",        // id_comercio real de SEPA
  15: "coto",
  10: "dia",
  9: "jumbo",
  12: "vea",
  11: "disco",
  17: "la-anonima",
  22: "changomas",
  // ... completar según manifest oficial
};
```

## Project Structure

```
src/ingestion/pcl/
├── index.ts                     # ChainParser polivalente ("pcl")
├── downloader.ts                # descarga CSVs de SEPA
├── manifest.ts                  # parsea manifest.json
├── stores.ts                    # pass 1 (sucursales)
├── products.ts                  # pass 2 (productos)
├── prices.ts                    # pass 3 (precios) con dedup
├── chains.ts                    # map id_comercio → chainId
├── zones.ts                     # localidad → zoneId
└── __tests__/
    ├── fixtures/
    │   ├── sucursales-sample.csv
    │   ├── productos-sample.csv
    │   └── precios-sample.csv
    └── pcl.test.ts
```

## Contracts

```ts
// RawSepaSucursal
export const SepaSucursalSchema = z.object({
  id_comercio: z.coerce.number(),
  id_bandera: z.coerce.number(),
  id_sucursal: z.string(),
  sucursales_nombre: z.string(),
  provincia: z.string(),
  ciudad: z.string(),
  localidad: z.string().optional(),
  sucursales_latitud: z.coerce.number().optional(),
  sucursales_longitud: z.coerce.number().optional(),
});
```

## Deduplicación con Folletos

Dedup en `pass 3`:
```ts
const existingFlyer = await prisma.price.findFirst({
  where: {
    productId, storeId,
    source: "flyer",
    validFrom: { gte: startOfDay(row.fecha), lte: endOfDay(row.fecha) },
  },
});
if (existingFlyer) return; // skip
```

## CI/CD

`.github/workflows/ingest-pcl.yml`:
```yaml
on:
  schedule: [{ cron: "0 11 * * 2" }]        # martes 11:00 UTC = 8am ART
  workflow_dispatch:
jobs:
  ingest-pcl:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm ingest pcl
```

## Testing

- Fixtures CSV recortados (~50-100 rows) para test unitario.
- Test de dedup: mock `Price` con `source='flyer'` y confirmar que la row PCL no lo pisa.
- Test de filtro geográfico: sucursal en Ushuaia → skip.

## Complexity Tracking

Sin violaciones.
