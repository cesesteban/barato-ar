import { describe, expect, it } from "vitest";
import { detectPackagingFlag, normalizeName, slugify } from "@/ingestion/core/normalize";

describe("normalizeName", () => {
  it("lowercase + sin acentos + tokens ordenados", () => {
    expect(normalizeName("Coca-Cola Original 2.25L Retornable")).toBe(
      "2.25l coca cola original retornable",
    );
  });

  it("dos nombres equivalentes con distinto orden colapsan", () => {
    const a = normalizeName("Coca-Cola Original 2.25L");
    const b = normalizeName("2.25L Coca Cola Original");
    expect(a).toBe(b);
  });
});

describe("detectPackagingFlag (C-004)", () => {
  it("retornable", () => {
    expect(detectPackagingFlag("Coca-Cola 2.25L Retornable")).toBe("retornable");
  });
  it("descartable", () => {
    expect(detectPackagingFlag("Coca-Cola 2.25L Descartable")).toBe("descartable");
  });
  it("zero", () => {
    expect(detectPackagingFlag("Coca-Cola Zero 2.25L")).toBe("zero");
  });
  it("sin match → null", () => {
    expect(detectPackagingFlag("Aceite Girasol 900ml")).toBeNull();
  });
});

describe("slugify", () => {
  it("kebab-case sin acentos", () => {
    expect(slugify("Coca-Cola Original 2.25L Retornable")).toBe(
      "coca-cola-original-2-25l-retornable",
    );
  });
  it("trunca a 100 chars", () => {
    const long = "x".repeat(150);
    expect(slugify(long).length).toBeLessThanOrEqual(100);
  });
});
