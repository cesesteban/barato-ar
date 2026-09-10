import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Badge, Button } from "@/components/ui";
import { SearchBar } from "@/components/domain";

export default function HomePage() {
  return (
    <PageShell>
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center">
        <Badge variant="primary" className="gap-1">
          <span className="size-2 rounded-full bg-savings" aria-hidden />
          Foundation lista · Feature 002 (design system)
        </Badge>
        <h1 className="text-5xl font-extrabold tracking-tight text-text sm:text-6xl">
          El precio más bajo,
          <br />
          en cualquier app.
        </h1>
        <p className="max-w-xl text-lg text-text-muted">
          Comparamos supermercados, delivery y farmacias en tu zona. Datos reales llegan cuando
          arranquen las ingestas de Feature 003.
        </p>
        <SearchBar zoneLabel="Palermo" className="w-full max-w-xl" />
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/dev/components">Ver design system</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/health">Ver /health</Link>
          </Button>
        </div>
      </section>
    </PageShell>
  );
}
