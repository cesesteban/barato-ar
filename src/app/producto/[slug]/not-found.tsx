import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui";
import { SearchBar } from "@/components/domain";

export default function ProductNotFound() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center">
        <span className="text-6xl">🔍</span>
        <h1 className="text-3xl font-bold tracking-tight">Producto no encontrado</h1>
        <p className="text-text-muted">
          No tenemos este producto en el catálogo — todavía. Probá una búsqueda o reportá la oferta.
        </p>
        <SearchBar className="w-full" />
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/reportar">Reportar oferta</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
