import { afterEach, describe, expect, it } from "vitest";
import {
  DELIVERY_PARTNERS,
  buildDeliveryQuery,
  readAffiliateIds,
} from "@/lib/deep-links";

describe("deep-links (F014)", () => {
  afterEach(() => {
    delete process.env["NEXT_PUBLIC_AFFILIATE_PEDIDOSYA"];
    delete process.env["NEXT_PUBLIC_AFFILIATE_RAPPI"];
    delete process.env["NEXT_PUBLIC_AFFILIATE_MERCADOLIBRE"];
  });

  it("PedidosYa sin afiliado: URL nativa con UTM (no Google site search)", () => {
    const py = DELIVERY_PARTNERS.find((p) => p.slug === "pedidosya");
    const url = py!.buildSearchUrl("Coca-Cola 2.25L", undefined);
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.pedidosya.com.ar");
    expect(parsed.pathname).toBe("/mercados-y-almacenes");
    expect(parsed.searchParams.get("searchTerm")).toBe("Coca-Cola 2.25L");
    // UTM tracking agregado
    expect(parsed.searchParams.get("utm_source")).toBe("barato.ar");
    expect(parsed.searchParams.get("utm_medium")).toBe("deep_link");
    expect(parsed.searchParams.get("utm_campaign")).toBe("comparator");
  });

  it("PedidosYa con afiliado: URL nativa con partnerId + UTM", () => {
    const py = DELIVERY_PARTNERS.find((p) => p.slug === "pedidosya");
    const url = py!.buildSearchUrl("Coca-Cola 2.25L", "PY-BARATO-42");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.pedidosya.com.ar");
    expect(parsed.searchParams.get("searchTerm")).toBe("Coca-Cola 2.25L");
    expect(parsed.searchParams.get("partnerId")).toBe("PY-BARATO-42");
    expect(parsed.searchParams.get("utm_source")).toBe("PY-BARATO-42");
  });

  it("Rappi sin afiliado: URL nativa con UTM (no Google site search)", () => {
    const rp = DELIVERY_PARTNERS.find((p) => p.slug === "rappi");
    const url = rp!.buildSearchUrl("Aceite Natura", undefined);
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.rappi.com.ar");
    expect(parsed.pathname).toBe("/search");
    expect(parsed.searchParams.get("query")).toBe("Aceite Natura");
    expect(parsed.searchParams.get("utm_source")).toBe("barato.ar");
  });

  it("Rappi con afiliado: URL nativa con ref + UTM", () => {
    const rp = DELIVERY_PARTNERS.find((p) => p.slug === "rappi");
    const url = rp!.buildSearchUrl("Aceite", "RAP-XYZ-001");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.rappi.com.ar");
    expect(parsed.searchParams.get("ref")).toBe("RAP-XYZ-001");
    expect(parsed.searchParams.get("utm_source")).toBe("RAP-XYZ-001");
  });

  it("MercadoLibre URL con afiliado: agrega matt_word", () => {
    const ml = DELIVERY_PARTNERS.find((p) => p.slug === "mercadolibre");
    const url = ml!.buildSearchUrl("cerveza quilmes", "matt_MLA_12345");
    const parsed = new URL(url);
    expect(parsed.pathname).toContain("cerveza-quilmes");
    expect(parsed.searchParams.get("matt_word")).toBe("matt_MLA_12345");
  });

  it("buildDeliveryQuery agrega marca si no está en el nombre", () => {
    expect(buildDeliveryQuery("Leche Descremada 1L", "La Serenísima")).toBe(
      "La Serenísima Leche Descremada 1L",
    );
  });

  it("buildDeliveryQuery no duplica marca si ya está en el nombre", () => {
    // El tamaño "2.25L" se MANTIENE (espec de tamaño útil)
    expect(buildDeliveryQuery("Coca-Cola Original 2.25L", "Coca-Cola")).toBe(
      "Coca-Cola Original 2.25L",
    );
  });

  it("buildDeliveryQuery limpia códigos EAN embebidos", () => {
    // El tamaño "1L" se MANTIENE (espec de tamaño útil)
    expect(buildDeliveryQuery("Cerveza Quilmes 7790895000119 Retornable 1L", "Quilmes")).toBe(
      "Cerveza Quilmes Retornable 1L",
    );
  });

  it("buildDeliveryQuery limpia códigos SEPA de packaging BOT-N-ml", () => {
    expect(buildDeliveryQuery("Vino la Celia Elite Malbec 750 cc BOT-750-ml", "La Celia")).toBe(
      "Vino la Celia Elite Malbec 750 ml",
    );
  });

  it("buildDeliveryQuery limpia PCK-N-un y cc → ml", () => {
    expect(
      buildDeliveryQuery("Cerveza Heineken Rubia 330 cc Sixpack PCK-6-un", "Heineken"),
    ).toBe("Cerveza Heineken Rubia 330 ml Sixpack");
  });

  it("buildDeliveryQuery trunca a 8 palabras", () => {
    const long =
      "Aceite Vegetal Natura Girasol Alto Oleico Sin TACC Botella 900 ml";
    const result = buildDeliveryQuery(long, "Natura");
    expect(result.split(" ").length).toBeLessThanOrEqual(8);
  });

  it("buildDeliveryQuery normaliza gramos: grs/gramos → g y elimina cantidad x N", () => {
    // "x 30 grs" se elimina completo como cantidad de pack
    expect(buildDeliveryQuery("Barrita Cereal Frutos Rojos x 30 grs", "Serenito")).toBe(
      "Serenito Barrita Cereal Frutos Rojos",
    );
  });

  // Prefix cleaning (SEPA "S/d", "Sin descripción") — benefits ALL consumers:
  // Coto, La Anónima, VTEX, delivery partners, Google fallback

  it("buildDeliveryQuery limpia prefijo 'S/d ' (bug reportado)", () => {
    // "x 100 g" se elimina como cantidad de pack, pero "1 L" se mantiene
    expect(buildDeliveryQuery("S/d Grisines Panader a Semillas x 100 g", "Fargo")).toBe(
      "Fargo Grisines Panader a Semillas",
    );
    expect(buildDeliveryQuery("S/d Grisines Panader a Semillas x 100 g", null)).toBe(
      "Grisines Panader a Semillas",
    );
  });

  it("buildDeliveryQuery limpia prefijo 'S/d.' (con punto)", () => {
    // "1 L" se mantiene como especificación de tamaño útil
    expect(buildDeliveryQuery("S/d. Leche Entera 1 L", "La Serenisima")).toBe(
      "La Serenisima Leche Entera 1 L",
    );
  });

  it("buildDeliveryQuery limpia prefijo 'Sin descripción '", () => {
    // "170 g" y "900 ml" se mantienen como especificaciones de tamaño útiles
    expect(buildDeliveryQuery("Sin descripción Yogur Natural 170 g", "Danone")).toBe(
      "Danone Yogur Natural 170 g",
    );
    expect(buildDeliveryQuery("Sin desc. Aceite 900 ml", "Natura")).toBe(
      "Natura Aceite 900 ml",
    );
  });

  it("buildDeliveryQuery limpia prefijo aunque venga después de la marca (brand prepended)", () => {
    // Cuando buildDeliveryQuery prepende la marca, el prefijo queda en medio
    // "460 g" se mantiene como especificación de tamaño útil
    expect(buildDeliveryQuery("S/d Pan Lactal 460 g", "Fargo")).toBe(
      "Fargo Pan Lactal 460 g",
    );
  });

  // Pack/promo cleaning tests

  it("buildDeliveryQuery elimina cantidades tipo pack 'x 6', 'Pack 12'", () => {
    // Las marcas se prependean al inicio SOLO si no están en el nombre
    // "x 6", "Pack 12", "x 4 unidades" se eliminan; "170 g" se mantiene
    // "Oreo" YA está en "Galletitas Oreo" -> no se prependea
    // "Quilmes" YA está en "Cerveza Quilmes" -> no se prependea
    // "Ser" YA está en "Yogur Ser 170 g" -> no se prependea
    expect(buildDeliveryQuery("Galletitas Oreo x 6", "Oreo")).toBe("Galletitas Oreo");
    expect(buildDeliveryQuery("Cerveza Quilmes Pack 12", "Quilmes")).toBe("Cerveza Quilmes");
    expect(buildDeliveryQuery("Yogur Ser 170 g x 4 unidades", "Ser")).toBe("Yogur Ser 170 g");
  });

  it("buildDeliveryQuery elimina promos tipo '2x1', '3x2', 'Promo 2x1'", () => {
    // "2x1", "3x2" se eliminan; "1L", "2.25L" se mantienen
    expect(buildDeliveryQuery("Leche 1L Promo 2x1", "La Serenisima")).toBe("La Serenisima Leche 1L");
    expect(buildDeliveryQuery("Gaseosa 2.25L 3x2", "Coca-Cola")).toBe("Coca-Cola Gaseosa 2.25L");
  });

  it("readAffiliateIds: devuelve undefined cuando envs no están seteados", () => {
    const ids = readAffiliateIds();
    expect(ids.pedidosya).toBeUndefined();
    expect(ids.rappi).toBeUndefined();
    expect(ids.mercadolibre).toBeUndefined();
  });

  it("readAffiliateIds: lee envs y trim vacíos", () => {
    process.env["NEXT_PUBLIC_AFFILIATE_PEDIDOSYA"] = "PY-42";
    process.env["NEXT_PUBLIC_AFFILIATE_RAPPI"] = "   ";
    const ids = readAffiliateIds();
    expect(ids.pedidosya).toBe("PY-42");
    expect(ids.rappi).toBeUndefined();
  });
});
