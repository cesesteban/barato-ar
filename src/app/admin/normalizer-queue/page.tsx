import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";
import { PageShell } from "@/components/layout";
import { Badge, Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { ApproveRejectButtons } from "./_client";

export const dynamic = "force-dynamic";

type ProductWithPrices = Prisma.ProductGetPayload<{
  include: { prices: { include: { store: { select: { name: true } } } } };
}>;

type FeatureShape = {
  eanMatch?: boolean | null;
  nameSim?: number;
  brandSim?: number;
  sizeMatch?: boolean;
  unitMatch?: boolean;
  packagingConflict?: boolean;
};

export default async function NormalizerQueuePage() {
  const rows = await prisma.normalizerCandidate.findMany({
    where: { status: "pending" },
    orderBy: { confidence: "desc" },
    take: 50,
  });

  const productIds = new Set<string>();
  for (const c of rows) {
    productIds.add(c.productAId);
    productIds.add(c.productBId);
  }
  const products = await prisma.product.findMany({
    where: { id: { in: [...productIds] } },
    include: {
      prices: {
        take: 3,
        orderBy: { capturedAt: "desc" },
        include: { store: { select: { name: true } } },
      },
    },
  });
  const productMap = new Map<string, ProductWithPrices>(products.map((p) => [p.id, p]));

  return (
    <PageShell hideFooter hideMobileNav>
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Normalizer · Cola de revisión</h1>
          <p className="mt-1 text-text-muted">
            Candidatos con confidence 0.60–0.89 esperando decisión. F005 · US3.
          </p>
        </header>

        {rows.length === 0 ? (
          <Card>
            <CardBody>Cola vacía. 🎉</CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {rows.map((c) => {
              const a = productMap.get(c.productAId);
              const b = productMap.get(c.productBId);
              const features = (c.features ?? {}) as FeatureShape;
              return (
                <Card key={c.id}>
                  <CardHeader className="flex-row items-center justify-between p-0 pb-4">
                    <div>
                      <CardTitle>Match candidate</CardTitle>
                      <CardDescription>
                        Confidence <strong>{c.confidence.toFixed(3)}</strong> · creado{" "}
                        {c.createdAt.toISOString().slice(0, 10)}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="info">nameSim {features.nameSim?.toFixed(2)}</Badge>
                      <Badge variant="info">brandSim {features.brandSim?.toFixed(2)}</Badge>
                      {features.sizeMatch ? <Badge variant="savings">size ✓</Badge> : null}
                      {features.packagingConflict ? (
                        <Badge variant="discount">packaging ✗</Badge>
                      ) : null}
                    </div>
                  </CardHeader>
                  <CardBody className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ProductPanel product={a} label="Producto A" />
                    <ProductPanel product={b} label="Producto B" />
                  </CardBody>
                  <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                    <ApproveRejectButtons candidateId={c.id} />
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function ProductPanel({ product, label }: { product: ProductWithPrices | undefined; label: string }) {
  if (!product) {
    return (
      <div className="rounded-lg border border-border p-3 text-text-subtle">
        {label}: no encontrado
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border p-3">
      <span className="text-2xs font-semibold uppercase tracking-wider text-text-subtle">{label}</span>
      <span className="text-base font-semibold">{product.name}</span>
      <span className="text-2xs text-text-muted">
        {product.brand ? `${product.brand} · ` : ""}
        {product.standardSize?.toString()} {product.standardUnit ?? ""}
        {product.packagingFlag ? ` · ${product.packagingFlag}` : ""}
        {product.eanCode ? ` · EAN ${product.eanCode}` : ""}
      </span>
      {product.prices.length > 0 ? (
        <ul className="mt-1 space-y-0.5 text-2xs text-text-muted">
          {product.prices.map((p) => (
            <li key={p.id}>
              {p.store.name}: ${p.price.toString()} ·{" "}
              {new Date(p.capturedAt).toISOString().slice(0, 10)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
