import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  for (const q of ["focaccia", "guinness", "coca cola", "cerveza retornable"]) {
    const results = (await p.$queryRawUnsafe(
      `SELECT name, brand, similarity(normalized_name, $1) AS score
       FROM products
       WHERE normalized_name % $1
       ORDER BY score DESC LIMIT 3`,
      q,
    )) as Array<{ name: string; brand: string | null; score: number }>;
    console.log(`\n=== q="${q}": ${results.length} hits ===`);
    for (const r of results) console.log(`  ${Number(r.score).toFixed(2)} | ${r.name} (${r.brand ?? "-"})`);
  }
  await p.$disconnect();
})();
