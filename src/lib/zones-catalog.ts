/**
 * Catálogo de zonas disponible del lado cliente.
 *
 * Duplicamos las zonas definidas en `src/ingestion/pcl/zones.ts` para poder
 * usarlas en componentes client sin importar Prisma. Mantener sincronizado:
 * cuando agregues una zona nueva al seed, agregala también acá.
 *
 * `slug` — coincide con Zone.slug en DB (uso como URL param).
 * `centroid` — lat/lng aproximado; útil para calcular distancia desde
 * geolocation del usuario y ranquear la zona más cercana.
 */

export type ZoneEntry = {
  slug: string;
  name: string;
  region: "CABA" | "GBA";
  centroid: { lat: number; lng: number };
};

export const ZONES_CATALOG: ZoneEntry[] = [
  // CABA
  { slug: "caba-palermo", name: "Palermo", region: "CABA", centroid: { lat: -34.5875, lng: -58.43 } },
  { slug: "caba-belgrano", name: "Belgrano", region: "CABA", centroid: { lat: -34.5624, lng: -58.4557 } },
  { slug: "caba-recoleta", name: "Recoleta", region: "CABA", centroid: { lat: -34.5883, lng: -58.3966 } },
  { slug: "caba-caballito", name: "Caballito", region: "CABA", centroid: { lat: -34.6197, lng: -58.4405 } },
  { slug: "caba-flores", name: "Flores", region: "CABA", centroid: { lat: -34.628, lng: -58.4636 } },
  { slug: "caba-almagro", name: "Almagro", region: "CABA", centroid: { lat: -34.6099, lng: -58.4247 } },
  { slug: "caba-villa-crespo", name: "Villa Crespo", region: "CABA", centroid: { lat: -34.6006, lng: -58.438 } },
  { slug: "caba-nunez", name: "Núñez", region: "CABA", centroid: { lat: -34.5468, lng: -58.4595 } },
  { slug: "caba-boedo", name: "Boedo", region: "CABA", centroid: { lat: -34.6296, lng: -58.4173 } },
  { slug: "caba-microcentro", name: "Microcentro", region: "CABA", centroid: { lat: -34.6083, lng: -58.3712 } },
  { slug: "caba", name: "Otras zonas CABA", region: "CABA", centroid: { lat: -34.6037, lng: -58.3816 } },
  // GBA
  { slug: "pba-gba-norte", name: "GBA Norte", region: "GBA", centroid: { lat: -34.5, lng: -58.53 } },
  { slug: "pba-gba-oeste", name: "GBA Oeste", region: "GBA", centroid: { lat: -34.65, lng: -58.65 } },
  { slug: "pba-gba-sur", name: "GBA Sur", region: "GBA", centroid: { lat: -34.75, lng: -58.4 } },
  { slug: "pba", name: "Otras zonas PBA", region: "GBA", centroid: { lat: -34.6, lng: -58.55 } },
];

export const DEFAULT_ZONE_SLUG = "caba-palermo";

export function getZoneBySlug(slug: string): ZoneEntry | null {
  return ZONES_CATALOG.find((z) => z.slug === slug) ?? null;
}

export function formatZoneLabel(slug: string): string {
  const entry = getZoneBySlug(slug);
  if (!entry) return slug;
  return entry.region === "CABA" ? `${entry.name}, CABA` : entry.name;
}

/**
 * Dada una lat/lng (ej. de Geolocation API), devuelve el slug de la zona más
 * cercana por distancia euclidiana sobre lat/lng. Suficientemente preciso para
 * distancias urbanas menores a ~20 km.
 */
export function nearestZone(lat: number, lng: number): ZoneEntry {
  let best = ZONES_CATALOG[0]!;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const z of ZONES_CATALOG) {
    const d = Math.hypot(z.centroid.lat - lat, z.centroid.lng - lng);
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best;
}
