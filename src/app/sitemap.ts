import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

/**
 * MVP: sitemap contiene solo las rutas core.
 * Feature 012 lo extiende para incluir top 20k productos + cadenas + categorías.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = env.NEXT_PUBLIC_APP_URL;
  return [
    { url: `${base}/`, priority: 1.0, changeFrequency: "hourly" },
  ];
}
