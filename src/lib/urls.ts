/**
 * Builders de URLs internas que preservan estado del usuario (zone).
 *
 * Uso: en cualquier server component que renderice cards/rows con href a
 * `/producto/[slug]` o `/tienda/[slug]`, invocar `productHref` / `tiendaHref`
 * en lugar de concatenar manualmente. Garantiza que el `?zone=` viaje entre
 * páginas — sin esto el detalle del producto siempre resuelve al default.
 */

import { DEFAULT_ZONE_SLUG } from "@/lib/zones-catalog";

export function productHref(slug: string, zone?: string | null): string {
  const z = zone ?? DEFAULT_ZONE_SLUG;
  return `/producto/${slug}?zone=${encodeURIComponent(z)}`;
}

export function tiendaHref(slug: string, zone?: string | null): string {
  const z = zone ?? DEFAULT_ZONE_SLUG;
  return `/tienda/${slug}?zone=${encodeURIComponent(z)}`;
}

export function ofertasHref(params: {
  zone?: string | null;
  vertical?: string | null;
  chain?: string | null;
} = {}): string {
  const sp = new URLSearchParams();
  if (params.zone) sp.set("zone", params.zone);
  if (params.vertical) sp.set("vertical", params.vertical);
  if (params.chain) sp.set("chain", params.chain);
  const q = sp.toString();
  return q ? `/ofertas?${q}` : "/ofertas";
}
