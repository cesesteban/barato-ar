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

/**
 * URL de búsqueda por Google con filtro `site:` — siempre encuentra resultados
 * cuando la plataforma tiene el producto indexado. Usamos esto como fallback
 * porque las URLs nativas de PY y Rappi requieren cookie de dirección
 * seleccionada, sin la cual redirigen al selector y pierden el query.
 * Cuando exista deal con afiliados, cambiar a URL nativa (afiliado no
 * traquea a través de Google).
 */
function googleSiteSearch(site: string, q: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(`site:${site} ${q}`)}`;
}

export const DELIVERY_PARTNERS: DeliveryPartnerConfig[] = [
  {
    slug: "pedidosya",
    name: "PedidosYa",
    hostLabel: "pedidosya.com.ar",
    buildSearchUrl: (q: string, affiliateId?: string) => {
      // Con afiliado activado, URL nativa (necesaria para tracking del deal).
      if (affiliateId) {
        return withUtm(
          `https://www.pedidosya.com.ar/mercados-y-almacenes?searchTerm=${encodeURIComponent(q)}`,
          { partnerId: affiliateId, utm_source: affiliateId },
        );
      }
      // Sin afiliado: Google site search — no requiere cookie de dirección y
      // siempre lleva a la página real del producto en PY.
      return googleSiteSearch("pedidosya.com.ar", q);
    },
  },
  {
    slug: "rappi",
    name: "Rappi",
    hostLabel: "rappi.com.ar",
    buildSearchUrl: (q: string, affiliateId?: string) => {
      if (affiliateId) {
        return withUtm(
          `https://www.rappi.com.ar/search?query=${encodeURIComponent(q)}`,
          { ref: affiliateId, utm_source: affiliateId },
        );
      }
      return googleSiteSearch("rappi.com.ar", q);
    },
  },
  {
    slug: "mercadolibre",
    name: "MercadoLibre",
    hostLabel: "mercadolibre.com.ar",
    buildSearchUrl: (q: string, affiliateId?: string) => {
      // ML sí acepta URL nativa sin cookies: /listado/... funciona siempre.
      const extra = affiliateId
        ? { matt_word: affiliateId, matt_tool: "88833099" }
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
 *
 * Los nombres de SEPA vienen con ruido específico de su dataset (códigos
 * de packaging, unidades poco comunes, presentaciones abreviadas) que
 * Google y las apps de delivery no indexan — hay que sacarlo para que
 * la búsqueda encuentre resultados.
 *
 * Ejemplos reales:
 *   "Vino la Celia Elite Malbec 750 cc BOT-750-ml" → "Vino la Celia Elite Malbec 750 ml"
 *   "Cerveza Heineken Rubia 330 cc Sixpack PCK-6-un" → "Cerveza Heineken Rubia 330 ml Sixpack"
 *   "Gaseosa Coca Cola Original 237 cc BOT-237-cc" → "Gaseosa Coca Cola Original 237 ml"
 */
export function buildDeliveryQuery(productName: string, brand: string | null): string {
  let cleaned = productName
    // Códigos SEPA de packaging: BOT-750-ml, PCK-6-un, PAQ-500-g, etc.
    .replace(/\b[A-Z]{2,4}-\d+(?:[.,]\d+)?-[A-Za-z]+\b/g, "")
    // EANs o SKUs numéricos largos embebidos
    .replace(/\b\d{6,}\b/g, "")
    // "cc" como unidad → ml (SEPA usa cc para líquidos, PY usa ml)
    .replace(/(\d)\s*cc\b/gi, "$1 ml")
    // "grs" / "gr" → g
    .replace(/(\d)\s*(grs?|gramos)\b/gi, "$1 g")
    // Colapsar espacios y trim
    .replace(/\s+/g, " ")
    .trim();

  // Truncar a ~8 palabras para queries más permisivos
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length > 8) cleaned = words.slice(0, 8).join(" ");

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
