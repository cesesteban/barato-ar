import { describe, expect, it } from "vitest";
import { resolveZoneId } from "@/ingestion/pcl/zones";

describe("PCL zones · resolveZoneId (F004+F016)", () => {
  it("CABA + Palermo → caba-palermo", () => {
    expect(resolveZoneId({ provincia: "CABA", ciudad: "Palermo", localidad: "Palermo" })).toBe(
      "caba-palermo",
    );
  });

  it("Ciudad Autónoma sin match localidad → caba", () => {
    expect(
      resolveZoneId({ provincia: "Ciudad Autónoma de Buenos Aires", ciudad: "?", localidad: "??" }),
    ).toBe("caba");
  });

  it("PBA + Morón → pba-moron (localidad fine-grained)", () => {
    expect(resolveZoneId({ provincia: "Buenos Aires", ciudad: "Morón", localidad: "Morón" })).toBe(
      "pba-moron",
    );
  });

  it("PBA + Avellaneda → pba-avellaneda (localidad fine-grained)", () => {
    expect(
      resolveZoneId({ provincia: "Buenos Aires", ciudad: "Avellaneda", localidad: "Avellaneda" }),
    ).toBe("pba-avellaneda");
  });

  it("PBA + San Isidro → pba-san-isidro (localidad fine-grained)", () => {
    expect(
      resolveZoneId({ provincia: "Buenos Aires", ciudad: "San Isidro", localidad: "San Isidro" }),
    ).toBe("pba-san-isidro");
  });

  it("PBA + Quilmes → pba-quilmes", () => {
    expect(resolveZoneId({ provincia: "Buenos Aires", ciudad: "Quilmes", localidad: "Quilmes" })).toBe(
      "pba-quilmes",
    );
  });

  it("PBA + provincia AR-B (SEPA CSV) + Tigre → pba-tigre", () => {
    expect(resolveZoneId({ provincia: "AR-B", ciudad: "Tigre", localidad: "Tigre" })).toBe(
      "pba-tigre",
    );
  });

  it("PBA + municipio desconocido de zona norte → fallback pba-gba-norte via keyword", () => {
    expect(
      resolveZoneId({ provincia: "Buenos Aires", ciudad: "Escobar", localidad: "Escobar" }),
    ).toBe("pba-gba-norte");
  });

  it("PBA + municipio totalmente desconocido → fallback pba (paraguas)", () => {
    expect(resolveZoneId({ provincia: "Buenos Aires", ciudad: "Chascomús", localidad: "Chascomús" })).toBe(
      "pba",
    );
  });

  it("Otra provincia → null", () => {
    expect(resolveZoneId({ provincia: "Córdoba", ciudad: "Córdoba" })).toBeNull();
  });

  it("Acentos y case-insensitive", () => {
    expect(resolveZoneId({ provincia: "buenos aires", ciudad: "MORON", localidad: "moron" })).toBe(
      "pba-moron",
    );
  });
});
