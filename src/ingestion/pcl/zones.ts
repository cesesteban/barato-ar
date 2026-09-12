/**
 * Resolución de zona a partir de campos SEPA (provincia, ciudad, localidad, lat/lng).
 * Bootstrapea `Zone` con jerarquía CABA barrios + PBA GBA norte/oeste/sur.
 */

import { prisma } from "@/lib/db";

export type ZoneSeed = {
  id: string;
  slug: string;
  name: string;
  parentId?: string;
  lat?: number;
  lng?: number;
};

// Centro aproximado por barrio/localidad — sirve como fallback y como centroide
// para queries "nearby" en F007/F008.
export const ZONE_SEEDS: ZoneSeed[] = [
  // CABA
  { id: "caba", slug: "caba", name: "CABA", lat: -34.6037, lng: -58.3816 },
  { id: "caba-palermo", slug: "caba-palermo", name: "Palermo", parentId: "caba", lat: -34.5875, lng: -58.4300 },
  { id: "caba-belgrano", slug: "caba-belgrano", name: "Belgrano", parentId: "caba", lat: -34.5624, lng: -58.4557 },
  { id: "caba-recoleta", slug: "caba-recoleta", name: "Recoleta", parentId: "caba", lat: -34.5883, lng: -58.3966 },
  { id: "caba-caballito", slug: "caba-caballito", name: "Caballito", parentId: "caba", lat: -34.6197, lng: -58.4405 },
  { id: "caba-flores", slug: "caba-flores", name: "Flores", parentId: "caba", lat: -34.6280, lng: -58.4636 },
  { id: "caba-almagro", slug: "caba-almagro", name: "Almagro", parentId: "caba", lat: -34.6099, lng: -58.4247 },
  { id: "caba-villa-crespo", slug: "caba-villa-crespo", name: "Villa Crespo", parentId: "caba", lat: -34.6006, lng: -58.4380 },
  { id: "caba-nunez", slug: "caba-nunez", name: "Núñez", parentId: "caba", lat: -34.5468, lng: -58.4595 },
  { id: "caba-boedo", slug: "caba-boedo", name: "Boedo", parentId: "caba", lat: -34.6296, lng: -58.4173 },
  { id: "caba-microcentro", slug: "caba-microcentro", name: "Microcentro", parentId: "caba", lat: -34.6083, lng: -58.3712 },
  // PBA — grupos GBA
  { id: "pba", slug: "pba", name: "Buenos Aires (PBA)" },
  { id: "pba-gba-norte", slug: "pba-gba-norte", name: "GBA Norte", parentId: "pba", lat: -34.5000, lng: -58.5300 },
  { id: "pba-gba-oeste", slug: "pba-gba-oeste", name: "GBA Oeste", parentId: "pba", lat: -34.6500, lng: -58.6500 },
  { id: "pba-gba-sur", slug: "pba-gba-sur", name: "GBA Sur", parentId: "pba", lat: -34.7500, lng: -58.4000 },
  // GBA Norte — localidades
  { id: "pba-san-isidro", slug: "pba-san-isidro", name: "San Isidro", parentId: "pba-gba-norte", lat: -34.4750, lng: -58.5127 },
  { id: "pba-vicente-lopez", slug: "pba-vicente-lopez", name: "Vicente López", parentId: "pba-gba-norte", lat: -34.5320, lng: -58.4854 },
  { id: "pba-tigre", slug: "pba-tigre", name: "Tigre", parentId: "pba-gba-norte", lat: -34.4237, lng: -58.5793 },
  { id: "pba-san-fernando", slug: "pba-san-fernando", name: "San Fernando", parentId: "pba-gba-norte", lat: -34.4433, lng: -58.5601 },
  { id: "pba-san-martin", slug: "pba-san-martin", name: "San Martín", parentId: "pba-gba-norte", lat: -34.5731, lng: -58.5347 },
  // GBA Oeste — localidades
  { id: "pba-moron", slug: "pba-moron", name: "Morón", parentId: "pba-gba-oeste", lat: -34.6534, lng: -58.6198 },
  { id: "pba-ituzaingo", slug: "pba-ituzaingo", name: "Ituzaingó", parentId: "pba-gba-oeste", lat: -34.6549, lng: -58.6688 },
  { id: "pba-merlo", slug: "pba-merlo", name: "Merlo", parentId: "pba-gba-oeste", lat: -34.6689, lng: -58.7280 },
  { id: "pba-hurlingham", slug: "pba-hurlingham", name: "Hurlingham", parentId: "pba-gba-oeste", lat: -34.5878, lng: -58.6360 },
  { id: "pba-tres-de-febrero", slug: "pba-tres-de-febrero", name: "Tres de Febrero", parentId: "pba-gba-oeste", lat: -34.6001, lng: -58.5665 },
  { id: "pba-la-matanza", slug: "pba-la-matanza", name: "La Matanza (Ramos)", parentId: "pba-gba-oeste", lat: -34.6431, lng: -58.5620 },
  // GBA Sur — localidades
  { id: "pba-avellaneda", slug: "pba-avellaneda", name: "Avellaneda", parentId: "pba-gba-sur", lat: -34.6613, lng: -58.3663 },
  { id: "pba-lomas-de-zamora", slug: "pba-lomas-de-zamora", name: "Lomas de Zamora", parentId: "pba-gba-sur", lat: -34.7614, lng: -58.4004 },
  { id: "pba-quilmes", slug: "pba-quilmes", name: "Quilmes", parentId: "pba-gba-sur", lat: -34.7207, lng: -58.2543 },
  { id: "pba-lanus", slug: "pba-lanus", name: "Lanús", parentId: "pba-gba-sur", lat: -34.7078, lng: -58.3925 },
  { id: "pba-florencio-varela", slug: "pba-florencio-varela", name: "Florencio Varela", parentId: "pba-gba-sur", lat: -34.8213, lng: -58.2828 },
  { id: "pba-berazategui", slug: "pba-berazategui", name: "Berazategui", parentId: "pba-gba-sur", lat: -34.7683, lng: -58.2126 },
  { id: "pba-almirante-brown", slug: "pba-almirante-brown", name: "Almirante Brown", parentId: "pba-gba-sur", lat: -34.7896, lng: -58.3924 },
];

/**
 * Poblate zonas base de forma idempotente. Corre desde el seed y desde pass1 de PCL.
 */
export async function seedZones(): Promise<void> {
  for (const z of ZONE_SEEDS) {
    await prisma.zone.upsert({
      where: { id: z.id },
      update: {
        name: z.name,
        slug: z.slug,
        parentId: z.parentId ?? null,
        lat: z.lat ?? null,
        lng: z.lng ?? null,
      },
      create: {
        id: z.id,
        slug: z.slug,
        name: z.name,
        parentId: z.parentId ?? null,
        lat: z.lat ?? null,
        lng: z.lng ?? null,
      },
    });
  }
}

const LOCALIDAD_TO_ZONE: Record<string, string> = {
  palermo: "caba-palermo",
  belgrano: "caba-belgrano",
  recoleta: "caba-recoleta",
  caballito: "caba-caballito",
  flores: "caba-flores",
  almagro: "caba-almagro",
  "villa crespo": "caba-villa-crespo",
  núñez: "caba-nunez",
  nunez: "caba-nunez",
  boedo: "caba-boedo",
  microcentro: "caba-microcentro",
};

/**
 * Municipio (localidad SEPA normalizada) → slug de zona hoja.
 * Preferimos taggear al municipio específico (fine-grained); si no hay match
 * exacto, resolveZoneId cae al parent region (`pba-gba-norte/oeste/sur`).
 */
const GBA_MUNICIPIO_TO_ZONE: Record<string, string> = {
  // Norte
  "san isidro": "pba-san-isidro",
  "vicente lópez": "pba-vicente-lopez",
  "vicente lopez": "pba-vicente-lopez",
  tigre: "pba-tigre",
  "san fernando": "pba-san-fernando",
  "general san martin": "pba-san-martin",
  "san martin": "pba-san-martin",
  // Oeste
  "morón": "pba-moron",
  moron: "pba-moron",
  ituzaingó: "pba-ituzaingo",
  ituzaingo: "pba-ituzaingo",
  merlo: "pba-merlo",
  hurlingham: "pba-hurlingham",
  "tres de febrero": "pba-tres-de-febrero",
  "la matanza": "pba-la-matanza",
  ramos: "pba-la-matanza",
  "ramos mejia": "pba-la-matanza",
  "ramos mejía": "pba-la-matanza",
  // Sur
  avellaneda: "pba-avellaneda",
  "lomas de zamora": "pba-lomas-de-zamora",
  quilmes: "pba-quilmes",
  lanús: "pba-lanus",
  lanus: "pba-lanus",
  "florencio varela": "pba-florencio-varela",
  berazategui: "pba-berazategui",
  "almirante brown": "pba-almirante-brown",
  adrogué: "pba-almirante-brown",
  adrogue: "pba-almirante-brown",
};

/**
 * Fallback: si el municipio no está en el mapping fine-grained, mapeamos
 * a la región paraguas (norte / oeste / sur) usando prefijos y palabras clave
 * del nombre — mejor que devolver "pba" genérico.
 */
const GBA_REGION_KEYWORDS: Array<[string, string]> = [
  // Norte
  ["san isidro", "pba-gba-norte"],
  ["vicente", "pba-gba-norte"],
  ["tigre", "pba-gba-norte"],
  ["san fernando", "pba-gba-norte"],
  ["escobar", "pba-gba-norte"],
  ["pilar", "pba-gba-norte"],
  ["san martin", "pba-gba-norte"],
  // Oeste
  ["moron", "pba-gba-oeste"],
  ["morón", "pba-gba-oeste"],
  ["ituzaingo", "pba-gba-oeste"],
  ["ituzaingó", "pba-gba-oeste"],
  ["merlo", "pba-gba-oeste"],
  ["hurlingham", "pba-gba-oeste"],
  ["tres de febrero", "pba-gba-oeste"],
  ["matanza", "pba-gba-oeste"],
  ["la matanza", "pba-gba-oeste"],
  // Sur
  ["avellaneda", "pba-gba-sur"],
  ["lomas de zamora", "pba-gba-sur"],
  ["quilmes", "pba-gba-sur"],
  ["lanus", "pba-gba-sur"],
  ["lanús", "pba-gba-sur"],
  ["varela", "pba-gba-sur"],
  ["berazategui", "pba-gba-sur"],
  ["almirante brown", "pba-gba-sur"],
  ["adrogue", "pba-gba-sur"],
  ["adrogué", "pba-gba-sur"],
];

export function resolveZoneId(input: {
  provincia?: string | null;
  ciudad?: string | null;
  localidad?: string | null;
}): string | null {
  const provincia = norm(input.provincia);
  const ciudad = norm(input.ciudad);
  const localidad = norm(input.localidad);
  const isCaba =
    provincia === "caba" ||
    provincia === "capital federal" ||
    provincia === "ciudad autonoma de buenos aires" ||
    provincia === "ciudad autónoma de buenos aires";

  if (isCaba) {
    return (localidad && LOCALIDAD_TO_ZONE[localidad]) ?? (ciudad && LOCALIDAD_TO_ZONE[ciudad]) ?? "caba";
  }
  if (provincia === "buenos aires" || provincia === "pba" || provincia === "ar-b") {
    // 1. Municipio exacto (fine-grained)
    const exact =
      (localidad && GBA_MUNICIPIO_TO_ZONE[localidad]) ??
      (ciudad && GBA_MUNICIPIO_TO_ZONE[ciudad]);
    if (exact) return exact;

    // 2. Keyword fallback (parent region)
    const hay = `${localidad} ${ciudad}`.trim();
    for (const [needle, zoneId] of GBA_REGION_KEYWORDS) {
      if (hay.includes(needle)) return zoneId;
    }
    return "pba";
  }
  return null;
}

function norm(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
