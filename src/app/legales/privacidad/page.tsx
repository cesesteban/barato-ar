import { PageShell } from "@/components/layout";

export const metadata = {
  title: "Política de privacidad",
  description: "Cómo tratamos tus datos personales en Barato.ar. Ley 25.326.",
  alternates: { canonical: "/legales/privacidad" },
};

export default function PrivacidadPage() {
  return (
    <PageShell>
      <article className="prose prose-slate mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Política de privacidad</h1>
        <p className="text-2xs text-text-subtle">
          Cumple Ley 25.326 (Argentina). Última actualización: 2026-09-11.
        </p>

        <h2 className="mt-8 text-xl font-bold">1. Qué datos recolectamos</h2>
        <ul>
          <li>
            <strong>Ninguno por default.</strong> Navegar el sitio no requiere cuenta ni deja rastro
            personal. Analytics con Plausible (sin cookies) sólo registra páginas vistas y
            referrer, sin identificación individual.
          </li>
          <li>
            <strong>Alertas de precio (F09):</strong> guardamos tu email para enviarte la
            notificación. Base legal: consentimiento (art. 5 Ley 25.326).
          </li>
          <li>
            <strong>Reportes de comunidad (F11):</strong> guardamos un hash SHA-256 de tu IP
            (irreversible, con salt diario) para prevenir abuso. Se purga a los 90 días.
          </li>
          <li>
            <strong>Administradores (F01):</strong> emails de quienes tienen acceso a{" "}
            <code>/admin</code>. Base legal: prestación del servicio.
          </li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">2. Cómo los usamos</h2>
        <p>
          Sólo para prestar el servicio: enviarte la alerta cuando corresponda; prevenir spam en
          reportes; gestionar el sitio. <strong>No los vendemos ni los cedemos.</strong>
        </p>

        <h2 className="mt-6 text-xl font-bold">3. Retención</h2>
        <ul>
          <li>Emails de alertas: hasta que cancelás la alerta.</li>
          <li>IP hasheada en reportes: 90 días.</li>
          <li>Fotos en reportes rechazados: 30 días.</li>
          <li>Analytics agregado: sin identificación personal, retención indefinida.</li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">4. Tus derechos (ARCO)</h2>
        <p>
          Podés pedir acceso, rectificación, actualización o supresión de tus datos escribiendo a{" "}
          <a href="mailto:privacidad@barato.ar">privacidad@barato.ar</a>. Respondemos en 10 días
          hábiles. También podés cancelar cualquier alerta con un click en el link &ldquo;Cancelar&rdquo;
          que viene en cada email.
        </p>

        <h2 className="mt-6 text-xl font-bold">5. Terceros</h2>
        <ul>
          <li>
            <strong>Neon</strong> (base de datos): US · procesa email de alertas.
          </li>
          <li>
            <strong>Resend</strong> (envío de emails): opera desde US.
          </li>
          <li>
            <strong>Vercel</strong> (hosting): opera globalmente.
          </li>
          <li>
            <strong>Cloudflare R2</strong> (fotos): opera globalmente.
          </li>
        </ul>

        <h2 className="mt-6 text-xl font-bold">6. Seguridad</h2>
        <p>
          HTTPS obligatorio, hashing SHA-256 para IPs, tokens de sesión firmados con HMAC. Sin
          almacenamiento de contraseñas (usamos email magic-link para admin).
        </p>

        <h2 className="mt-6 text-xl font-bold">7. Cambios</h2>
        <p>
          Publicamos versiones nuevas en esta URL. Los cambios de fondo se notifican por email a
          suscriptores activos de alertas.
        </p>
      </article>
    </PageShell>
  );
}
