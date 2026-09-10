import { describe, expect, it } from "vitest";
import { computeEffectivePrice } from "@/lib/promo";

describe("computeEffectivePrice", () => {
  it("unit → sin cambio", () => {
    expect(computeEffectivePrice({ price: 890, promoType: "unit" })).toBe(890);
  });
  it("2x1 → mitad", () => {
    expect(computeEffectivePrice({ price: 1000, promoType: "nx1", promoBuyQty: 2 })).toBe(500);
  });
  it("3x2 → 667 aprox", () => {
    expect(
      computeEffectivePrice({ price: 1000, promoType: "nxm", promoBuyQty: 3, promoPayQty: 2 }),
    ).toBeCloseTo(666.6667, 3);
  });
  it("segundo al 70% → 65% del listado", () => {
    // El segundo cuesta 30% del precio → promedio: (1 + 0.3) / 2 = 0.65
    expect(
      computeEffectivePrice({ price: 1000, promoType: "second_off", promoSecondDiscountPct: 70 }),
    ).toBe(650);
  });
  it("bundle -20% → 80% del precio", () => {
    expect(
      computeEffectivePrice({ price: 1000, promoType: "bundle_discount", promoSecondDiscountPct: 20 }),
    ).toBe(800);
  });
});
