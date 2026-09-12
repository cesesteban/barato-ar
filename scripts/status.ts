import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const [c, z, s, sv, pr, pri, ir] = await Promise.all([
    p.chain.count(),
    p.zone.count(),
    p.store.count(),
    p.store.count({ where: { isVirtual: false } }),
    p.product.count(),
    p.price.count(),
    p.ingestionRun.count(),
  ]);
  console.log(
    JSON.stringify(
      { chains: c, zones: z, stores: s, real_stores: sv, products: pr, prices: pri, ingestion_runs: ir },
      null,
      2,
    ),
  );
  await p.$disconnect();
})();
