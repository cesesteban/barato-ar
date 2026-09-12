import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout";
import { Alert, Badge, Card, CardBody } from "@/components/ui";
import { ChainBadge, DealCard } from "@/components/domain";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { runOffers } from "@/server/offers/service";
import { formatZoneLabel } from "@/lib/zones-catalog";
import { productHref } from "@/lib/urls";

export const dynamic = "force-dynamic";
export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const chain = await prisma.chain
    .findUnique({ where: { slug }, select: { name: true, vertical: true } })
    .catch(() => null);
  if (!chain) return { title: "Tienda no encontrada" };
  const title = `Ofertas en ${chain.name}`;
  const description = `Precios y ofertas de ${chain.name} en tu zona de CABA y GBA. Comparación con otras cadenas.`;
  return {
    title,
    description,
    alternates: { canonical: `/tienda/${slug}` },
    openGraph: {
      title,
      description,
      url: `${env.NEXT_PUBLIC_APP_URL}/tienda/${slug}`,
      type: "website",
    },
  };
}

const VERTICAL_LABEL: Record<string, string> = {
  supermarket: "Supermercado",
  pharmacy: "Farmacia",
  delivery: "Delivery",
  beverages: "Bebidas",
};

export default async function TiendaPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const zone = pick(sp["zone"]) ?? "caba-palermo";

  const chain = await prisma.chain
    .findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true, vertical: true, websiteUrl: true },
    })
    .catch(() => null);

  if (!chain) notFound();

  const [nearbyStores, offers] = await Promise.all([
    prisma.store.findMany({
      where: {
        chainId: chain.id,
        isVirtual: false,
        OR: [{ zone: { slug: zone } }, { zone: { parent: { slug: zone } } }],
      },
      take: 8,
      select: { id: true, name: true, address: true, zone: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    runOffers({
      zone,
      chains: [slug],
      vertical: undefined,
      minDiscount: 0,
      maxDistanceKm: 5,
      validity: "week",
      sort: "discount",
      cursor: undefined,
      limit: 24,
      includeNearby: true,
      onlyBestPerProduct: false,
      minChainCount: 1,
    }).catch(() => null),
  ]);

  const verticalLabel = VERTICAL_LABEL[chain.vertical] ?? chain.vertical;

  return (
    <PageShell zoneLabel={formatZoneLabel(zone)}>
      <article className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-2xs uppercase tracking-wider text-text-subtle">
            <Link href="/" className="hover:text-primary">Inicio</Link>
            <span>/</span>
            <span>Tienda</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold tracking-tight">{chain.name}</h1>
            <Badge variant="info" size="sm">{verticalLabel}</Badge>
          </div>
          <p className="text-sm text-text-muted">
            {offers?.total ?? 0} ofertas visibles · {nearbyStores.length} sucursales cercanas
          </p>
          {chain.websiteUrl ? (
            <a
              href={chain.websiteUrl}
              className="text-sm text-primary hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sitio oficial ↗
            </a>
          ) : null}
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardBody>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-subtle">
                  Sucursales cercanas
                </h2>
                {nearbyStores.length === 0 ? (
                  <p className="text-sm text-text-muted">Sin sucursales de {chain.name} en esta zona.</p>
                ) : (
                  <ul className="space-y-3">
                    {nearbyStores.map((s) => (
                      <li key={s.id} className="text-sm">
                        <div className="font-medium text-text">{s.name}</div>
                        {s.address ? <div className="text-text-muted">{s.address}</div> : null}
                        {s.zone?.name ? (
                          <div className="mt-1 text-2xs text-text-subtle">{s.zone.name}</div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <div className="flex gap-2">
              <ChainBadge slug={chain.slug} label={chain.name} />
            </div>
          </aside>

          <section>
            <h2 className="mb-4 text-lg font-semibold">Mejores ofertas</h2>
            {!offers || offers.items.length === 0 ? (
              <Alert variant="info">
                Todavía no tenemos ofertas activas de {chain.name} en tu zona. Volvé más tarde.
              </Alert>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {offers.items.map((o) => (
                  <DealCard
                    key={o.id}
                    product={{
                      slug: o.productSlug,
                      name: o.productName,
                      brand: o.productBrand ?? undefined,
                      imageUrl: o.productImageUrl ?? undefined,
                    }}
                    price={o.price}
                    previousPrice={o.previousPrice ?? undefined}
                    discountPct={o.discountPct ?? undefined}
                    chainSlug={o.chainSlug}
                    chainLabel={o.chainName}
                    pricePerUnit={
                      o.pricePerUnit != null && o.standardUnit
                        ? { value: o.pricePerUnit, unit: o.standardUnit }
                        : undefined
                    }
                    distanceKm={o.distanceKm ?? undefined}
                    href={productHref(o.productSlug, zone)}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </article>
    </PageShell>
  );
}

function pick(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}
