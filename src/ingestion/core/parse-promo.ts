/**
 * Detección de patrones de promociones combo (C-001) en texto de folletos.
 * Reconoce: 2x1, 3x2, "lleva 3 paga 2", "2do al 70%", "3 iguales 20%".
 */

export type ParsedPromo = {
  promoType: "unit" | "nx1" | "nxm" | "second_off" | "bundle_discount";
  promoBuyQty?: number;
  promoPayQty?: number;
  promoSecondDiscountPct?: number;
  promoDescription: string;
};

const NX1_RE = /(\d)\s*[xX×]\s*1\b/;
const NXM_RE = /(\d)\s*[xX×]\s*(\d)\b/;
const LLEVA_PAGA_RE = /lleva[^\d]{0,5}(\d+)[^\d]{0,20}paga[^\d]{0,5}(\d+)/i;
const SECOND_OFF_RE = /(?:2do|2°|2º|segundo)\s*(?:al|con)?\s*(\d{1,2})\s*%/i;
const BUNDLE_RE = /(\d+)\s*iguales?[^\d]{0,20}(\d{1,2})\s*%/i;

export function parsePromoFromText(rawText: string): ParsedPromo {
  const text = rawText.trim();
  if (!text) return { promoType: "unit", promoDescription: "" };

  // "Lleva N Paga M" antes de NxM por especificidad.
  const llevaPaga = LLEVA_PAGA_RE.exec(text);
  if (llevaPaga && llevaPaga[1] && llevaPaga[2]) {
    const buy = Number(llevaPaga[1]);
    const pay = Number(llevaPaga[2]);
    if (buy > pay) {
      return pay === 1
        ? { promoType: "nx1", promoBuyQty: buy, promoDescription: text }
        : { promoType: "nxm", promoBuyQty: buy, promoPayQty: pay, promoDescription: text };
    }
  }

  const secondOff = SECOND_OFF_RE.exec(text);
  if (secondOff && secondOff[1]) {
    return {
      promoType: "second_off",
      promoSecondDiscountPct: Number(secondOff[1]),
      promoDescription: text,
    };
  }

  const bundle = BUNDLE_RE.exec(text);
  if (bundle && bundle[1] && bundle[2]) {
    return {
      promoType: "bundle_discount",
      promoBuyQty: Number(bundle[1]),
      promoSecondDiscountPct: Number(bundle[2]),
      promoDescription: text,
    };
  }

  const nxm = NXM_RE.exec(text);
  if (nxm && nxm[1] && nxm[2]) {
    const buy = Number(nxm[1]);
    const pay = Number(nxm[2]);
    if (buy > pay) {
      return pay === 1
        ? { promoType: "nx1", promoBuyQty: buy, promoDescription: text }
        : { promoType: "nxm", promoBuyQty: buy, promoPayQty: pay, promoDescription: text };
    }
  }

  const nx1 = NX1_RE.exec(text);
  if (nx1 && nx1[1]) {
    return { promoType: "nx1", promoBuyQty: Number(nx1[1]), promoDescription: text };
  }

  return { promoType: "unit", promoDescription: text };
}
