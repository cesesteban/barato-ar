/**
 * Features de similitud para el normalizer (F005).
 * Jaro-Winkler minimal (sin deps externas) + heurísticas de packaging.
 */

const JW_SCALING_FACTOR = 0.1;
const JW_MAX_PREFIX = 4;

/**
 * Jaro similarity ∈ [0, 1]. 1 = idénticos.
 */
export function jaro(a: string, b: string): number {
  if (a === b) return 1;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0 || bLen === 0) return 0;

  const matchDistance = Math.floor(Math.max(aLen, bLen) / 2) - 1;
  const aMatches: boolean[] = new Array(aLen).fill(false);
  const bMatches: boolean[] = new Array(bLen).fill(false);

  let matches = 0;
  for (let i = 0; i < aLen; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, bLen);
    for (let j = start; j < end; j++) {
      if (bMatches[j]) continue;
      if (a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < aLen; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }

  return (matches / aLen + matches / bLen + (matches - transpositions / 2) / matches) / 3;
}

/**
 * Jaro-Winkler: aplica boost al prefijo común.
 */
export function jaroWinkler(a: string, b: string): number {
  const base = jaro(a, b);
  const maxPrefix = Math.min(JW_MAX_PREFIX, a.length, b.length);
  let prefix = 0;
  for (let i = 0; i < maxPrefix; i++) {
    if (a[i] === b[i]) prefix++;
    else break;
  }
  return base + prefix * JW_SCALING_FACTOR * (1 - base);
}

/**
 * Detecta conflictos duros de packaging entre dos nombres.
 * "retornable" vs "descartable" → conflicto. Complementa `Product.packagingFlag`.
 */
const CONFLICT_GROUPS = [
  [/\bretornable\b/i, /\bdescartable\b/i],
  [/\blight|lite|zero|diet|sin ?azucar\b/i, /\bregular|clasica|clasico\b/i],
  [/\bdescremada|descremado\b/i, /\bentera|entero\b/i],
  [/\bsin ?gas\b/i, /\bcon ?gas\b/i],
];

export function detectPackagingConflictText(a: string, b: string): boolean {
  for (const [reA, reB] of CONFLICT_GROUPS) {
    const aOnA = reA?.test(a);
    const aOnB = reA?.test(b);
    const bOnA = reB?.test(a);
    const bOnB = reB?.test(b);
    // A tiene el flag "A" y B tiene el "B" — conflicto
    if ((aOnA && bOnB) || (aOnB && bOnA)) return true;
  }
  return false;
}

export type MatchFeatures = {
  eanMatch: boolean | null;
  nameSim: number;
  brandSim: number;
  sizeMatch: boolean;
  unitMatch: boolean;
  packagingConflict: boolean;
};
