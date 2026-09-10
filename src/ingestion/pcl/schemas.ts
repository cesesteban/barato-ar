/**
 * Zod schemas para las filas crudas del dataset SEPA (Precios Claros).
 * Los headers exactos varían levemente entre publicaciones; se refleja acá.
 * Ref: https://datosgobar.github.io/ (dataset "sepa-precios").
 */

import { z } from "zod";

/**
 * Los CSVs SEPA vienen con strings; a veces con "NA"/"SD" para faltantes.
 * Los números usan punto decimal ("1290.50"); si aparece coma la limpiamos.
 */
const coerceOptionalNumber = z.preprocess((v) => {
  if (v === "" || v === "NA" || v === "SD" || v == null) return undefined;
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  if (typeof v !== "string") return undefined;
  const trimmed = v.trim().replace(/\s/g, "");
  if (!trimmed) return undefined;
  let normalized: string;
  if (/^-?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/.test(trimmed)) {
    // Formato es-AR con miles: "1.290,50" → "1290.50"
    normalized = trimmed.replace(/\./g, "").replace(",", ".");
  } else if (trimmed.includes(",") && !trimmed.includes(".")) {
    // Sólo coma como decimal: "1290,50" → "1290.50"
    normalized = trimmed.replace(",", ".");
  } else {
    // Punto decimal estándar: "1290.50"
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

export const SepaSucursalSchema = z.object({
  id_comercio: z.coerce.number().int(),
  id_bandera: z.coerce.number().int(),
  id_sucursal: z.coerce.string(),
  sucursales_nombre: coerceOptionalString,
  sucursales_calle: coerceOptionalString,
  sucursales_numero: coerceOptionalString,
  provincia: z.coerce.string().default(""),
  ciudad: coerceOptionalString,
  localidad: coerceOptionalString,
  sucursales_latitud: coerceOptionalNumber,
  sucursales_longitud: coerceOptionalNumber,
});
export type SepaSucursal = z.infer<typeof SepaSucursalSchema>;

export const SepaProductoSchema = z.object({
  id_producto: z.coerce.string(),
  productos_descripcion: z.coerce.string().default(""),
  productos_marca: coerceOptionalString,
  productos_presentacion: coerceOptionalString,
});
export type SepaProducto = z.infer<typeof SepaProductoSchema>;

export const SepaPrecioSchema = z.object({
  id_comercio: z.coerce.number().int(),
  id_bandera: z.coerce.number().int(),
  id_sucursal: z.coerce.string(),
  id_producto: z.coerce.string(),
  productos_precio_lista: coerceOptionalNumber,
  productos_precio_referencia_impuestos_incluidos: coerceOptionalNumber,
  fecha_relevamiento: coerceOptionalString,
});
export type SepaPrecio = z.infer<typeof SepaPrecioSchema>;
