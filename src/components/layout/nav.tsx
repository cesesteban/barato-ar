import Link from "next/link";
import { Logo } from "./logo";
import { ZoneChip } from "@/components/domain/zone-chip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type NavProps = {
  zoneLabel?: string | undefined;
  onChangeZone?: (() => void) | undefined;
};

/** Nav desktop. Mobile usa `MobileBottomNav`. */
export function Nav({ zoneLabel = "Palermo, CABA", onChangeZone }: NavProps) {
  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border bg-surface">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-12 px-6" aria-label="Principal">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <Badge variant="neutral" size="sm" className="ml-1">
            BETA
          </Badge>
        </Link>
        <ul className="hidden items-center gap-6 text-sm font-medium text-text-muted md:flex">
          <li>
            <Link href="/ofertas" className="text-text hover:text-primary">
              Ofertas
            </Link>
          </li>
          <li>
            <Link href="/ofertas?vertical=supermarket" className="hover:text-primary">
              Supermercados
            </Link>
          </li>
          <li>
            <Link href="/ofertas?vertical=delivery" className="hover:text-primary">
              Delivery
            </Link>
          </li>
          <li>
            <Link href="/ofertas?vertical=pharmacy" className="hover:text-primary">
              Farmacias
            </Link>
          </li>
          <li>
            <Link href="/ofertas?vertical=beverages" className="hover:text-primary">
              Bebidas
            </Link>
          </li>
        </ul>
        <div className="ml-auto flex items-center gap-3">
          <ZoneChip zoneLabel={zoneLabel} onChangeZone={onChangeZone} />
          <Button asChild variant="secondary" size="sm" className="hidden sm:inline-flex">
            <Link href="/reportar">Reportar oferta</Link>
          </Button>
        </div>
      </nav>
    </header>
  );
}
