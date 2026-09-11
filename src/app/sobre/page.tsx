import Link from "next/link";
import { PageShell } from "@/components/layout";
import { Alert, Badge, Card, CardBody } from "@/components/ui";

export const metadata = {
  title: "Sobre Barato.ar",
  description: "Cómo funciona Barato.ar — qué fuentes usamos y qué NO hacemos con tus datos.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  return (
    <PageShell>
      <article className="mx-auto max-w-3xl px-6 py-12">
        <header className="mb-8">
          <span className="text-2xs font-semibold uppercase tracking-wider text-primary">
            Sobre
          </span>
          <h1 className="mt-2 text-4xl font-bold tracking-tight">Cómo funciona Barato.ar</h1>
          <p className="mt-3 text-lg text-text-muted">
            Comparador de ofertas de supermercados, delivery y farmacias en Argentina. Sin cuentas.
            Sin tracking. Sólo precios.
          </p>
        </header>

        <section className="prose prose-slate mt-6 max-w-none">
          <h2 className="text-2xl font-bold">¿Qué hacemos?</h2>
          <p className="text-text">
            Recopilamos precios semanalmente de fuentes públicas: folletos oficiales de las cadenas,
            el dataset SEPA del Estado argentino, y aportes de la comunidad. Después los agrupamos
            por producto y zona (CABA y GBA), y te mostramos dónde está más barato.
          </p>

          <h2 className="mt-8 text-2xl font-bold">¿Qué NO hacemos?</h2>
          <ul className="mt-2 space-y-1">
            <li>❌ No pedimos cuenta ni contraseña.</li>
            <li>❌ No trackeamos entre sitios (usamos Plausible sin cookies).</li>
            <li>❌ No vendemos datos de nadie.</li>
            <li>❌ No inventamos precios: cada uno tiene fuente y timestamp visibles.</li>
          </ul>

          <h2 className="mt-8 text-2xl font-bold">Fuentes de datos</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Card>
              <CardBody className="flex flex-col gap-2 text-sm">
                <Badge variant="savings" size="sm">Semanal</Badge>
                <strong>Folletos oficiales</strong>
                <span className="text-text-muted">
                  Carrefour, Coto, Día, Jumbo, Vea, Disco.
                </span>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-col gap-2 text-sm">
                <Badge variant="savings" size="sm">Semanal</Badge>
                <strong>SEPA / Precios Claros</strong>
                <span className="text-text-muted">
                  Dataset abierto del Estado con precios por sucursal.
                </span>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-col gap-2 text-sm">
                <Badge variant="info" size="sm">Real-time</Badge>
                <strong>Aportes de la comunidad</strong>
                <span className="text-text-muted">
                  Reportá lo que ves —{" "}
                  <Link href="/reportar" className="text-primary hover:underline">
                    reportar oferta
                  </Link>
                  .
                </span>
              </CardBody>
            </Card>
            <Card>
              <CardBody className="flex flex-col gap-2 text-sm">
                <Badge variant="warning" size="sm">Diferido</Badge>
                <strong>Delivery apps</strong>
                <span className="text-text-muted">
                  PedidosYa y Rappi entran después del MVP, con foco legal.
                </span>
              </CardBody>
            </Card>
          </div>

          <Alert variant="info" className="mt-8">
            Los precios son referenciales y pueden variar. Verificá siempre en la tienda antes de
            comprar.
          </Alert>

          <h2 className="mt-8 text-2xl font-bold">¿Contactar?</h2>
          <p className="text-text">
            Escribí a{" "}
            <a href="mailto:hola@barato.ar" className="text-primary hover:underline">
              hola@barato.ar
            </a>
            . Para pedir retiro de contenido, ver{" "}
            <Link href="/legales/takedown" className="text-primary hover:underline">
              legales/takedown
            </Link>
            .
          </p>
        </section>
      </article>
    </PageShell>
  );
}
