import { describe, expect, it } from "vitest";
import { AutocompleteParamsSchema, SearchParamsSchema } from "@/server/search/schemas";

describe("SearchParamsSchema (F006)", () => {
  it("acepta q válido con defaults", () => {
    const r = SearchParamsSchema.parse({ q: "coca cola" });
    expect(r.q).toBe("coca cola");
    expect(r.limit).toBe(20);
  });
  it("trim + min 2", () => {
    expect(() => SearchParamsSchema.parse({ q: " a " })).toThrow();
  });
  it("max 100 chars", () => {
    expect(() => SearchParamsSchema.parse({ q: "x".repeat(101) })).toThrow();
  });
  it("limit fuera de rango falla", () => {
    expect(() => SearchParamsSchema.parse({ q: "coca", limit: 100 })).toThrow();
    expect(() => SearchParamsSchema.parse({ q: "coca", limit: 0 })).toThrow();
  });
  it("vertical enum", () => {
    expect(() =>
      SearchParamsSchema.parse({ q: "coca", vertical: "invalido" }),
    ).toThrow();
    expect(SearchParamsSchema.parse({ q: "coca", vertical: "supermarket" }).vertical).toBe("supermarket");
  });
});

describe("AutocompleteParamsSchema", () => {
  it("acepta min 1 char", () => {
    expect(AutocompleteParamsSchema.parse({ q: "c" }).q).toBe("c");
  });
  it("rechaza vacío", () => {
    expect(() => AutocompleteParamsSchema.parse({ q: "" })).toThrow();
  });
});
