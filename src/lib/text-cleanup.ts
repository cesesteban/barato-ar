/**
 * Normalización de textos crudos de SEPA (Precios Claros).
 *
 * Los datasets de las cadenas mandan strings en MAYÚSCULAS con abreviaturas
 * inconsistentes ("CHUPETINES SAB.FRUT.Y VAINILLA PAL.DE LA SELVA PAQ 432 GRM")
 * y códigos de packaging del propio SEPA ("BOT-1000-ml.", "PCK-6-un.").
 * Estas funciones producen versiones limpias para mostrar al usuario:
 *   - Strip códigos SEPA
 *   - Strip chain names al inicio (Carrefour, Coto, ...)
 *   - Expansión de abreviaturas comunes (Cerv → Cerveza, C → con)
 *   - Normalización de unidades (GRM → g, LT → L)
 *   - Dedup palabras consecutivas repetidas
 *   - Title Case español-aware
 *   - Limpieza de marca via BRAND_CATALOG
 */

import { resolveBrand, extractBrandFromName } from "./brand-catalog";

/**
 * Códigos SEPA de packaging que persisten en names crudos:
 *   BOT-1000-ml., PCK-6-un., LAT-473-cc., PAQ-500-g., etc.
 * Mismo regex que en `buildDeliveryQuery` (F017.8) — DRY sería extraer a
 * un helper compartido pero por ahora duplicamos por claridad.
 */
const SEPA_PACKAGING_CODE_RE = /\b[A-Z]{2,4}-\d+(?:[.,]\d+)?-[A-Za-z]+\.?/gi;

/**
 * Chain names que se strippan al INICIO del name para evitar redundancia
 * ("Carrefour Cristal Focaccia" → "Cristal Focaccia" — la card ya muestra
 * el chain badge). Match case-insensitive con word boundary.
 */
const CHAIN_NAMES_TO_STRIP = [
  "Carrefour",
  "Coto",
  "Día",
  "Dia",
  "Jumbo",
  "Vea",
  "Disco",
  "La Anónima",
  "La Anonima",
  "Changomas",
  "Farmacity",
];
const CHAIN_STRIP_RE = new RegExp(
  `^(?:${CHAIN_NAMES_TO_STRIP.map((n) => n.replace(/\s+/g, "\\s+")).join("|")})\\s+`,
  "i",
);

const ABBREV_EXPANSIONS: Array<[RegExp, string]> = [
  // ===== Compuestos primero (deben ganar antes que sueltos) =====
  [/\bPAL\.?\s*DE\s*LA\s*SELVA\b/gi, "Palo de la Selva"],
  [/\bSAB\.?\s*FRUT\.?\s*Y\b/gi, "Sabor Frutas y"],
  [/\bC\/FRUT\.?/gi, "c/Frutas"],
  [/\bCON\s+FRUT\.?/gi, "con Frutas"],

  // ===== Abreviaturas terminadas en "." o pegadas =====
  [/\bSAB\.\s*/gi, "Sabor "],
  [/\bFRUT\.\s*/gi, "Frutas "],
  [/\bPAQ\.?(?=\s|\d)/gi, "Paquete"],
  [/\bENV\.?(?=\s|\d)/gi, "Envase"],
  [/\bBLIST\.?(?=\s|\d)/gi, "Blister"],
  [/\bBOT\.?(?=\s|\d)/gi, "Botella"],
  [/\bLAT\.?(?=\s|\d)/gi, "Lata"],
  [/\bDIET\.\s*/gi, "Dieta "],
  [/\bORIG\.\s*/gi, "Original "],
  [/\bC\/GAS\b/gi, "con gas"],
  [/\bS\/GAS\b/gi, "sin gas"],
  [/\bC\/SAL\b/gi, "con sal"],
  [/\bS\/SAL\b/gi, "sin sal"],
  [/\bDESCREM\.?\s*/gi, "Descremada "],
  [/\bENT\.\s*/gi, "Entera "],
  [/\bSIN\s+TACC\b/gi, "sin TACC"],

  // ===== Whole-word abreviaturas comunes (F020) =====
  [/\bCERV\b\.?/gi, "Cerveza"],
  [/\bRET\b\.?/gi, "Retornable"],
  [/\bEXTR\b\.?/gi, "Extra"],
  [/\bDESCR\b\.?/gi, "Descremada"],
  [/\bSEMIDESCRE\b\.?/gi, "Semidescremada"],
  [/\bMUZZARE\b\.?/gi, "Muzzarella"],
  [/\bRECTAN\b\.?/gi, "Rectangular"],
  [/\bCHOC\b\.?/gi, "Chocolate"],
  [/\bGASEO\b\.?/gi, "Gaseosa"],
  [/\bALFA\b\.?/gi, "Alfajor"],
];

/**
 * Conectores SEPA sueltos: " C " → " con ", " D " → " de ", " X " → " x ".
 * IMPORTANTE: usan lookbehind/lookahead de espacios explícitos para NO
 * matchear letras dentro de palabras o pegadas a números ("1L", "6xC").
 */
const CONNECTORS_LOOSE: Array<[RegExp, string]> = [
  [/(?<=\s)C(?=\s)/g, "con"],
  [/(?<=\s)D(?=\s)/g, "de"],
  [/(?<=\s)X(?=\s)/g, "x"],
];

const UNIT_ABBREV: Array<[RegExp, string]> = [
  [/(\d+(?:\.\d+)?)\s*GRM?\b/gi, "$1 g"],
  [/(\d+(?:\.\d+)?)\s*GRS\b/gi, "$1 g"],
  [/(\d+(?:\.\d+)?)\s*GRAMOS\b/gi, "$1 g"],
  [/(\d+(?:\.\d+)?)\s*KG\b/gi, "$1 kg"],
  [/(\d+(?:\.\d+)?)\s*KILOS?\b/gi, "$1 kg"],
  [/(\d+(?:\.\d+)?)\s*LTS?\b/gi, "$1 L"],
  [/(\d+(?:\.\d+)?)\s*LITROS?\b/gi, "$1 L"],
  [/(\d+(?:\.\d+)?)\s*ML\b/gi, "$1 ml"],
  [/(\d+(?:\.\d+)?)\s*MLTS?\b/gi, "$1 ml"],
  [/(\d+(?:\.\d+)?)\s*CC\b/gi, "$1 cc"],
  [/(\d+)\s*UN\.?\b/gi, "$1 un"],
  [/(\d+)\s*U\.?\b/gi, "$1 un"],
];

const CONNECTORS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "e",
  "o",
  "u",
  "con",
  "sin",
  "en",
  "para",
  "por",
  "al",
  "a",
]);

const KEEP_UPPERCASE = new Set(["TACC", "PET", "PVC"]);

// Unidades multi-letter que aparecen sueltas post-expansión y no queremos capitalizar.
// "L" singular para litros PREFERE mayúscula (convención tipográfica), por eso NO está acá.
const LOWERCASE_UNITS = new Set(["g", "kg", "ml", "cc", "un", "u"]);

// Conectores sueltos (post-cleanup C/D/X) que deben ir en minúscula.
const LOWERCASE_CONNECTORS = new Set(["x"]);

function toTitleCaseEs(input: string): string {
  return input
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return word;
      const lower = word.toLowerCase();
      if (LOWERCASE_UNITS.has(lower)) return lower;
      if (LOWERCASE_CONNECTORS.has(lower)) return lower;
      // "L" singular para litros: mayúscula
      if (word === "L" || lower === "l") return "L";
      if (KEEP_UPPERCASE.has(word.toUpperCase())) return word.toUpperCase();
      if (idx > 0 && CONNECTORS.has(lower)) return lower;
      if (/\d/.test(word)) return word;
      const first = lower.charAt(0).toUpperCase();
      return first + lower.slice(1);
    })
    .join(" ");
}

/**
 * Colapsa palabras consecutivas repetidas (case-insensitive):
 *   "Cerveza Cerveza Extra" → "Cerveza Extra"
 * Preserva la primera aparición y su casing.
 */
function dedupConsecutiveWords(input: string): string {
  const words = input.split(/\s+/);
  const out: string[] = [];
  let prev = "";
  for (const w of words) {
    if (w.toLowerCase() !== prev.toLowerCase()) {
      out.push(w);
    }
    prev = w;
  }
  return out.join(" ");
}

export type CleanNameOptions = {
  /** Si true, no strippea chain names al inicio (útil para tests o white-label deliberado). */
  skipChainStrip?: boolean;
};

/**
 * Convierte "CHUPETINES SAB.FRUT.Y VAINILLA PAL.DE LA SELVA PAQ 432 GRM"
 * en "Chupetines Sabor Frutas y Vainilla Palo de la Selva Paquete 432 g".
 *
 * También strip códigos SEPA (BOT-N-ml, PCK-N-un) y chain names al inicio
 * (F020). Idempotente y seguro para nombres ya bonitos.
 */
export function cleanProductName(raw: string, opts?: CleanNameOptions): string {
  if (!raw) return raw;
  let cleaned = raw.trim();

  // 1. Strip códigos SEPA de packaging (F020)
  cleaned = cleaned.replace(SEPA_PACKAGING_CODE_RE, "");

  // 2. Strip chain names al inicio (F020)
  if (!opts?.skipChainStrip) {
    cleaned = cleaned.replace(CHAIN_STRIP_RE, "");
  }

  // 3. Abreviaturas
  for (const [re, rep] of ABBREV_EXPANSIONS) cleaned = cleaned.replace(re, rep);

  // 4. Conectores SEPA sueltos (C→con, D→de, X→x)
  for (const [re, rep] of CONNECTORS_LOOSE) cleaned = cleaned.replace(re, rep);

  // 5. Unidades
  for (const [re, rep] of UNIT_ABBREV) cleaned = cleaned.replace(re, rep);

  // 6. Whitespace + punctuation cleanup
  cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/\s+([.,;])/g, "$1").trim();

  // 7. Dedup palabras consecutivas
  cleaned = dedupConsecutiveWords(cleaned);

  // 8. Title case español-aware
  cleaned = toTitleCaseEs(cleaned);

  return cleaned;
}

/**
 * Marcas que SEPA suele mandar como texto de nombre en lugar de marca real
 * ("SIN MARCA", "SM", "GENERICO"). Se descartan → null.
 */
const REJECTED_BRAND_PATTERNS: RegExp[] = [
  /^sin\s+marca$/i,
  /^s\/marca$/i,
  /^s\.?m\.?$/i,
  /^generico$/i,
  /^varios$/i,
  /^n\/?d$/i,
  /^n\/?a$/i,
  /^-+$/,
];

export type CleanBrandOptions = {
  /** Nombre del producto para inferir brand cuando raw es null/no matchea. */
  productName?: string | null | undefined;
};

/**
 * Limpia el campo brand de SEPA:
 *   1. Consulta BRAND_CATALOG — si raw matchea alguna alias/canonical, devuelve canonical.
 *   2. Si raw no matchea el catalog, aplica filtros existentes (reject SIN MARCA, etc.).
 *   3. Si raw es null y hay hint.productName, intenta extractBrandFromName().
 */
export function cleanBrand(
  raw: string | null | undefined,
  opts?: CleanBrandOptions,
): string | null {
  // 1. Canonicalización via catalog
  if (raw) {
    const canonical = resolveBrand(raw);
    if (canonical) return canonical;
  }

  // 2. Filtros clásicos si raw existe pero no matchea catalog
  if (raw) {
    const trimmed = raw.trim();
    if (!trimmed) return tryExtractFromName(opts);
    if (REJECTED_BRAND_PATTERNS.some((re) => re.test(trimmed))) return tryExtractFromName(opts);
    if (/[.,;]/.test(trimmed)) return tryExtractFromName(opts);
    const words = trimmed.split(/\s+/);
    if (words.length > 4) return tryExtractFromName(opts);
    return toTitleCaseEs(trimmed);
  }

  // 3. Raw es null/empty → intentar extraer del name
  return tryExtractFromName(opts);
}

function tryExtractFromName(opts?: CleanBrandOptions): string | null {
  if (!opts?.productName) return null;
  return extractBrandFromName(opts.productName);
}
