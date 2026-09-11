import { describe, expect, it } from "vitest";
import { OffersParamsSchema } from "@/server/offers/schemas";

describe("OffersParamsSchema (F008)", () => {
  it("defaults completos", () => {
    const p = OffersParamsSchema.parse({});
    expect(p.zone).toBe("caba-palermo");
    expect(p.minDiscount).toBe(0);
    expect(p.validity).toBe("week");
    expect(p.sort).toBe("discount");
    expect(p.limit).toBe(24);
    expect(p.includeNearby).toBe(true);
    expect(p.chains).toEqual([]);
  });

  it("chains como CSV se parsea a array", () => {
    const p = OffersParamsSchema.parse({ chains: "carrefour, coto ,dia" });
    expect(p.chains).toEqual(["carrefour", "coto", "dia"]);
  });

  it("minDiscount fuera de rango falla", () => {
    expect(() => OffersParamsSchema.parse({ minDiscount: 200 })).toThrow();
    expect(() => OffersParamsSchema.parse({ minDiscount: -1 })).toThrow();
  });

  it("sort inválido falla", () => {
    expect(() => OffersParamsSchema.parse({ sort: "cheap" })).toThrow();
  });

  it("includeNearby coerce boolean desde string", () => {
    const p = OffersParamsSchema.parse({ includeNearby: "false" });
    expect(p.includeNearby).toBe(false);
  });
});
