/**
 * Formato de precios en es-AR: "$1.234", "$1.234,50".
 * Los precios llegan como number (pesos + centavos si aplica).
 */

const arsCompact = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const arsDecimal = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const perUnitFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(amount: number, options?: { withCents?: boolean }): string {
  if (!Number.isFinite(amount)) return "—";
  if (amount === 0) return "Consultar";
  const fmt = options?.withCents ? arsDecimal : arsCompact;
  return fmt.format(amount);
}

export function formatPricePerUnit(pricePerUnit: number, unit: string): string {
  if (!Number.isFinite(pricePerUnit) || pricePerUnit <= 0) return "";
  return `${perUnitFmt.format(pricePerUnit)} / ${unit}`;
}

export function formatDiscountPct(pct: number): string {
  if (!Number.isFinite(pct)) return "";
  const sign = pct < 0 ? "" : "-";
  return `${sign}${Math.round(Math.abs(pct))}%`;
}
