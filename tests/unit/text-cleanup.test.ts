import { describe, expect, it } from "vitest";
import { cleanBrand, cleanProductName } from "@/lib/text-cleanup";

describe("cleanProductName", () => {
  it("expande abreviaturas SEPA típicas y aplica title case", () => {
    const input = "CHUPETINES SAB.FRUT.Y VAINILLA PAL.DE LA SELVA PAQ 432 GRM";
    const out = cleanProductName(input);
    expect(out).toContain("Chupetines");
    expect(out).toContain("Sabor");
    expect(out).toContain("Vainilla");
    expect(out).toContain("Palo de la Selva");
    expect(out).toContain("Paquete");
    expect(out).toContain("432 g");
    expect(out).not.toMatch(/SAB\.|FRUT\.|PAL\.DE|GRM/);
  });

  it("preserva unidades ya normalizadas", () => {
    expect(cleanProductName("Coca-Cola 2.25L Retornable")).toContain("2.25L");
  });

  it("respeta TACC en mayúsculas", () => {
    expect(cleanProductName("HARINA DE ARROZ SIN TACC 500 GRM")).toContain("sin TACC");
  });

  it("idempotente sobre nombres ya limpios", () => {
    const clean = "Coca-Cola Original 2.25L Retornable";
    expect(cleanProductName(clean)).toBe(cleanProductName(cleanProductName(clean)));
  });

  it("colapsa espacios múltiples", () => {
    expect(cleanProductName("CHUPETINES   VAINILLA")).toBe("Chupetines Vainilla");
  });
});

describe("cleanBrand", () => {
  it("descarta SIN MARCA / GENERICO / N/D", () => {
    expect(cleanBrand("SIN MARCA")).toBeNull();
    expect(cleanBrand("Generico")).toBeNull();
    expect(cleanBrand("N/D")).toBeNull();
    expect(cleanBrand("SM")).toBeNull();
    expect(cleanBrand("-")).toBeNull();
  });

  it("rechaza brand con abreviaturas del nombre (contiene puntos)", () => {
    expect(cleanBrand("PAL. DE LA SELVA")).toBeNull();
    expect(cleanBrand("SAB.FRUT")).toBeNull();
  });

  it("rechaza brand con demasiadas palabras", () => {
    expect(cleanBrand("uno dos tres cuatro cinco")).toBeNull();
  });

  it("acepta marcas válidas con title case", () => {
    expect(cleanBrand("COCA-COLA")).toBe("Coca-cola");
    expect(cleanBrand("la serenísima")).toBe("La Serenísima");
    expect(cleanBrand("QUILMES")).toBe("Quilmes");
  });

  it("retorna null para null/undefined/string vacío", () => {
    expect(cleanBrand(null)).toBeNull();
    expect(cleanBrand(undefined)).toBeNull();
    expect(cleanBrand("")).toBeNull();
    expect(cleanBrand("   ")).toBeNull();
  });
});
