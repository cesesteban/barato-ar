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

type ChainBuilder = (query: string) => string;

/**
 * URL de search de una tienda VTEX (Carrefour, Día, Jumbo, Vea, Disco,
 * Changomas, Farmacity comparten esta convención):
 *   https://{host}/{slug}?_q={query}&map=ft
 * El `slug` en el path ayuda al SEO de la tienda pero no es requerido.
 */
function vtexSearch(host: string, q: string): string {
  const slug = encodeURIComponent(q.replace(/\s+/g, "-").toLowerCase());
  const encoded = encodeURIComponent(q);
  return `https://${host}/${slug}?_q=${encoded}&map=ft`;
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
 */
const STORE_LINK_BUILDERS: Record<string, ChainBuilder> = {
  // VTEX supermercados
  carrefour: (q) => vtexSearch("www.carrefour.com.ar", q),
  dia: (q) => vtexSearch("diaonline.supermercadosdia.com.ar", q),
  jumbo: (q) => vtexSearch("www.jumbo.com.ar", q),
  vea: (q) => vtexSearch("www.vea.com.ar", q),
  disco: (q) => vtexSearch("www.disco.com.ar", q),
  changomas: (q) => vtexSearch("www.changomas.com.ar", q),
  // VTEX farmacia
  farmacity: (q) => vtexSearch("www.farmacity.com", q),
  // Custom
  coto: (q) =>
    `https://www.cotodigital3.com.ar/sitios/cdigi/browse?Ntt=${encodeURIComponent(q)}`,
  "la-anonima": (q) =>
    `https://laanonimaonline.com/busqueda?q=${encodeURIComponent(q)}`,
};

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

  const query = buildDeliveryQuery(ctx.productName, ctx.brand ?? null);

  // Prioridad 2: builder específico por chain
  const chainBuilder = STORE_LINK_BUILDERS[ctx.chainSlug];
  if (chainBuilder) {
    return chainBuilder(query);
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
