/**
 * Pass 3: precios.csv → upsert Price + append PriceHistory con dedup vs folleto.
 * Si ya existe un Price (product, store, día) con source='flyer', se saltea.
 */

import { createReadStream } from "node:fs";
import { parse } from "csv-parse";
import Decimal from "decimal.js";
import { prisma } from "@/lib/db";
import { SepaPrecioSchema } from "./schemas";
import { computePricePerUnit } from "@/lib/units";
import { revalidateAfterIngest } from "../core/revalidate";

export type Pass3Result = {
  pricesUpserted: number;
  rowsSkipped: number;
  rowsDedupedVsFlyer: number;
  chainIdsTouched: Set<string>;
  zoneIdsTouched: Set<string>;
};

type StoreLookup = {
  storeId: string;
  chainId: string;
  zoneId: string | null;
};

type ProductLookup = {
  productId: string;
  standardSize: number | null;
};

const BATCH_SIZE = 500;

export async function ingestPrecios(path: string, sourceUrl: string): Promise<Pass3Result> {
  const parser = createReadStream(path).pipe(
    parse({
      columns: (headers) => headers.map((h: string) => h.trim().toLowerCase()),
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    }),
  );

  const storeCache = new Map<string, StoreLookup | null>();
  const productCache = new Map<string, ProductLookup | null>();
  const result: Pass3Result = {
    pricesUpserted: 0,
    rowsSkipped: 0,
    rowsDedupedVsFlyer: 0,
    chainIdsTouched: new Set<string>(),
    zoneIdsTouched: new Set<string>(),
  };

  let batchCount = 0;
  for await (const rawRow of parser) {
    const parsed = SepaPrecioSchema.safeParse(rawRow);
    if (!parsed.success) {
      result.rowsSkipped++;
      continue;
    }
    const row = parsed.data;
    const price = row.productos_precio_lista ?? row.productos_precio_referencia_impuestos_incluidos;
    if (!Number.isFinite(price) || (price ?? 0) < 0) {
      result.rowsSkipped++;
      continue;
    }
    const storeKey = `${row.id_comercio}:${row.id_sucursal}`;
    let store = storeCache.get(storeKey);
    if (store === undefined) {
      store = await loadStore(row.id_comercio, row.id_sucursal);
      storeCache.set(storeKey, store);
    }
    if (!store) {
      result.rowsSkipped++;
      continue;
    }

    let product = productCache.get(row.id_producto);
    if (product === undefined) {
      product = await loadProductByEan(row.id_producto);
      productCache.set(row.id_producto, product);
    }
    if (!product) {
      result.rowsSkipped++;
      continue;
    }

    const validFrom = row.fecha_relevamiento ? new Date(row.fecha_relevamiento) : new Date();
    if (!Number.isFinite(validFrom.getTime())) {
      result.rowsSkipped++;
      continue;
    }

    // Dedup vs folleto (C-007 evolutivo con F003): si existe Price 'flyer' del
    // mismo (product, store, día), no pisamos.
    const existingFlyer = await prisma.price.findFirst({
      where: {
        productId: product.productId,
        storeId: store.storeId,
        source: "flyer",
        validFrom: {
          gte: startOfDay(validFrom),
          lte: endOfDay(validFrom),
        },
      },
      select: { id: true },
    });
    if (existingFlyer) {
      result.rowsDedupedVsFlyer++;
      continue;
    }

    const pricePerUnit = computePricePerUnit(price!, product.standardSize);

    await prisma.price.upsert({
      where: {
        unique_capture: {
          productId: product.productId,
          storeId: store.storeId,
          source: "precios_claros",
          validFrom,
        },
      },
      update: {
        price: new Decimal(price!),
        capturedAt: new Date(),
        pricePerUnit: pricePerUnit ? new Decimal(pricePerUnit) : null,
      },
      create: {
        productId: product.productId,
        storeId: store.storeId,
        price: new Decimal(price!),
        currency: "ARS",
        validFrom,
        source: "precios_claros",
        sourceUrl,
        pricePerUnit: pricePerUnit ? new Decimal(pricePerUnit) : null,
      },
    });
    await prisma.priceHistory.create({
      data: {
        productId: product.productId,
        storeId: store.storeId,
        price: new Decimal(price!),
        capturedAt: new Date(),
      },
    });

    result.pricesUpserted++;
    result.chainIdsTouched.add(store.chainId);
    if (store.zoneId) result.zoneIdsTouched.add(store.zoneId);

    if (++batchCount % BATCH_SIZE === 0) {
      // Batch checkpoint sirve de progreso — no hay commit explícito con
      // Prisma pero permitimos que el event loop respire.
      await new Promise((r) => setImmediate(r));
    }
  }

  // Revalidate cache global tras cada corrida (C-008)
  if (result.pricesUpserted > 0) {
    for (const chainId of result.chainIdsTouched) {
      await revalidateAfterIngest(chainId, [...result.zoneIdsTouched]);
    }
  }
  return result;
}

async function loadStore(idComercio: number, idSucursal: string): Promise<StoreLookup | null> {
  const row = await prisma.$queryRaw<Array<{ id: string; chain_id: string; zone_id: string | null }>>`
    SELECT s.id, s.chain_id, s.zone_id
    FROM stores s
    JOIN chains c ON c.id = s.chain_id
    WHERE s.slug LIKE ${`${sepaChainSlug(idComercio)}-%-${idSucursal.toLowerCase()}%`}
       OR s.slug LIKE ${`%-${idSucursal.toLowerCase()}%`}
    LIMIT 1
  `;
  if (!row[0]) return null;
  return { storeId: row[0].id, chainId: row[0].chain_id, zoneId: row[0].zone_id };
}

function sepaChainSlug(idComercio: number): string {
  // Ver chains.ts; fallback prefix vacío.
  const map: Record<number, string> = {
    1: "carrefour",
    9: "jumbo",
    10: "dia",
    11: "disco",
    12: "vea",
    15: "coto",
    17: "la-anonima",
    22: "changomas",
  };
  return map[idComercio] ?? "";
}

async function loadProductByEan(ean: string): Promise<ProductLookup | null> {
  const p = await prisma.product.findUnique({
    where: { eanCode: ean },
    select: { id: true, standardSize: true },
  });
  if (!p) return null;
  return {
    productId: p.id,
    standardSize: p.standardSize ? Number(p.standardSize) : null,
  };
}

function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setUTCHours(0, 0, 0, 0);
  return c;
}

function endOfDay(d: Date): Date {
  const c = new Date(d);
  c.setUTCHours(23, 59, 59, 999);
  return c;
}
