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
 * Mapa de chainSlug → hostname del sitio oficial. Se usa para:
 *   1. Cuando hay afiliado configurado, construir URL nativa con tracking
 *      (VTEX `?_q=X&map=ft`, Coto `Ntt=X`, La Anónima `busqueda?q=X`).
 *   2. Como filtro `site:X` para Google site search cuando NO hay afiliado.
 *
 * Decisión pragmática (F021): sin afiliado configurado, la URL nativa de
 * cada cadena es demasiado estricta y suele dar "producto no encontrado"
 * porque los catálogos usan títulos propios que no matchean nuestro query
 * SEPA. Google encuentra el producto en el mismo dominio sin ese problema.
 * Perdemos control del intermedio (usuario pasa por Google) pero garantizamos
 * que el link SIEMPRE encuentra el producto. Cuando exista deal con afiliado,
 * cambiamos a URL nativa (el tracking no funciona vía Google).
 */
const STORE_HOSTNAMES: Record<string, string> = {
  carrefour: "www.carrefour.com.ar",
  dia: "diaonline.supermercadosdia.com.ar",
  jumbo: "www.jumbo.com.ar",
  vea: "www.vea.com.ar",
  disco: "www.disco.com.ar",
  changomas: "www.changomas.com.ar",
  farmacity: "www.farmacity.com",
  coto: "www.cotodigital3.com.ar",
  "la-anonima": "laanonimaonline.com",
};

/**
 * Builders nativos por cadena — usados SOLO cuando hay afiliado configurado.
 * Sin afiliado, cae a Google site search por peor UX de los sites nativos.
 */
const NATIVE_STORE_BUILDERS: Record<string, ChainBuilder> = {
  carrefour: (q) => vtexSearch("www.carrefour.com.ar", q),
  dia: (q) => vtexSearch("diaonline.supermercadosdia.com.ar", q),
  jumbo: (q) => vtexSearch("www.jumbo.com.ar", q),
  vea: (q) => vtexSearch("www.vea.com.ar", q),
  disco: (q) => vtexSearch("www.disco.com.ar", q),
  changomas: (q) => vtexSearch("www.changomas.com.ar", q),
  farmacity: (q) => vtexSearch("www.farmacity.com", q),
  coto: (q) => `https://www.cotodigital3.com.ar/sitios/cdigi/browse?Ntt=${encodeURIComponent(q)}`,
  "la-anonima": (q) => `https://laanonimaonline.com/busqueda?q=${encodeURIComponent(q)}`,
};

/**
 * Resuelve el URL final al que debe llevar el botón "Ir a la tienda".
 *
 * Orden de prioridad (F019 + F021):
 *   1. `storeProductUrl` explícito (folleto capturó PDP) → PDP directo.
 *   2. Delivery partner de F014 (PY, Rappi, ML) — reutiliza builder de F017.7
 *      (Google si sin afiliado, nativo con partner ID si hay afiliado).
 *   3. Chain con affiliate configurado → URL nativa (VTEX/Coto/La Anónima)
 *      para preservar tracking del deal. F021 aún no implementa este check
 *      por chain — todos los super hoy caen al fallback Google (no hay deals).
 *   4. Chain conocido (hostname en STORE_HOSTNAMES) SIN afiliado → Google
 *      site search sobre ese dominio. UX: user pasa por Google, aterriza
 *      en la página real del producto en la cadena. Garantiza que el link
 *      SIEMPRE encuentre resultado — los sites VTEX/custom eran demasiado
 *      estrictos con el query SEPA y daban "producto no encontrado".
 *   5. Chain desconocido con `chainWebsiteUrl` → Google site search fallback.
 *   6. Null — caller decide fallback.
 */
export function resolveStoreLink(ctx: StoreLinkContext): string | null {
  // Prioridad 1: PDP directo (folleto)
  if (ctx.storeProductUrl && /^https?:\/\//.test(ctx.storeProductUrl)) {
    return ctx.storeProductUrl;
  }

  const query = buildDeliveryQuery(ctx.productName, ctx.brand ?? null);

  // Prioridad 2: delivery partner (F014) — misma URL que <DeliveryLinks>
  const partner = DELIVERY_PARTNERS.find((p) => p.slug === ctx.chainSlug);
  if (partner) {
    const affiliateId = readAffiliateIds()[partner.slug];
    return partner.buildSearchUrl(query, affiliateId);
  }

  // Prioridad 3: chain conocido — Google site search sobre su hostname.
  // Cuando existan deals con afiliado, cambiar acá a NATIVE_STORE_BUILDERS
  // para preservar tracking. Hoy: 0 chains con afiliado activo.
  const knownHost = STORE_HOSTNAMES[ctx.chainSlug];
  if (knownHost) {
    return googleSiteSearch(knownHost, query);
  }

  // Prioridad 5: chain desconocido con websiteUrl → Google fallback
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

// Re-export para tests o code que use el builder nativo directo (deal futuro)
export const NATIVE_BUILDERS = NATIVE_STORE_BUILDERS;
