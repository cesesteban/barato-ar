import type { Metadata } from "next";
import { PageShell } from "@/components/layout";
import { Alert, Card, CardBody } from "@/components/ui";
import { prisma } from "@/lib/db";
import { ReportForm } from "./_client";

export const metadata: Metadata = {
  title: "Reportar oferta",
  description: "Sumá una oferta que encontraste y no está en Barato.ar.",
  alternates: { canonical: "/reportar" },
};

export const dynamic = "force-dynamic";

export default async function ReportarPage() {
  const chains = await prisma.chain.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } });
  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-6 py-12">
        <header className="mb-6 flex flex-col gap-2">
          <span className="text-2xs font-semibold uppercase tracking-wider text-primary">Comunidad</span>
          <h1 className="text-3xl font-bold tracking-tight">Reportar una oferta</h1>
          <p className="text-text-muted">
            Sumá una oferta que encontraste y no está publicada. Un moderador la revisa antes de que
            aparezca en el feed. No pedimos cuenta; sólo tu paciencia.
          </p>
        </header>
        <Alert variant="info" className="mb-6">
          Los precios son referenciales. Verificá en la tienda antes de comprar.
        </Alert>
        <Card>
          <CardBody>
            <ReportForm chains={chains} />
          </CardBody>
        </Card>
      </div>
    </PageShell>
  );
}
