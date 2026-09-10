import { PrismaClient, Vertical } from "@prisma/client";

const prisma = new PrismaClient();

type ChainSeed = {
  id: string;
  slug: string;
  name: string;
  vertical: Vertical;
  websiteUrl?: string;
};

const CHAINS: ChainSeed[] = [
  { id: "carrefour", slug: "carrefour", name: "Carrefour", vertical: "supermarket", websiteUrl: "https://www.carrefour.com.ar" },
  { id: "coto", slug: "coto", name: "Coto", vertical: "supermarket", websiteUrl: "https://www.cotodigital3.com.ar" },
  { id: "dia", slug: "dia", name: "Día", vertical: "supermarket", websiteUrl: "https://diaonline.supermercadosdia.com.ar" },
  { id: "jumbo", slug: "jumbo", name: "Jumbo", vertical: "supermarket", websiteUrl: "https://www.jumbo.com.ar" },
  { id: "vea", slug: "vea", name: "Vea", vertical: "supermarket", websiteUrl: "https://www.vea.com.ar" },
  { id: "disco", slug: "disco", name: "Disco", vertical: "supermarket", websiteUrl: "https://www.disco.com.ar" },
  { id: "la-anonima", slug: "la-anonima", name: "La Anónima", vertical: "supermarket", websiteUrl: "https://www.laanonimaonline.com" },
  { id: "changomas", slug: "changomas", name: "Changomas", vertical: "supermarket", websiteUrl: "https://www.changomas.com.ar" },
  { id: "farmacity", slug: "farmacity", name: "Farmacity", vertical: "pharmacy", websiteUrl: "https://www.farmacity.com" },
  { id: "pedidosya", slug: "pedidosya", name: "PedidosYa", vertical: "delivery", websiteUrl: "https://www.pedidosya.com.ar" },
  { id: "rappi", slug: "rappi", name: "Rappi", vertical: "delivery", websiteUrl: "https://www.rappi.com.ar" },
];

export async function seedChainsAndVirtualStores() {
  for (const c of CHAINS) {
    await prisma.chain.upsert({
      where: { id: c.id },
      update: { name: c.name, vertical: c.vertical, websiteUrl: c.websiteUrl ?? null },
      create: { id: c.id, slug: c.slug, name: c.name, vertical: c.vertical, websiteUrl: c.websiteUrl ?? null },
    });
    // Sucursal virtual "nacional" para MVP (F003 · Fase 2).
    // Cuando F004 corra, las sucursales reales quedan con lat/lng y `isVirtual=false`.
    const virtualSlug = `${c.slug}-virtual`;
    await prisma.store.upsert({
      where: { slug: virtualSlug },
      update: { name: `${c.name} · Virtual` },
      create: {
        chainId: c.id,
        name: `${c.name} · Virtual`,
        slug: virtualSlug,
        isVirtual: true,
      },
    });
  }
  console.info(`✅ Seed OK: ${CHAINS.length} chains + stores virtuales.`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  seedChainsAndVirtualStores()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
