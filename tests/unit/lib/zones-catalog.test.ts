import { describe, expect, it } from "vitest";
import {
  ZONES_CATALOG,
  DEFAULT_ZONE_SLUG,
  getZoneBySlug,
  formatZoneLabel,
  nearestZone,
} from "@/lib/zones-catalog";

describe("zones-catalog (F015)", () => {
  it("catálogo tiene 15 zonas y cubre CABA + GBA", () => {
    expect(ZONES_CATALOG).toHaveLength(15);
    const caba = ZONES_CATALOG.filter((z) => z.region === "CABA");
    const gba = ZONES_CATALOG.filter((z) => z.region === "GBA");
    expect(caba.length).toBe(11);
    expect(gba.length).toBe(4);
  });

  it("default zone existe en el catálogo", () => {
    expect(getZoneBySlug(DEFAULT_ZONE_SLUG)).toBeTruthy();
  });

  it("getZoneBySlug devuelve null para slug inexistente", () => {
    expect(getZoneBySlug("nonexistent")).toBeNull();
  });

  it("formatZoneLabel añade sufijo CABA a barrios porteños", () => {
    expect(formatZoneLabel("caba-palermo")).toBe("Palermo, CABA");
  });

  it("formatZoneLabel no añade sufijo a zonas GBA", () => {
    expect(formatZoneLabel("pba-gba-norte")).toBe("GBA Norte");
  });

  it("formatZoneLabel devuelve slug crudo si no está en catálogo", () => {
    expect(formatZoneLabel("xyz")).toBe("xyz");
  });

  it("nearestZone para lat/lng de Palermo devuelve caba-palermo", () => {
    const near = nearestZone(-34.5875, -58.43);
    expect(near.slug).toBe("caba-palermo");
  });

  it("nearestZone para lat/lng de Tigre devuelve pba-gba-norte", () => {
    const near = nearestZone(-34.42, -58.58);
    expect(near.slug).toBe("pba-gba-norte");
  });

  it("nearestZone para lat/lng de Quilmes devuelve pba-gba-sur", () => {
    const near = nearestZone(-34.72, -58.26);
    expect(near.slug).toBe("pba-gba-sur");
  });

  it("nearestZone para lat/lng de Villa Crespo devuelve caba-villa-crespo", () => {
    const near = nearestZone(-34.6006, -58.438);
    expect(near.slug).toBe("caba-villa-crespo");
  });
});
