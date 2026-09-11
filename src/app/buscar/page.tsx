import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Alert, Badge, Card, CardBody } from "@/components/ui";
import { runSearch } from "@/server/search/service";
import { SearchParamsSchema } from "@/server/search/schemas";
import { formatPrice } from "@/lib/format-price";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Buscar",
  robots: { index: false, follow: true },
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = Array.isArray(params["q"]) ? params["q"][0] : params["q"];
  const zone = Array.isArray(params["zone"]) ? params["zone"][0] : params["zone"];

  if (!q || q.trim().length < 2) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="mb-4 text-3xl font-bold tracking-tight">Buscar</h1>
          <Alert>Escribí al menos 2 caracteres.</Alert>
        </div>
      </PageShell>
    );
  }

  const parsed = SearchParamsSchema.safeParse({ q, zone });
  if (!parsed.success) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <Alert variant="warning">Búsqueda inválida.</Alert>
        </div>
      </PageShell>
    );
  }

  const response = await runSearch(parsed.data);

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-6 flex flex-col gap-2">
          <span className="text-2xs text-text-subtle">Búsqueda</span>
          <h1 className="text-3xl font-bold tracking-tight">Resultados para &ldquo;{parsed.data.q}&rdquo;</h1>
          <span className="text-sm text-text-muted">
            {response.total} resultado{response.total === 1 ? "" : "s"} · {response.ms} ms
          </span>
        </header>

        {response.suggestion ? (
          <Alert variant="info" className="mb-6">
            ¿Quisiste decir{" "}
            <Link
              href={`/buscar?q=${encodeURIComponent(response.suggestion)}`}
              className="font-semibold text-primary hover:underline"
            >
              {response.suggestion}
            </Link>
            ?
          </Alert>
        ) : null}

        {response.results.length === 0 ? (
          <Card>
            <CardBody>
              No encontramos productos que coincidan con tu búsqueda. Probá con menos palabras o
              revisá si escribiste bien.
            </CardBody>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {response.results.map((r) => (
              <li key={r.id}>
                <Card>
                  <CardBody className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <Link href={`/producto/${r.slug}`} className="font-semibold hover:text-primary">
                        {r.name}
                      </Link>
                      <span className="text-2xs text-text-muted">
                        {r.brand ?? "—"} · {r.chainCount} cadena{r.chainCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {r.minPrice ? (
                        <span className="text-lg font-bold">Desde {formatPrice(r.minPrice)}</span>
                      ) : (
                        <Badge variant="neutral">Sin precio reciente</Badge>
                      )}
                    </div>
                  </CardBody>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
