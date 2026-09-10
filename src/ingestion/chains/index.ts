import type { ChainParser } from "../core/types";
import { carrefourParser } from "./carrefour";

/**
 * Registro de parsers por slug de cadena.
 * F003 arranca con Carrefour; Coto/Día/Jumbo llegan en fase 4.
 * F004 registrará también "pcl" para Precios Claros.
 */
const REGISTRY: Record<string, ChainParser> = {
  carrefour: carrefourParser,
};

export async function getChainParser(chainSlug: string): Promise<ChainParser | null> {
  return REGISTRY[chainSlug.toLowerCase()] ?? null;
}

export function listRegisteredChains(): string[] {
  return Object.keys(REGISTRY);
}
