/**
 * Auditoría de calidad de data en Neon.
 */
import { PrismaClient } from "@prisma/client";

async function main() {
  const p = new PrismaClient();

  console.log("=== COUNTS BÁSICOS ===");
  const [chains, stores, storesReal, storesGeo, zones, products, prices, priceHistory, alerts, reports, runs] =
    await Promise.all([
      p.chain.count(),
      p.store.count(),
      p.store.count({ where: { isVirtual: false } }),
      p.store.count({ where: { lat: { not: null }, lng: { not: null } } }),
      p.zone.count(),
      p.product.count(),
      p.price.count(),
      p.priceHistory.count(),
      p.alert.count(),
      p.report.count(),
      p.ingestionRun.count(),
    ]);
  console.log({
    chains,
    stores,
    storesReal,
    storesGeo,
    zones,
    products,
    prices,
    priceHistory,
    alerts,
    reports,
    runs,
  });

  console.log("\n=== DISTRIBUCIÓN DE PRECIOS POR CADENA ===");
  const byChain = await p.$queryRawUnsafe<Array<{ chain: string; stores: bigint; products: bigint; prices: bigint }>>(
    `SELECT c.slug AS chain,
            COUNT(DISTINCT s.id) AS stores,
            COUNT(DISTINCT pr.product_id) AS products,
            COUNT(pr.id) AS prices
     FROM chains c
     LEFT JOIN stores s ON s.chain_id = c.id AND s.is_virtual = false
     LEFT JOIN prices pr ON pr.store_id = s.id
     GROUP BY c.slug
     ORDER BY prices DESC`,
  );
  for (const r of byChain) console.log(`  ${r.chain}: ${r.stores} stores, ${r.products} prods, ${r.prices} prices`);

  console.log("\n=== PRODUCTOS CON PROBLEMAS DE NOMBRE ===");
  const noBrand = await p.product.count({ where: { brand: null } });
  const shortName = await p.product.count({ where: { name: { contains: " " } } });
  const withEan = await p.product.count({ where: { eanCode: { not: null, notIn: [""] } } });
  const eanSepa = await p.product.count({ where: { eanCode: { startsWith: "sepa-" } } });
  console.log(`  sin marca (brand null): ${noBrand}`);
  console.log(`  con espacios en name: ${shortName}`);
  console.log(`  con EAN válido: ${withEan}`);
  console.log(`  con EAN sintético SEPA (sin match cross-cadena): ${eanSepa}`);

  console.log("\n=== SAMPLE DE 5 PRODUCTOS ===");
  const sample = await p.product.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { name: true, brand: true, eanCode: true, imageUrl: true },
  });
  for (const s of sample) console.log(`  "${s.name}" | brand: ${s.brand ?? "null"} | ean: ${s.eanCode} | img: ${s.imageUrl ?? "null"}`);

  console.log("\n=== IMÁGENES ===");
  const withImg = await p.product.count({ where: { imageUrl: { not: null } } });
  console.log(`  productos con imageUrl: ${withImg}/${products} (${((withImg / products) * 100).toFixed(1)}%)`);

  console.log("\n=== ZONAS SIN STORES ===");
  const zonesWithStores = await p.$queryRawUnsafe<Array<{ zone: string; stores: bigint }>>(
    `SELECT z.slug AS zone, COUNT(s.id) AS stores
     FROM zones z LEFT JOIN stores s ON s.zone_id = z.id AND s.is_virtual = false
     GROUP BY z.slug ORDER BY stores ASC`,
  );
  const empty = zonesWithStores.filter((z) => z.stores === 0n);
  console.log(`  zonas sin sucursales: ${empty.length}/${zonesWithStores.length}`);
  for (const z of empty.slice(0, 10)) console.log(`    - ${z.zone}`);

  console.log("\n=== ALERTS ===");
  const alertStatus = await p.$queryRawUnsafe<Array<{ status: string; c: bigint }>>(
    `SELECT status, COUNT(*)::text AS c FROM alerts GROUP BY status`,
  );
  for (const a of alertStatus) console.log(`  ${a.status}: ${a.c}`);

  console.log("\n=== REPORTS ===");
  const reportStatus = await p.$queryRawUnsafe<Array<{ status: string; c: bigint }>>(
    `SELECT status, COUNT(*)::text AS c FROM reports GROUP BY status`,
  );
  for (const r of reportStatus) console.log(`  ${r.status}: ${r.c}`);

  console.log("\n=== ÚLTIMA INGESTA ===");
  const lastRun = await p.ingestionRun.findFirst({
    orderBy: { startedAt: "desc" },
    include: { chain: { select: { slug: true } } },
  });
  console.log(`  ${lastRun?.chain.slug ?? "n/a"}: status=${lastRun?.status} rows=${lastRun?.rowsIngested} at ${lastRun?.startedAt.toISOString() ?? "never"}`);

  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
