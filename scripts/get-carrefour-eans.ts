import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const rows = (await p.$queryRawUnsafe(`
    SELECT DISTINCT p.ean_code, p.name, p.brand
    FROM products p
    JOIN prices pr ON pr.product_id = p.id
    JOIN stores s ON s.id = pr.store_id
    JOIN chains c ON c.id = s.chain_id
    WHERE c.slug = 'carrefour' AND p.ean_code IS NOT NULL AND p.ean_code != '0'
    LIMIT 5
  `)) as Array<{ ean_code: string; name: string; brand: string }>;
  for (const r of rows) console.log(`${r.ean_code} | ${r.brand} | ${r.name}`);
  await p.$disconnect();
})();
