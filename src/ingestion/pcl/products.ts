/**
 * Pass 2 (por comercio): productos.csv → upsert Product por EAN + insert Price.
 *
 * SEPA no usa un archivo separado de precios: cada row en productos.csv trae
 * el precio de ese producto en esa sucursal. Extraemos ambas cosas en un
 * mismo pase, con caches en memoria y batching de Prices para velocidad.
 */

import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { SepaProductoRowSchema, type SepaProductoRow } from "./schemas";
import { detectPackagingFlag, normalizeName, slugify } from "../core/normalize";
import { computePricePerUnit, computeStandard } from "@/lib/units";
import { cleanBrand, cleanProductName } from "@/lib/text-cleanup";
import type { StoreCache } from "./stores";
import { makeCacheKey } from "./stores";

export type Pass2Result = {
  productsUpserted: number;
  pricesUpserted: number;
  rowsSkipped: number;
  chainIdsTouched: Set<string>;
  zoneIdsTouched: Set<string>;
};

type ProductCacheEntry = {
  productId: string;
  standardSize: number | null;
};

type PricePayload = {
  productId: string;
  storeId: string;
  price: Decimal;
  currency: "ARS";
  validFrom: Date;
  source: "precios_claros";
  sourceUrl: string;
  pricePerUnit: Decimal | null;
};

type HistoryPayload = {
  productId: string;
  storeId: string;
  price: Decimal;
  capturedAt: Date;
};

const CSV_OPTS = {
  columns: (headers: string[]) => headers.map((h) => h.replace(/^﻿/, "").trim().toLowerCase()),
  delimiter: "|",
  skip_empty_lines: true,
  trim: true,
  relax_column_count: true,
  relax_quotes: true,
  quote: false as const,
  bom: true,
} as const;

const SIZE_RE = /(\d+(?:[.,]\d+)?)\s*(ml|cc|l|lts?|litros?|g|gr|grs|gramos|kg|kgs|kilos?|un|unidades|u|rollos?|sobres?)\b/i;
const PRICE_BATCH_SIZE = 500;

export async function ingestProductos(
  path: string,
  storeCache: StoreCache,
  sourceDate: Date,
  sourceUrl: string,
): Promise<Pass2Result> {
  const parser = createReadStream(path).pipe(parse(CSV_OPTS));

  const productCache = new Map<string, ProductCacheEntry>();
  const priceBatch: PricePayload[] = [];
  const historyBatch: HistoryPayload[] = [];
  // Dedup por (producto, cadena, precio): Coto/Día/Cencosud tienen pricing
  // centralizado — 100+ sucursales de la misma cadena tienen el mismo precio
  // para el mismo producto. Insertamos 1 row representativa por combinación.
  const seenPrice = new Set<string>();

  const result: Pass2Result = {
    productsUpserted: 0,
    pricesUpserted: 0,
    rowsSkipped: 0,
    chainIdsTouched: new Set<string>(),
    zoneIdsTouched: new Set<string>(),
  };

  const capturedAt = new Date();

  for await (const rawRow of parser) {
    const parsed = SepaProductoRowSchema.safeParse(rawRow);
    if (!parsed.success || !parsed.data.productos_descripcion) {
      result.rowsSkipped++;
      continue;
    }
    const row = parsed.data;

    const store = storeCache.get(makeCacheKey(row.id_comercio, row.id_bandera, row.id_sucursal));
    if (!store) {
      result.rowsSkipped++;
      continue;
    }

    const price = pickPrice(row);
    if (price == null) {
      result.rowsSkipped++;
      continue;
    }

    const ean = resolveProductKey(row);
    if (!ean) {
      result.rowsSkipped++;
      continue;
    }

    let product = productCache.get(ean);
    if (!product) {
      product = await upsertProduct(row, ean);
      productCache.set(ean, product);
      result.productsUpserted++;
    }

    // Dedup a nivel (product, chain, price) — no per-store.
    // Redondeamos precio a int (centavos irrelevantes en pricing centralizado).
    const priceKey = `${product.productId}:${store.chainId}:${Math.round(price * 100)}`;
    if (seenPrice.has(priceKey)) {
      result.rowsSkipped++;
      continue;
    }
    seenPrice.add(priceKey);

    const priceDecimal = new Decimal(price);
    const rawPPU = computePricePerUnit(price, product.standardSize);
    const pricePerUnit =
      rawPPU != null && rawPPU >= 0 && rawPPU <= MAX_STORABLE_PRICE ? new Decimal(rawPPU) : null;
    priceBatch.push({
      productId: product.productId,
      storeId: store.storeId,
      price: priceDecimal,
      currency: "ARS",
      validFrom: sourceDate,
      source: "precios_claros",
      sourceUrl,
      pricePerUnit,
    });
    historyBatch.push({
      productId: product.productId,
      storeId: store.storeId,
      price: priceDecimal,
      capturedAt,
    });
    result.chainIdsTouched.add(store.chainId);
    if (store.zoneId) result.zoneIdsTouched.add(store.zoneId);

    if (priceBatch.length >= PRICE_BATCH_SIZE) {
      const flushed = await flushBatches(priceBatch, historyBatch);
      result.pricesUpserted += flushed;
      priceBatch.length = 0;
      historyBatch.length = 0;
    }
  }

  if (priceBatch.length > 0) {
    const flushed = await flushBatches(priceBatch, historyBatch);
    result.pricesUpserted += flushed;
  }

  return result;
}

const MIN_PLAUSIBLE_PRICE = 1;
// Prisma Decimal(10, 4) → máximo 999_999.9999. Precios por encima son data mala.
const MAX_STORABLE_PRICE = 999_998;

function pickPrice(row: SepaProductoRow): number | null {
  const candidates = [
    row.productos_precio_lista,
    row.productos_precio_unitario_promo1,
    row.productos_precio_referencia,
  ];
  for (const c of candidates) {
    if (
      typeof c === "number" &&
      Number.isFinite(c) &&
      c >= MIN_PLAUSIBLE_PRICE &&
      c <= MAX_STORABLE_PRICE
    ) {
      return c;
    }
  }
  return null;
}

/**
 * Genera un identificador de producto para nuestro schema.
 *
 * Solo aceptamos EAN reales (8-14 dígitos numéricos) para que el mismo producto
 * en Coto/Carrefour/Día colapse en una única row Product — sin eso, perdemos
 * el match multi-cadena que es el core del sitio.
 *
 * Los productos con SKU interno que no es EAN se descartan (retornamos null).
 * Estos son la "long tail" de cada cadena: no se pueden comparar con las otras
 * y no aportan a la vista de ofertas del MVP.
 */
function resolveProductKey(row: SepaProductoRow): string | null {
  const ean = row.productos_ean?.trim() ?? "";
  if (isValidEan(ean)) return ean;
  const internal = row.id_producto.trim();
  if (isValidEan(internal)) return internal;
  return null;
}

function isValidEan(candidate: string): boolean {
  return /^\d{8,14}$/.test(candidate) && !/^0+$/.test(candidate);
}

async function upsertProduct(row: SepaProductoRow, ean: string): Promise<ProductCacheEntry> {
  const name = cleanProductName(row.productos_descripcion);
  const brand = cleanBrand(row.productos_marca);
  const presentation = formatPresentation(row);
  const { size, unit } = extractSizeUnit(presentation || name);
  const std = size != null && unit ? computeStandard(size, unit) : null;
  const normalized = normalizeName(name);
  const packagingFlag = detectPackagingFlag(name);
  const baseSlug = slugify(`${name} ${brand ?? ""} ${size ?? ""}${unit ?? ""}`);
  const slug = `${baseSlug}-${shortHash(ean)}`;

  const product = await prisma.product.upsert({
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
    select: { id: true, standardSize: true },
  });
  return {
    productId: product.id,
    standardSize: product.standardSize ? Number(product.standardSize) : null,
  };
}

function formatPresentation(row: SepaProductoRow): string {
  const qty = row.productos_cantidad_presentacion;
  const unit = row.productos_unidad_medida_presentacion;
  if (qty != null && unit) return `${qty} ${unit}`;
  return "";
}

function shortHash(input: string): string {
  // FNV-1a 32-bit — corto, estable, sin dependencias.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36).padStart(7, "0").slice(0, 7);
}

function extractSizeUnit(text: string): { size?: number; unit?: string } {
  const match = SIZE_RE.exec(text);
  if (!match || !match[1] || !match[2]) return {};
  const size = Number(match[1].replace(",", "."));
  if (!Number.isFinite(size) || size <= 0) return {};
  return { size, unit: match[2].toLowerCase() };
}

async function flushBatches(prices: PricePayload[], history: HistoryPayload[]): Promise<number> {
  if (prices.length === 0) return 0;
  const result = await prisma.price.createMany({
    data: prices,
    skipDuplicates: true,
  });
  if (history.length > 0) {
    await prisma.priceHistory.createMany({
      data: history,
      skipDuplicates: true,
    });
  }
  return result.count;
}
