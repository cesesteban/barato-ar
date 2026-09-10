# SEPA / Precios Claros ingest — troubleshooting

Endpoint público del dataset SEPA (ex Precios Claros). La URL exacta puede cambiar entre publicaciones — se configura en `.env` como `SEPA_MANIFEST_URL`.

## Manifest esperado

```json
{
  "version": "2026-W37",
  "publishedAt": "2026-09-08T10:00:00Z",
  "files": {
    "sucursales": "https://.../sucursales.csv",
    "productos": "https://.../productos.csv",
    "precios": "https://.../precios.csv",
    "comercios": "https://.../comercios.csv"
  }
}
```

Si el dataset oficial no expone un manifest JSON, publicamos uno propio en un bucket de Cloudflare R2 y apuntamos `SEPA_MANIFEST_URL` a ese archivo.

## Corridas manuales

```bash
export SEPA_MANIFEST_URL=https://tu-bucket/manifest.json
pnpm ingest pcl
```

## Filtro CABA + GBA

Un radio de 50 km del Obelisco (`src/ingestion/pcl/geo.ts`) — cubre todas las sucursales de interés y descarta el resto del país.

## Mapeo `id_comercio` → chain

Ver `src/ingestion/pcl/chains.ts`. Los ids reales se estabilizan al descargar el manifest — hay que verificarlos periódicamente. Cuando SEPA sube una cadena nueva:

1. Agregar entrada a `SEPA_CHAIN_MAP`.
2. Agregar `Chain` al seed (`prisma/seed/chains.ts`).
3. Re-correr `pnpm db:seed`.

## Deduplicación con folletos (C-007)

`prices.ts` verifica si ya existe un `Price` con `source='flyer'` para `(product, store, día)`. Si sí, no pisa. Verificación:

```sql
SELECT product_id, store_id, DATE(valid_from), COUNT(*)
FROM prices
GROUP BY 1, 2, 3
HAVING COUNT(*) > 1;
```

Debe devolver 0 rows para el día ingerido.

## Frecuencia

Martes 8am ART (`cron: "0 11 * * 2"`), justo después del ciclo de folletos del lunes — así el dedup funciona bien.
