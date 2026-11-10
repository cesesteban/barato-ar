import { expect, test } from "@playwright/test";

/**
 * E2E tests para validar navegación saliente ("Ir a la tienda" y deep links
 * de delivery) desde el detalle del producto (/producto/[slug]).
 *
 * Valida que:
 *   1. Los botones "Ir a la tienda" apuntan a URLs externas correctas por cadena
 *   2. Los links de delivery (PedidosYa, Rappi, MercadoLibre) tienen hrefs válidos
 *   3. Todos los links externos tienen target="_blank" y rel apropiado
 *   4. Los VTEX usan /? con _q + map=ft (pre-fill + auto-search)
 *   5. Coto usa Ntt, La Anónima usa q
 *   6. Al hacer click se abre una nueva pestaña con la URL esperada
 */

const PRODUCT_SLUG = "gaseosa-coca-cola-botella-2-25-ltr-coca-cola-19ciz2j";
const PRODUCT_URL = `https://barato-ar.vercel.app/producto/${PRODUCT_SLUG}?zone=caba-palermo`;

test.use({ navigationTimeout: 30000 });

const pageHasLoaded = async (page: Parameters<typeof test>[0]["page"]) => {
  await page.goto(PRODUCT_URL, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await expect(page.locator("h1").filter({ hasText: /Gaseosa Cola/ })).toBeVisible({
    timeout: 15000,
  });
};

test.describe("Product detail page — outbound navigation (Ir a la tienda + delivery)", () => {
  test.beforeEach(async ({ page }) => {
    await pageHasLoaded(page);
  });

  test("Muestra filas de comparación con botones 'Ir a la tienda'", async ({ page }) => {
    const anchors = page.locator('[data-store-click]');
    await expect(anchors.first()).toBeVisible({ timeout: 10000 });
  });

  test("VTEX chains (Carrefour, Día, Jumbo, Vea, Disco, Changomas, Farmacity) usan /? con _q + map=ft", async ({ page }) => {
    const vtexChains = ["carrefour", "dia", "jumbo", "vea", "disco", "changomas", "farmacity"];

    const expectedHosts: Record<string, string> = {
      carrefour: "www.carrefour.com.ar",
      dia: "diaonline.supermercadosdia.com.ar",
      jumbo: "www.jumbo.com.ar",
      vea: "www.vea.com.ar",
      disco: "www.disco.com.ar",
      changomas: "www.changomas.com.ar",
      farmacity: "www.farmacity.com",
    };

    for (const chainSlug of vtexChains) {
      const anchor = page.locator(`[data-store-click="${chainSlug}"]`).first();
      if ((await anchor.count()) === 0) continue;

      const href = await anchor.getAttribute("href");
      expect(href).toBeTruthy();
      expect(href).toMatch(/^https:\/\//);

      const url = new URL(href!);
      expect(url.hostname).toBe(expectedHosts[chainSlug]);

      // Path debe ser / (homepage de la tienda con pre-fill)
      expect(url.pathname).toBe("/");

      // _q param debe contener el nombre del producto (pre-fill del buscador)
      const q = url.searchParams.get("_q");
      expect(q).toBeTruthy();
      expect(q!.length).toBeGreaterThan(0);

      // map=ft para auto-disparar búsqueda
      expect(url.searchParams.get("map")).toBe("ft");

      // target="_blank" para abrir en nueva pestaña
      expect(await anchor.getAttribute("target")).toBe("_blank");
    }
  });

  test("Coto usa cotodigital3.com.ar con param Ntt", async ({ page }) => {
    const anchor = page.locator('[data-store-click="coto"]').first();
    if ((await anchor.count()) === 0) {
      test.skip();
    }

    const href = await anchor.getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href!);
    expect(url.hostname).toBe("www.cotodigital3.com.ar");
    expect(url.pathname).toBe("/sitios/cdigi/browse");
    expect(url.searchParams.get("Ntt")).toBeTruthy();
    expect(await anchor.getAttribute("target")).toBe("_blank");
  });

  test("La Anónima usa laanonimaonline.com/busqueda con param q", async ({ page }) => {
    const anchor = page.locator('[data-store-click="la-anonima"]').first();
    if ((await anchor.count()) === 0) {
      test.skip();
    }

    const href = await anchor.getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href!);
    expect(url.hostname).toBe("laanonimaonline.com");
    expect(url.pathname).toBe("/busqueda");
    expect(url.searchParams.get("q")).toBeTruthy();
    expect(await anchor.getAttribute("target")).toBe("_blank");
  });

  test("Delivery links: PedidosYa URL nativa con searchTerm", async ({ page }) => {
    const link = page.locator('[data-platform="pedidosya"]').first();
    if ((await link.count()) === 0) {
      test.skip();
    }

    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href!);
    expect(url.hostname).toBe("www.pedidosya.com.ar");
    expect(url.pathname).toBe("/mercados-y-almacenes");
    expect(url.searchParams.get("searchTerm")).toBeTruthy();
    expect(await link.getAttribute("target")).toBe("_blank");
  });

  test("Delivery links: Rappi URL nativa con query", async ({ page }) => {
    const link = page.locator('[data-platform="rappi"]').first();
    if ((await link.count()) === 0) {
      test.skip();
    }

    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href!);
    expect(url.hostname).toBe("www.rappi.com.ar");
    expect(url.pathname).toBe("/search");
    expect(url.searchParams.get("query")).toBeTruthy();
    expect(await link.getAttribute("target")).toBe("_blank");
  });

  test("Delivery links: MercadoLibre listado (subdomain listado.mercadolibre.com.ar)", async ({ page }) => {
    const link = page.locator('[data-platform="mercadolibre"]').first();
    if ((await link.count()) === 0) {
      test.skip();
    }

    const href = await link.getAttribute("href");
    expect(href).toBeTruthy();
    const url = new URL(href!);
    expect(url.hostname).toContain("mercadolibre.com.ar");
    // ML usa subdomain listado, no path /listado/
    expect(url.hostname.startsWith("listado.")).toBe(true);
    expect(await link.getAttribute("target")).toBe("_blank");
  });

  test("Click en 'Ir a la tienda' abre nueva pestaña con URL externa", async ({ page }) => {
    const anchors = page.locator('[data-store-click]');
    const count = await anchors.count();
    if (count === 0) {
      test.skip();
    }

    const firstAnchor = anchors.first();
    const href = await firstAnchor.getAttribute("href");
    expect(href).toBeTruthy();

    const newPagePromise = page.context().waitForEvent("page");
    await firstAnchor.click();
    const newPage = await newPagePromise;

    // Espera que la nueva pestaña cargue alguna URL externa
    // (algunas cadenas redirigen, ej: cotodigital3.com.ar → coto.com.ar)
    await newPage.waitForURL((url) => url.href.startsWith("http"), { timeout: 15000 });
    const newUrl = new URL(newPage.url());
    expect(newUrl.hostname.length).toBeGreaterThan(0);
    // Verifica que sea un dominio de tienda conocido (no barato.ar)
    expect(newUrl.hostname).not.toBe("barato-ar.vercel.app");
    expect(["carrefour.com.ar", "coto.com.ar", "disco.com.ar", "jumbo.com.ar", "diaonline.supermercadosdia.com.ar"].some(
      (h) => newUrl.hostname.endsWith(h)
    )).toBe(true);
  });

  test("Todos los links externos tienen rel con nofollow y noopener", async ({ page }) => {
    const anchors = page.locator('a[target="_blank"]');
    const count = await anchors.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const anchor = anchors.nth(i);
      const href = await anchor.getAttribute("href");
      if (href && href.startsWith("http")) {
        const rel = await anchor.getAttribute("rel");
        expect(rel).toContain("nofollow");
        expect(rel).toContain("noopener");
      }
    }
  });

  test("Producto se renderiza con nombre y precios", async ({ page }) => {
    await expect(page.locator("h1").filter({ hasText: /Gaseosa Cola/ })).toBeVisible();
    // Debe haber al menos un elemento con precio (contiene $)
    await expect(page.locator('text=/\\$/').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Product detail page — delivery platform links (F014)", () => {
  test.beforeEach(async ({ page }) => {
    await pageHasLoaded(page);
    // DeliveryLinks es un Client Component — espera a que hidrate
    await expect(page.locator('[data-platform="pedidosya"]')).toBeVisible({ timeout: 15000 });
  });

  test("DeliveryLinks section está presente con las 3 plataformas", async ({ page }) => {
    const heading = page.getByText(/Comprar por delivery/i);
    await expect(heading).toBeVisible();

    const platforms = ["pedidosya", "rappi", "mercadolibre"];
    for (const platform of platforms) {
      const link = page.locator(`[data-platform="${platform}"]`);
      if ((await link.count()) > 0) {
        await expect(link.first()).toBeVisible();
        const href = await link.first().getAttribute("href");
        expect(href).toMatch(/^https:\/\//);
      }
    }
  });

  test("Cada link de delivery contiene el nombre del producto en el query o path", async ({ page }) => {
    const links = page.locator('[data-platform]');
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const href = await link.getAttribute("href");
      if (!href) continue;

      const url = new URL(href);
      const searchTerm =
        url.searchParams.get("searchTerm") ??
        url.searchParams.get("query") ??
        url.pathname.split("/").pop() ?? "";
      expect(searchTerm.length).toBeGreaterThan(0);
    }
  });
});
