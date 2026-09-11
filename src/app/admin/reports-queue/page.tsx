import { prisma } from "@/lib/db";
import { PageShell } from "@/components/layout";
import { Badge, Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui";
import { formatPrice } from "@/lib/format-price";
import { formatDistanceToNow } from "@/lib/dates";
import { ReportActions } from "./_client";

export const dynamic = "force-dynamic";

export default async function ReportsQueuePage() {
  const rows = await prisma.report.findMany({
    where: { status: { in: ["pending", "re_review", "auto_hidden"] } },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <PageShell hideFooter hideMobileNav>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Reports · Cola de revisión</h1>
          <p className="mt-1 text-text-muted">
            Reportes crowdsourced esperando decisión. F011 · US2.
          </p>
        </header>

        {rows.length === 0 ? (
          <Card>
            <CardBody>Cola vacía. 🎉</CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <Card key={r.id}>
                <CardHeader className="p-0 pb-3">
                  <CardTitle className="text-base">
                    {r.productText ?? r.productSlug ?? "Producto s/nombre"}
                  </CardTitle>
                  <CardDescription>
                    <Badge variant={r.status === "pending" ? "info" : "warning"} size="sm">
                      {r.status}
                    </Badge>{" "}
                    · {formatDistanceToNow(r.createdAt)} · {r.chainSlug}
                    {r.storeText ? ` · ${r.storeText}` : ""}
                  </CardDescription>
                </CardHeader>
                <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <span className="text-2xs uppercase tracking-wider text-text-subtle">Precio</span>
                    <p className="text-lg font-bold">{formatPrice(Number(r.price))}</p>
                    {r.previousPrice ? (
                      <p className="text-2xs text-text-subtle">
                        antes {formatPrice(Number(r.previousPrice))}
                      </p>
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-2xs uppercase tracking-wider text-text-subtle">Descripción</span>
                    <p className="text-sm text-text-muted">
                      {r.description ?? "—"}
                    </p>
                  </div>
                </CardBody>
                <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4">
                  <ReportActions
                    reportId={r.id}
                    suggestedProductSlug={r.productSlug ?? ""}
                    suggestedStoreId={r.storeId ?? ""}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
