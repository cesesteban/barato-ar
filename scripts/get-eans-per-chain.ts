import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  for (const cs of ["dia", "jumbo", "vea", "disco", "changomas", "farmacity", "la-anonima"]) {
    const rows = (await p.$queryRawUnsafe(`
      SELECT DISTINCT p.ean_code, p.name FROM products p
      JOIN prices pr ON pr.product_id = p.id
      JOIN stores s ON s.id = pr.store_id
      JOIN chains c ON c.id = s.chain_id
      WHERE c.slug = '${cs}' AND p.ean_code IS NOT NULL AND p.ean_code ~ '^[0-9]{13}$'
      LIMIT 2
    `)) as Array<{ ean_code: string; name: string }>;
    for (const r of rows) console.log(`${cs} | ${r.ean_code} | ${r.name}`);
  }
  await p.$disconnect();
})();
