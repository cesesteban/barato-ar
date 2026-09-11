import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import { DealCard, SearchBar } from "@/components/domain";
import { runOffers } from "@/server/offers/service";
import { orgJsonLd, websiteJsonLd } from "@/lib/jsonld";
import { Bell, Search, TrendingDown } from "lucide-react";

export const revalidate = 300;

export default async function HomePage() {
  const feed = await runOffers({
    zone: "caba-palermo",
    chains: [],
    minDiscount: 0,
    maxDistanceKm: 5,
    validity: "week",
    sort: "discount",
    limit: 8,
    includeNearby: true,
  });

  return (
    <PageShell zoneLabel="Palermo, CABA">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd()) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />

      <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-16 text-center">
        <Badge variant="primary" className="gap-1">
          <span className="size-2 rounded-full bg-savings" aria-hidden />
          {feed.total} ofertas activas en tu zona
        </Badge>
        <h1 className="text-5xl font-extrabold tracking-tight text-text sm:text-6xl">
          El precio más bajo,
          <br />
          en cualquier app.
        </h1>
        <p className="max-w-xl text-lg text-text-muted">
          Comparamos supermercados, delivery y farmacias en tu zona.
        </p>
        <SearchBar zoneLabel="Palermo" className="w-full max-w-2xl" />
      </section>

      <section className="border-y border-border bg-surface py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 sm:flex-row sm:items-center">
          <div>
            <span className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">
              Rastreamos precios en
            </span>
            <p className="text-sm text-text-muted">
              {feed.facets.chains.length} cadenas · CABA + GBA · actualizado semanalmente
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {feed.facets.chains.slice(0, 10).map((c) => (
              <span key={c.slug} className="text-sm font-bold uppercase tracking-wide text-text-subtle">
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <header className="mb-6 flex items-end justify-between gap-4">
          <div>
            <span className="text-2xs font-semibold uppercase tracking-wider text-savings">
              Ofertas del día
            </span>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Mejores ofertas en Palermo</h2>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/ofertas">Ver todas →</Link>
          </Button>
        </header>

        {feed.items.length === 0 ? (
          <Card>
            <CardBody className="text-sm text-text-muted">
              Todavía no hay ofertas en tu zona. Corré <code>pnpm db:seed:demo</code> para verlo con
              datos de prueba, o esperá a que corra la ingesta.
            </CardBody>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {feed.items.map((it) => (
              <DealCard
                key={it.id}
                product={{
                  slug: it.productSlug,
                  name: it.productName,
                  brand: it.productBrand ?? undefined,
                  imageUrl: it.productImageUrl ?? undefined,
                }}
                price={it.price}
                previousPrice={it.previousPrice ?? undefined}
                discountPct={it.discountPct ?? undefined}
                chainSlug={it.chainSlug}
                chainLabel={it.chainName}
                pricePerUnit={
                  it.pricePerUnit && it.standardUnit
                    ? { value: it.pricePerUnit, unit: it.standardUnit }
                    : undefined
                }
                promo={
                  it.promoType !== "unit"
                    ? {
                        type: it.promoType,
                        buyQty: it.promoBuyQty ?? undefined,
                        payQty: it.promoPayQty ?? undefined,
                        secondDiscountPct: it.promoSecondDiscountPct ?? undefined,
                      }
                    : undefined
                }
                validUntilLabel={
                  it.validTo ? `Válida hasta ${new Date(it.validTo).toISOString().slice(5, 10)}` : undefined
                }
                distanceKm={it.distanceKm ?? undefined}
                href={`/producto/${it.productSlug}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-10 text-center">
            <span className="text-2xs font-semibold uppercase tracking-wider text-primary">
              Cómo funciona
            </span>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Comprar barato en 3 pasos</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <HowStep num="01" title="Buscá lo que necesitás" icon={<Search className="size-5" />}>
              Escribí el producto o mirá el feed de mejores ofertas del día en tu zona.
            </HowStep>
            <HowStep num="02" title="Compará precios reales" icon={<TrendingDown className="size-5" />}>
              Precio, historial y qué tan lejos estás de la sucursal.
            </HowStep>
            <HowStep num="03" title="Recibí una alerta" icon={<Bell className="size-5" />}>
              Dejá tu email y te avisamos cuando el precio baje al que buscás.
            </HowStep>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

function HowStep({
  num,
  title,
  icon,
  children,
}: {
  num: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border bg-bg p-6">
      <div className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </div>
      <span className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">
        Paso {num}
      </span>
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <p className="text-sm text-text-muted">{children}</p>
    </div>
  );
}
