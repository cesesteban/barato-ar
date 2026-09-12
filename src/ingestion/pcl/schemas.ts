/**
 * Zod schemas para las filas crudas del dataset SEPA (Precios Claros).
 *
 * SEPA usa delimitador `|` y en cada zip por comercio incluye 3 CSVs:
 *   - comercio.csv    (metadata del comercio + banderas)
 *   - sucursales.csv  (una fila por sucursal + bandera)
 *   - productos.csv   (una fila por producto × sucursal — INCLUYE los precios)
 *
 * No hay `precios.csv` separado: los precios viven inline en productos.csv
 * (columnas productos_precio_lista + productos_precio_referencia +
 * productos_precio_unitario_promo1/2).
 *
 * Ref: `docs/ingest/sepa.md`.
 */

import { z } from "zod";

const coerceOptionalNumber = z.preprocess((v) => {
  if (v === "" || v === "NA" || v === "SD" || v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim().replace(/\s/g, "");
  if (!trimmed) return undefined;
  let normalized: string;
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(trimmed)) {
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (trimmed.includes(",") && !trimmed.includes(".")) {
    normalized = trimmed.replace(",", ".");
  } else {
    normalized = trimmed;
  }
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}, z.number().optional());

const coerceOptionalString = z.preprocess((v) => {
  if (v == null) return undefined;
  if (typeof v !== "string") return String(v);
  const t = v.trim();
  return t === "" ? undefined : t;
}, z.string().optional());

/**
 * sucursales.csv real:
 * id_comercio|id_bandera|id_sucursal|sucursales_nombre|sucursales_tipo|
 * sucursales_calle|sucursales_numero|sucursales_latitud|sucursales_longitud|
 * sucursales_observaciones|sucursales_barrio|sucursales_codigo_postal|
 * sucursales_localidad|sucursales_provincia|sucursales_[dia]_horario_atencion
 */
export const SepaSucursalSchema = z.object({
  id_comercio: z.coerce.number().int(),
  id_bandera: z.coerce.number().int(),
  id_sucursal: z.coerce.string(),
  sucursales_nombre: coerceOptionalString,
  sucursales_calle: coerceOptionalString,
  sucursales_numero: coerceOptionalString,
  sucursales_latitud: coerceOptionalNumber,
  sucursales_longitud: coerceOptionalNumber,
  sucursales_barrio: coerceOptionalString,
  sucursales_localidad: coerceOptionalString,
  sucursales_provincia: coerceOptionalString,
});
export type SepaSucursal = z.infer<typeof SepaSucursalSchema>;

/**
 * productos.csv real:
 * id_comercio|id_bandera|id_sucursal|id_producto|productos_ean|
 * productos_descripcion|productos_cantidad_presentacion|
 * productos_unidad_medida_presentacion|productos_marca|
 * productos_precio_lista|productos_precio_referencia|
 * productos_cantidad_referencia|productos_unidad_medida_referencia|
 * productos_precio_unitario_promo1|productos_leyenda_promo1|
 * productos_precio_unitario_promo2|productos_leyenda_promo2
 */
export const SepaProductoRowSchema = z.object({
  id_comercio: z.coerce.number().int(),
  id_bandera: z.coerce.number().int(),
  id_sucursal: z.coerce.string(),
  id_producto: z.coerce.string(),
  productos_ean: coerceOptionalString,
  productos_descripcion: z.coerce.string(),
  productos_cantidad_presentacion: coerceOptionalNumber,
  productos_unidad_medida_presentacion: coerceOptionalString,
  productos_marca: coerceOptionalString,
  productos_precio_lista: coerceOptionalNumber,
  productos_precio_referencia: coerceOptionalNumber,
  productos_cantidad_referencia: coerceOptionalNumber,
  productos_unidad_medida_referencia: coerceOptionalString,
  productos_precio_unitario_promo1: coerceOptionalNumber,
  productos_leyenda_promo1: coerceOptionalString,
  productos_precio_unitario_promo2: coerceOptionalNumber,
  productos_leyenda_promo2: coerceOptionalString,
});
export type SepaProductoRow = z.infer<typeof SepaProductoRowSchema>;

/**
 * comercio.csv real:
 * id_comercio|id_bandera|comercio_cuit|comercio_razon_social|
 * comercio_bandera_nombre|comercio_bandera_url|comercio_ultima_actualizacion|
 * comercio_version_sepa
 */
export const SepaComercioSchema = z.object({
  id_comercio: z.coerce.number().int(),
  id_bandera: z.coerce.number().int(),
  comercio_razon_social: coerceOptionalString,
  comercio_bandera_nombre: coerceOptionalString,
});
export type SepaComercio = z.infer<typeof SepaComercioSchema>;
