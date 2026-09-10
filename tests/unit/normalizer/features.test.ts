import { describe, expect, it } from "vitest";
import { detectPackagingConflictText, jaro, jaroWinkler } from "@/normalizer/features";

describe("jaro", () => {
  it("idénticos → 1", () => {
    expect(jaro("coca cola", "coca cola")).toBe(1);
  });
  it("totalmente distintos → cerca de 0", () => {
    expect(jaro("abc", "xyz")).toBeLessThan(0.4);
  });
});

describe("jaroWinkler", () => {
  it("nombres muy similares → alto", () => {
    const s = jaroWinkler(
      "2.25l coca cola original retornable",
      "2.25l coca cola original ret",
    );
    expect(s).toBeGreaterThan(0.9);
  });
  it("nombres iguales → 1", () => {
    expect(jaroWinkler("aceite natura girasol", "aceite natura girasol")).toBe(1);
  });
});

describe("detectPackagingConflictText (C-004)", () => {
  it("retornable vs descartable → conflict", () => {
    expect(
      detectPackagingConflictText("Coca-Cola 2.25L Retornable", "Coca-Cola 2.25L Descartable"),
    ).toBe(true);
  });
  it("descremada vs entera → conflict", () => {
    expect(
      detectPackagingConflictText("Leche La Serenísima Descremada 1L", "Leche La Serenísima Entera 1L"),
    ).toBe(true);
  });
  it("zero vs regular → conflict", () => {
    expect(detectPackagingConflictText("Coca-Cola Zero 2.25L", "Coca-Cola Clasica 2.25L")).toBe(true);
  });
  it("mismos → no conflict", () => {
    expect(detectPackagingConflictText("Coca 2.25L retornable", "Coca 2.25L retornable")).toBe(false);
  });
  it("sin flag → no conflict", () => {
    expect(detectPackagingConflictText("Aceite Girasol 900ml", "Aceite Girasol 900ml Natura")).toBe(false);
  });
});
