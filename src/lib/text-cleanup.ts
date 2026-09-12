/**
 * Normalización de textos crudos de SEPA (Precios Claros).
 *
 * Los datasets de las cadenas mandan strings en MAYÚSCULAS con abreviaturas
 * inconsistentes ("CHUPETINES SAB.FRUT.Y VAINILLA PAL.DE LA SELVA PAQ 432 GRM").
 * Estas funciones producen versiones limpias para mostrar al usuario:
 *   - Title Case español-aware
 *   - Expansión de abreviaturas comunes
 *   - Normalización de unidades (GRM → g, LT → L)
 *   - Limpieza de marca (rechaza texto que parece nombre truncado)
 */

const ABBREV_EXPANSIONS: Array<[RegExp, string]> = [
  // Compuestos primero — deben ganar antes que SAB/FRUT sueltos.
  [/\bPAL\.?\s*DE\s*LA\s*SELVA\b/gi, "Palo de la Selva"],
  [/\bSAB\.?\s*FRUT\.?\s*Y\b/gi, "Sabor Frutas y"],
  [/\bC\/FRUT\.?/gi, "c/Frutas"],
  [/\bCON\s+FRUT\.?/gi, "con Frutas"],
  // Sueltos: la abreviatura puede terminar en "." pegada a la siguiente palabra
  // ("SAB.FRUT") o con espacio ("SAB. FRUT"). Aceptamos ambos.
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
  [/\bDESCR?EM\.\s*/gi, "Descremada "],
  [/\bENT\.\s*/gi, "Entera "],
  [/\bSIN\s+TACC\b/gi, "sin TACC"],
];

const UNIT_ABBREV: Array<[RegExp, string]> = [
  [/(\d+(?:\.\d+)?)\s*GRM?\b/gi, "$1 g"],
  [/(\d+(?:\.\d+)?)\s*KG\b/gi, "$1 kg"],
  [/(\d+(?:\.\d+)?)\s*LTS?\b/gi, "$1 L"],
  [/(\d+(?:\.\d+)?)\s*ML\b/gi, "$1 ml"],
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

// Unidades single-letter que aparecen sueltas post-expansión y no queremos capitalizar.
const LOWERCASE_UNITS = new Set(["g", "kg", "l", "ml", "cc", "un", "u"]);

function toTitleCaseEs(input: string): string {
  return input
    .split(/\s+/)
    .map((word, idx) => {
      if (!word) return word;
      const lower = word.toLowerCase();
      if (LOWERCASE_UNITS.has(lower)) return lower;
      if (KEEP_UPPERCASE.has(word.toUpperCase())) return word.toUpperCase();
      if (idx > 0 && CONNECTORS.has(lower)) return lower;
      if (/\d/.test(word)) return word;
      const first = lower.charAt(0).toUpperCase();
      return first + lower.slice(1);
    })
    .join(" ");
}

/**
 * Convierte "CHUPETINES SAB.FRUT.Y VAINILLA PAL.DE LA SELVA PAQ 432 GRM"
 * en "Chupetines Sabor Frutas y Vainilla Palo de la Selva Paquete 432 g".
 * Idempotente y seguro para nombres ya bonitos.
 */
export function cleanProductName(raw: string): string {
  if (!raw) return raw;
  let cleaned = raw.trim();
  for (const [re, rep] of ABBREV_EXPANSIONS) cleaned = cleaned.replace(re, rep);
  for (const [re, rep] of UNIT_ABBREV) cleaned = cleaned.replace(re, rep);
  cleaned = cleaned.replace(/\s{2,}/g, " ").replace(/\s+([.,;])/g, "$1").trim();
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

/**
 * Limpia el campo brand de SEPA:
 *   - Rechaza "SIN MARCA", "GENERICO", "N/D", strings con punto/coma
 *     (probable pedazo del nombre) o >4 palabras.
 *   - Si supera los filtros, aplica Title Case.
 */
export function cleanBrand(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (REJECTED_BRAND_PATTERNS.some((re) => re.test(trimmed))) return null;
  if (/[.,;]/.test(trimmed)) return null;
  const words = trimmed.split(/\s+/);
  if (words.length > 4) return null;
  return toTitleCaseEs(trimmed);
}
