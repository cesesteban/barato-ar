import { describe, expect, it } from "vitest";
import { CreateReportSchema } from "@/server/reports/schemas";

describe("CreateReportSchema (F011)", () => {
  it("payload mínimo válido con productText", () => {
    const p = CreateReportSchema.parse({
      productText: "Coca-Cola 2.25L",
      chainSlug: "carrefour",
      price: 890,
    });
    expect(p.chainSlug).toBe("carrefour");
    expect(p.price).toBe(890);
  });

  it("acepta productSlug alternativa", () => {
    const p = CreateReportSchema.parse({
      productSlug: "coca-cola-2-25l",
      chainSlug: "carrefour",
      price: 890,
    });
    expect(p.productSlug).toBe("coca-cola-2-25l");
  });

  it("productText muy corto falla", () => {
    expect(() =>
      CreateReportSchema.parse({ productText: "a", chainSlug: "carrefour", price: 100 }),
    ).toThrow();
  });

  it("price ≤ 0 falla", () => {
    expect(() =>
      CreateReportSchema.parse({ productText: "coca", chainSlug: "carrefour", price: 0 }),
    ).toThrow();
  });

  it("description > 500 falla", () => {
    expect(() =>
      CreateReportSchema.parse({
        productText: "coca",
        chainSlug: "carrefour",
        price: 100,
        description: "x".repeat(501),
      }),
    ).toThrow();
  });
});
