/**
 * Upserts idempotentes para Product y Price (F003).
 */

import type { PrismaClient, Product, Price } from "@prisma/client";
import Decimal from "decimal.js";
import type { ParsedItem } from "./types";
import { detectPackagingFlag, normalizeName, slugify } from "./normalize";
import { computePricePerUnit, computeStandard } from "@/lib/units";
import { computeEffectivePrice } from "@/lib/promo";
import { parsePromoFromText } from "./parse-promo";

export type IngestContext = {
  db: PrismaClient;
  chainId: string;
  storeId: string;
  source: "flyer" | "precios_claros" | "public_api" | "crowdsourced" | "scraped";
  runId: string;
  capturedAt: Date;
};

export async function upsertProductFromItem(ctx: IngestContext, item: ParsedItem): Promise<Product> {
  const normalized = normalizeName(item.productName);
  const packagingFlag = item.packagingFlag ?? detectPackagingFlag(item.productName);
  const std = computeStandard(item.size ?? null, item.unit ?? null);
  const slug = slugify(`${item.productName} ${item.brand ?? ""} ${item.size ?? ""}${item.unit ?? ""}`);

  // Match by EAN first (C-005)
  if (item.eanCode) {
    const byEan = await ctx.db.product.findUnique({ where: { eanCode: item.eanCode } });
    if (byEan) return byEan;
  }

  // Match by (normalized, brand, standardSize, standardUnit, packagingFlag)
  const existing = await ctx.db.product.findFirst({
    where: {
      normalizedName: normalized,
      brand: item.brand ?? null,
      standardSize: std ? new Decimal(std.standardSize) : null,
      standardUnit: std?.standardUnit ?? null,
      packagingFlag: packagingFlag ?? null,
    },
  });
  if (existing) return existing;

  return ctx.db.product.create({
    data: {
      name: item.productName,
      normalizedName: normalized,
      brand: item.brand ?? null,
      size: item.size ?? null,
      unit: item.unit ?? null,
      standardSize: std ? new Decimal(std.standardSize) : null,
      standardUnit: std?.standardUnit ?? null,
      packagingFlag: packagingFlag ?? null,
      category: item.category ?? null,
      eanCode: item.eanCode ?? null,
      slug,
    },
  });
}

export async function upsertPriceFromItem(
  ctx: IngestContext,
  product: Product,
  item: ParsedItem,
): Promise<Price> {
  const promoParsed = item.promoType
    ? {
        promoType: item.promoType,
        promoBuyQty: item.promoBuyQty,
        promoPayQty: item.promoPayQty,
        promoSecondDiscountPct: item.promoSecondDiscountPct,
        promoDescription: item.promoDescription ?? "",
      }
    : parsePromoFromText(item.promoDescription ?? "");

  const std = product.standardSize ? Number(product.standardSize) : null;
  const pricePerUnit = computePricePerUnit(item.price, std);
  const effective = computeEffectivePrice({
    price: item.price,
    promoType: promoParsed.promoType,
    promoBuyQty: promoParsed.promoBuyQty ?? null,
    promoPayQty: promoParsed.promoPayQty ?? null,
    promoSecondDiscountPct: promoParsed.promoSecondDiscountPct ?? null,
  });
  const pricePerUnitEff = computePricePerUnit(effective, std);

  const discountPct =
    item.previousPrice && item.previousPrice > 0
      ? new Decimal(item.previousPrice - item.price).div(item.previousPrice).mul(100).toDecimalPlaces(2).toNumber()
      : null;
  const isOffer = !!discountPct && discountPct > 0;

  const validFrom = new Date(item.validFrom);
  const validTo = item.validTo ? new Date(item.validTo) : null;

  // Idempotencia: unique(product_id, store_id, source, valid_from)
  return ctx.db.price.upsert({
    where: {
      unique_capture: {
        productId: product.id,
        storeId: ctx.storeId,
        source: ctx.source,
        validFrom,
      },
    },
    update: {
      price: new Decimal(item.price),
      previousPrice: item.previousPrice ? new Decimal(item.previousPrice) : null,
      discountPct,
      isOffer,
      validTo,
      sourceUrl: item.sourceUrl,
      storeProductUrl: item.storeProductUrl ?? null,
      capturedAt: ctx.capturedAt,
      promoType: promoParsed.promoType,
      promoBuyQty: promoParsed.promoBuyQty ?? null,
      promoPayQty: promoParsed.promoPayQty ?? null,
      promoSecondDiscountPct: promoParsed.promoSecondDiscountPct ?? null,
      promoDescription: promoParsed.promoDescription || null,
      pricePerUnit: pricePerUnit ? new Decimal(pricePerUnit) : null,
      pricePerUnitEff: pricePerUnitEff ? new Decimal(pricePerUnitEff) : null,
    },
    create: {
      productId: product.id,
      storeId: ctx.storeId,
      price: new Decimal(item.price),
      previousPrice: item.previousPrice ? new Decimal(item.previousPrice) : null,
      discountPct,
      isOffer,
      validFrom,
      validTo,
      source: ctx.source,
      sourceUrl: item.sourceUrl,
      storeProductUrl: item.storeProductUrl ?? null,
      capturedAt: ctx.capturedAt,
      promoType: promoParsed.promoType,
      promoBuyQty: promoParsed.promoBuyQty ?? null,
      promoPayQty: promoParsed.promoPayQty ?? null,
      promoSecondDiscountPct: promoParsed.promoSecondDiscountPct ?? null,
      promoDescription: promoParsed.promoDescription || null,
      pricePerUnit: pricePerUnit ? new Decimal(pricePerUnit) : null,
      pricePerUnitEff: pricePerUnitEff ? new Decimal(pricePerUnitEff) : null,
    },
  });
}

export async function appendPriceHistory(ctx: IngestContext, product: Product, price: number): Promise<void> {
  await ctx.db.priceHistory.create({
    data: {
      productId: product.id,
      storeId: ctx.storeId,
      price: new Decimal(price),
      capturedAt: ctx.capturedAt,
    },
  });
}
