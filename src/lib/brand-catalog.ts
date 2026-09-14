/**
 * brand-catalog (F020) — dictionary de marcas argentinas comunes con
 * aliases para canonicalizar variantes truncadas de SEPA.
 *
 * SEPA suele mandar brands truncados a 5-6 chars ("Guinn" en lugar de
 * "Guinness", "Coca" en lugar de "Coca-Cola"). Este catalog nos permite:
 *
 *   1. `resolveBrand(input)` — canonicalizar un raw brand truncado.
 *   2. `extractBrandFromName(name)` — inferir brand cuando SEPA no lo mandó
 *      buscando palabras del name en el catalog.
 *
 * Curación manual — cubre ~80 marcas comunes de super/farmacia/bebidas AR.
 * Extender: agregar entry al array. Es preferible dictionary chico y curado
 * antes que fuzzy match genérico (Ppio II Honesty — no adivinamos).
 */

export type BrandEntry = {
  /** Nombre canónico que va a `Product.brand`. */
  canonicalName: string;
  /** Variantes que SEPA suele mandar truncadas. Match case-insensitive exacto. */
  aliases: string[];
  /** Opcional — categoría para futura desambiguación. */
  category?: "cerveza" | "gaseosa" | "lacteo" | "snack" | "limpieza" | "higiene" | "vino" | "cafe" | "otro";
};

export const BRAND_CATALOG: BrandEntry[] = [
  // ===== Cervezas =====
  { canonicalName: "Guinness", aliases: ["Guinn", "Guiness", "Guinnes"], category: "cerveza" },
  { canonicalName: "Stella Artois", aliases: ["Stell", "Stella"], category: "cerveza" },
  { canonicalName: "Imperial", aliases: ["Imper"], category: "cerveza" },
  { canonicalName: "Quilmes", aliases: ["Quil"], category: "cerveza" },
  { canonicalName: "Corona", aliases: [], category: "cerveza" },
  { canonicalName: "Heineken", aliases: ["Heinek"], category: "cerveza" },
  { canonicalName: "Andes", aliases: [], category: "cerveza" },
  { canonicalName: "Salta", aliases: [], category: "cerveza" },
  { canonicalName: "Warsteiner", aliases: ["Warstein"], category: "cerveza" },
  { canonicalName: "Brahma", aliases: [], category: "cerveza" },
  { canonicalName: "Patagonia", aliases: [], category: "cerveza" },
  { canonicalName: "Iguana", aliases: [], category: "cerveza" },
  { canonicalName: "Temple", aliases: [], category: "cerveza" },
  { canonicalName: "Bulldog", aliases: ["Bulld"], category: "cerveza" },

  // ===== Gaseosas + bebidas sin alcohol =====
  { canonicalName: "Coca-Cola", aliases: ["Coca", "Cocacola", "Coca Cola"], category: "gaseosa" },
  { canonicalName: "Pepsi", aliases: [], category: "gaseosa" },
  { canonicalName: "Manaos", aliases: ["Manao"], category: "gaseosa" },
  { canonicalName: "7Up", aliases: ["7 Up", "Seven Up"], category: "gaseosa" },
  { canonicalName: "Sprite", aliases: [], category: "gaseosa" },
  { canonicalName: "Fanta", aliases: [], category: "gaseosa" },
  { canonicalName: "Villavicencio", aliases: ["Villavi"], category: "gaseosa" },
  { canonicalName: "Villa del Sur", aliases: ["Villa Del Sur"], category: "gaseosa" },
  { canonicalName: "Bonaqua", aliases: [], category: "gaseosa" },
  { canonicalName: "Cepita", aliases: [], category: "gaseosa" },
  { canonicalName: "Baggio", aliases: [], category: "gaseosa" },
  { canonicalName: "Powerade", aliases: [], category: "gaseosa" },

  // ===== Lácteos =====
  { canonicalName: "La Serenísima", aliases: ["Serene", "Serenisima", "Serenisi", "La Serenisima"], category: "lacteo" },
  { canonicalName: "Sancor", aliases: ["Sancr"], category: "lacteo" },
  { canonicalName: "Ilolay", aliases: [], category: "lacteo" },
  { canonicalName: "Milkaut", aliases: ["Milk"], category: "lacteo" },
  { canonicalName: "Ledesma", aliases: ["Ledesm"], category: "lacteo" },
  { canonicalName: "Serenito", aliases: [], category: "lacteo" },
  { canonicalName: "Yogurísimo", aliases: ["Yogurisi", "Yogurisimo"], category: "lacteo" },
  { canonicalName: "Danone", aliases: [], category: "lacteo" },
  { canonicalName: "Sublime", aliases: [], category: "lacteo" },

  // ===== Snacks + chocolates + galletitas =====
  { canonicalName: "Milka", aliases: [], category: "snack" },
  { canonicalName: "Cadbury", aliases: ["Cadbur"], category: "snack" },
  { canonicalName: "Bon o Bon", aliases: ["Bon O Bon"], category: "snack" },
  { canonicalName: "Águila", aliases: ["Aguila"], category: "snack" },
  { canonicalName: "Terrabusi", aliases: ["Terrab"], category: "snack" },
  { canonicalName: "Bagley", aliases: [], category: "snack" },
  { canonicalName: "Bimbo", aliases: [], category: "snack" },
  { canonicalName: "Fargo", aliases: [], category: "snack" },
  { canonicalName: "Lactal", aliases: [], category: "snack" },
  { canonicalName: "Havanna", aliases: [], category: "snack" },
  { canonicalName: "Guaymallén", aliases: ["Guaymallen"], category: "snack" },
  { canonicalName: "Jorgito", aliases: [], category: "snack" },
  { canonicalName: "Águila Saint", aliases: ["Aguila Saint"], category: "snack" },
  { canonicalName: "Lays", aliases: [], category: "snack" },
  { canonicalName: "Pringles", aliases: [], category: "snack" },
  { canonicalName: "3 Arroyos", aliases: ["Tres Arroyos"], category: "snack" },

  // ===== Aceite + almacén =====
  { canonicalName: "Natura", aliases: [], category: "otro" },
  { canonicalName: "Cocinero", aliases: ["Cociner"], category: "otro" },
  { canonicalName: "Ideal", aliases: [], category: "otro" },
  { canonicalName: "Cañuelas", aliases: ["Canuelas"], category: "otro" },
  { canonicalName: "Molinos", aliases: [], category: "otro" },
  { canonicalName: "Marolio", aliases: [], category: "otro" },
  { canonicalName: "Knorr", aliases: [], category: "otro" },
  { canonicalName: "Maggi", aliases: [], category: "otro" },
  { canonicalName: "Hellmann's", aliases: ["Hellmann", "Hellmanns"], category: "otro" },
  { canonicalName: "Fanacoa", aliases: [], category: "otro" },
  { canonicalName: "Arcor", aliases: [], category: "otro" },
  { canonicalName: "Vitina", aliases: [], category: "otro" },

  // ===== Café + té + yerba =====
  { canonicalName: "Nescafé", aliases: ["Nescafe", "Nesca"], category: "cafe" },
  { canonicalName: "La Virginia", aliases: ["Virginia"], category: "cafe" },
  { canonicalName: "Bonafide", aliases: [], category: "cafe" },
  { canonicalName: "Cabrales", aliases: [], category: "cafe" },
  { canonicalName: "Rosamonte", aliases: ["Rosamon"], category: "cafe" },
  { canonicalName: "Playadito", aliases: [], category: "cafe" },
  { canonicalName: "Cruz de Malta", aliases: [], category: "cafe" },
  { canonicalName: "Amanda", aliases: [], category: "cafe" },
  { canonicalName: "Taragüí", aliases: ["Taragui"], category: "cafe" },

  // ===== Limpieza + higiene =====
  { canonicalName: "Ala", aliases: [], category: "limpieza" },
  { canonicalName: "Skip", aliases: [], category: "limpieza" },
  { canonicalName: "Cif", aliases: [], category: "limpieza" },
  { canonicalName: "Ayudín", aliases: ["Ayudin"], category: "limpieza" },
  { canonicalName: "Poett", aliases: [], category: "limpieza" },
  { canonicalName: "Magistral", aliases: [], category: "limpieza" },
  { canonicalName: "Palmolive", aliases: [], category: "higiene" },
  { canonicalName: "Colgate", aliases: [], category: "higiene" },
  { canonicalName: "Dove", aliases: [], category: "higiene" },
  { canonicalName: "Rexona", aliases: [], category: "higiene" },
  { canonicalName: "Sedal", aliases: [], category: "higiene" },
  { canonicalName: "Head & Shoulders", aliases: ["Head Shoulders"], category: "higiene" },
  { canonicalName: "Elite", aliases: [], category: "higiene" },
  { canonicalName: "Scott", aliases: [], category: "higiene" },
  { canonicalName: "Higienol", aliases: [], category: "higiene" },
  { canonicalName: "Sussex", aliases: [], category: "higiene" },
  { canonicalName: "Pampers", aliases: [], category: "higiene" },
  { canonicalName: "Huggies", aliases: [], category: "higiene" },
  { canonicalName: "Nestlé", aliases: ["Nestle"], category: "otro" },
  { canonicalName: "Pescador", aliases: ["Pesca"], category: "otro" },
  { canonicalName: "La Celia", aliases: [], category: "vino" },
];

/**
 * Índice interno: lowercase → canonicalName. Se rebuilds una sola vez al
 * primer acceso; O(1) lookup después.
 */
let _index: Map<string, string> | null = null;

function buildIndex(): Map<string, string> {
  if (_index) return _index;
  const map = new Map<string, string>();
  for (const entry of BRAND_CATALOG) {
    map.set(entry.canonicalName.toLowerCase(), entry.canonicalName);
    for (const alias of entry.aliases) {
      map.set(alias.toLowerCase(), entry.canonicalName);
    }
  }
  _index = map;
  return map;
}

/**
 * Devuelve el `canonicalName` si `input` matchea alguna alias o el propio
 * canonical (case-insensitive, trim). Retorna null si no matchea.
 *
 * Ejemplos:
 *   resolveBrand("Guinn") → "Guinness"
 *   resolveBrand("guinness") → "Guinness"
 *   resolveBrand("Coca") → "Coca-Cola"
 *   resolveBrand("Xyz") → null
 */
export function resolveBrand(input: string | null | undefined): string | null {
  if (!input) return null;
  const key = input.trim().toLowerCase();
  if (!key) return null;
  const index = buildIndex();
  return index.get(key) ?? null;
}

/**
 * Busca palabras del `name` que matcheen el catalog. Prefiere matches
 * multi-palabra (ej. "Stella Artois") sobre single-word.
 *
 * Ejemplos:
 *   extractBrandFromName("Cerveza Guinness Extra Stout") → "Guinness"
 *   extractBrandFromName("Cerveza Stella Artois 473 ml") → "Stella Artois"
 *   extractBrandFromName("Yogur natural") → null
 */
export function extractBrandFromName(name: string | null | undefined): string | null {
  if (!name) return null;
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  // Try multi-word matches first (2-3 words consecutivas) — no filter por length
  // porque marcas como "La Serenísima" incluyen "La" (2 chars)
  for (let n = 3; n >= 2; n--) {
    for (let i = 0; i <= words.length - n; i++) {
      const chunk = words.slice(i, i + n).join(" ");
      const match = resolveBrand(chunk);
      if (match) return match;
    }
  }

  // Fallback single-word — filter por length para evitar falsos positivos con "La", "El", etc.
  for (const w of words) {
    if (w.length < 3) continue;
    const match = resolveBrand(w);
    if (match) return match;
  }

  return null;
}
