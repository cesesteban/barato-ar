import { describe, expect, it } from "vitest";
import { formatPromoLabel } from "@/components/domain/promo-badge";

describe("formatPromoLabel", () => {
  it("unit no renderiza label", () => {
    expect(formatPromoLabel({ type: "unit" })).toBeNull();
  });
  it("nx1 con qty", () => {
    expect(formatPromoLabel({ type: "nx1", buyQty: 2 })).toBe("2x1");
  });
  it("nxm con buy y pay", () => {
    expect(formatPromoLabel({ type: "nxm", buyQty: 3, payQty: 2 })).toBe("3x2");
  });
  it("second_off con pct", () => {
    expect(formatPromoLabel({ type: "second_off", secondDiscountPct: 70 })).toBe("2do -70%");
  });
  it("bundle_discount con qty y pct", () => {
    expect(formatPromoLabel({ type: "bundle_discount", buyQty: 3, secondDiscountPct: 20 })).toBe(
      "3 iguales -20%",
    );
  });
  it("bundle_discount sin qty usa 'N'", () => {
    expect(formatPromoLabel({ type: "bundle_discount", secondDiscountPct: 20 })).toBe(
      "N iguales -20%",
    );
  });
});
