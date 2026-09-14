import { describe, expect, it } from "vitest";
import { resolveStoreLink, NATIVE_BUILDERS } from "@/lib/store-links";
import { DELIVERY_PARTNERS } from "@/lib/deep-links";

describe("store-links (F019 + F021)", () => {
  const baseCtx = {
    productName: "Coca-Cola Original 2.25L",
    brand: "Coca-Cola",
  } as const;

  // ------------------------- F021 · Google fallback para chains conocidos -------------------------

  it("F021: Carrefour sin afiliado → Google site search sobre carrefour.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "carrefour" });
    expect(url).not.toBeNull();
    const parsed = new URL(url!);
    expect(parsed.hostname).toBe("www.google.com");
    const q = parsed.searchParams.get("q") ?? "";
    expect(q).toContain("site:www.carrefour.com.ar");
    expect(q).toContain("Coca-Cola");
  });

  it("F021: Coto → Google site search sobre cotodigital3.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "coto" });
    const q = new URL(url!).searchParams.get("q") ?? "";
    expect(q).toContain("site:www.cotodigital3.com.ar");
  });

  it("F021: Día → Google site search sobre diaonline.supermercadosdia.com.ar", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "dia" });
    const q = new URL(url!).searchParams.get("q") ?? "";
    expect(q).toContain("site:diaonline.supermercadosdia.com.ar");
  });

  it("F021: La Anónima → Google site search sobre laanonimaonline.com", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "la-anonima" });
    const q = new URL(url!).searchParams.get("q") ?? "";
    expect(q).toContain("site:laanonimaonline.com");
  });

  it("F021: Farmacity → Google site search sobre farmacity.com", () => {
    const url = resolveStoreLink({ ...baseCtx, chainSlug: "farmacity" });
    const q = new URL(url!).searchParams.get("q") ?? "";
    expect(q).toContain("site:www.farmacity.com");
  });

  it("F021: los 4 chains VTEX comunes (jumbo/vea/disco/changomas) usan Google", () => {
    for (const slug of ["jumbo", "vea", "disco", "changomas"]) {
      const url = resolveStoreLink({ ...baseCtx, chainSlug: slug });
      const parsed = new URL(url!);
      expect(parsed.hostname).toBe("www.google.com");
    }
  });

  // ------------------------- NATIVE_BUILDERS exportado para deals futuros -------------------------

  it("NATIVE_BUILDERS.carrefour devuelve URL VTEX nativa (para deal futuro)", () => {
    const url = NATIVE_BUILDERS.carrefour!("Test Query");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.carrefour.com.ar");
    expect(parsed.searchParams.get("_q")).toBe("Test Query");
    expect(parsed.searchParams.get("map")).toBe("ft");
  });

  it("NATIVE_BUILDERS.coto devuelve URL con Ntt", () => {
    const url = NATIVE_BUILDERS.coto!("Test Query");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.cotodigital3.com.ar");
    expect(parsed.searchParams.get("Ntt")).toBe("Test Query");
  });

  // ------------------------- Priority: storeProductUrl gana -------------------------

  it("storeProductUrl explícito gana sobre Google fallback", () => {
    const pdp = "https://www.carrefour.com.ar/productos/coca-cola-2-25-retornable/p/12345";
    const url = resolveStoreLink({
      ...baseCtx,
      chainSlug: "carrefour",
      storeProductUrl: pdp,
    });
    expect(url).toBe(pdp);
  });

  it("storeProductUrl inválido (no http) es ignorado → cae a Google", () => {
    const url = resolveStoreLink({
      ...baseCtx,
      chainSlug: "carrefour",
      storeProductUrl: "javascript:alert(1)", // XSS guard
    });
    expect(url).not.toBeNull();
    expect(new URL(url!).hostname).toBe("www.google.com");
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
    const q = new URL(url!).searchParams.get("q") ?? "";
    expect(q).not.toContain("BOT-750-ml");
    expect(q).not.toContain("cc");
    expect(q).toContain("Vino");
    expect(q).toContain("Malbec");
  });
});
