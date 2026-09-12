import type { Metadata } from "next";
import { PageShell } from "@/components/layout";
import { Alert, Badge, Card, CardBody } from "@/components/ui";
import { DealCard } from "@/components/domain";
import { runOffers } from "@/server/offers/service";
import { OffersParamsSchema, type OfferListing } from "@/server/offers/schemas";
import { formatZoneLabel } from "@/lib/zones-catalog";
import { productHref } from "@/lib/urls";
import { FiltersSidebar, ActiveChips, InfiniteLoader } from "./_client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ofertas",
  description: "Todas las ofertas activas de super, delivery, farmacia y bebidas en tu zona.",
  alternates: { canonical: "/ofertas" },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OfertasPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const parsed = OffersParamsSchema.safeParse({
    zone: pick(sp["zone"]),
    vertical: pick(sp["vertical"]),
    chains: pick(sp["chains"]),
    minDiscount: pick(sp["minDiscount"]),
    maxDistanceKm: pick(sp["maxDistanceKm"]),
    validity: pick(sp["validity"]),
    sort: pick(sp["sort"]),
    limit: pick(sp["limit"]),
    includeNearby: pick(sp["includeNearby"]),
  });
  if (!parsed.success) {
    return (
      <PageShell>
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Alert variant="warning">Parámetros inválidos.</Alert>
        </div>
      </PageShell>
    );
  }
  const initial = await runOffers(parsed.data);
  const zoneLabel = formatZoneLabel(parsed.data.zone);

  return (
    <PageShell zoneLabel={zoneLabel}>
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-6 flex flex-col gap-2">
          <span className="text-2xs text-text-subtle">Ofertas · {zoneLabel}</span>
          <h1 className="text-3xl font-bold tracking-tight">Todas las ofertas activas</h1>
          <p className="text-sm text-text-muted">
            {initial.total} ofertas visibles · {initial.facets.chains.length} cadenas · actualizado en {initial.ms} ms
          </p>
          <ActiveChips />
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <FiltersSidebar facets={initial.facets} />
          </aside>

          <section className="flex flex-col gap-6">
            {initial.items.length === 0 ? (
              <Card>
                <CardBody className="flex flex-col items-start gap-2 text-sm">
                  <Badge variant="warning">Sin resultados</Badge>
                  <p>
                    No encontramos ofertas con esos filtros en <strong>{zoneLabel}</strong>. Probá
                    aflojar filtros o cambiar de zona.
                  </p>
                </CardBody>
              </Card>
            ) : (
              <InfiniteLoader
                initialItems={initial.items}
                initialCursor={initial.nextCursor}
                params={parsed.data}
              />
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}

export function OffersGrid({ items, zone }: { items: OfferListing[]; zone: string }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((it) => (
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
          validUntilLabel={it.validTo ? `Válida hasta ${new Date(it.validTo).toISOString().slice(5, 10)}` : undefined}
          distanceKm={it.distanceKm ?? undefined}
          href={productHref(it.productSlug, zone)}
        />
      ))}
    </div>
  );
}

function pick(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

