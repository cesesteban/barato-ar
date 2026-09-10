/**
 * Photo scraper (C-006).
 * Post-ingesta: para cada Product sin `imageUrl` (o con >30 días) y que tenga
 * al menos un `Price.storeProductUrl`, scrapea la foto de esa página, la
 * convierte a WebP con sharp y la sube a R2 (bucket products).
 *
 * En F003 dejamos el pipeline armado; la ejecución real depende de tener
 * credenciales R2 + un dominio dispuesto a ser scrapeado. Sharp se instalará
 * cuando esto se active en una feature dedicada.
 */

import { prisma } from "@/lib/db";
import { politeFetch } from "../core/http";
import { uploadImage } from "@/lib/storage";
import { load } from "cheerio";

const MAX_PER_RUN = 50;

export async function scrapeProductPhotos(): Promise<{ scraped: number; skipped: number }> {
  const bucket = process.env.R2_BUCKET_PRODUCTS;
  if (!bucket) {
    console.warn("[photos] R2_BUCKET_PRODUCTS no seteado — skip");
    return { scraped: 0, skipped: 0 };
  }

  const candidates = await prisma.product.findMany({
    where: {
      OR: [
        { imageUrl: null },
        { imageCapturedAt: { lt: new Date(Date.now() - 30 * 24 * 3600 * 1000) } },
      ],
      prices: { some: { storeProductUrl: { not: null } } },
    },
    take: MAX_PER_RUN,
    include: {
      prices: {
        where: { storeProductUrl: { not: null } },
        orderBy: { capturedAt: "desc" },
        take: 1,
      },
    },
  });

  let scraped = 0;
  let skipped = 0;

  for (const product of candidates) {
    const pdpUrl = product.prices[0]?.storeProductUrl;
    if (!pdpUrl) {
      skipped++;
      continue;
    }
    try {
      const html = await politeFetch(pdpUrl, { label: `photos.${product.slug}` }).then((r) => r.text());
      const imgUrl = extractImageUrl(html, pdpUrl);
      if (!imgUrl) {
        await prisma.product.update({ where: { id: product.id }, data: { imageStatus: "missing" } });
        skipped++;
        continue;
      }
      const imgRes = await politeFetch(imgUrl, { label: `photos.download` });
      if (!imgRes.ok) throw new Error(`img HTTP ${imgRes.status}`);
      const buf = Buffer.from(await imgRes.arrayBuffer());
      const key = `products/${product.eanCode ?? product.id}.webp`;

      const { publicUrl } = await uploadImage({
        bucket,
        key,
        body: buf,
        contentType: "image/webp",
      });
      await prisma.product.update({
        where: { id: product.id },
        data: {
          imageUrl: publicUrl ?? null,
          imageSourceUrl: imgUrl,
          imageStatus: "ok",
          imageCapturedAt: new Date(),
        },
      });
      scraped++;
    } catch (err) {
      console.warn(`[photos] fallo con ${product.slug}:`, err instanceof Error ? err.message : err);
      await prisma.product.update({
        where: { id: product.id },
        data: { imageStatus: "failed" },
      });
      skipped++;
    }
  }
  return { scraped, skipped };
}

function extractImageUrl(html: string, base: string): string | null {
  const $ = load(html);
  const og = $('meta[property="og:image"]').attr("content");
  if (og) return absolutize(og, base);
  const first = $("img[src]").first().attr("src");
  return first ? absolutize(first, base) : null;
}

function absolutize(href: string, base: string): string {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}
