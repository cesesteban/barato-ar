/**
 * Helpers para JSON-LD (schema.org) — F007 y F012.
 */

import { env } from "./env";

export function orgJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Barato.ar",
    url: env.NEXT_PUBLIC_APP_URL,
    logo: `${env.NEXT_PUBLIC_APP_URL}/logo-512.png`,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Barato.ar",
    url: env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${env.NEXT_PUBLIC_APP_URL}/buscar?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export type ProductJsonLdOffer = {
  price: number;
  priceCurrency?: string | undefined;
  sellerName: string;
  priceValidUntil?: string | undefined;
  url?: string | undefined;
};

export function productJsonLd(input: {
  name: string;
  slug: string;
  brand: string | null;
  imageUrl: string | null;
  eanCode: string | null;
  offers: ProductJsonLdOffer[];
  minPrice: number | null;
  maxPrice: number | null;
}) {
  const jsonld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    url: `${env.NEXT_PUBLIC_APP_URL}/producto/${input.slug}`,
  };
  if (input.brand) jsonld.brand = { "@type": "Brand", name: input.brand };
  if (input.imageUrl) jsonld.image = input.imageUrl;
  if (input.eanCode) jsonld.gtin = input.eanCode;

  if (input.offers.length > 0 && input.minPrice != null && input.maxPrice != null) {
    jsonld.offers = {
      "@type": "AggregateOffer",
      priceCurrency: "ARS",
      lowPrice: input.minPrice,
      highPrice: input.maxPrice,
      offerCount: input.offers.length,
      offers: input.offers.slice(0, 10).map((o) => ({
        "@type": "Offer",
        price: o.price,
        priceCurrency: o.priceCurrency ?? "ARS",
        seller: { "@type": "Organization", name: o.sellerName },
        availability: "https://schema.org/InStock",
        ...(o.priceValidUntil ? { priceValidUntil: o.priceValidUntil } : {}),
        ...(o.url ? { url: o.url } : {}),
      })),
    };
  }
  return jsonld;
}
