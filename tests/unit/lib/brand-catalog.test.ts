import { describe, expect, it } from "vitest";
import { resolveBrand, extractBrandFromName, BRAND_CATALOG } from "@/lib/brand-catalog";

describe("brand-catalog (F020)", () => {
  describe("resolveBrand", () => {
    it("match exacto por canonical name", () => {
      expect(resolveBrand("Guinness")).toBe("Guinness");
      expect(resolveBrand("Coca-Cola")).toBe("Coca-Cola");
    });

    it("match por alias truncado", () => {
      expect(resolveBrand("Guinn")).toBe("Guinness");
      expect(resolveBrand("Coca")).toBe("Coca-Cola");
      expect(resolveBrand("Stell")).toBe("Stella Artois");
      expect(resolveBrand("Imper")).toBe("Imperial");
    });

    it("case-insensitive", () => {
      expect(resolveBrand("guinness")).toBe("Guinness");
      expect(resolveBrand("GUINN")).toBe("Guinness");
      expect(resolveBrand("Coca-Cola")).toBe("Coca-Cola");
      expect(resolveBrand("COCA")).toBe("Coca-Cola");
    });

    it("no match → null", () => {
      expect(resolveBrand("XyzMarca")).toBeNull();
      expect(resolveBrand("MarcaInventada")).toBeNull();
    });

    it("null/undefined/empty → null", () => {
      expect(resolveBrand(null)).toBeNull();
      expect(resolveBrand(undefined)).toBeNull();
      expect(resolveBrand("")).toBeNull();
      expect(resolveBrand("   ")).toBeNull();
    });
  });

  describe("extractBrandFromName", () => {
    it("encuentra brand en el medio del name", () => {
      expect(extractBrandFromName("Cerveza Guinness Extra Stout")).toBe("Guinness");
      expect(extractBrandFromName("Yogur La Serenísima Descremado")).toBe("La Serenísima");
    });

    it("encuentra brand al inicio", () => {
      expect(extractBrandFromName("Coca-Cola Original 2.25L")).toBe("Coca-Cola");
    });

    it("prefiere multi-word sobre single-word", () => {
      // "Stella Artois" es multi-word, debe ganar sobre "Stella" solo (aunque no está como alias)
      expect(extractBrandFromName("Cerveza Stella Artois 473 ml")).toBe("Stella Artois");
    });

    it("ignora palabras cortas < 3 chars", () => {
      // "La" tiene 2 chars — no debe matchear "La Serenísima" via primer intento single-word
      // (pero "La Serenísima" como multi-word SÍ debe matchear)
      expect(extractBrandFromName("La Serenísima yogur")).toBe("La Serenísima");
    });

    it("no match si name sin brand conocida → null", () => {
      expect(extractBrandFromName("Producto genérico varios")).toBeNull();
      expect(extractBrandFromName("Yogur natural")).toBeNull();
    });

    it("null/empty → null", () => {
      expect(extractBrandFromName(null)).toBeNull();
      expect(extractBrandFromName("")).toBeNull();
      expect(extractBrandFromName(undefined)).toBeNull();
    });
  });

  describe("BRAND_CATALOG integridad", () => {
    it("tiene >= 50 brands", () => {
      expect(BRAND_CATALOG.length).toBeGreaterThanOrEqual(50);
    });

    it("no tiene duplicados en canonicalName", () => {
      const canonicals = BRAND_CATALOG.map((b) => b.canonicalName);
      const unique = new Set(canonicals);
      expect(unique.size).toBe(canonicals.length);
    });

    it("cada entry tiene canonicalName no vacío", () => {
      for (const b of BRAND_CATALOG) {
        expect(b.canonicalName.trim().length).toBeGreaterThan(0);
      }
    });
  });
});
