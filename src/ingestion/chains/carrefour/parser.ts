/**
 * Parser HTML del folleto semanal de Carrefour.
 * El folleto real es JSON-LD embebido; usamos Cheerio como fallback.
 * Estructura esperada (fixture): cada producto en un `<article class="product-card">`
 * con data-attrs y texto para promo.
 */

import { load } from "cheerio";
import type { ParsedItem } from "../../core/types";

const SIZE_RE = /(\d+(?:[.,]\d+)?)\s*(ml|cc|l|lts?|litros?|g|gr|grs|gramos|kg|kgs|kilos?|un|unidades|u|rollos?|sobres?)\b/i;

export function parseCarrefourFlyer(html: string, sourceUrl: string): ParsedItem[] {
  const $ = load(html);
  const items: ParsedItem[] = [];
  const validFrom = extractDate($('meta[name="valid-from"]').attr("content")) ?? new Date().toISOString();
  const validTo = extractDate($('meta[name="valid-to"]').attr("content"));

  $("article.product-card").each((_, node) => {
    const $card = $(node);
    const productName = $card.find(".product-name").text().trim();
    if (!productName) return;

    const brand = $card.find(".product-brand").text().trim() || undefined;
    const category = $card.attr("data-category") ?? undefined;
    const eanCode = $card.attr("data-ean") ?? undefined;
    const productHref = $card.find("a.product-link").attr("href");
    const storeProductUrl = productHref ? absolutize(productHref, sourceUrl) : undefined;

    const priceText = $card.find(".price-current").text();
    const previousText = $card.find(".price-previous").text();
    const promoText = $card.find(".promo-label").text().trim();
    const sizeText = $card.find(".product-size").text().trim();

    const price = parseNumber(priceText);
    if (!price) return; // sin precio válido no ingestamos
    const previousPrice = parseNumber(previousText);

    const { size, unit } = extractSizeUnit(sizeText || productName);

    const item: ParsedItem = {
      productName,
      brand,
      size,
      unit,
      category,
      eanCode,
      price,
      previousPrice,
      validFrom,
      validTo,
      sourceUrl,
      storeProductUrl,
      promoDescription: promoText || undefined,
    };
    items.push(item);
  });

  return items;
}

function parseNumber(raw: string): number | undefined {
  if (!raw) return undefined;
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(/,/g, ".");
  const num = Number(cleaned);
  return Number.isFinite(num) && num > 0 ? num : undefined;
}

function extractSizeUnit(text: string): { size?: number; unit?: string } {
  const match = SIZE_RE.exec(text);
  if (!match || !match[1] || !match[2]) return {};
  const size = Number(match[1].replace(",", "."));
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(size) || size <= 0) return {};
  return { size, unit };
}

function extractDate(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString() : undefined;
}

function absolutize(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
