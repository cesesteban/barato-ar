"use client";

import Link from "next/link";
import { useEffect } from "react";
import { PageShell } from "@/components/layout";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error.message, error.digest);
  }, [error]);
  return (
    <PageShell>
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-20 text-center">
        <span className="text-6xl">💥</span>
        <h1 className="text-3xl font-bold tracking-tight">Algo salió mal</h1>
        <p className="text-text-muted">
          Ya lo estamos mirando. Podés reintentar o volver al inicio.
        </p>
        {error.digest ? <code className="text-2xs text-text-subtle">ref: {error.digest}</code> : null}
        <div className="flex gap-3">
          <Button variant="primary" onClick={() => reset()}>
            Reintentar
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
