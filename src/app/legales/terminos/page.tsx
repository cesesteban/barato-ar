import { PageShell } from "@/components/layout";

export const metadata = {
  title: "Términos y condiciones",
  description: "Términos de uso de Barato.ar.",
  alternates: { canonical: "/legales/terminos" },
};

export default function TerminosPage() {
  return (
    <PageShell>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Términos y condiciones</h1>
        <p className="text-2xs text-text-subtle">Vigente desde 2026-09-11 · Barato.ar</p>

        <h2 className="mt-8 text-xl font-bold">1. Servicio</h2>
        <p>
          Barato.ar es un comparador informativo de precios en Argentina. Los precios se recopilan
          de fuentes públicas (folletos, dataset SEPA, aportes de comunidad) y son referenciales:
          pueden estar desactualizados o ser incorrectos. Antes de comprar, verificá en la tienda.
        </p>

        <h2 className="mt-6 text-xl font-bold">2. Uso permitido</h2>
        <p>
          Podés navegar, buscar y crear alertas de precio libremente. No podés scrapear
          automáticamente el sitio, revender los datos, ni intentar romper el sistema.
        </p>

        <h2 className="mt-6 text-xl font-bold">3. Propiedad intelectual</h2>
        <p>
          Los precios son hechos de dominio público. Las marcas y nombres de cadenas pertenecen a
          sus dueños. Los logos, código, diseño y textos originales del sitio son de Barato.ar y
          están bajo la licencia que se indique en el repositorio público.
        </p>

        <h2 className="mt-6 text-xl font-bold">4. Límite de responsabilidad</h2>
        <p>
          Usás Barato.ar bajo tu propio riesgo. No respondemos por pérdidas económicas ni de
          oportunidad derivadas de decisiones de compra basadas en información aquí publicada.
        </p>

        <h2 className="mt-6 text-xl font-bold">5. Reporte de contenido</h2>
        <p>
          Si sos titular de un derecho sobre contenido publicado, ver{" "}
          <a href="/legales/takedown">legales/takedown</a> para el procedimiento de retiro.
        </p>

        <h2 className="mt-6 text-xl font-bold">6. Jurisdicción</h2>
        <p>
          Cualquier controversia se resuelve en los tribunales ordinarios de la Ciudad Autónoma de
          Buenos Aires, salvo derechos irrenunciables del consumidor.
        </p>

        <h2 className="mt-6 text-xl font-bold">7. Cambios</h2>
        <p>
          Podemos actualizar estos términos. La versión vigente es la publicada en esta página.
        </p>
      </article>
    </PageShell>
  );
}
