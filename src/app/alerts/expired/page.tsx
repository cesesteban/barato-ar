import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui";

export const metadata = { title: "Link vencido", robots: { index: false } };

export default function ExpiredPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-20 text-center">
        <div className="text-5xl">⏰</div>
        <h1 className="text-3xl font-bold tracking-tight">El link expiró</h1>
        <p className="text-text-muted">
          El link de confirmación duró 24 horas. Creá una alerta nueva desde la página del producto.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </PageShell>
  );
}
