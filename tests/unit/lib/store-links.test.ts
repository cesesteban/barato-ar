import { describe, expect, it } from "vitest";
import { resolveStoreLink } from "@/lib/store-links";
import { DELIVERY_PARTNERS } from "@/lib/deep-links";

describe("store-links (F019)", () => {
  const baseCtx = {
    productName: "Coca-Cola Original 2.25L",
    brand: "Coca-Cola",
  } as const;

  // ------------------------- VTEX chains -------------------------

  it("Carrefour → URL VTEX de carrefour.com.ar con _q + map=ft", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "carrefour" });
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.hostname).toBe("www.carrefour.com.ar");
    expect(parsed.searchParams.get("_q")).toContain("Coca-Cola");
    expect(parsed.searchParams.get("map")).toBe("ft");
  });

  it("Día → URL VTEX de diaonline.supermercadosdia.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "dia" });
    expect(new URL(url!).hostname).toBe("diaonline.supermercadosdia.com.ar");
    expect(new URL(url!).searchParams.get("map")).toBe("ft");
  });

  it("Jumbo → URL VTEX de jumbo.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "jumbo" });
    expect(new URL(url!).hostname).toBe("www.jumbo.com.ar");
  });

  it("Vea → URL VTEX de vea.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "vea" });
    expect(new URL(url!).hostname).toBe("www.vea.com.ar");
  });

  it("Disco → URL VTEX de disco.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "disco" });
    expect(new URL(url!).hostname).toBe("www.disco.com.ar");
  });

  it("Changomas → URL VTEX de changomas.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "changomas" });
    expect(new URL(url!).hostname).toBe("www.changomas.com.ar");
  });

  // ------------------------- Custom builders -------------------------

  it("Coto → cotodigital3.com.ar con param Ntt", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "coto" });
    expect(new URL(url!).hostname).toBe("www.cotodigital3.com.ar");
    expect(new URL(url!).pathname).toBe("/sitios/cdigi/browse");
    expect(new URL(url!).searchParams.get("Ntt")).toContain("Coca-Cola");
  });

  it("La Anónima → laanonimaonline.com/busqueda con param q", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "la-anonima" });
    expect(new URL(url!).hostname).toBe("laanonimaonline.com");
    expect(new URL(url!).pathname).toBe("/busqueda");
    expect(new URL(url!).searchParams.get("q")).toContain("Coca-Cola");
  });

  // ------------------------- Farmacity (US2) -------------------------

  it("Farmacity → URL VTEX de farmacity.com", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "farmacity" });
    expect(new URL(url!).hostname).toBe("www.farmacity.com");
    expect(new URL(url!).searchParams.get("map")).toBe("ft");
  });

  // ------------------------- Priority: storeProductUrl gana -------------------------

  it("storeProductUrl explícito gana sobre builder", () => {
    const pdp = "https://www.carrefour.com.ar/productos/coca-cola-2-25-retornable/p/12345";
    const url = resolveStoreLink({
      ...baseCtx,
      chainSlug: "carrefour",
      storeProductUrl: pdp,
    });
    expect(url).toBe(pdp);
  });

  it("storeProductUrl inválido (no http) es ignorado → cae a builder", () => {
    const url = resolveStoreLink({
      ...baseCtx,
      chainSlug: "carrefour",
      storeProductUrl: "javascript:alert(1)", // guardarnos de XSS
    });
    expect(url).not.toBeNull();
    expect(new URL(url!).hostname).toBe("www.carrefour.com.ar");
  });

  // ------------------------- Delivery reuso F014 (US3) -------------------------

  it("PedidosYa reutiliza DELIVERY_PARTNERS de F014", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "pedidosya" });
    const py = DELIVERY_PARTNERS.find((p) => p.slug === "pedidosya")!;
    const expected = py.buildSearchUrl("Coca-Cola Original 2.25L", undefined);
    expect(url).toBe(expected);
  });

  it("Rappi reutiliza DELIVERY_PARTNERS", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "rappi" });
    const rp = DELIVERY_PARTNERS.find((p) => p.slug === "rappi")!;
    const expected = rp.buildSearchUrl("Coca-Cola Original 2.25L", undefined);
    expect(url).toBe(expected);
  });

  it("MercadoLibre reutiliza DELIVERY_PARTNERS", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "mercadolibre" });
    const ml = DELIVERY_PARTNERS.find((p) => p.slug === "mercadolibre")!;
    const expected = ml.buildSearchUrl("Coca-Cola Original 2.25L", undefined);
    expect(url).toBe(expected);
  });

  // ------------------------- Fallback (US4) -------------------------

  it("Chain desconocida con websiteUrl → Google site search", () => {
    const url = resolveStoreLink({
      ...baseCtx,
      chainSlug: "nueva-cadena",
      chainWebsiteUrl: "https://www.nuevacadena.com.ar",
    });
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.hostname).toBe("www.google.com");
    expect(parsed.searchParams.get("q")).toContain("site:www.nuevacadena.com.ar");
    expect(parsed.searchParams.get("q")).toContain("Coca-Cola");
  });

  it("Chain desconocida sin websiteUrl → null", () => {
    const url = resolveStoreLink({
      ...baseCtx,
      chainSlug: "chain-inexistente",
    });
    expect(url).toBeNull();
  });

  it("chainWebsiteUrl malformada no rompe (try/catch) → null", () => {
    const url = resolveStoreLink({
      ...baseCtx,
      chainSlug: "chain-inexistente",
      chainWebsiteUrl: "not-a-valid-url",
    });
    expect(url).toBeNull();
  });

  // ------------------------- Query cleanup (US5) -------------------------

  it("Limpia códigos SEPA (BOT-N-ml, cc → ml) antes de armar URL", () => {
    const url = resolveStoreLink({
      chainSlug: "coto",
      productName: "Vino la Celia Elite Malbec 750 cc BOT-750-ml",
      brand: "La Celia",
    });
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    const Ntt = parsed.searchParams.get("Ntt") ?? "";
    expect(Ntt).not.toContain("BOT-750-ml");
    expect(Ntt).not.toContain("cc");
    expect(Ntt).toContain("ml");
    expect(Ntt).toContain("Vino");
    expect(Ntt).toContain("Malbec");
  });
});
