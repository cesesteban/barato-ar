import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

/**
 * Sitemap dinámico (F012). Top 20k productos canonical + cadenas + páginas core.
 * lastModified de cada producto = su updated_at.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;

  const [products, chains] = await Promise.all([
    prisma.product
      .findMany({
        where: { canonicalId: null },
        orderBy: { updatedAt: "desc" },
        take: 20_000,
        select: { slug: true, updatedAt: true },
      })
      .catch(() => [] as Array<{ slug: string; updatedAt: Date }>),
    prisma.chain
      .findMany({ select: { slug: true } })
      .catch(() => [] as Array<{ slug: string }>),
  ]);

  const core: MetadataRoute.Sitemap = [
    { url: `${base}/`, priority: 1.0, changeFrequency: "hourly" },
    { url: `${base}/ofertas`, priority: 0.9, changeFrequency: "hourly" },
    { url: `${base}/reportar`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${base}/sobre`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${base}/legales/terminos`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${base}/legales/privacidad`, priority: 0.3, changeFrequency: "yearly" },
    { url: `${base}/legales/takedown`, priority: 0.3, changeFrequency: "yearly" },
  ];

  return [
    ...core,
    ...products.map((p) => ({
      url: `${base}/producto/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.8,
      changeFrequency: "daily" as const,
    })),
    ...chains.map((c) => ({
      url: `${base}/tienda/${c.slug}`,
      priority: 0.6,
      changeFrequency: "weekly" as const,
    })),
  ];
}
