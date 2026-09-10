/**
 * Manifest del dataset SEPA. La URL exacta vive en env (`SEPA_MANIFEST_URL`)
 * porque cambia con las publicaciones oficiales.
 */

import { z } from "zod";
import { politeFetch } from "../core/http";

const ManifestSchema = z.object({
  version: z.string().optional(),
  publishedAt: z.string().optional(),
  files: z.object({
    sucursales: z.string().url(),
    productos: z.string().url(),
    precios: z.string().url(),
    comercios: z.string().url().optional(),
  }),
});
export type SepaManifest = z.infer<typeof ManifestSchema>;

export async function fetchManifest(): Promise<SepaManifest> {
  const url = process.env.SEPA_MANIFEST_URL;
  if (!url) throw new Error("SEPA_MANIFEST_URL no configurada");
  const res = await politeFetch(url, { label: "sepa.manifest" });
  if (!res.ok) throw new Error(`SEPA manifest HTTP ${res.status}`);
  const json: unknown = await res.json();
  const parsed = ManifestSchema.safeParse(json);
  if (!parsed.success) {
    throw new Error(`SEPA manifest inválido: ${parsed.error.message}`);
  }
  return parsed.data;
}
