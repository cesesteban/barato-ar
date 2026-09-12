import { describe, expect, it } from "vitest";
import { DELIVERY_PARTNERS, buildDeliveryQuery } from "@/lib/deep-links";

describe("deep-links (F014)", () => {
  it("PedidosYa URL incluye query encodeada y UTM completo", () => {
    const py = DELIVERY_PARTNERS.find((p) => p.slug === "pedidosya");
    expect(py).toBeTruthy();
    const url = py!.buildSearchUrl("Coca-Cola 2.25L");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.pedidosya.com.ar");
    expect(parsed.searchParams.get("query")).toBe("Coca-Cola 2.25L");
    expect(parsed.searchParams.get("utm_source")).toBe("barato.ar");
    expect(parsed.searchParams.get("utm_medium")).toBe("deep_link");
    expect(parsed.searchParams.get("utm_campaign")).toBe("comparator");
  });

  it("Rappi URL incluye query encodeada y UTM completo", () => {
    const rp = DELIVERY_PARTNERS.find((p) => p.slug === "rappi");
    expect(rp).toBeTruthy();
    const url = rp!.buildSearchUrl("Aceite Natura Girasol 900ml");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.rappi.com.ar");
    expect(parsed.searchParams.get("query")).toBe("Aceite Natura Girasol 900ml");
    expect(parsed.searchParams.get("utm_source")).toBe("barato.ar");
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
});
