/**
 * Contratos compartidos por los parsers de F003.
 * Un parser emite `ParsedItem` por producto; el runner los normaliza y
 * los upserta idempotentemente.
 */

export type ParsedItem = {
  productName: string;
  brand?: string | undefined;
  size?: number | undefined;
  unit?: string | undefined;
  packagingFlag?: string | undefined;
  category?: string | undefined;
  eanCode?: string | undefined;

  price: number;
  previousPrice?: number | undefined;

  // C-001
  promoType?: "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount" | undefined;
  promoBuyQty?: number | undefined;
  promoPayQty?: number | undefined;
  promoSecondDiscountPct?: number | undefined;
  promoDescription?: string | undefined;

  validFrom: string; // ISO
  validTo?: string | undefined;
  sourceUrl: string;
  storeProductUrl?: string | undefined;
};

export type ChainParser = {
  chainId: string;
  fetch(): Promise<{ raw: string; sourceUrl: string; capturedAt: Date }>;
  parse(raw: string, sourceUrl: string): AsyncIterable<ParsedItem>;
};

export type ParserRunSummary = {
  runId: string;
  rowsIngested: number;
  rowsSkipped: number;
  status: "success" | "partial" | "failed";
  errorMessage?: string | undefined;
  durationMs: number;
};
