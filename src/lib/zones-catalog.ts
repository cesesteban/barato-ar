/**
 * Catálogo de zonas disponible del lado cliente.
 *
 * Duplicamos las zonas definidas en `src/ingestion/pcl/zones.ts` para poder
 * usarlas en componentes client sin importar Prisma. Mantener sincronizado:
 * cuando agregues una zona nueva al seed, agregala también acá.
 *
 * Jerarquía:
 *   - CABA (region) → 10 barrios + "Otras zonas CABA"
 *   - GBA Norte / Oeste / Sur → sublocalidades (parentGroup) + "Otras" fallback
 *
 * `centroid` — lat/lng aproximado; útil para geolocation matching y para el
 * cálculo de distancia cuando el usuario elige una zona sin coords propias.
 */

export type ZoneRegion = "CABA" | "GBA Norte" | "GBA Oeste" | "GBA Sur";

export type ZoneEntry = {
  slug: string;
  name: string;
  region: ZoneRegion;
  centroid: { lat: number; lng: number };
  /** true si es región paraguas (no localidad específica) */
  umbrella?: boolean;
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
  { slug: "caba", name: "Otras zonas CABA", region: "CABA", centroid: { lat: -34.6037, lng: -58.3816 }, umbrella: true },

  // GBA Norte
  { slug: "pba-san-isidro", name: "San Isidro", region: "GBA Norte", centroid: { lat: -34.475, lng: -58.5127 } },
  { slug: "pba-vicente-lopez", name: "Vicente López", region: "GBA Norte", centroid: { lat: -34.532, lng: -58.4854 } },
  { slug: "pba-tigre", name: "Tigre", region: "GBA Norte", centroid: { lat: -34.4237, lng: -58.5793 } },
  { slug: "pba-san-fernando", name: "San Fernando", region: "GBA Norte", centroid: { lat: -34.4433, lng: -58.5601 } },
  { slug: "pba-san-martin", name: "San Martín", region: "GBA Norte", centroid: { lat: -34.5731, lng: -58.5347 } },
  { slug: "pba-gba-norte", name: "Otras zonas GBA Norte", region: "GBA Norte", centroid: { lat: -34.5, lng: -58.53 }, umbrella: true },

  // GBA Oeste
  { slug: "pba-moron", name: "Morón", region: "GBA Oeste", centroid: { lat: -34.6534, lng: -58.6198 } },
  { slug: "pba-ituzaingo", name: "Ituzaingó", region: "GBA Oeste", centroid: { lat: -34.6549, lng: -58.6688 } },
  { slug: "pba-merlo", name: "Merlo", region: "GBA Oeste", centroid: { lat: -34.6689, lng: -58.728 } },
  { slug: "pba-hurlingham", name: "Hurlingham", region: "GBA Oeste", centroid: { lat: -34.5878, lng: -58.636 } },
  { slug: "pba-tres-de-febrero", name: "Tres de Febrero", region: "GBA Oeste", centroid: { lat: -34.6001, lng: -58.5665 } },
  { slug: "pba-la-matanza", name: "La Matanza (Ramos)", region: "GBA Oeste", centroid: { lat: -34.6431, lng: -58.562 } },
  { slug: "pba-gba-oeste", name: "Otras zonas GBA Oeste", region: "GBA Oeste", centroid: { lat: -34.65, lng: -58.65 }, umbrella: true },

  // GBA Sur
  { slug: "pba-avellaneda", name: "Avellaneda", region: "GBA Sur", centroid: { lat: -34.6613, lng: -58.3663 } },
  { slug: "pba-lomas-de-zamora", name: "Lomas de Zamora", region: "GBA Sur", centroid: { lat: -34.7614, lng: -58.4004 } },
  { slug: "pba-quilmes", name: "Quilmes", region: "GBA Sur", centroid: { lat: -34.7207, lng: -58.2543 } },
  { slug: "pba-lanus", name: "Lanús", region: "GBA Sur", centroid: { lat: -34.7078, lng: -58.3925 } },
  { slug: "pba-florencio-varela", name: "Florencio Varela", region: "GBA Sur", centroid: { lat: -34.8213, lng: -58.2828 } },
  { slug: "pba-berazategui", name: "Berazategui", region: "GBA Sur", centroid: { lat: -34.7683, lng: -58.2126 } },
  { slug: "pba-almirante-brown", name: "Almirante Brown", region: "GBA Sur", centroid: { lat: -34.7896, lng: -58.3924 } },
  { slug: "pba-gba-sur", name: "Otras zonas GBA Sur", region: "GBA Sur", centroid: { lat: -34.75, lng: -58.4 }, umbrella: true },
];

export const DEFAULT_ZONE_SLUG = "caba-palermo";

export function getZoneBySlug(slug: string): ZoneEntry | null {
  return ZONES_CATALOG.find((z) => z.slug === slug) ?? null;
}

export function formatZoneLabel(slug: string): string {
  const entry = getZoneBySlug(slug);
  if (!entry) return slug;
  if (entry.umbrella) return entry.name;
  return entry.region === "CABA" ? `${entry.name}, CABA` : `${entry.name}, ${entry.region}`;
}

/**
 * Dada una lat/lng (ej. de Geolocation API), devuelve la zona más cercana
 * por distancia euclidiana sobre lat/lng. Suficientemente preciso para
 * distancias urbanas menores a ~20 km. Prioriza localidades específicas
 * sobre umbrella regions (ties resueltos con precisión finer).
 */
export function nearestZone(lat: number, lng: number): ZoneEntry {
  let best = ZONES_CATALOG[0]!;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const z of ZONES_CATALOG) {
    if (z.umbrella) continue; // saltamos regiones paraguas
    const d = Math.hypot(z.centroid.lat - lat, z.centroid.lng - lng);
    if (d < bestDist) {
      bestDist = d;
      best = z;
    }
  }
  return best;
}

/** Agrupa el catálogo por región para renderizar en el picker. */
export function groupZonesByRegion(): Array<{ region: ZoneRegion; zones: ZoneEntry[] }> {
  const regions: ZoneRegion[] = ["CABA", "GBA Norte", "GBA Oeste", "GBA Sur"];
  return regions.map((region) => ({
    region,
    zones: ZONES_CATALOG.filter((z) => z.region === region),
  }));
}
