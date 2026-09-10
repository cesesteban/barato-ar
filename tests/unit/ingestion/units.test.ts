import { describe, expect, it } from "vitest";
import { computePricePerUnit, computeStandard } from "@/lib/units";

describe("computeStandard", () => {
  it("ml → L", () => {
    expect(computeStandard(900, "ml")).toEqual({ standardSize: 0.9, standardUnit: "L" });
  });
  it("L → L", () => {
    expect(computeStandard(2.25, "L")).toEqual({ standardSize: 2.25, standardUnit: "L" });
  });
  it("g → kg", () => {
    expect(computeStandard(200, "g")).toEqual({ standardSize: 0.2, standardUnit: "kg" });
  });
  it("kg → kg", () => {
    expect(computeStandard(1, "kg")).toEqual({ standardSize: 1, standardUnit: "kg" });
  });
  it("unidades cuenta", () => {
    expect(computeStandard(4, "un")).toEqual({ standardSize: 4, standardUnit: "un" });
    expect(computeStandard(4, "rollos")).toEqual({ standardSize: 4, standardUnit: "un" });
  });
  it("unit desconocida → null", () => {
    expect(computeStandard(1, "boquis")).toBeNull();
  });
  it("size inválido → null", () => {
    expect(computeStandard(0, "L")).toBeNull();
    expect(computeStandard(-1, "L")).toBeNull();
    expect(computeStandard(null, "L")).toBeNull();
  });
});

describe("computePricePerUnit", () => {
  it("$890 / 2.25L → 395.56/L", () => {
    expect(computePricePerUnit(890, 2.25)).toBeCloseTo(395.5556, 3);
  });
  it("$2450 / 0.9L → 2722.22/L", () => {
    expect(computePricePerUnit(2450, 0.9)).toBeCloseTo(2722.2222, 3);
  });
  it("standardSize inválido → null", () => {
    expect(computePricePerUnit(890, 0)).toBeNull();
    expect(computePricePerUnit(890, null)).toBeNull();
  });
});
