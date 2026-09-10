/**
 * Filtro geográfico para CABA + GBA (F004).
 * Centro: Obelisco (−34.6037, −58.3816). Radio 50 km cubre GBA.
 */

import haversine from "haversine-distance";

const OBELISCO = { lat: -34.6037, lng: -58.3816 };
const GBA_RADIUS_M = 50_000;

export function isInGBA(lat: number | null | undefined, lng: number | null | undefined): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  const distanceM = haversine(OBELISCO, { lat: lat as number, lng: lng as number });
  return distanceM <= GBA_RADIUS_M;
}

export function distanceKmFromObelisco(lat: number, lng: number): number {
  return haversine(OBELISCO, { lat, lng }) / 1000;
}
