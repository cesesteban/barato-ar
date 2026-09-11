import { describe, expect, it } from "vitest";
import { HistoryParamsSchema } from "@/server/history/schemas";

describe("HistoryParamsSchema (F010)", () => {
  it("defaults: 90 días, caba-palermo", () => {
    const p = HistoryParamsSchema.parse({ slug: "coca" });
    expect(p.days).toBe(90);
    expect(p.zone).toBe("caba-palermo");
  });
  it("coerce days desde string", () => {
    expect(HistoryParamsSchema.parse({ slug: "x", days: "30" }).days).toBe(30);
  });
  it("days fuera de rango falla", () => {
    expect(() => HistoryParamsSchema.parse({ slug: "x", days: 6 })).toThrow();
    expect(() => HistoryParamsSchema.parse({ slug: "x", days: 500 })).toThrow();
  });
});
