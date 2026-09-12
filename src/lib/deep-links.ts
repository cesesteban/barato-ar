/**
 * Deep links a plataformas de delivery (PedidosYa, Rappi) para monetización.
 *
 * Estrategia F1: NO ingesta de precios (issues legales + técnicos). Solo
 * redirigimos al usuario con el nombre del producto pre-cargado en la
 * búsqueda de la plataforma. UTM tags para tracking cuando exista
 * partnership.
 *
 * Cuando exista programa de afiliados (Rappi Ads, futuro), reemplazar
 * `utm_source` por el partner id y agregar `ref=<afiliado-id>`.
 */

export type DeliveryPlatform = "pedidosya" | "rappi";

export type DeliveryPartnerConfig = {
  slug: DeliveryPlatform;
  name: string;
  hostLabel: string;
  buildSearchUrl: (q: string) => string;
};

const UTM: Record<string, string> = {
  utm_source: "barato.ar",
  utm_medium: "deep_link",
  utm_campaign: "comparator",
};

function appendUtm(url: string): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(UTM)) {
    u.searchParams.set(k, v);
  }
  return u.toString();
}

export const DELIVERY_PARTNERS: DeliveryPartnerConfig[] = [
  {
    slug: "pedidosya",
    name: "PedidosYa",
    hostLabel: "pedidosya.com.ar",
    buildSearchUrl: (q: string) =>
      appendUtm(
        `https://www.pedidosya.com.ar/mercado/search?query=${encodeURIComponent(q)}`,
      ),
  },
  {
    slug: "rappi",
    name: "Rappi",
    hostLabel: "rappi.com.ar",
    buildSearchUrl: (q: string) =>
      appendUtm(`https://www.rappi.com.ar/search?query=${encodeURIComponent(q)}`),
  },
];

/**
 * Reduce el nombre del producto a un query eficiente para las plataformas de
 * delivery. Sacamos código EAN, cantidades muy específicas y ruido.
 */
export function buildDeliveryQuery(productName: string, brand: string | null): string {
  const cleaned = productName
    .replace(/\b\d{6,}\b/g, "") // eans o skus embebidos
    .replace(/\s+/g, " ")
    .trim();
  if (brand && !cleaned.toLowerCase().includes(brand.toLowerCase())) {
    return `${brand} ${cleaned}`.trim();
  }
  return cleaned;
}
