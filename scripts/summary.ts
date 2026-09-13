import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();

  const size = (await p.$queryRawUnsafe(
    "SELECT pg_size_pretty(pg_database_size(current_database())) AS size",
  )) as Array<{ size: string }>;
  console.log("DB size:", size[0]?.size);

  const byChain = (await p.$queryRawUnsafe(`
    SELECT c.slug AS chain,
      COUNT(DISTINCT s.id) FILTER (WHERE s.is_virtual = false) AS stores,
      COUNT(DISTINCT pr.product_id) AS products,
      COUNT(pr.id) AS prices,
      ROUND(AVG(pr.price)::numeric, 0)::text AS avg_price
    FROM chains c
    LEFT JOIN stores s ON s.chain_id = c.id
    LEFT JOIN prices pr ON pr.store_id = s.id
    GROUP BY c.slug
    ORDER BY prices DESC NULLS LAST
  `)) as Array<{ chain: string; stores: bigint; products: bigint; prices: bigint; avg_price: string | null }>;

  console.log("\nPor cadena:");
  for (const r of byChain) {
    const line = `  ${r.chain.padEnd(12)} stores=${String(r.stores).padStart(4)} products=${String(r.products).padStart(6)} prices=${String(r.prices).padStart(7)} avg=$${r.avg_price ?? "-"}`;
    console.log(line);
  }

  const multi = (await p.$queryRawUnsafe(`
    SELECT COUNT(*)::bigint AS c FROM (
      SELECT pr.product_id
      FROM prices pr JOIN stores s ON s.id = pr.store_id
      GROUP BY pr.product_id
      HAVING COUNT(DISTINCT s.chain_id) >= 2
    ) t
  `)) as Array<{ c: bigint }>;
  console.log("\nProductos con >=2 cadenas (cross-comparables):", String(multi[0]?.c));

  const globals = await Promise.all([
    p.product.count(),
    p.price.count(),
    p.ingestionRun.count(),
  ]);
  console.log("Totales:", { products: globals[0], prices: globals[1], runs: globals[2] });

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
