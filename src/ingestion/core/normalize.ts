/**
 * Normalización de nombres y detección de packagingFlag (C-004).
 */

const PACKAGING_PATTERNS: Array<{ flag: string; re: RegExp }> = [
  { flag: "retornable", re: /\b(retornable|ret\.?|retornables)\b/i },
  { flag: "descartable", re: /\b(descartable|descart\.?|no ?retornable)\b/i },
  { flag: "light", re: /\b(light|lite|liviana|liviano)\b/i },
  { flag: "zero", re: /\b(zero|sin ?azúcar|sin ?azucar)\b/i },
  { flag: "sin_gas", re: /\bsin ?gas\b/i },
  { flag: "con_gas", re: /\bcon ?gas\b/i },
  { flag: "descremada", re: /\b(descremada|descremado|light)\b/i },
  { flag: "entera", re: /\bentera\b/i },
];

/**
 * Normaliza un nombre de producto:
 *   1) lowercase, remove acentos, remove símbolos y espacios múltiples
 *   2) tokens ordenados alfabéticamente para matching estable
 */
export function normalizeName(raw: string): string {
  const cleaned = raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(" ").filter(Boolean).sort();
  return tokens.join(" ");
}

export function detectPackagingFlag(name: string): string | null {
  for (const { flag, re } of PACKAGING_PATTERNS) {
    if (re.test(name)) return flag;
  }
  return null;
}

/**
 * Genera slug URL-friendly para `Product.slug`.
 * Máx 100 chars; se limita para SEO y para evitar branches largos.
 */
export function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}
