/**
 * Pass 2: productos.csv → upsert Product por EAN.
 * SEPA usa `id_producto` como EAN/GTIN.
 */

import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { SepaProductoSchema } from "./schemas";
import { detectPackagingFlag, normalizeName, slugify } from "../core/normalize";
import { computeStandard } from "@/lib/units";

const SIZE_RE = /(\d+(?:[.,]\d+)?)\s*(ml|cc|l|lts?|litros?|g|gr|grs|gramos|kg|kgs|kilos?|un|unidades|u|rollos?|sobres?)\b/i;

export type Pass2Result = {
  productsUpserted: number;
  rowsSkipped: number;
};

export async function ingestProductos(path: string): Promise<Pass2Result> {
  const parser = createReadStream(path).pipe(
    parse({
      columns: (headers) => headers.map((h: string) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }),
  );

  let productsUpserted = 0;
  let rowsSkipped = 0;

  for await (const rawRow of parser) {
    const parsed = SepaProductoSchema.safeParse(rawRow);
    if (!parsed.success || !parsed.data.productos_descripcion) {
      rowsSkipped++;
      continue;
    }
    const row = parsed.data;
    const ean = row.id_producto?.trim();
    if (!ean) {
      rowsSkipped++;
      continue;
    }

    const name = row.productos_descripcion.trim();
    const brand = row.productos_marca?.trim() ?? null;
    const presentation = row.productos_presentacion?.trim() ?? "";
    const { size, unit } = extractSizeUnit(presentation || name);
    const std = size != null && unit ? computeStandard(size, unit) : null;
    const normalized = normalizeName(name);
    const packagingFlag = detectPackagingFlag(name);
    const slug = slugify(`${name} ${brand ?? ""} ${size ?? ""}${unit ?? ""}`);

    await prisma.product.upsert({
      where: { eanCode: ean },
      update: {
        name,
        normalizedName: normalized,
        brand,
        size: size ?? null,
        unit: unit ?? null,
        standardSize: std ? new Decimal(std.standardSize) : null,
        standardUnit: std?.standardUnit ?? null,
        packagingFlag,
      },
      create: {
        name,
        normalizedName: normalized,
        brand,
        size: size ?? null,
        unit: unit ?? null,
        standardSize: std ? new Decimal(std.standardSize) : null,
        standardUnit: std?.standardUnit ?? null,
        packagingFlag,
        eanCode: ean,
        slug,
      },
    });
    productsUpserted++;
  }
  return { productsUpserted, rowsSkipped };
}

function extractSizeUnit(text: string): { size?: number; unit?: string } {
  const match = SIZE_RE.exec(text);
  if (!match || !match[1] || !match[2]) return {};
  const size = Number(match[1].replace(",", "."));
  if (!Number.isFinite(size) || size <= 0) return {};
  return { size, unit: match[2].toLowerCase() };
}
