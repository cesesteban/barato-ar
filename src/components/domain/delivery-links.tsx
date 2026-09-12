"use client";

import { Card, CardBody } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  DELIVERY_PARTNERS,
  buildDeliveryQuery,
  type AffiliateIds,
} from "@/lib/deep-links";

export type DeliveryLinksProps = {
  productName: string;
  brand: string | null | undefined;
  affiliateIds: AffiliateIds;
  className?: string | undefined;
};

/**
 * CTAs a plataformas de delivery/marketplace. Deep-link pasivo con búsqueda
 * pre-cargada. Cuando `affiliateIds[platform]` está seteado, agrega el
 * parámetro de afiliado al URL — sino, solo tracking UTM.
 *
 * Click tracking via `window.plausible` (fallback silencioso si no está).
 */
export function DeliveryLinks({
  productName,
  brand,
  affiliateIds,
  className,
}: DeliveryLinksProps) {
  const query = buildDeliveryQuery(productName, brand ?? null);
  const anyAffiliate = Object.values(affiliateIds).some(Boolean);

  const handleClick = (platform: string, hasAffiliate: boolean) => () => {
    try {
      const w = window as unknown as { plausible?: (event: string, opts?: unknown) => void };
      w.plausible?.("Delivery Click", {
        props: { platform, query: query.slice(0, 60), affiliate: hasAffiliate ? "yes" : "no" },
      });
    } catch {
      // no-op
    }
  };

  return (
    <Card className={className}>
      <CardBody className="flex flex-col gap-3">
        <div>
          <span className="text-2xs font-semibold uppercase tracking-wider text-primary">
            Comprar por delivery
          </span>
          <p className="mt-1 text-sm text-text-muted">
            Buscamos este producto en las apps de delivery. Precio y disponibilidad
            los muestra cada plataforma.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {DELIVERY_PARTNERS.map((p) => {
            const affiliateId = affiliateIds[p.slug];
            return (
              <a
                key={p.slug}
                href={p.buildSearchUrl(query, affiliateId)}
                target="_blank"
                rel={affiliateId ? "noopener noreferrer sponsored" : "noopener noreferrer nofollow sponsored"}
                onClick={handleClick(p.slug, !!affiliateId)}
                className={cn(
                  "flex flex-1 items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm font-semibold text-text transition-colors hover:border-primary hover:bg-surface-alt",
                )}
                data-platform={p.slug}
                aria-label={`Buscar ${productName} en ${p.name}`}
              >
                <span className="flex flex-col items-start">
                  <span className="text-2xs uppercase tracking-wide text-text-subtle">Buscar en</span>
                  <span>{p.name}</span>
                </span>
                <span aria-hidden className="text-lg text-primary">
                  →
                </span>
              </a>
            );
          })}
        </div>
        {anyAffiliate ? (
          <p className="text-2xs text-text-subtle">
            Nos pueden dar comisión de afiliado si comprás. No pagás de más por eso.
          </p>
        ) : null}
      </CardBody>
    </Card>
  );
}
