/**
 * DTOs para /producto/[slug] (F007).
 */

export type Proximity = "in_zone" | "nearby" | "national";

export type ComparisonStoreRow = {
  storeId: string;
  storeName: string;
  address: string | null;
  chainSlug: string;
  chainName: string;
  price: number;
  previousPrice: number | null;
  discountPct: number | null;
  pricePerUnit: number | null;
  pricePerUnitEff: number | null;
  promoType: "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount";
  promoBuyQty: number | null;
  promoPayQty: number | null;
  promoSecondDiscountPct: number | null;
  capturedAt: Date;
  validTo: Date | null;
  source: string;
  storeProductUrl: string | null;
  distanceKm: number | null;
  proximity: Proximity;
  deltaVsAvgPct: number | null;
};

export type ComparisonView = {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    eanCode: string | null;
    size: number | null;
    unit: string | null;
    standardSize: number | null;
    standardUnit: string | null;
    packagingFlag: string | null;
    canonicalId: string | null;
  };
  stores: {
    inZone: ComparisonStoreRow[];
    nearby: ComparisonStoreRow[];
    national: ComparisonStoreRow[];
  };
  avg30d: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  zoneSlug: string;
  variantOfPackaging: { slug: string; name: string; packagingFlag: string } | null;
};
