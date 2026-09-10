import { describe, expect, it } from "vitest";
import Decimal from "decimal.js";
import type { Product } from "@prisma/client";
import { AUTO_MERGE_THRESHOLD, MANUAL_QUEUE_THRESHOLD, scoreMatch } from "@/normalizer/matcher";

function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: "id",
    name: "Producto",
    normalizedName: "producto",
    brand: null,
    size: null,
    unit: null,
    standardSize: null,
    standardUnit: null,
    packagingFlag: null,
    category: null,
    imageUrl: null,
    imageSourceUrl: null,
    imageStatus: null,
    imageCapturedAt: null,
    eanCode: null,
    slug: "producto",
    canonicalId: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  } as Product;
}

describe("scoreMatch", () => {
  it("mismos nombre/marca/size → auto (>=0.9)", () => {
    const a = makeProduct({
      id: "a",
      name: "Coca-Cola Original 2.25L",
      normalizedName: "2.25l coca cola original",
      brand: "Coca-Cola",
      standardSize: new Decimal(2.25) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    const b = makeProduct({
      id: "b",
      name: "Coca-Cola 2.25 L",
      normalizedName: "2.25l coca cola original",
      brand: "Coca-Cola",
      standardSize: new Decimal(2.25) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    const r = scoreMatch(a, b);
    expect(r.bucket).toBe("auto");
    expect(r.confidence).toBeGreaterThanOrEqual(AUTO_MERGE_THRESHOLD);
  });

  it("distinta size → ignore", () => {
    const a = makeProduct({
      id: "a",
      normalizedName: "coca cola 2.25l",
      standardSize: new Decimal(2.25) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    const b = makeProduct({
      id: "b",
      normalizedName: "coca cola 1.5l",
      standardSize: new Decimal(1.5) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    expect(scoreMatch(a, b).bucket).toBe("ignore");
  });

  it("packaging_conflict (retornable/descartable) → confidence 0", () => {
    const a = makeProduct({
      id: "a",
      name: "Coca 2.25L Retornable",
      normalizedName: "2.25l coca retornable",
      packagingFlag: "retornable",
      standardSize: new Decimal(2.25) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    const b = makeProduct({
      id: "b",
      name: "Coca 2.25L Descartable",
      normalizedName: "2.25l coca descartable",
      packagingFlag: "descartable",
      standardSize: new Decimal(2.25) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    const r = scoreMatch(a, b);
    expect(r.confidence).toBe(0);
    expect(r.bucket).toBe("ignore");
    expect(r.features.packagingConflict).toBe(true);
  });

  it("nombres parecidos pero brand distinta → manual (0.6-0.89)", () => {
    const a = makeProduct({
      id: "a",
      name: "Cerveza Lager 1L",
      normalizedName: "1l cerveza lager",
      brand: "Quilmes",
      standardSize: new Decimal(1) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    const b = makeProduct({
      id: "b",
      name: "Cerveza Lager 1L Heineken",
      normalizedName: "1l cerveza heineken lager",
      brand: "Heineken",
      standardSize: new Decimal(1) as unknown as Product["standardSize"],
      standardUnit: "L",
    });
    const r = scoreMatch(a, b);
    expect(r.confidence).toBeGreaterThanOrEqual(MANUAL_QUEUE_THRESHOLD);
    expect(r.confidence).toBeLessThan(AUTO_MERGE_THRESHOLD);
    expect(r.bucket).toBe("manual");
  });
});
