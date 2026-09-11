import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui";

export const metadata = { title: "Alerta confirmada", robots: { index: false } };

export default function VerifiedPage() {
  return (
    <PageShell>
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-6 py-20 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-3xl font-bold tracking-tight">Alerta confirmada</h1>
        <p className="text-text-muted">
          Te vamos a avisar por email cuando el precio baje al que buscás.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>
    </PageShell>
  );
}
