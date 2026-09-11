import { describe, expect, it } from "vitest";
import { CreateAlertSchema } from "@/server/alerts/schemas";

describe("CreateAlertSchema (F009)", () => {
  it("acepta payload válido con defaults", () => {
    const p = CreateAlertSchema.parse({
      email: "user@example.com",
      productSlug: "coca-cola-original-2-25l-retornable",
      targetPrice: 800,
    });
    expect(p.zoneSlug).toBe("caba-palermo");
    expect(p.targetPrice).toBe(800);
  });

  it("email inválido falla", () => {
    expect(() =>
      CreateAlertSchema.parse({ email: "notemail", productSlug: "x", targetPrice: 100 }),
    ).toThrow();
  });

  it("targetPrice ≤ 0 falla", () => {
    expect(() =>
      CreateAlertSchema.parse({ email: "u@e.com", productSlug: "x", targetPrice: 0 }),
    ).toThrow();
    expect(() =>
      CreateAlertSchema.parse({ email: "u@e.com", productSlug: "x", targetPrice: -1 }),
    ).toThrow();
  });

  it("coerce string a number para targetPrice", () => {
    const p = CreateAlertSchema.parse({
      email: "u@e.com",
      productSlug: "x",
      targetPrice: "800.50",
    });
    expect(p.targetPrice).toBe(800.5);
  });

  it("targetPrice > 9_999_999 falla", () => {
    expect(() =>
      CreateAlertSchema.parse({ email: "u@e.com", productSlug: "x", targetPrice: 10_000_000 }),
    ).toThrow();
  });
});
