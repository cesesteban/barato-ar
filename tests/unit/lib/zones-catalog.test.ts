import { describe, expect, it } from "vitest";
import {
  ZONES_CATALOG,
  DEFAULT_ZONE_SLUG,
  getZoneBySlug,
  formatZoneLabel,
  groupZonesByRegion,
  nearestZone,
} from "@/lib/zones-catalog";

describe("zones-catalog (F015+F016)", () => {
  it("catálogo cubre CABA + 3 sub-regiones GBA con localidades", () => {
    const groups = groupZonesByRegion();
    expect(groups.map((g) => g.region)).toEqual(["CABA", "GBA Norte", "GBA Oeste", "GBA Sur"]);
    // Cada región tiene al menos 2 entradas (localidades + fallback umbrella)
    for (const g of groups) {
      expect(g.zones.length).toBeGreaterThanOrEqual(2);
      // Última entrada debe ser umbrella
      expect(g.zones[g.zones.length - 1]?.umbrella).toBe(true);
    }
  });

  it("catálogo total: 11 CABA + 6 Norte + 7 Oeste + 8 Sur = 32", () => {
    expect(ZONES_CATALOG).toHaveLength(32);
  });

  it("default zone existe en el catálogo", () => {
    expect(getZoneBySlug(DEFAULT_ZONE_SLUG)).toBeTruthy();
  });

  it("getZoneBySlug devuelve null para slug inexistente", () => {
    expect(getZoneBySlug("nonexistent")).toBeNull();
  });

  it("formatZoneLabel para barrio CABA: 'Palermo, CABA'", () => {
    expect(formatZoneLabel("caba-palermo")).toBe("Palermo, CABA");
  });

  it("formatZoneLabel para localidad GBA: 'San Isidro, GBA Norte'", () => {
    expect(formatZoneLabel("pba-san-isidro")).toBe("San Isidro, GBA Norte");
  });

  it("formatZoneLabel para umbrella: nombre tal cual", () => {
    expect(formatZoneLabel("pba-gba-norte")).toBe("Otras zonas GBA Norte");
    expect(formatZoneLabel("caba")).toBe("Otras zonas CABA");
  });

  it("nearestZone Palermo → caba-palermo", () => {
    expect(nearestZone(-34.5875, -58.43).slug).toBe("caba-palermo");
  });

  it("nearestZone Tigre lat/lng → pba-tigre (localidad específica, no umbrella)", () => {
    expect(nearestZone(-34.4237, -58.5793).slug).toBe("pba-tigre");
  });

  it("nearestZone Quilmes → pba-quilmes", () => {
    expect(nearestZone(-34.7207, -58.2543).slug).toBe("pba-quilmes");
  });

  it("nearestZone Morón → pba-moron", () => {
    expect(nearestZone(-34.6534, -58.6198).slug).toBe("pba-moron");
  });

  it("nearestZone excluye umbrellas — nunca devuelve pba-gba-*", () => {
    const near = nearestZone(-34.5, -58.53); // aprox centroide GBA Norte
    expect(near.umbrella).toBeFalsy();
    expect(near.slug.startsWith("pba-gba-")).toBe(false);
  });
});
