import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui";

export const metadata = { title: "Alerta cancelada", robots: { index: false } };

export default function CancelledPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-20 text-center">
        <div className="text-5xl">👋</div>
        <h1 className="text-3xl font-bold tracking-tight">Alerta cancelada</h1>
        <p className="text-text-muted">Ya no vas a recibir más avisos de este producto.</p>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </PageShell>
  );
}
