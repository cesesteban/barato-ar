import { formatDistanceToNow } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { PageShell } from "@/components/layout";
import { Badge, Card, CardBody, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function IngestStatusPage() {
  const rows = await prisma.ingestionRun.findMany({
    orderBy: { startedAt: "desc" },
    take: 40,
    include: { chain: { select: { name: true, slug: true } } },
  });

  const chains = new Map<string, typeof rows>();
  for (const r of rows) {
    const arr = chains.get(r.chain.slug) ?? [];
    arr.push(r);
    chains.set(r.chain.slug, arr);
  }

  return (
    <PageShell hideFooter hideMobileNav>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Estado de ingesta</h1>
          <p className="mt-1 text-text-muted">
            Últimas 10 corridas por cadena. F003 · US3.
          </p>
        </header>

        {chains.size === 0 ? (
          <Card>
            <CardBody>Todavía no hay corridas registradas.</CardBody>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {[...chains.entries()].map(([slug, runs]) => (
              <Card key={slug} padding="none">
                <CardHeader className="p-4">
                  <CardTitle>{runs[0]?.chain.name ?? slug}</CardTitle>
                  <CardDescription>{runs.length} corridas recientes</CardDescription>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-surface-muted text-2xs uppercase tracking-wider text-text-subtle">
                      <tr>
                        <th className="px-4 py-2 text-left">Inicio</th>
                        <th className="px-4 py-2 text-left">Fuente</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-right">Rows</th>
                        <th className="px-4 py-2 text-right">Skipped</th>
                        <th className="px-4 py-2 text-right">Duración</th>
                        <th className="px-4 py-2 text-left">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.slice(0, 10).map((r) => {
                        const duration =
                          r.finishedAt && r.startedAt
                            ? `${Math.round((r.finishedAt.getTime() - r.startedAt.getTime()) / 1000)}s`
                            : "—";
                        return (
                          <tr key={r.id} className="border-t border-border">
                            <td className="px-4 py-2 text-text">{formatDistanceToNow(r.startedAt)}</td>
                            <td className="px-4 py-2 text-text-muted">{r.source}</td>
                            <td className="px-4 py-2">
                              <StatusBadge status={r.status} />
                            </td>
                            <td className="px-4 py-2 text-right font-medium">{r.rowsIngested}</td>
                            <td className="px-4 py-2 text-right text-text-subtle">{r.rowsSkipped}</td>
                            <td className="px-4 py-2 text-right text-text-muted">{duration}</td>
                            <td className="px-4 py-2 text-2xs text-discount">{r.errorMessage ?? ""}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === "success"
      ? "savings"
      : status === "partial"
        ? "warning"
        : status === "failed"
          ? "discount"
          : "info";
  return (
    <Badge variant={variant} size="sm">
      {status}
    </Badge>
  );
}
