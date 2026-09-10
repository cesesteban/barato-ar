import { describe, expect, it } from "vitest";
import { distanceKmFromObelisco, isInGBA } from "@/ingestion/pcl/geo";

describe("PCL geo · isInGBA (F004)", () => {
  it("Palermo (CABA) → true", () => {
    expect(isInGBA(-34.5875, -58.4300)).toBe(true);
  });
  it("Morón (GBA oeste) → true", () => {
    expect(isInGBA(-34.6533, -58.6193)).toBe(true);
  });
  it("La Plata (~ 50 km) → true (borde)", () => {
    // La Plata: -34.9214, -57.9544 — a ~55 km del Obelisco (borde/afuera)
    expect(isInGBA(-34.9214, -57.9544)).toBe(false);
  });
  it("Ushuaia → false", () => {
    expect(isInGBA(-54.8019, -68.3030)).toBe(false);
  });
  it("lat/lng null → false", () => {
    expect(isInGBA(null, null)).toBe(false);
    expect(isInGBA(-34.6, null)).toBe(false);
  });
});

describe("distanceKmFromObelisco", () => {
  it("Palermo ~4 km", () => {
    const d = distanceKmFromObelisco(-34.5875, -58.4300);
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(7);
  });
});
