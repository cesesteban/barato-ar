import { describe, expect, it } from "vitest";
import { formatDiscountPct, formatPrice, formatPricePerUnit } from "@/lib/format-price";

describe("formatPrice", () => {
  it("formatea con separador de miles es-AR", () => {
    expect(formatPrice(1234)).toMatch(/1\.234/);
  });
  it("con centavos", () => {
    expect(formatPrice(1234.5, { withCents: true })).toMatch(/1\.234,50/);
  });
  it("precio 0 devuelve 'Consultar' (C-007)", () => {
    expect(formatPrice(0)).toBe("Consultar");
  });
  it("NaN o infinity devuelve dash", () => {
    expect(formatPrice(NaN)).toBe("—");
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe("—");
  });
});

describe("formatPricePerUnit", () => {
  it("muestra precio por unidad con separador", () => {
    expect(formatPricePerUnit(1245, "L")).toMatch(/1\.245.*\/ L/);
  });
  it("valores inválidos devuelve string vacío", () => {
    expect(formatPricePerUnit(0, "L")).toBe("");
    expect(formatPricePerUnit(-1, "L")).toBe("");
  });
});

describe("formatDiscountPct", () => {
  it("descuento positivo → '-31%'", () => {
    expect(formatDiscountPct(31)).toBe("-31%");
  });
  it("descuento negativo → '8%' (sin signo)", () => {
    expect(formatDiscountPct(-8)).toBe("8%");
  });
  it("redondea", () => {
    expect(formatDiscountPct(30.6)).toBe("-31%");
  });
});
