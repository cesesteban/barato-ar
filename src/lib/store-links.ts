/**
 * store-links (F019) — resuelve el URL externo al que lleva "Ir a la tienda"
 * en `PriceComparisonRow`.
 *
 * Orden de prioridad:
 *   1. `storeProductUrl` explícito (parser folleto capturó PDP directo)
 *   2. Builder específico por chain (VTEX + Coto/La Anónima custom + Farmacity)
 *   3. Delivery partner de F014 (PY, Rappi, ML) — misma URL que <DeliveryLinks>
 *   4. Google site search sobre `chainWebsiteUrl` (fallback para chains nuevas)
 *   5. `null` → caller decide fallback (típicamente chainWebsiteUrl root)
 *
 * Los links se abren en new tab con rel="noopener noreferrer nofollow" salvo
 * que exista afiliado configurado (F014), en cuyo caso `sponsored`.
 */

import {
  DELIVERY_PARTNERS,
  buildDeliveryQuery,
  readAffiliateIds,
} from "./deep-links";

export type StoreLinkContext = {
  chainSlug: string;
  productName: string;
  brand: string | null | undefined;
  /** Si el parser folleto capturó PDP directo, prioridad absoluta */
  storeProductUrl?: string | null | undefined;
  /** Chain.websiteUrl como último recurso para fallback Google site search */
  chainWebsiteUrl?: string | null | undefined;
};

type ChainBuilder = (query: string, brand?: string | null) => string;

/**
 * Limpia prefijos y sufijos comunes en nombres de productos SEPA que
 * ensucian el slug de VTEX y rompen las URLs de búsqueda.
 *
 * Se aplica tanto al segmento de "slug" como al query param _q.
 * El query ya viene procesado por buildDeliveryQuery (puede tener
 * la marca preprendida), así que los prefijos pueden estar al inicio
 * o después de un espacio.
 */
function cleanForVTEX(query: string): string {
  return query
    // Prefijos basura típicos de SEPA — al inicio O precedidos de espacio
    .replace(/(^|\s)s\/?d\.?\s+/gi, "$1")           // "S/d ", "S/d.", "S/d", "s/d "
    .replace(/(^|\s)sin\s+descripci[oó]n\s+/gi, "$1") // "Sin descripción "
    .replace(/(^|\s)sin\s+desc\.?\s+/gi, "$1")      // "Sin desc. "
    // Sufijos de presentación/packaging comunes en SEPA
    .replace(/\s+x\s+\d+(?:[.,]\d+)?\s*(?:g|gr|grs|grms|kg|ml|l|cc|un|uds?|unidades?)\b/gi, "")
    .replace(/\b(?:pack|promo|promocion|promoción|oferta)\s*(?:de|x)?\s*\d+/gi, "")
    // Colapsar espacios
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * URL de search de una tienda VTEX (Carrefour, Día, Jumbo, Vea, Disco,
 * Changomas, Farmacity comparten esta convención).
 *
 * Patrón óptimo: homepage con `_q` param que pre-lena el buscador
 * + `map=ft` para forzar resultados de full-text search (auto-ejecuta).
 *   https://{host}/?_q={query}&map=ft
 *
 * El `_q` pre-lena la caja de búsqueda visible al usuario.
 * El `map=ft` dispara la búsqueda automáticamente (evita el bug "borrar 1 letra para que busque").
 */
function vtexSearch(host: string, q: string, brand?: string | null): string {
  const cleanedForSlug = cleanForVTEX(q);

  // Para el query param, incluir la marca si está disponible
  let queryForSearch = cleanedForSlug;
  if (brand && !cleanedForSlug.toLowerCase().includes(brand.toLowerCase())) {
    queryForSearch = `${cleanedForSlug} ${brand}`;
  }

  const encoded = encodeURIComponent(queryForSearch);
  // Homepage con _q (pre-fill) + map=ft (auto-search)
  return `https://${host}/?_q=${encoded}&map=ft`;
}

/**
 * Google site search — fallback universal. Google indexa las páginas de
 * producto de casi cualquier e-commerce; el usuario aterriza en resultados
 * relevantes y click va al PDP real. Perdemos control del intermediate step
 * pero es el failsafe más robusto.
 */
function googleSiteSearch(hostname: string, q: string): string {
  const query = `site:${hostname} ${q}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/**
 * Mapa de chainSlug → builder de URL de búsqueda en el sitio de la cadena.
 *
 * Cuando se agrega una cadena nueva al seed (`prisma/seed/chains.ts`),
 * agregar su entry acá. Si comparte convención VTEX, usar `vtexSearch`.
 * Si tiene URL scheme propia, agregar builder custom.
 *
 * Para VTEX: pasamos (query, brand) para que el _q param incluya la marca.
 * Para custom: solo usan query.
 */
const STORE_LINK_BUILDERS: Record<string, ChainBuilder> = {
  // VTEX supermercados - pasamos brand para enriquecer el _q param
  carrefour: (q, brand) => vtexSearch("www.carrefour.com.ar", q, brand),
  dia: (q, brand) => vtexSearch("diaonline.supermercadosdia.com.ar", q, brand),
  jumbo: (q, brand) => vtexSearch("www.jumbo.com.ar", q, brand),
  vea: (q, brand) => vtexSearch("www.vea.com.ar", q, brand),
  disco: (q, brand) => vtexSearch("www.disco.com.ar", q, brand),
  changomas: (q, brand) => vtexSearch("www.changomas.com.ar", q, brand),
  // VTEX farmacia
  farmacity: (q, brand) => vtexSearch("www.farmacity.com", q, brand),
  // Custom - solo usan query
  coto: (q) =>
    `https://www.cotodigital3.com.ar/sitios/cdigi/browse?Ntt=${encodeURIComponent(q)}`,
  "la-anonima": (q) =>
    `https://laanonimaonline.com/busqueda?q=${encodeURIComponent(q)}`,
};

/** Chains que usan VTEX — para ellos NO prepender la marca (no está en sus títulos) */
const VTEX_CHAINS = new Set([
  "carrefour",
  "dia",
  "jumbo",
  "vea",
  "disco",
  "changomas",
  "farmacity",
]);

/**
 * Resuelve el URL final al que debe llevar el botón "Ir a la tienda".
 * Retorna null solo si no hay chainWebsiteUrl ni builder — el caller debe
 * fallback a "#" o esconder el link.
 */
export function resolveStoreLink(ctx: StoreLinkContext): string | null {
  // Prioridad 1: PDP directo (folleto)
  if (ctx.storeProductUrl && /^https?:\/\//.test(ctx.storeProductUrl)) {
    return ctx.storeProductUrl;
  }

  // Para VTEX no prepender la marca en el query principal (sus títulos no la incluyen al inicio)
  // Pero SÍ pasamos la marca al builder para que la incluya en el _q param de VTEX
  const brandForQuery = VTEX_CHAINS.has(ctx.chainSlug) ? null : ctx.brand ?? null;
  const query = buildDeliveryQuery(ctx.productName, brandForQuery);

  // Prioridad 2: builder específico por chain
  const chainBuilder = STORE_LINK_BUILDERS[ctx.chainSlug];
  if (chainBuilder) {
    // Para VTEX, pasamos la marca original para enriquecer _q
    const brandForVTEX = VTEX_CHAINS.has(ctx.chainSlug) ? ctx.brand ?? null : undefined;
    return chainBuilder(query, brandForVTEX);
  }

  // Prioridad 3: delivery partner (F014) — misma URL que <DeliveryLinks>
  const partner = DELIVERY_PARTNERS.find((p) => p.slug === ctx.chainSlug);
  if (partner) {
    const affiliateId = readAffiliateIds()[partner.slug];
    return partner.buildSearchUrl(query, affiliateId);
  }

  // Prioridad 4: Google site search sobre el dominio de la cadena
  if (ctx.chainWebsiteUrl) {
    try {
      const hostname = new URL(ctx.chainWebsiteUrl).hostname;
      return googleSiteSearch(hostname, query);
    } catch {
      // websiteUrl malformada — cae al null
    }
  }

  return null;
}
