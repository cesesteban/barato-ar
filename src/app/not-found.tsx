import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui";
import { SearchBar } from "@/components/domain";

export const metadata = { title: "Página no encontrada", robots: { index: false } };

export default function NotFound() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center">
        <span className="text-6xl">🔍</span>
        <h1 className="text-4xl font-bold tracking-tight">Página no encontrada</h1>
        <p className="text-text-muted">
          El link que seguiste no lleva a ninguna parte. Probá una búsqueda o volvé al inicio.
        </p>
        <SearchBar className="w-full max-w-xl" />
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/ofertas">Ver ofertas</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
