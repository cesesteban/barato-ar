import { describe, expect, it } from "vitest";
import { resolveZoneId } from "@/ingestion/pcl/zones";

describe("PCL zones · resolveZoneId (F004)", () => {
  it("CABA + Palermo → caba-palermo", () => {
    expect(resolveZoneId({ provincia: "CABA", ciudad: "Palermo", localidad: "Palermo" })).toBe(
      "caba-palermo",
    );
  });
  it("Ciudad Autónoma sin match localidad → caba", () => {
    expect(resolveZoneId({ provincia: "Ciudad Autónoma de Buenos Aires", ciudad: "?", localidad: "??" })).toBe(
      "caba",
    );
  });
  it("PBA + Morón → pba-gba-oeste", () => {
    expect(resolveZoneId({ provincia: "Buenos Aires", ciudad: "Morón", localidad: "Morón" })).toBe(
      "pba-gba-oeste",
    );
  });
  it("PBA + Avellaneda → pba-gba-sur", () => {
    expect(resolveZoneId({ provincia: "Buenos Aires", ciudad: "Avellaneda", localidad: "Avellaneda" })).toBe(
      "pba-gba-sur",
    );
  });
  it("PBA + San Isidro → pba-gba-norte", () => {
    expect(resolveZoneId({ provincia: "Buenos Aires", ciudad: "San Isidro", localidad: "San Isidro" })).toBe(
      "pba-gba-norte",
    );
  });
  it("Otra provincia → null", () => {
    expect(resolveZoneId({ provincia: "Córdoba", ciudad: "Córdoba" })).toBeNull();
  });
  it("Acentos y case-insensitive", () => {
    expect(resolveZoneId({ provincia: "buenos aires", ciudad: "MORON", localidad: "moron" })).toBe(
      "pba-gba-oeste",
    );
  });
});
