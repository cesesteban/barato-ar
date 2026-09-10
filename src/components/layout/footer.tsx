import Link from "next/link";
import { Logo } from "./logo";

export function Footer() {
  return (
    <footer className="bg-text py-10 text-[var(--color-primary-fg)]" aria-label="Pie de página">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
        <div className="flex items-baseline gap-3">
          <Logo className="text-white" />
          <span className="text-2xs opacity-70">© 2026 · Argentina</span>
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/80">
          <li>
            <Link href="/sobre" className="hover:text-white">
              Cómo funciona
            </Link>
          </li>
          <li>
            <Link href="/reportar" className="hover:text-white">
              Reportar oferta
            </Link>
          </li>
          <li>
            <Link href="/legales/privacidad" className="hover:text-white">
              Privacidad
            </Link>
          </li>
          <li>
            <Link href="/legales/terminos" className="hover:text-white">
              Términos
            </Link>
          </li>
          <li>
            <Link href="/legales/takedown" className="hover:text-white">
              Retirar contenido
            </Link>
          </li>
        </ul>
      </div>
      <p className="mx-auto mt-6 max-w-7xl px-6 text-2xs text-white/50">
        Los precios son referenciales y pueden variar. Verificá siempre en la tienda antes de comprar.
      </p>
    </footer>
  );
}
