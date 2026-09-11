import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout";
import { Alert, Card, CardBody } from "@/components/ui";
import {
  AlertCard,
  ConsultarBadge,
  PriceComparisonRow,
  PriceHistoryChart,
  PriceTag,
} from "@/components/domain";
import { getComparison } from "@/server/product/get-comparison";
import type { ComparisonStoreRow } from "@/server/product/types";
import { productJsonLd } from "@/lib/jsonld";
import { env } from "@/lib/env";
import { formatPrice } from "@/lib/format-price";

export const revalidate = 3600;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const sp = await searchParams;
  const zone = pickString(sp["zone"]) ?? "caba-palermo";
  const data = await getComparison({ slug, zoneSlug: zone });
  if (!data) return { title: "Producto no encontrado", robots: { index: false } };

  const desc = data.minPrice
    ? `Comparamos ${data.product.name} en supermercados y delivery de tu zona. Desde ${formatPrice(data.minPrice)}.`
    : `${data.product.name} — comparador de precios en Argentina.`;

  return {
    title: data.product.name,
    description: desc,
    alternates: { canonical: `/producto/${data.product.slug}` },
    openGraph: {
      title: data.product.name,
      description: desc,
      url: `${env.NEXT_PUBLIC_APP_URL}/producto/${data.product.slug}`,
      type: "website",
    },
  };
}

export default async function ProductPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const zone = pickString(sp["zone"]) ?? "caba-palermo";
  const data = await getComparison({ slug, zoneSlug: zone });
  if (!data) notFound();

  const allStores = [...data.stores.inZone, ...data.stores.nearby, ...data.stores.national];
  const bestPrice = allStores[0]?.price ?? null;

  const jsonld = productJsonLd({
    name: data.product.name,
    slug: data.product.slug,
    brand: data.product.brand,
    imageUrl: data.product.imageUrl,
    eanCode: data.product.eanCode,
    offers: allStores.slice(0, 10).map((s) => ({
      price: s.price,
      sellerName: s.chainName,
      priceValidUntil: s.validTo ? s.validTo.toISOString() : undefined,
      url: s.storeProductUrl ?? undefined,
    })),
    minPrice: data.minPrice,
    maxPrice: data.maxPrice,
  });

  return (
    <PageShell zoneLabel={zone.replace("caba-", "").replace(/-/g, " ")}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld) }} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-text-subtle">
          <Link href="/ofertas" className="hover:text-primary">
            Ofertas
          </Link>
          <span>›</span>
          <span className="text-text">{data.product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[400px_1fr]">
          <section className="flex flex-col gap-4">
            <div className="flex h-96 items-center justify-center rounded-lg border border-border bg-surface">
              {data.product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.product.imageUrl}
                  alt={data.product.name}
                  className="max-h-72 w-auto object-contain"
                />
              ) : (
                <span className="text-text-subtle">Sin foto</span>
              )}
            </div>
            <Card>
              <CardBody className="flex flex-col gap-2 text-sm">
                <MetaRow label="Marca" value={data.product.brand} />
                <MetaRow
                  label="Presentación"
                  value={
                    data.product.size && data.product.unit
                      ? `${data.product.size} ${data.product.unit}`
                      : null
                  }
                />
                {data.product.packagingFlag ? (
                  <MetaRow label="Tipo" value={data.product.packagingFlag} />
                ) : null}
                {data.product.eanCode ? <MetaRow label="EAN" value={data.product.eanCode} /> : null}
              </CardBody>
            </Card>
          </section>

          <section className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
              <span className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">
                {data.product.brand ?? "Producto"}
              </span>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{data.product.name}</h1>
              {bestPrice ? (
                <PriceTag amount={bestPrice} size="xl" />
              ) : (
                <ConsultarBadge />
              )}
              {data.avg30d ? (
                <p className="text-sm text-text-muted">
                  Promedio zonal últimos 30 días: <strong>{formatPrice(data.avg30d)}</strong>
                </p>
              ) : null}
            </header>

            {allStores.length === 0 ? (
              <Alert variant="info">
                No tenemos precios recientes en tu zona. Reportá una oferta o probá otra zona.
              </Alert>
            ) : (
              <>
                <StoreSection
                  title={`En ${prettyZone(zone)}`}
                  subtitle="Sucursales dentro de tu zona"
                  rows={data.stores.inZone}
                  bestPrice={bestPrice}
                />
                <StoreSection
                  title={`Cerca de ${prettyZone(zone)}`}
                  subtitle="Sucursales a menos de 3 km"
                  rows={data.stores.nearby}
                  bestPrice={bestPrice}
                />
                <StoreSection
                  title="Cadenas nacionales"
                  subtitle="Precios de referencia por cadena"
                  rows={data.stores.national}
                  bestPrice={bestPrice}
                />
              </>
            )}

            {data.variantOfPackaging ? (
              <Card>
                <CardBody className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">
                      Ver también
                    </span>
                    <p className="mt-1 text-sm text-text">{data.variantOfPackaging.name}</p>
                  </div>
                  <Link
                    href={`/producto/${data.variantOfPackaging.slug}?zone=${encodeURIComponent(zone)}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Ir →
                  </Link>
                </CardBody>
              </Card>
            ) : null}
          </section>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardBody>
              <h2 className="mb-4 text-lg font-bold tracking-tight">Historial de precios</h2>
              <PriceHistoryChart data={[]} />
              <p className="mt-3 text-2xs text-text-subtle">
                Los datos completos aparecen cuando la ingesta acumula historial (F010).
              </p>
            </CardBody>
          </Card>
          <AlertCard productSlug={data.product.slug} currentPrice={bestPrice ?? undefined} />
        </div>
      </div>
    </PageShell>
  );
}

function StoreSection({
  title,
  subtitle,
  rows,
  bestPrice,
}: {
  title: string;
  subtitle: string;
  rows: ComparisonStoreRow[];
  bestPrice: number | null;
}) {
  if (rows.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <span className="text-2xs text-text-subtle">{subtitle}</span>
      </div>
      <Card padding="none">
        {rows.map((row, i) => (
          <PriceComparisonRow
            key={row.storeId}
            rank={i + 1}
            storeName={row.storeName}
            storeAddress={row.address ?? undefined}
            chainSlug={row.chainSlug}
            price={row.price}
            previousPrice={row.previousPrice ?? undefined}
            deltaVsAvgPct={row.deltaVsAvgPct ?? undefined}
            distanceKm={row.distanceKm ?? undefined}
            pricePerUnit={undefined}
            promo={
              row.promoType !== "unit"
                ? {
                    type: row.promoType,
                    buyQty: row.promoBuyQty ?? undefined,
                    payQty: row.promoPayQty ?? undefined,
                    secondDiscountPct: row.promoSecondDiscountPct ?? undefined,
                  }
                : undefined
            }
            href={row.storeProductUrl ?? `/tienda/${row.chainSlug}`}
            best={bestPrice === row.price && i === 0}
          />
        ))}
      </Card>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between border-b border-border last:border-b-0">
      <span className="text-text-muted">{label}</span>
      <span className="font-medium text-text">{value}</span>
    </div>
  );
}

function pickString(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

function prettyZone(slug: string): string {
  if (slug === "caba") return "CABA";
  if (slug === "pba") return "PBA";
  return slug
    .replace(/^caba-/, "")
    .replace(/^pba-gba-/, "GBA ")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

