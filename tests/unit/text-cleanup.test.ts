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

  // ===== F020 · Nuevos casos =====

  it("F020: strip códigos SEPA del name (BOT-N-ml, PCK-N-un, LAT-N-cc)", () => {
    expect(cleanProductName("Cerveza Iguana 1 L BOT-1000-ml.")).not.toContain("BOT-1000");
    expect(cleanProductName("Sixpack Heineken PCK-6-un.")).not.toContain("PCK-6");
    expect(cleanProductName("Cerveza Stella LAT-473-cc.")).not.toContain("LAT-473");
  });

  it("F020: strip 'Carrefour ' al inicio del name", () => {
    const out = cleanProductName("CARREFOUR CRISTAL FOCACCIA C SALSA D TOMATE X 250 G");
    expect(out).toContain("Cristal Focaccia");
    expect(out).toContain("con Salsa");
    expect(out).toContain("de Tomate");
    expect(out).toContain("x 250 g");
    expect(out).not.toContain("Carrefour");
  });

  it("F020: strip 'Coto ', 'Dia ', 'Jumbo ' al inicio", () => {
    expect(cleanProductName("Coto Yogur Griego")).toBe("Yogur Griego");
    expect(cleanProductName("Dia Trapo de Piso")).toBe("Trapo de Piso");
    expect(cleanProductName("Jumbo Papel Higienico")).toBe("Papel Higienico");
  });

  it("F020: expande Cerv/Ret/Extr", () => {
    expect(cleanProductName("Cerv Extra Stout")).toBe("Cerveza Extra Stout");
    expect(cleanProductName("Cerveza 1 L Ret")).toContain("Retornable");
    expect(cleanProductName("Alfajor Extr Chocolate")).toContain("Extra");
  });

  it("F020: expande Choc/Gaseo/Alfa/Muzzare", () => {
    expect(cleanProductName("Alfa Choc Milka")).toContain("Alfajor");
    expect(cleanProductName("Alfa Choc Milka")).toContain("Chocolate");
    expect(cleanProductName("Gaseo Cola Light")).toBe("Gaseosa Cola Light");
    expect(cleanProductName("Queso Muzzare Rectan")).toContain("Muzzarella");
    expect(cleanProductName("Queso Muzzare Rectan")).toContain("Rectangular");
  });

  it("F020: expande C/D/X sueltos como conectores", () => {
    const out = cleanProductName("Alfajor C Mousse D Frutilla X 6 un");
    expect(out).toContain("con Mousse");
    expect(out).toContain("de Frutilla");
    expect(out).toContain("x 6 un");
    expect(out).not.toMatch(/\s[CDX]\s/);
  });

  it("F020: no rompe 1L, 250g pegados (no matchea C/D/X dentro)", () => {
    expect(cleanProductName("Aceite 1L")).toContain("1L");
    expect(cleanProductName("Harina 500g")).toContain("500g");
  });

  it("F020: dedup palabras consecutivas repetidas", () => {
    expect(cleanProductName("Cerveza Cerveza Extra")).toBe("Cerveza Extra");
    expect(cleanProductName("Yogur Yogur natural")).toBe("Yogur Natural");
  });

  it("F020: idempotencia con nuevas features", () => {
    const cases = [
      "Cerveza Iguana Pilsener 1 L Ret BOT-1000-ml.",
      "CARREFOUR CRISTAL FOCACCIA C SALSA D TOMATE X 250 G",
      "Cerv Cerveza Cerveza Extra",
    ];
    for (const c of cases) {
      expect(cleanProductName(cleanProductName(c))).toBe(cleanProductName(c));
    }
  });

  it("F020: skipChainStrip preserva chain", () => {
    expect(cleanProductName("Carrefour Focaccia", { skipChainStrip: true })).toBe("Carrefour Focaccia");
  });

  it("F020: normaliza LT, GRS, LITROS, KILOS, MLTS", () => {
    expect(cleanProductName("Aceite 1 LT")).toContain("1 L");
    expect(cleanProductName("Harina 500 GRS")).toContain("500 g");
    expect(cleanProductName("Agua 2 LITROS")).toContain("2 L");
    expect(cleanProductName("Kilo 2 KILOS")).toContain("2 kg");
    expect(cleanProductName("Bebida 500 MLT")).toContain("500 ml");
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
    // Coca-Cola ahora resuelve via catalog canonical
    expect(cleanBrand("COCA-COLA")).toBe("Coca-Cola");
    // La Serenísima via catalog
    expect(cleanBrand("la serenísima")).toBe("La Serenísima");
    expect(cleanBrand("QUILMES")).toBe("Quilmes");
  });

  it("retorna null para null/undefined/string vacío", () => {
    expect(cleanBrand(null)).toBeNull();
    expect(cleanBrand(undefined)).toBeNull();
    expect(cleanBrand("")).toBeNull();
    expect(cleanBrand("   ")).toBeNull();
  });

  // ===== F020 · Brand catalog =====

  it("F020: canonicaliza Guinn → Guinness via catalog", () => {
    expect(cleanBrand("Guinn")).toBe("Guinness");
  });

  it("F020: canonicaliza Coca → Coca-Cola", () => {
    expect(cleanBrand("Coca")).toBe("Coca-Cola");
  });

  it("F020: canonicaliza Stell → Stella Artois", () => {
    expect(cleanBrand("Stell")).toBe("Stella Artois");
  });

  it("F020: canonicaliza Serene, Ledesm, Sancr", () => {
    expect(cleanBrand("Serene")).toBe("La Serenísima");
    expect(cleanBrand("Ledesm")).toBe("Ledesma");
    expect(cleanBrand("Sancr")).toBe("Sancor");
  });

  it("F020: con hint extrae desde name si brand raw es null", () => {
    expect(cleanBrand(null, { productName: "Cerveza Guinness Extra Stout" })).toBe("Guinness");
    expect(cleanBrand(undefined, { productName: "Cerveza Stella Artois 473 ml" })).toBe(
      "Stella Artois",
    );
  });

  it("F020: con hint pero name sin brand conocida → null", () => {
    expect(cleanBrand(null, { productName: "Yogur natural genérico" })).toBeNull();
  });

  it("F020: raw null y sin hint → null (safety)", () => {
    expect(cleanBrand(null)).toBeNull();
  });
});
