import { describe, expect, it } from "vitest";
import { parsePromoFromText } from "@/ingestion/core/parse-promo";

describe("parsePromoFromText", () => {
  it("texto vacío → unit", () => {
    expect(parsePromoFromText("")).toEqual({ promoType: "unit", promoDescription: "" });
  });

  it("'2x1'", () => {
    const r = parsePromoFromText("Llevando 2x1");
    expect(r.promoType).toBe("nx1");
    expect(r.promoBuyQty).toBe(2);
  });

  it("'3x2'", () => {
    const r = parsePromoFromText("3x2 en toda la línea");
    expect(r.promoType).toBe("nxm");
    expect(r.promoBuyQty).toBe(3);
    expect(r.promoPayQty).toBe(2);
  });

  it("'Lleva 3 Paga 2'", () => {
    const r = parsePromoFromText("Lleva 3 Paga 2");
    expect(r.promoType).toBe("nxm");
    expect(r.promoBuyQty).toBe(3);
    expect(r.promoPayQty).toBe(2);
  });

  it("'Lleva 2 Paga 1' → nx1", () => {
    const r = parsePromoFromText("Lleva 2 paga 1");
    expect(r.promoType).toBe("nx1");
    expect(r.promoBuyQty).toBe(2);
  });

  it("'2do al 70%'", () => {
    const r = parsePromoFromText("2do al 70%");
    expect(r.promoType).toBe("second_off");
    expect(r.promoSecondDiscountPct).toBe(70);
  });

  it("'Segundo al 50%'", () => {
    const r = parsePromoFromText("Segundo al 50%");
    expect(r.promoType).toBe("second_off");
    expect(r.promoSecondDiscountPct).toBe(50);
  });

  it("'3 iguales 20%'", () => {
    const r = parsePromoFromText("Llevando 3 iguales 20% off");
    expect(r.promoType).toBe("bundle_discount");
    expect(r.promoBuyQty).toBe(3);
    expect(r.promoSecondDiscountPct).toBe(20);
  });
});
