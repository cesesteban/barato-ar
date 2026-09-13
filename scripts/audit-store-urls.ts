import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const total = await p.price.count();
  const withUrl = await p.price.count({ where: { storeProductUrl: { not: null } } });
  console.log(`prices total: ${total}, con storeProductUrl: ${withUrl} (${((withUrl / total) * 100).toFixed(1)}%)`);

  console.log("\nchains con websiteUrl:");
  const chains = await p.chain.findMany({ select: { slug: true, name: true, websiteUrl: true } });
  for (const c of chains) console.log(`  ${c.slug} (${c.name}) → ${c.websiteUrl ?? "null"}`);

  console.log("\nsample de precios con URL:");
  const sample = await p.price.findMany({
    where: { storeProductUrl: { not: null } },
    take: 3,
    select: { storeProductUrl: true, source: true, store: { select: { chain: { select: { slug: true } } } } },
  });
  for (const s of sample) {
    console.log(`  ${s.store.chain.slug} (${s.source}): ${s.storeProductUrl}`);
  }

  console.log("\nsample de precios SIN URL:");
  const noUrl = await p.price.findMany({
    where: { storeProductUrl: null },
    take: 3,
    select: {
      source: true,
      store: { select: { chain: { select: { slug: true } } } },
      product: { select: { name: true, eanCode: true } },
    },
  });
  for (const s of noUrl) {
    console.log(`  ${s.store.chain.slug} (${s.source}): ean=${s.product.eanCode} name="${s.product.name.slice(0, 40)}"`);
  }

  await p.$disconnect();
})();
