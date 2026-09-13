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

  it("PedidosYa sin afiliado: Google site search (URLs nativas requieren cookie de dirección)", () => {
    const py = DELIVERY_PARTNERS.find((p) => p.slug === "pedidosya");
    const url = py!.buildSearchUrl("Coca-Cola 2.25L", undefined);
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.google.com");
    const q = parsed.searchParams.get("q") ?? "";
    expect(q).toContain("site:pedidosya.com.ar");
    expect(q).toContain("Coca-Cola 2.25L");
  });

  it("PedidosYa con afiliado: URL nativa con partnerId (para tracking)", () => {
    const py = DELIVERY_PARTNERS.find((p) => p.slug === "pedidosya");
    const url = py!.buildSearchUrl("Coca-Cola 2.25L", "PY-BARATO-42");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.pedidosya.com.ar");
    expect(parsed.searchParams.get("searchTerm")).toBe("Coca-Cola 2.25L");
    expect(parsed.searchParams.get("partnerId")).toBe("PY-BARATO-42");
    expect(parsed.searchParams.get("utm_source")).toBe("PY-BARATO-42");
  });

  it("Rappi sin afiliado: Google site search", () => {
    const rp = DELIVERY_PARTNERS.find((p) => p.slug === "rappi");
    const url = rp!.buildSearchUrl("Aceite Natura", undefined);
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.google.com");
    const q = parsed.searchParams.get("q") ?? "";
    expect(q).toContain("site:rappi.com.ar");
    expect(q).toContain("Aceite Natura");
  });

  it("Rappi con afiliado: URL nativa con ref", () => {
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
    expect(buildDeliveryQuery("Coca-Cola Original 2.25L", "Coca-Cola")).toBe(
      "Coca-Cola Original 2.25L",
    );
  });

  it("buildDeliveryQuery limpia códigos EAN embebidos", () => {
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

  it("buildDeliveryQuery normaliza gramos: grs/gramos → g", () => {
    expect(buildDeliveryQuery("Barrita Cereal Frutos Rojos x 30 grs", "Serenito")).toBe(
      "Serenito Barrita Cereal Frutos Rojos x 30 g",
    );
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
