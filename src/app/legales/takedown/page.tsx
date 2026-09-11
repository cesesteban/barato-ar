import { PageShell } from "@/components/layout";

export const metadata = {
  title: "Retirar contenido",
  description: "Procedimiento de takedown para titulares de derechos.",
  alternates: { canonical: "/legales/takedown" },
};

export default function TakedownPage() {
  return (
    <PageShell>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Retirar contenido</h1>
        <p>
          Si sos titular de un derecho (marca, propiedad intelectual, imagen personal) y creés que
          algún contenido en Barato.ar lo viola, seguí este procedimiento.
        </p>

        <h2 className="mt-6 text-xl font-bold">Cómo pedirlo</h2>
        <p>
          Enviá un email a{" "}
          <a href="mailto:takedown@barato.ar">takedown@barato.ar</a> con:
        </p>
        <ul>
          <li>Tu nombre y forma de contacto.</li>
          <li>Titularidad que invocás (breve).</li>
          <li>URL(s) exactas del contenido que solicitás retirar.</li>
          <li>Declaración de buena fe.</li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">Plazo</h2>
        <p>
          Respondemos y actuamos dentro de <strong>5 días hábiles</strong>. Si el pedido es
          claramente fundado, retiramos el contenido inmediatamente mientras el análisis continúa.
        </p>

        <h2 className="mt-6 text-xl font-bold">Contrapedido</h2>
        <p>
          Si alguien retiró contenido tuyo y no estás de acuerdo, respondé al hilo con evidencia y
          revisamos. No usamos este proceso como sistema de censura.
        </p>
      </article>
    </PageShell>
  );
}
