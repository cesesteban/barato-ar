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

const GBA_ZONA_BY_MUNICIPIO: Record<string, string> = {
  "san isidro": "pba-gba-norte",
  "vicente lópez": "pba-gba-norte",
  "vicente lopez": "pba-gba-norte",
  "tigre": "pba-gba-norte",
  "san fernando": "pba-gba-norte",
  "morón": "pba-gba-oeste",
  "moron": "pba-gba-oeste",
  ituzaingó: "pba-gba-oeste",
  ituzaingo: "pba-gba-oeste",
  merlo: "pba-gba-oeste",
  "hurlingham": "pba-gba-oeste",
  "tres de febrero": "pba-gba-oeste",
  avellaneda: "pba-gba-sur",
  "lomas de zamora": "pba-gba-sur",
  quilmes: "pba-gba-sur",
  lanús: "pba-gba-sur",
  lanus: "pba-gba-sur",
  "florencio varela": "pba-gba-sur",
};

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
  if (provincia === "buenos aires" || provincia === "pba") {
    return (
      (localidad && GBA_ZONA_BY_MUNICIPIO[localidad]) ??
      (ciudad && GBA_ZONA_BY_MUNICIPIO[ciudad]) ??
      "pba"
    );
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
