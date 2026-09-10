/**
 * Mapeo `id_comercio` (SEPA) → `chainId` de Barato.ar.
 * Los ids reales se estabilizan al descargar el manifest oficial;
 * documentar override en docs/ingest/sepa.md cuando se detecta drift.
 */

export const SEPA_CHAIN_MAP: Record<number, string> = {
  // Los ids son placeholders razonables — verificar contra manifest real.
  1: "carrefour",
  9: "jumbo",
  10: "dia",
  11: "disco",
  12: "vea",
  15: "coto",
  17: "la-anonima",
  22: "changomas",
  // Otros comercios del dataset se ignoran hasta agregarlos como Chain.
};

export function mapSepaChain(idComercio: number): string | null {
  return SEPA_CHAIN_MAP[idComercio] ?? null;
}
