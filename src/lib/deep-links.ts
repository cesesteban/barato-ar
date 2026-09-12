/**
 * Deep links a plataformas de delivery/marketplace para monetización (F014).
 *
 * Estrategia sin ingesta de precios (issues legales + técnicos): redirigimos
 * al usuario a la búsqueda de cada plataforma con el nombre del producto
 * pre-cargado.
 *
 * Modo tracking-only (default, sin afiliados aún):
 *   - Solo agregamos UTM tags — sirve para analytics pero NO monetiza.
 *   - Es lo que se activa mientras negociás un partnership con la plataforma.
 *
 * Modo affiliate (cuando exista deal con la plataforma):
 *   - Setear el env `NEXT_PUBLIC_AFFILIATE_<PLATFORM>` en Vercel con el token
 *     que te da el partner. Cada plataforma usa un formato distinto:
 *
 *     PedidosYa   → subdomain o parámetro `partnerId=...` (a definir con ellos)
 *     Rappi       → parámetro `ref=...` (Rappi Ads asigna un ID por campaña)
 *     MercadoLibre → matt_word para MLA Afiliados (auto-registro público)
 *
 *   - El código detecta el env, arma el URL con el ID y no requiere re-deploy
 *     de código. Un usuario admin lo cambia desde Vercel Dashboard.
 *
 * Realidad hoy (2026-Q3 AR): ni PY ni Rappi tienen programa de afiliados
 * público. Necesitás demostrar tráfico con UTM primero, después escribir a
 * partnerships@ de cada uno. Solo MercadoLibre tiene programa self-serve.
 */

export type DeliveryPlatform = "pedidosya" | "rappi" | "mercadolibre";

export type DeliveryPartnerConfig = {
  slug: DeliveryPlatform;
  name: string;
  hostLabel: string;
  buildSearchUrl: (q: string, affiliateId: string | undefined) => string;
};

const UTM: Record<string, string> = {
  utm_source: "barato.ar",
  utm_medium: "deep_link",
  utm_campaign: "comparator",
};

function withUtm(url: string, extraParams?: Record<string, string>): string {
  const u = new URL(url);
  for (const [k, v] of Object.entries(UTM)) {
    u.searchParams.set(k, v);
  }
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      u.searchParams.set(k, v);
    }
  }
  return u.toString();
}

export const DELIVERY_PARTNERS: DeliveryPartnerConfig[] = [
  {
    slug: "pedidosya",
    name: "PedidosYa",
    hostLabel: "pedidosya.com.ar",
    buildSearchUrl: (q: string, affiliateId?: string) => {
      const extra = affiliateId
        ? { partnerId: affiliateId, utm_source: affiliateId }
        : undefined;
      return withUtm(
        `https://www.pedidosya.com.ar/mercado/search?query=${encodeURIComponent(q)}`,
        extra,
      );
    },
  },
  {
    slug: "rappi",
    name: "Rappi",
    hostLabel: "rappi.com.ar",
    buildSearchUrl: (q: string, affiliateId?: string) => {
      const extra = affiliateId ? { ref: affiliateId, utm_source: affiliateId } : undefined;
      return withUtm(
        `https://www.rappi.com.ar/search?query=${encodeURIComponent(q)}`,
        extra,
      );
    },
  },
  {
    slug: "mercadolibre",
    name: "MercadoLibre",
    hostLabel: "mercadolibre.com.ar",
    buildSearchUrl: (q: string, affiliateId?: string) => {
      const extra = affiliateId
        ? { matt_word: affiliateId, matt_tool: "88833099" } // ML expects matt_word
        : undefined;
      return withUtm(
        `https://listado.mercadolibre.com.ar/${encodeURIComponent(q.replace(/\s+/g, "-"))}`,
        extra,
      );
    },
  },
];

/**
 * Reduce el nombre del producto a un query eficiente para las plataformas.
 * Sacamos código EAN, cantidades muy específicas y ruido.
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

/**
 * Lee los IDs de afiliado desde los envs NEXT_PUBLIC_ (visibles al cliente).
 * Retorna undefined si no está seteado — el link queda en modo tracking-only.
 */
export type AffiliateIds = Partial<Record<DeliveryPlatform, string>>;

export function readAffiliateIds(): AffiliateIds {
  const result: AffiliateIds = {};
  const py = nonEmpty(process.env["NEXT_PUBLIC_AFFILIATE_PEDIDOSYA"]);
  if (py) result.pedidosya = py;
  const rp = nonEmpty(process.env["NEXT_PUBLIC_AFFILIATE_RAPPI"]);
  if (rp) result.rappi = rp;
  const ml = nonEmpty(process.env["NEXT_PUBLIC_AFFILIATE_MERCADOLIBRE"]);
  if (ml) result.mercadolibre = ml;
  return result;
}

function nonEmpty(v: string | undefined): string | undefined {
  return v && v.trim() !== "" ? v.trim() : undefined;
}
