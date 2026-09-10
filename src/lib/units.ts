/**
 * Conversión de unidades a standard (C-003).
 * Volumen → L. Peso → kg. Unidades enteras → un.
 * Todo con Decimal para evitar imprecisiones en precio por unidad.
 */

import Decimal from "decimal.js";

export type StandardUnit = "L" | "kg" | "un";

const VOLUME_MAP: Record<string, { unit: StandardUnit; factor: Decimal }> = {
  l: { unit: "L", factor: new Decimal(1) },
  lt: { unit: "L", factor: new Decimal(1) },
  lts: { unit: "L", factor: new Decimal(1) },
  litro: { unit: "L", factor: new Decimal(1) },
  litros: { unit: "L", factor: new Decimal(1) },
  ml: { unit: "L", factor: new Decimal("0.001") },
  cc: { unit: "L", factor: new Decimal("0.001") },
};

const WEIGHT_MAP: Record<string, { unit: StandardUnit; factor: Decimal }> = {
  kg: { unit: "kg", factor: new Decimal(1) },
  kgs: { unit: "kg", factor: new Decimal(1) },
  kilo: { unit: "kg", factor: new Decimal(1) },
  kilos: { unit: "kg", factor: new Decimal(1) },
  g: { unit: "kg", factor: new Decimal("0.001") },
  gr: { unit: "kg", factor: new Decimal("0.001") },
  grs: { unit: "kg", factor: new Decimal("0.001") },
  gramos: { unit: "kg", factor: new Decimal("0.001") },
};

const COUNT_UNITS = new Set([
  "un",
  "unidad",
  "unidades",
  "u",
  "pack",
  "rollos",
  "rollo",
  "capsulas",
  "cápsulas",
  "sobres",
  "sobre",
  "comprimidos",
  "comp",
]);

export type StandardResult = {
  standardSize: number;
  standardUnit: StandardUnit;
};

/**
 * Convierte `(size, unit)` a `standard`.
 * Devuelve null si no se puede inferir (el normalizer marca revisión manual).
 */
export function computeStandard(size: number | null | undefined, unit: string | null | undefined): StandardResult | null {
  if (!Number.isFinite(size) || size == null || size <= 0) return null;
  const raw = (unit ?? "").toLowerCase().trim();
  if (!raw) return null;

  if (VOLUME_MAP[raw]) {
    const cfg = VOLUME_MAP[raw];
    return { standardSize: new Decimal(size).mul(cfg.factor).toNumber(), standardUnit: cfg.unit };
  }
  if (WEIGHT_MAP[raw]) {
    const cfg = WEIGHT_MAP[raw];
    return { standardSize: new Decimal(size).mul(cfg.factor).toNumber(), standardUnit: cfg.unit };
  }
  if (COUNT_UNITS.has(raw)) {
    return { standardSize: size, standardUnit: "un" };
  }
  return null;
}

/**
 * Precio por unidad estándar (ARS / L o /kg o /un).
 */
export function computePricePerUnit(price: number, standardSize: number | null | undefined): number | null {
  if (!Number.isFinite(price) || !Number.isFinite(standardSize) || !standardSize || standardSize <= 0 || price <= 0) {
    return null;
  }
  return new Decimal(price).div(new Decimal(standardSize)).toDecimalPlaces(4).toNumber();
}
