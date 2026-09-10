import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCarrefourFlyer } from "@/ingestion/chains/carrefour/parser";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE = join(__dirname, "../../fixtures/flyers/carrefour/2026-W37.html");
const SOURCE_URL = "https://www.carrefour.com.ar/promociones/folleto-2026-W37";

describe("parseCarrefourFlyer", () => {
  it("extrae 7 productos del fixture", async () => {
    const html = await readFile(FIXTURE, "utf8");
    const items = parseCarrefourFlyer(html, SOURCE_URL);
    expect(items).toHaveLength(7);
  });

  it("Coca 2.25L Retornable — precio + previous + EAN + storeProductUrl", async () => {
    const html = await readFile(FIXTURE, "utf8");
    const [coca] = parseCarrefourFlyer(html, SOURCE_URL);
    expect(coca).toBeDefined();
    expect(coca!.productName).toContain("Coca-Cola");
    expect(coca!.brand).toBe("Coca-Cola");
    expect(coca!.price).toBe(890);
    expect(coca!.previousPrice).toBe(1290);
    expect(coca!.eanCode).toBe("7790895000119");
    expect(coca!.size).toBe(2.25);
    expect(coca!.unit).toBe("l");
    expect(coca!.category).toBe("gaseosas-cola");
    expect(coca!.storeProductUrl).toContain("/producto/coca-cola-2-25-retornable");
    expect(coca!.storeProductUrl).toContain(SOURCE_URL.split("/promociones")[0]);
  });

  it("Cerveza Quilmes 1L — promo '2x1'", async () => {
    const html = await readFile(FIXTURE, "utf8");
    const items = parseCarrefourFlyer(html, SOURCE_URL);
    const quilmes = items.find((i) => i.productName.includes("Quilmes"));
    expect(quilmes?.promoDescription).toBe("2x1");
  });

  it("Cerveza Heineken 473ml — promo '2do al 70%' + size ml", async () => {
    const html = await readFile(FIXTURE, "utf8");
    const items = parseCarrefourFlyer(html, SOURCE_URL);
    const heineken = items.find((i) => i.productName.includes("Heineken"));
    expect(heineken?.promoDescription).toBe("2do al 70%");
    expect(heineken?.size).toBe(473);
    expect(heineken?.unit).toBe("ml");
  });

  it("Papel Elite x4 — 'Lleva 3 Paga 2'", async () => {
    const html = await readFile(FIXTURE, "utf8");
    const items = parseCarrefourFlyer(html, SOURCE_URL);
    const papel = items.find((i) => i.productName.includes("Elite"));
    expect(papel?.promoDescription).toBe("Lleva 3 Paga 2");
    expect(papel?.size).toBe(4);
    expect(papel?.unit).toBe("un");
  });

  it("validFrom/validTo tomados de meta", async () => {
    const html = await readFile(FIXTURE, "utf8");
    const [first] = parseCarrefourFlyer(html, SOURCE_URL);
    expect(first?.validFrom).toContain("2026-09-09");
    expect(first?.validTo).toContain("2026-09-15");
  });
});
