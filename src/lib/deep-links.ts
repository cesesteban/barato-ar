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
      // Native search URL — pre-carga el query y el usuario elige dirección
      // después (no requiere cookie previa). Con afiliado agrega partnerId.
      const base = `https://www.pedidosya.com.ar/mercados-y-almacenes?searchTerm=${encodeURIComponent(q)}`;
      if (affiliateId) {
        return withUtm(base, { partnerId: affiliateId, utm_source: affiliateId });
      }
      // Sin afiliado: tracking-only UTM, link nativo (no Google fallback)
      return withUtm(base);
    },
  },
  {
    slug: "rappi",
    name: "Rappi",
    hostLabel: "rappi.com.ar",
    buildSearchUrl: (q: string, affiliateId?: string) => {
      // Native search URL — igual que PY: el query viaja y Rappi pide
      // dirección si no la hay. Con afiliado agrega ref.
      const base = `https://www.rappi.com.ar/search?query=${encodeURIComponent(q)}`;
      if (affiliateId) {
        return withUtm(base, { ref: affiliateId, utm_source: affiliateId });
      }
      return withUtm(base);
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
 * de packaging, unidades poco comunes, presentaciones abreviadas, prefijos
 * basura como "S/d", cantidades de pack) que Google y las apps de delivery
 * no indexan — hay que sacarlo para que la búsqueda encuentre resultados.
 *
 * Estrategia:
 * - MANTENER specs de tamaño útiles: "750 ml", "330 ml", "1L", "500g"
 * - ELIMINAR multiplicadores de pack: "x 6", "Pack 12", "x 100 g", "2x1"
 * - ELIMINAR códigos SEPA: "BOT-750-ml", "PCK-6-un"
 * - ELIMINAR prefijos basura: "S/d", "Sin descripción"
 *
 * Ejemplos reales:
 *   "Vino la Celia Elite Malbec 750 cc BOT-750-ml" → "Vino la Celia Elite Malbec 750 ml"
 *   "Cerveza Heineken Rubia 330 cc Sixpack PCK-6-un" → "Cerveza Heineken Rubia 330 ml Sixpack"
 *   "Gaseosa Coca Cola Original 237 cc BOT-237-cc" → "Gaseosa Coca Cola Original 237 ml"
 *   "S/d Grisines Panader a Semillas x 100 g" → "Grisines Panader a Semillas"
 *   "Sin descripción Leche Entera 1 L" → "Leche Entera 1 L"
 *   "Galletitas Oreo x 6 Pack Promo 2x1" → "Galletitas Oreo"
 *   "Yogur Ser Natural 170 g x 4 unidades" → "Yogur Ser Natural 170 g"
 */
export function buildDeliveryQuery(productName: string, brand: string | null): string {
  let cleaned = productName
    // Prefijos basura típicos de SEPA — al inicio O precedidos de espacio
    .replace(/(^|\s)s\/?d\.?\s+/gi, "$1")
    .replace(/(^|\s)sin\s+descripci[oó]n\s+/gi, "$1")
    .replace(/(^|\s)sin\s+desc\.?\s+/gi, "$1")
    // Códigos SEPA de packaging: BOT-750-ml, PCK-6-un, PAQ-500-g, etc.
    .replace(/\b[A-Z]{2,4}-\d+(?:[.,]\d+)?-[A-Za-z]+\b/g, "")
    // EANs o SKUs numéricos largos embebidos
    .replace(/\b\d{6,}\b/g, "")
    // "cc" como unidad → ml (SEPA usa cc para líquidos, PY usa ml)
    .replace(/(\d)\s*cc\b/gi, "$1 ml")
    // Eliminar multiplicadores de pack ANTES de normalizar unidades:
    // "Pack 12", "Promo 2x1", "Oferta 3", "x 6", "x 100 g", "x 4 unidades", "x 30 grs"
    .replace(/\b(?:pack|promo|promoción|promocion|oferta)\s*\d+(?:[xX]\d+)?\b/gi, "")
    .replace(/\s+x\s*\d+\s*(?:uni?ds?|unidades?|packs?|g|grs?|ml|l|cc|kg)?\b/gi, "")
    // Eliminar patrones "N x N" tipo promo (2x1, 3x2, etc.)
    .replace(/\b\d+\s*x\s*\d+\b/gi, "")
    // "grs" / "gr" / "gramos" → g (después de eliminar "x N grs")
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
