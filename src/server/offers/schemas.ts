import { z } from "zod";

export const OffersParamsSchema = z.object({
  zone: z.string().default("caba-palermo"),
  vertical: z.enum(["supermarket", "delivery", "pharmacy", "beverages"]).optional(),
  chains: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",").map((s) => s.trim()).filter(Boolean) : [])),
  minDiscount: z.coerce.number().min(0).max(100).default(0),
  // Default 10km a la redonda de la zona del usuario.
  maxDistanceKm: z.coerce.number().min(0).max(50).default(10),
  validity: z.enum(["today", "week", "month"]).default("week"),
  sort: z.enum(["discount", "new", "popular", "price_unit"]).default("discount"),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(24),
  includeNearby: z
    .preprocess((v) => {
      if (v == null) return true;
      if (typeof v === "boolean") return v;
      if (typeof v === "string") return !/^(false|0|no)$/i.test(v);
      return Boolean(v);
    }, z.boolean())
    .default(true),
  /**
   * Cuando true, dedup a nivel producto: solo la cadena más barata por producto
   * (mejor oferta) y `discountPct` se computa vs promedio del producto en las
   * demás cadenas. Requiere `minChainCount` cadenas o más con precio.
   */
  onlyBestPerProduct: z
    .preprocess((v) => {
      if (v == null) return true;
      if (typeof v === "boolean") return v;
      if (typeof v === "string") return !/^(false|0|no)$/i.test(v);
      return Boolean(v);
    }, z.boolean())
    .default(true),
  minChainCount: z.coerce.number().int().min(1).max(20).default(1),
});
export type OffersParams = z.infer<typeof OffersParamsSchema>;

export type OfferListing = {
  id: string;
  productId: string;
  productSlug: string;
  productName: string;
  productBrand: string | null;
  productImageUrl: string | null;
  chainSlug: string;
  chainName: string;
  storeId: string;
  storeName: string;
  price: number;
  previousPrice: number | null;
  discountPct: number | null;
  pricePerUnit: number | null;
  pricePerUnitEff: number | null;
  standardUnit: string | null;
  standardSize: number | null;
  promoType: "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount";
  promoBuyQty: number | null;
  promoPayQty: number | null;
  promoSecondDiscountPct: number | null;
  validTo: string | null;
  distanceKm: number | null;
  proximity: "in_zone" | "nearby" | "national";
  score: number;
};

export type OffersResponse = {
  items: OfferListing[];
  nextCursor: string | null;
  total: number;
  ms: number;
  facets: {
    chains: Array<{ slug: string; name: string; count: number }>;
    verticals: Array<{ slug: string; count: number }>;
  };
};
