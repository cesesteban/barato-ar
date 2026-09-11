#!/usr/bin/env node
/**
 * Seed demo — pobla productos + precios de fixture para probar F007/F008
 * localmente sin correr una ingesta real.
 * `pnpm db:seed:demo`
 */

import { PrismaClient } from "@prisma/client";
import Decimal from "decimal.js";

const prisma = new PrismaClient();

type PriceRow = {
  chainSlug: string;
  price: number;
  previousPrice?: number;
  promoDescription?: string;
  promoType?: "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount";
  promoBuyQty?: number;
  promoPayQty?: number;
  promoSecondDiscountPct?: number;
};

type ProductRow = {
  name: string;
  slug: string;
  brand: string;
  size: number;
  unit: string;
  standardSize: number;
  standardUnit: "L" | "kg" | "un";
  eanCode: string;
  packagingFlag?: string;
  imageUrl?: string;
  prices: PriceRow[];
};

const DEMO: ProductRow[] = [
  {
    name: "Coca-Cola Original 2.25L Retornable",
    slug: "coca-cola-original-2-25l-retornable",
    brand: "Coca-Cola",
    size: 2.25,
    unit: "L",
    standardSize: 2.25,
    standardUnit: "L",
    eanCode: "7790895000119",
    packagingFlag: "retornable",
    prices: [
      { chainSlug: "carrefour", price: 890, previousPrice: 1290 },
      { chainSlug: "coto", price: 1050, previousPrice: 1290 },
      { chainSlug: "dia", price: 980, previousPrice: 1290 },
      { chainSlug: "jumbo", price: 1190 },
      { chainSlug: "vea", price: 1150 },
    ],
  },
  {
    name: "Aceite Girasol Natura 900ml",
    slug: "aceite-natura-girasol-900ml",
    brand: "Natura",
    size: 900,
    unit: "ml",
    standardSize: 0.9,
    standardUnit: "L",
    eanCode: "7791234567890",
    prices: [
      { chainSlug: "carrefour", price: 2450, previousPrice: 3200, promoDescription: "3 iguales 20%", promoType: "bundle_discount", promoBuyQty: 3, promoSecondDiscountPct: 20 },
      { chainSlug: "coto", price: 2700 },
      { chainSlug: "dia", price: 2550 },
    ],
  },
  {
    name: "Yerba Mate Rosamonte 1kg",
    slug: "yerba-rosamonte-1kg",
    brand: "Rosamonte",
    size: 1,
    unit: "kg",
    standardSize: 1,
    standardUnit: "kg",
    eanCode: "7797777777777",
    prices: [
      { chainSlug: "carrefour", price: 3890, previousPrice: 4800 },
      { chainSlug: "coto", price: 4200 },
      { chainSlug: "dia", price: 3990 },
    ],
  },
  {
    name: "Cerveza Quilmes Cristal 1L Retornable",
    slug: "cerveza-quilmes-1l-retornable",
    brand: "Quilmes",
    size: 1,
    unit: "L",
    standardSize: 1,
    standardUnit: "L",
    eanCode: "7791111111111",
    packagingFlag: "retornable",
    prices: [
      { chainSlug: "carrefour", price: 1590, previousPrice: 1990, promoDescription: "2x1", promoType: "nx1", promoBuyQty: 2 },
      { chainSlug: "coto", price: 1690 },
    ],
  },
];

async function main() {
  const now = new Date();
  const validFrom = new Date(now.getTime() - 24 * 3600 * 1000);
  const validTo = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

  for (const p of DEMO) {
    const product = await prisma.product.upsert({
      where: { eanCode: p.eanCode },
      update: {
        name: p.name,
        slug: p.slug,
        brand: p.brand,
        size: p.size,
        unit: p.unit,
        standardSize: new Decimal(p.standardSize),
        standardUnit: p.standardUnit,
        packagingFlag: p.packagingFlag ?? null,
        imageUrl: p.imageUrl ?? null,
      },
      create: {
        name: p.name,
        normalizedName: p.name
          .toLowerCase()
          .normalize("NFD")
          .replace(/[̀-ͯ]/g, "")
          .replace(/[^a-z0-9\s]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .split(" ")
          .sort()
          .join(" "),
        slug: p.slug,
        brand: p.brand,
        size: p.size,
        unit: p.unit,
        standardSize: new Decimal(p.standardSize),
        standardUnit: p.standardUnit,
        packagingFlag: p.packagingFlag ?? null,
        eanCode: p.eanCode,
        imageUrl: p.imageUrl ?? null,
      },
    });

    for (const pr of p.prices) {
      const store = await prisma.store.findFirst({
        where: { chainId: pr.chainSlug, isVirtual: true },
      });
      if (!store) continue;

      const discountPct =
        pr.previousPrice && pr.previousPrice > 0
          ? ((pr.previousPrice - pr.price) / pr.previousPrice) * 100
          : null;

      await prisma.price.upsert({
        where: {
          unique_capture: {
            productId: product.id,
            storeId: store.id,
            source: "flyer",
            validFrom,
          },
        },
        update: {
          price: new Decimal(pr.price),
          previousPrice: pr.previousPrice ? new Decimal(pr.previousPrice) : null,
          discountPct,
          validTo,
          isOffer: discountPct != null && discountPct > 0,
          promoType: pr.promoType ?? "unit",
          promoBuyQty: pr.promoBuyQty ?? null,
          promoPayQty: pr.promoPayQty ?? null,
          promoSecondDiscountPct: pr.promoSecondDiscountPct ?? null,
          promoDescription: pr.promoDescription ?? null,
          pricePerUnit: new Decimal(pr.price / p.standardSize),
          pricePerUnitEff: new Decimal(pr.price / p.standardSize),
        },
        create: {
          productId: product.id,
          storeId: store.id,
          price: new Decimal(pr.price),
          previousPrice: pr.previousPrice ? new Decimal(pr.previousPrice) : null,
          discountPct,
          isOffer: discountPct != null && discountPct > 0,
          validFrom,
          validTo,
          source: "flyer",
          sourceUrl: `https://demo/${p.slug}`,
          promoType: pr.promoType ?? "unit",
          promoBuyQty: pr.promoBuyQty ?? null,
          promoPayQty: pr.promoPayQty ?? null,
          promoSecondDiscountPct: pr.promoSecondDiscountPct ?? null,
          promoDescription: pr.promoDescription ?? null,
          pricePerUnit: new Decimal(pr.price / p.standardSize),
          pricePerUnitEff: new Decimal(pr.price / p.standardSize),
        },
      });
    }
    console.info(`✓ ${p.name} · ${p.prices.length} precios`);
  }
  console.info("✅ Seed demo completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
