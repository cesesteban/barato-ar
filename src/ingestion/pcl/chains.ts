/**
 * Mapeo (id_comercio, id_bandera) del dataset SEPA → chainId de Barato.ar.
 *
 * SEPA agrupa por comercio; Cencosud (id_comercio=9) tiene 3 banderas:
 *   1=Vea, 2=Disco, 3=Jumbo. El resto de comercios usan id_bandera=1.
 *
 * IDs verificados descargando `sepa_sabado.zip` 2026-09-12:
 *   - 2  → S.A. IMP. Y EXP. DE LA PATAGONIA      → la-anonima
 *   - 9  → Cencosud S.A.                          → vea | disco | jumbo (por bandera)
 *   - 10 → INC S.A.                               → carrefour
 *   - 11 → DORINKA SRL                            → changomas (Walmart AR)
 *   - 12 → COTO CENTRO INTEGRAL DE COMERCIALIZ.  → coto
 *   - 15 → DIA Argentina S.A.                     → dia
 *
 * Otros comercios del dataset (Cooperativa Obrera, Toledo, DEHEZA, YPF, etc.)
 * se ignoran hasta agregar sus Chain al seed.
 */

export const SEPA_CHAIN_MAP: Record<string, string> = {
  "2:1": "la-anonima",
  "9:1": "vea",
  "9:2": "disco",
  "9:3": "jumbo",
  "10:1": "carrefour",
  "11:1": "changomas",
  "12:1": "coto",
  "15:1": "dia",
};

export function mapSepaChain(idComercio: number, idBandera: number): string | null {
  return SEPA_CHAIN_MAP[`${idComercio}:${idBandera}`] ?? null;
}
